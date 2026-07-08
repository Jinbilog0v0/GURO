<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StudentUserSeeder extends Seeder
{
    private function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha512', $password, $salt, 1000, 64);
        return "{$salt}:{$hash}";
    }

    public function run(): void
    {
        $email = 'student@guro.dev';
        $password = 'Password123';

        if (!User::where('email', $email)->exists()) {
            User::create([
                'user_id' => 'USR-STUDENT',
                'email' => $email,
                'password_hash' => $this->hashPassword($password),
                'name' => 'Sample Student',
                'role' => 'student',
                'classroom_id' => null,
            ]);
        }
    }
}
