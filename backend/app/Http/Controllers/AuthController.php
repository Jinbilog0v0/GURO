<?php

namespace App\Http\Controllers;

use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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
            $expectedKey = env('ADMIN_REGISTRATION_KEY', 'GURO_ADMIN_SECRET_2026');
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
            $fullName = trim($firstName . ($middleName !== '' ? ' ' . $middleName : '') . ' ' . $lastName);
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
                if (!in_array($user->role, ['admin', 'developer'])) {
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
        if ($user->role === 'student' && !$classroomId) {
            $member = \App\Models\ClassroomMember::where('student_id', $user->user_id)->first();
            if ($member) {
                $classroomId = $member->classroom_id;
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
            ],
            'studentId' => $user->role === 'student' ? $user->user_id : null,
        ]);
    }

    public function unauthorized()
    {
        return response()->json(['error' => 'Unauthenticated.'], 401);
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
            $fullName = trim($firstName . ($middleName !== '' ? ' ' . $middleName : '') . ' ' . $lastName);
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
            $newStudentId .= '-' . strtoupper(Str::random(4));
        }

        $normalized = strtoupper(preg_replace('/\s+/', '-', trim($newStudentId)));
        $salt = "GURO_PARENT_SALT";
        $combined = $normalized . $salt;
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
            'role' => 'required|in:student,teacher,parent',
        ]);

        $email = strtolower(trim($request->input('email')));
        $role = trim($request->input('role'));

        $user = User::where('email', $email)->where('role', $role)->first();

        if (!$user) {
            return response()->json(['error' => 'No account found with this email and role.'], 404);
        }

        // Generate 6-digit verification code
        $code = (string) mt_rand(100000, 999999);

        // Store code in cache for 15 minutes
        Cache::put('password_reset_code_' . $email, $code, now()->addMinutes(15));

        // Always log OTP for local debugging
        \Illuminate\Support\Facades\Log::info("[Password Recovery Code] OTP Code for {$email} is: {$code}");

        // Call Resend API to send the email
        try {
            $apiKey = env('RESEND_API_KEY');
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.resend.com/emails', [
                'from' => 'GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Recovery <onboarding@resend.dev>',
                'to' => [$email],
                'subject' => 'GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Account Password Reset Code',
                'html' => '<h3>Reset Your Password</h3><p>Hello,</p><p>You requested a password reset for your GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION account. Use the verification code below to proceed:</p><h2 style="color: #11428E; letter-spacing: 2px;">' . $code . '</h2><p>This code is valid for 15 minutes.</p><p>If you did not request this, you can safely ignore this email.</p><br><p>Best regards,<br>The GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Team</p>',
            ]);

            if ($response->failed()) {
                $responseBody = $response->body();
                \Illuminate\Support\Facades\Log::error('[Resend Email failed] API Response: ' . $responseBody);
                
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
            \Illuminate\Support\Facades\Log::error('[Resend Exception] ' . $e->getMessage());
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
            'role' => 'required|in:student,teacher,parent',
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

        if (!$user) {
            return response()->json(['error' => 'No account found with this email and role.'], 404);
        }

        // Verify stored code
        $storedCode = Cache::get('password_reset_code_' . $email);

        if (!$storedCode || $storedCode !== $code) {
            return response()->json(['error' => 'Invalid or expired verification code.'], 400);
        }

        // Update password
        $user->password_hash = $this->hashPassword($newPassword);
        $user->save();

        // Clear cache
        Cache::forget('password_reset_code_' . $email);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful. You can now login with your new password.',
        ]);
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
            $fullName = trim($firstName . ($middleName !== '' ? ' ' . $middleName : '') . ' ' . $lastName);
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
            $newStudentId .= '-' . strtoupper(Str::random(4));
        }

        $normalized = strtoupper(preg_replace('/\s+/', '-', trim($newStudentId)));
        $salt = "GURO_PARENT_SALT";
        $combined = $normalized . $salt;
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
        if (!$user) {
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

        $fullName = trim($firstName . ($middleName !== '' ? ' ' . $middleName : '') . ' ' . $lastName);

        if ($user->role === 'student') {
            preg_match('/\(([^)]+)\)/', $user->user_id, $matches);
            if (!empty($matches)) {
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
            ],
        ]);
    }
}
