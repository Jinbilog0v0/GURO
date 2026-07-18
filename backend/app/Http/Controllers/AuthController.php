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
            'password' => 'required|string',
            'name' => 'required|string',
            'role' => 'required|in:student,teacher,parent',
        ]);

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');
        $name = trim($request->input('name'));
        $role = trim($request->input('role'));

        // Check duplicate email
        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email already registered.'], 400);
        }

        $userId = 'USR-'.strtoupper(Str::random(7));
        $passwordHash = $this->hashPassword($password);

        $user = User::create([
            'user_id' => $userId,
            'email' => $email,
            'password_hash' => $passwordHash,
            'name' => $name,
            'role' => $role,
            'classroom_id' => null,
        ]);

        $token = $user->createToken('app')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'userId' => $user->user_id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'classroomId' => $user->classroom_id,
            ],
        ]);
    }

    // POST /api/auth/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        if (! $user || ! $this->verifyPassword($password, $user->password_hash)) {
            return response()->json(['error' => 'Invalid email or password.'], 401);
        }

        $token = $user->createToken('app')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'userId' => $user->user_id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'classroomId' => $user->classroom_id,
            ],
        ]);
    }

    // POST /api/auth/promote
    public function promote(Request $request)
    {
        $request->validate([
            'anonymousStudentId' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string',
            'name' => 'required|string',
        ]);

        $anonymousStudentId = $request->input('anonymousStudentId');
        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');
        $name = trim($request->input('name'));

        // Check duplicate email
        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email already registered.'], 400);
        }

        $userId = 'USR-'.strtoupper(Str::random(7));
        $passwordHash = $this->hashPassword($password);
        $newStudentId = strtoupper(str_replace(' ', '-', $name));

        return DB::transaction(function () use ($userId, $email, $passwordHash, $name, $anonymousStudentId, $newStudentId) {
            // Create user with a random parent access token
            $user = User::create([
                'user_id' => $userId,
                'email' => $email,
                'password_hash' => $passwordHash,
                'name' => $name,
                'role' => 'student',
                'classroom_id' => null,
                'parent_access_token' => Str::random(32),
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
                    'role' => $user->role,
                    'classroomId' => $user->classroom_id,
                ],
                'studentId' => $newStudentId,
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
                'from' => 'GURO Recovery <onboarding@resend.dev>',
                'to' => [$email],
                'subject' => 'GURO Account Password Reset Code',
                'html' => '<h3>Reset Your Password</h3><p>Hello,</p><p>You requested a password reset for your GURO account. Use the verification code below to proceed:</p><h2 style="color: #11428E; letter-spacing: 2px;">' . $code . '</h2><p>This code is valid for 15 minutes.</p><p>If you did not request this, you can safely ignore this email.</p><br><p>Best regards,<br>The GURO Team</p>',
            ]);

            if ($response->failed()) {
                $responseBody = $response->body();
                \Illuminate\Support\Facades\Log::error('[Resend Email failed] API Response: ' . $responseBody);
                
                // If sandbox restriction, return code in response for testing convenience
                if (strpos($responseBody, 'validation_error') !== false && strpos($responseBody, 'testing emails') !== false) {
                    return response()->json([
                        'success' => true,
                        'message' => "Sandbox Mode: Since '{$email}' is not verified in Resend, we simulated sending. Your code is: {$code} (Also logged in laravel.log).",
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
            'new_password' => 'required|string|min:6',
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
            'name' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');
        $name = trim($request->input('name'));

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email already registered.'], 400);
        }

        $userId = 'USR-' . strtoupper(Str::random(7));
        $passwordHash = $this->hashPassword($password);
        $newStudentId = strtoupper(str_replace(' ', '-', $name)) . '-' . strtoupper(Str::random(4));

        $student = User::create([
            'user_id' => $userId,
            'email' => $email,
            'password_hash' => $passwordHash,
            'name' => $name,
            'role' => 'student',
            'classroom_id' => null,
            'parent_access_token' => Str::random(32),
        ]);

        $accessCode = substr(hash('sha256', $newStudentId . 'GURO_PARENT_SALT'), 0, 8);

        return response()->json([
            'success' => true,
            'student' => [
                'userId' => $student->user_id,
                'email' => $student->email,
                'name' => $student->name,
                'role' => $student->role,
                'studentId' => $newStudentId,
                'accessCode' => $accessCode,
            ],
        ]);
    }
}
