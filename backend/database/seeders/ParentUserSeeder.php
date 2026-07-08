<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class ParentUserSeeder extends Seeder
{
    private function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha512', $password, $salt, 1000, 64);
        return "{$salt}:{$hash}";
    }

    public function run(): void
    {
        $email = 'parent@guro.dev';
        $password = 'Password123';

        if (!User::where('email', $email)->exists()) {
            User::create([
                'user_id' => 'USR-PARENT',
                'email' => $email,
                'password_hash' => $this->hashPassword($password),
                'name' => 'Sample Parent',
                'role' => 'parent',
                'classroom_id' => null,
            ]);
        }
    }
}
