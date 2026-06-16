<?php

namespace App\Http\Controllers;

use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'role' => 'required|string',
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

        return response()->json([
            'success' => true,
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

        return response()->json([
            'success' => true,
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
            // Create user
            $user = User::create([
                'user_id' => $userId,
                'email' => $email,
                'password_hash' => $passwordHash,
                'name' => $name,
                'role' => 'student',
                'classroom_id' => null,
            ]);

            // Migrate student progress events
            $updatedLogsCount = ProgressLog::where('student_id', $anonymousStudentId)
                ->update(['student_id' => $newStudentId]);

            return response()->json([
                'success' => true,
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
}
