<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // Helper to generate the exact same PBKDF2 hash as Express
    private function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha512', $password, $salt, 1000, 64);

        return "{$salt}:{$hash}";
    }

    private function verifyPassword(string $password, string $storedValue): bool
    {
        if (strpos($storedValue, ':') === false) {
            return false;
        }
        [$salt, $storedHash] = explode(':', $storedValue);
        $hash = hash_pbkdf2('sha512', $password, $salt, 1000, 64);

        return hash_equals($storedHash, $hash);
    }

    // POST /api/auth/register
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/'],
            'role' => 'required|in:student,teacher,parent,admin,developer',
            'admin_secret' => 'nullable|string',
            'name' => 'required_without:first_name|nullable|string',
            'first_name' => 'required_without:name|nullable|string',
            'last_name' => 'required_without:name|nullable|string',
            'middle_name' => 'nullable|string',
        ], [
            'password.regex' => 'Password must contain alphanumeric characters and at least one special symbol.',
            'password.min' => 'Password must be at least 8 characters long.',
        ]);

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');
        $role = trim($request->input('role'));

        if ($role === 'admin' || $role === 'developer') {
            $expectedKey = config('services.admin.registration_key') ?? env('ADMIN_REGISTRATION_KEY', 'GURO_ADMIN_SECRET_2026');
            $providedKey = trim($request->input('admin_secret', ''));
            if ($providedKey === '' || $providedKey !== $expectedKey) {
                return response()->json(['error' => 'Invalid or missing admin security passkey.'], 403);
            }
        }

        $firstName = trim($request->input('first_name', ''));
        $middleName = trim($request->input('middle_name', ''));
        $lastName = trim($request->input('last_name', ''));
        $name = trim($request->input('name', ''));

        $schoolName = trim($request->input('school_name', ''));
        $schoolIdNumber = trim($request->input('school_id_number', ''));
        $idDocument = $request->input('id_document') ?: $request->input('id_document_path');

        if ($firstName !== '' && $lastName !== '') {
            $fullName = trim($firstName.($middleName !== '' ? ' '.$middleName : '').' '.$lastName);
        } else {
            $fullName = $name;
            $parts = explode(' ', $fullName);
            if (count($parts) === 1) {
                $firstName = $parts[0];
                $lastName = '';
            } elseif (count($parts) === 2) {
                $firstName = $parts[0];
                $lastName = $parts[1];
            } else {
                $firstName = $parts[0];
                $lastName = $parts[count($parts) - 1];
                $middleName = implode(' ', array_slice($parts, 1, -1));
            }
        }

        // Check duplicate email
        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email already registered.'], 400);
        }

        // Validate verification code if provided or if one was issued for this email
        if ($request->filled('verification_code') || Cache::has('email_verify_code_'.$email)) {
            $request->validate([
                'verification_code' => 'required|string|size:6',
            ], [
                'verification_code.required' => 'Email verification code is required.',
                'verification_code.size' => 'Verification code must be 6 digits.',
            ]);

            $attemptsKey = 'email_verify_attempts_'.$email;
            $attempts = (int) Cache::get($attemptsKey, 0);

            if ($attempts >= 5) {
                Cache::forget('email_verify_code_'.$email);
                Cache::forget($attemptsKey);

                return response()->json(['error' => 'Too many failed verification attempts. Please request a new code.'], 429);
            }

            $storedCode = Cache::get('email_verify_code_'.$email);

            if (! $storedCode || $storedCode !== trim($request->input('verification_code'))) {
                Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(15));

                return response()->json(['error' => 'Invalid or expired verification code.'], 400);
            }

            $emailVerifiedAt = now();
            Cache::forget('email_verify_code_'.$email);
            Cache::forget($attemptsKey);
            Cache::forget('email_verify_cooldown_'.$email);
        } else {
            $emailVerifiedAt = app()->environment('testing') ? now() : null;
        }

        $userId = 'USR-'.strtoupper(Str::random(7));
        $passwordHash = $this->hashPassword($password);

        // Newly registered teachers enter pending verification state for admin review
        $verificationStatus = ($role === 'teacher') ? 'pending' : 'approved';

        $user = User::create([
            'user_id' => $userId,
            'email' => $email,
            'password_hash' => $passwordHash,
            'name' => $fullName,
            'first_name' => $firstName !== '' ? $firstName : null,
            'middle_name' => $middleName !== '' ? $middleName : null,
            'last_name' => $lastName !== '' ? $lastName : null,
            'role' => $role,
            'classroom_id' => null,
            'verification_status' => $verificationStatus,
            'school_name' => $schoolName !== '' ? $schoolName : null,
            'school_id_number' => $schoolIdNumber !== '' ? $schoolIdNumber : null,
            'id_document_path' => $idDocument ?: null,
            'email_verified_at' => $emailVerifiedAt,
        ]);

        // Teachers do NOT receive an active token until confirmed by administrator
        if ($role === 'teacher') {
            return response()->json([
                'success' => true,
                'pendingVerification' => true,
                'message' => 'Teacher registration submitted successfully. Your account is pending administrator verification before you can log in.',
                'user' => [
                    'userId' => $user->user_id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'firstName' => $user->first_name,
                    'middleName' => $user->middle_name,
                    'lastName' => $user->last_name,
                    'role' => $user->role,
                    'classroomId' => null,
                    'verificationStatus' => 'pending',
                    'schoolName' => $user->school_name,
                    'schoolIdNumber' => $user->school_id_number,
                    'rejectionReason' => null,
                    'emailVerifiedAt' => $user->email_verified_at ? $user->email_verified_at->toISOString() : null,
                ],
            ]);
        }

        $token = $user->createToken('app')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'userId' => $user->user_id,
                'email' => $user->email,
                'name' => $user->name,
                'firstName' => $user->first_name,
                'middleName' => $user->middle_name,
                'lastName' => $user->last_name,
                'role' => $user->role,
                'classroomId' => $user->classroom_id,
                'verificationStatus' => $user->verification_status ?? 'approved',
                'schoolName' => $user->school_name,
                'schoolIdNumber' => $user->school_id_number,
                'rejectionReason' => $user->rejection_reason,
                'emailVerifiedAt' => $user->email_verified_at ? $user->email_verified_at->toISOString() : null,
            ],
        ]);
    }

    // POST /api/auth/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'role' => 'nullable|string',
        ]);

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        if (! $user || ! $this->verifyPassword($password, $user->password_hash)) {
            return response()->json(['error' => 'Invalid email or password.'], 401);
        }

        // Strict role validation if specified by caller
        if ($request->filled('role')) {
            $expectedRole = strtolower(trim($request->input('role')));
            if ($expectedRole === 'admin') {
                if (! in_array($user->role, ['admin', 'developer'])) {
                    return response()->json(['error' => "Access denied: This account is registered as a {$user->role}, not an administrator."], 403);
                }
            } elseif ($expectedRole !== strtolower($user->role)) {
                return response()->json(['error' => "Role mismatch: This account is registered as a {$user->role}, not a {$expectedRole}."], 403);
            }
        }

        // Strict Teacher Verification Enforcement: Pending or rejected teachers cannot log in
        if ($user->role === 'teacher') {
            $status = $user->verification_status ?? 'pending';
            if ($status === 'pending') {
                return response()->json([
                    'error' => 'Your teacher account is pending administrator verification. Please wait for approval before logging in.',
                    'verification_status' => 'pending',
                ], 403);
            }
            if ($status === 'rejected') {
                $reason = $user->rejection_reason ?: 'Institutional credentials could not be validated.';

                return response()->json([
                    'error' => "Your teacher account registration was not approved. Reason: {$reason}",
                    'verification_status' => 'rejected',
                ], 403);
            }
        }

        $token = $user->createToken('app')->plainTextToken;

        $classroomId = $user->classroom_id;
        if ($user->role === 'student' && ! $classroomId) {
            $member = ClassroomMember::where('student_id', $user->user_id)->first();
            if ($member) {
                $classroomId = $member->classroom_id;
            }
        }
        if ($user->role === 'teacher' && ! $classroomId) {
            $classroom = Classroom::where(function ($q) use ($user) {
                $q->where('teacher_user_id', $user->id)
                    ->when(is_numeric($user->user_id), fn ($sub) => $sub->orWhere('teacher_user_id', $user->user_id))
                    ->orWhere('teacher_name', $user->name);
            })->orderBy('created_at', 'desc')->first();
            if ($classroom) {
                $classroomId = $classroom->classroom_id;
            }
        }

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'userId' => $user->user_id,
                'email' => $user->email,
                'name' => $user->name,
                'firstName' => $user->first_name,
                'middleName' => $user->middle_name,
                'lastName' => $user->last_name,
                'role' => $user->role,
                'classroomId' => $classroomId,
                'verificationStatus' => $user->verification_status ?? 'approved',
                'schoolName' => $user->school_name,
                'schoolIdNumber' => $user->school_id_number,
                'rejectionReason' => $user->rejection_reason,
                'emailVerifiedAt' => $user->email_verified_at ? $user->email_verified_at->toISOString() : null,
            ],
            'studentId' => $user->role === 'student' ? $user->user_id : null,
            'classroomId' => $classroomId,
        ]);
    }

    public function unauthorized()
    {
        return response()->json(['error' => 'Unauthenticated.'], 401);
    }

    // POST /api/auth/logout
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    // POST /api/auth/promote
    public function promote(Request $request)
    {
        $request->validate([
            'anonymousStudentId' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/'],
            'name' => 'required_without:first_name|nullable|string',
            'first_name' => 'required_without:name|nullable|string',
            'last_name' => 'required_without:name|nullable|string',
            'middle_name' => 'nullable|string',
        ], [
            'password.regex' => 'Password must contain alphanumeric characters and at least one special symbol.',
            'password.min' => 'Password must be at least 8 characters long.',
        ]);

        $anonymousStudentId = $request->input('anonymousStudentId');
        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');

        $firstName = trim($request->input('first_name', ''));
        $middleName = trim($request->input('middle_name', ''));
        $lastName = trim($request->input('last_name', ''));
        $name = trim($request->input('name', ''));

        if ($firstName !== '' && $lastName !== '') {
            $fullName = trim($firstName.($middleName !== '' ? ' '.$middleName : '').' '.$lastName);
        } else {
            $fullName = $name;
            $parts = explode(' ', $fullName);
            if (count($parts) === 1) {
                $firstName = $parts[0];
                $lastName = '';
            } elseif (count($parts) === 2) {
                $firstName = $parts[0];
                $lastName = $parts[1];
            } else {
                $firstName = $parts[0];
                $lastName = $parts[count($parts) - 1];
                $middleName = implode(' ', array_slice($parts, 1, -1));
            }
        }

        // Check duplicate email
        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email already registered.'], 400);
        }

        $passwordHash = $this->hashPassword($password);
        $newStudentId = strtoupper(str_replace(' ', '-', $fullName));
        if (User::where('user_id', $newStudentId)->exists()) {
            $newStudentId .= '-'.strtoupper(Str::random(4));
        }

        $normalized = strtoupper(preg_replace('/\s+/', '-', trim($newStudentId)));
        $salt = 'GURO_PARENT_SALT';
        $combined = $normalized.$salt;
        $sum = 0;
        $len = strlen($combined);
        for ($i = 0; $i < $len; $i++) {
            $sum += ord($combined[$i]) * ($i + 1);
        }
        $accessCode = (string) (100000 + ($sum % 900000));

        return DB::transaction(function () use ($email, $passwordHash, $fullName, $firstName, $middleName, $lastName, $anonymousStudentId, $newStudentId, $accessCode) {
            // Create user with actual parent access token
            $user = User::create([
                'user_id' => $newStudentId,
                'email' => $email,
                'password_hash' => $passwordHash,
                'name' => $fullName,
                'first_name' => $firstName !== '' ? $firstName : null,
                'middle_name' => $middleName !== '' ? $middleName : null,
                'last_name' => $lastName !== '' ? $lastName : null,
                'role' => 'student',
                'classroom_id' => null,
                'parent_access_token' => $accessCode,
            ]);

            // Migrate student progress events
            ProgressLog::where('student_id', $anonymousStudentId)
                ->update(['student_id' => $newStudentId]);

            $token = $user->createToken('app')->plainTextToken;

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => [
                    'userId' => $user->user_id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'firstName' => $user->first_name,
                    'middleName' => $user->middle_name,
                    'lastName' => $user->last_name,
                    'role' => $user->role,
                    'classroomId' => $user->classroom_id,
                    'emailVerifiedAt' => $user->email_verified_at ? $user->email_verified_at->toISOString() : null,
                ],
                'studentId' => $user->user_id,
            ]);
        });
    }

    // POST /api/auth/forgot-password/send-code
    public function sendRecoveryCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:student,teacher,parent,admin,developer',
        ]);

        $email = strtolower(trim($request->input('email')));
        $role = trim($request->input('role'));

        $user = User::where('email', $email)->where('role', $role)->first();

        if (! $user) {
            return response()->json(['error' => 'No account found with this email and role.'], 404);
        }

        // Hourly rate limit: max 5 requests per hour per email
        $hourlyKey = 'password_reset_hourly_'.$email;
        $hourlyCount = (int) Cache::get($hourlyKey, 0);
        if ($hourlyCount >= 5) {
            return response()->json(['error' => 'Too many reset requests for this email. Please try again in 1 hour.'], 429);
        }

        // Rate limit: 60-second cooldown between requests for the same email
        if (Cache::has('password_reset_cooldown_'.$email)) {
            return response()->json(['error' => 'Please wait before requesting another verification code.'], 429);
        }

        // Generate 6-digit verification code
        $code = (string) mt_rand(100000, 999999);

        // Store code in cache for 10 minutes and set 60s request cooldown
        Cache::put('password_reset_code_'.$email, $code, now()->addMinutes(10));
        Cache::put('password_reset_cooldown_'.$email, true, now()->addSeconds(60));
        Cache::put($hourlyKey, $hourlyCount + 1, now()->addHour());
        Cache::forget('password_reset_attempts_'.$email);

        // Always log OTP for local debugging
        Log::info("[Password Recovery Code] OTP Code for {$email} is: {$code}");

        // Call Resend API to send the email
        try {
            $apiKey = config('services.resend.key') ?? env('RESEND_API_KEY');
            $fromAddress = config('services.resend.from') ?? env('RESEND_FROM_EMAIL', 'GURO Recovery <auth@neoguro.app>');

            $emailHtml = $this->renderOtpEmailHtml(
                'Password Reset Verification',
                $user->name,
                'We received a request to reset your GURO account password. Enter this verification code to proceed:',
                $code
            );

            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.resend.com/emails', [
                'from' => $fromAddress,
                'to' => [$email],
                'subject' => 'GURO Account Password Reset Code: '.$code,
                'html' => $emailHtml,
            ]);

            if ($response->failed()) {
                $responseBody = $response->body();
                Log::error('[Resend Email failed] API Response: '.$responseBody);

                // If sandbox restriction, return code in response for testing convenience
                if (strpos($responseBody, 'validation_error') !== false && strpos($responseBody, 'testing emails') !== false) {
                    return response()->json([
                        'success' => true,
                        'message' => "Sandbox Mode: Since '{$email}' is not verified in Resend, we simulated sending. Code is logged in laravel.log.",
                        'sandbox' => true,
                    ]);
                }

                return response()->json(['error' => 'Failed to send recovery email. Please try again later.'], 500);
            }
        } catch (\Exception $e) {
            Log::error('[Resend Exception] '.$e->getMessage());

            return response()->json(['error' => 'Could not connect to recovery email service.'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'A 6-digit recovery code has been sent to your email address.',
        ]);
    }

    // POST /api/auth/forgot-password/verify-code
    public function verifyRecoveryCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:student,teacher,parent,admin,developer',
            'code' => 'required|string|size:6',
            'new_password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/'],
        ], [
            'new_password.regex' => 'Password must contain alphanumeric characters and at least one special symbol.',
            'new_password.min' => 'Password must be at least 8 characters long.',
        ]);

        $email = strtolower(trim($request->input('email')));
        $role = trim($request->input('role'));
        $code = trim($request->input('code'));
        $newPassword = $request->input('new_password');

        $user = User::where('email', $email)->where('role', $role)->first();

        if (! $user) {
            return response()->json(['error' => 'No account found with this email and role.'], 404);
        }

        // Brute force protection: track attempts (max 5)
        $attemptsKey = 'password_reset_attempts_'.$email;
        $attempts = (int) Cache::get($attemptsKey, 0);

        if ($attempts >= 5) {
            Cache::forget('password_reset_code_'.$email);
            Cache::forget($attemptsKey);

            return response()->json(['error' => 'Too many failed verification attempts. Please request a new code.'], 429);
        }

        // Verify stored code
        $storedCode = Cache::get('password_reset_code_'.$email);

        if (! $storedCode || $storedCode !== $code) {
            Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(15));

            return response()->json(['error' => 'Invalid or expired verification code.'], 400);
        }

        // Update password
        $user->password_hash = $this->hashPassword($newPassword);
        $user->save();

        // Clear cache and tracking
        Cache::forget('password_reset_code_'.$email);
        Cache::forget($attemptsKey);
        Cache::forget('password_reset_cooldown_'.$email);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful. You can now login with your new password.',
        ]);
    }

    // POST /api/auth/email/send-verification
    public function sendVerificationCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string',
            'for_registration' => 'nullable|boolean',
        ]);

        $email = strtolower(trim($request->input('email')));
        $isForRegistration = $request->boolean('for_registration', false);

        if ($isForRegistration && User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email already registered. Please sign in or use another email.'], 400);
        }

        // Hourly rate limit: max 5 requests per hour per email
        $hourlyKey = 'email_verify_hourly_'.$email;
        $hourlyCount = (int) Cache::get($hourlyKey, 0);
        if ($hourlyCount >= 5) {
            return response()->json(['error' => 'Too many verification requests for this email. Please try again in 1 hour.'], 429);
        }

        // Rate limit: 60-second cooldown between requests for the same email
        if (Cache::has('email_verify_cooldown_'.$email)) {
            return response()->json(['error' => 'Please wait 60 seconds before requesting another verification code.'], 429);
        }

        // Generate 6-digit verification code
        $code = (string) mt_rand(100000, 999999);

        // Store code in cache for 10 minutes and set 60s cooldown
        Cache::put('email_verify_code_'.$email, $code, now()->addMinutes(10));
        Cache::put('email_verify_cooldown_'.$email, true, now()->addSeconds(60));
        Cache::put($hourlyKey, $hourlyCount + 1, now()->addHour());
        Cache::forget('email_verify_attempts_'.$email);

        Log::info("[Email Verification Code] OTP Code for {$email} is: {$code}");

        // Call Resend API
        try {
            $apiKey = config('services.resend.key') ?? env('RESEND_API_KEY');
            $fromAddress = config('services.resend.from') ?? env('RESEND_FROM_EMAIL', 'GURO Recovery <auth@neoguro.app>');

            $user = User::where('email', $email)->first();
            $greetingName = $user ? $user->name : ($request->input('name') ?: 'there');
            $message = $isForRegistration
                ? 'Thank you for registering with GURO. Enter this verification code to verify your email and activate your account:'
                : 'We received a request to verify your email address. Enter this verification code to proceed:';

            $emailHtml = $this->renderOtpEmailHtml(
                'Email Verification',
                $greetingName,
                $message,
                $code
            );

            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.resend.com/emails', [
                'from' => $fromAddress,
                'to' => [$email],
                'subject' => 'GURO Email Verification Code: '.$code,
                'html' => $emailHtml,
            ]);

            if ($response->failed()) {
                $responseBody = $response->body();
                Log::error('[Resend Email failed] API Response: '.$responseBody);

                if (strpos($responseBody, 'validation_error') !== false && strpos($responseBody, 'testing emails') !== false) {
                    return response()->json([
                        'success' => true,
                        'message' => "Sandbox Mode: Simulated code delivery. Code logged in laravel.log.",
                        'sandbox' => true,
                    ]);
                }

                return response()->json(['error' => 'Failed to send verification email. Please try again later.'], 500);
            }
        } catch (\Exception $e) {
            Log::error('[Resend Exception] '.$e->getMessage());

            return response()->json(['error' => 'Could not connect to email service.'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'A 6-digit verification code has been sent to your email address.',
        ]);
    }

    // POST /api/auth/email/verify
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
            'email' => 'nullable|email',
        ]);

        $authenticatedUser = $request->user('sanctum');
        $email = $authenticatedUser ? $authenticatedUser->email : strtolower(trim($request->input('email', '')));

        if (! $email) {
            return response()->json(['error' => 'Email address is required.'], 400);
        }

        // Brute force protection: track attempts (max 5)
        $attemptsKey = 'email_verify_attempts_'.$email;
        $attempts = (int) Cache::get($attemptsKey, 0);

        if ($attempts >= 5) {
            Cache::forget('email_verify_code_'.$email);
            Cache::forget($attemptsKey);

            return response()->json(['error' => 'Too many failed verification attempts. Please request a new code.'], 429);
        }

        // Verify stored code
        $storedCode = Cache::get('email_verify_code_'.$email);

        if (! $storedCode || $storedCode !== trim($request->input('code'))) {
            Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(15));

            return response()->json(['error' => 'Invalid or expired verification code.'], 400);
        }

        // Clear cache and tracking
        Cache::forget('email_verify_code_'.$email);
        Cache::forget($attemptsKey);
        Cache::forget('email_verify_cooldown_'.$email);

        $user = $authenticatedUser ?: User::where('email', $email)->first();
        if ($user) {
            $user->email_verified_at = now();
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully!',
                'emailVerifiedAt' => $user->email_verified_at->toISOString(),
                'user' => [
                    'userId' => $user->user_id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'firstName' => $user->first_name,
                    'middleName' => $user->middle_name,
                    'lastName' => $user->last_name,
                    'role' => $user->role,
                    'classroomId' => $user->classroom_id,
                    'verificationStatus' => $user->verification_status ?? 'approved',
                    'schoolName' => $user->school_name,
                    'schoolIdNumber' => $user->school_id_number,
                    'rejectionReason' => $user->rejection_reason,
                    'emailVerifiedAt' => $user->email_verified_at->toISOString(),
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email code verified successfully.',
        ]);
    }

    private function renderOtpEmailHtml(string $title, string $greetingName, string $message, string $code): string
    {
        $logoUrl = 'https://neoguro.app/images/guro-mark-email.png';

        if (view()->exists('emails.otp')) {
            return view('emails.otp', [
                'title' => $title,
                'greetingName' => $greetingName,
                'bodyMessage' => $message,
                'code' => $code,
                'logoUrl' => $logoUrl,
            ])->render();
        }

        return '
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr><td align="center">
                    <table width="100%" style="max-width: 500px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="background: linear-gradient(135deg, #11428E 0%, #1E3A8A 100%); background-color: #11428E; padding: 24px 32px; text-align: center;">
                                <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                                    <tr>
                                        <td style="vertical-align: middle; padding-right: 14px;">
                                            <img src="'.$logoUrl.'" width="44" height="44" alt="GURO Logo" style="display: block; width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2);" />
                                        </td>
                                        <td style="vertical-align: middle; text-align: left;">
                                            <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 1.5px; line-height: 1.1;">GURO</h1>
                                            <p style="color: #BFDBFE; font-size: 10px; margin: 3px 0 0; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Guided Unified Resource Optimization</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px;">
                                <h2 style="color: #0F172A; font-size: 18px; margin: 0 0 12px; font-weight: 700;">'.htmlspecialchars($title).'</h2>
                                <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px;">
                                    Hello <strong>'.htmlspecialchars($greetingName).'</strong>,<br>
                                    '.htmlspecialchars($message).'
                                </p>
                                
                                <!-- 1-Click Copy Code Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; border: 2px dashed #11428E; border-radius: 14px; margin: 0 0 24px; cursor: pointer; user-select: all; -webkit-user-select: all; -moz-user-select: all;">
                                    <tr>
                                        <td style="padding: 10px 14px 2px 14px;" align="right">
                                            <span style="display: inline-block; background-color: #11428E; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                                                📋 1-Click Copy
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 14px 6px 14px; text-align: center;">
                                            <span style="display: inline-block; font-family: monospace, \'Courier New\', Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #11428E; user-select: all; -webkit-user-select: all; -moz-user-select: all;">
                                                '.$code.'
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 0 14px 12px 14px; text-align: center;">
                                            <span style="color: #64748B; font-size: 11px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                                                👆 Click anywhere on the box to select & copy code
                                            </span>
                                        </td>
                                    </tr>
                                </table>

                                <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
                                    ⏱️ This code will expire in <strong>10 minutes</strong>. If you did not make this request, you can safely disregard this message.
                                </p>
                                <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0 16px;">
                                <p style="color: #94A3B8; font-size: 11px; margin: 0; text-align: center;">
                                    GURO Platform · Secure Authentication · <a href="https://neoguro.app" style="color: #11428E; text-decoration: none;">neoguro.app</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>';
    }

    // POST /api/parent/create-student
    public function createStudent(Request $request)
    {
        if ($request->user()->role !== 'parent') {
            return response()->json(['error' => 'Unauthorized. Only parents can create student accounts.'], 403);
        }

        $request->validate([
            'email' => 'required|email',
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/'],
            'name' => 'required_without:first_name|nullable|string',
            'first_name' => 'required_without:name|nullable|string',
            'last_name' => 'required_without:name|nullable|string',
            'middle_name' => 'nullable|string',
            'section' => 'nullable|string',
        ], [
            'password.regex' => 'Password must contain alphanumeric characters and at least one special symbol.',
            'password.min' => 'Password must be at least 8 characters long.',
        ]);

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');

        $firstName = trim($request->input('first_name', ''));
        $middleName = trim($request->input('middle_name', ''));
        $lastName = trim($request->input('last_name', ''));
        $name = trim($request->input('name', ''));
        $section = trim($request->input('section', ''));

        if ($firstName !== '' && $lastName !== '') {
            $fullName = trim($firstName.($middleName !== '' ? ' '.$middleName : '').' '.$lastName);
        } else {
            $fullName = $name;
            $parts = explode(' ', $fullName);
            if (count($parts) === 1) {
                $firstName = $parts[0];
                $lastName = '';
            } elseif (count($parts) === 2) {
                $firstName = $parts[0];
                $lastName = $parts[1];
            } else {
                $firstName = $parts[0];
                $lastName = $parts[count($parts) - 1];
                $middleName = implode(' ', array_slice($parts, 1, -1));
            }
        }

        if ($section !== '') {
            $fullName = "{$fullName} ({$section})";
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email already registered.'], 400);
        }

        $passwordHash = $this->hashPassword($password);
        $newStudentId = strtoupper(str_replace(' ', '-', $fullName));
        if (User::where('user_id', $newStudentId)->exists()) {
            $newStudentId .= '-'.strtoupper(Str::random(4));
        }

        $normalized = strtoupper(preg_replace('/\s+/', '-', trim($newStudentId)));
        $salt = 'GURO_PARENT_SALT';
        $combined = $normalized.$salt;
        $sum = 0;
        $len = strlen($combined);
        for ($i = 0; $i < $len; $i++) {
            $sum += ord($combined[$i]) * ($i + 1);
        }
        $accessCode = (string) (100000 + ($sum % 900000));

        $student = User::create([
            'user_id' => $newStudentId,
            'email' => $email,
            'password_hash' => $passwordHash,
            'name' => $fullName,
            'first_name' => $firstName !== '' ? $firstName : null,
            'middle_name' => $middleName !== '' ? $middleName : null,
            'last_name' => $lastName !== '' ? $lastName : null,
            'role' => 'student',
            'classroom_id' => null,
            'parent_access_token' => $accessCode,
        ]);

        return response()->json([
            'success' => true,
            'student' => [
                'userId' => $student->user_id,
                'email' => $student->email,
                'name' => $student->name,
                'firstName' => $student->first_name,
                'middleName' => $student->middle_name,
                'lastName' => $student->last_name,
                'role' => $student->role,
                'studentId' => $student->user_id,
                'accessCode' => $student->parent_access_token,
            ],
        ]);
    }

    // POST /api/user/update-profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'middle_name' => 'nullable|string',
        ]);

        $firstName = trim($request->input('first_name'));
        $middleName = trim($request->input('middle_name', ''));
        $lastName = trim($request->input('last_name'));

        $fullName = trim($firstName.($middleName !== '' ? ' '.$middleName : '').' '.$lastName);

        if ($user->role === 'student') {
            preg_match('/\(([^)]+)\)/', $user->user_id, $matches);
            if (! empty($matches)) {
                $section = $matches[1];
                $fullName = "{$fullName} ({$section})";
            }
        }

        $user->update([
            'first_name' => $firstName,
            'middle_name' => $middleName !== '' ? $middleName : null,
            'last_name' => $lastName,
            'name' => $fullName,
        ]);

        return response()->json([
            'success' => true,
            'user' => [
                'userId' => $user->user_id,
                'email' => $user->email,
                'name' => $user->name,
                'firstName' => $user->first_name,
                'middleName' => $user->middle_name,
                'lastName' => $user->last_name,
                'role' => $user->role,
                'classroomId' => $user->classroom_id,
                'verificationStatus' => $user->verification_status ?? 'approved',
                'schoolName' => $user->school_name,
                'schoolIdNumber' => $user->school_id_number,
                'rejectionReason' => $user->rejection_reason,
                'emailVerifiedAt' => $user->email_verified_at ? $user->email_verified_at->toISOString() : null,
            ],
        ]);
    }

    // POST /api/auth/change-password
    public function changePassword(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        if (! $this->verifyPassword($request->current_password, $user->password_hash)) {
            return response()->json(['error' => 'Current password does not match our records.'], 422);
        }

        $user->update([
            'password_hash' => $this->hashPassword($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
        ]);
    }
}
