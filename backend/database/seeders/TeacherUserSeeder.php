<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TeacherUserSeeder extends Seeder
{
    private function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha512', $password, $salt, 1000, 64);

        return "{$salt}:{$hash}";
    }

    /**
     * Run the database seeds.
     */
    public function up(): void
    {
        $email = 'nealjeanclaro05@gmail.com';
        $password = 'Password123';

        // Check duplicate
        $exists = User::where('email', $email)->exists();
        if (! $exists) {
            User::create([
                'user_id' => 'USR-'.strtoupper(Str::random(7)),
                'email' => $email,
                'password_hash' => $this->hashPassword($password),
                'name' => 'sample-teacher',
                'role' => 'teacher',
                'classroom_id' => null,
            ]);
        }
    }

    /**
     * Run the seeder.
     */
    public function run(): void
    {
        $this->up();
    }
}
