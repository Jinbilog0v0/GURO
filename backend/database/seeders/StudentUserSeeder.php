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

    private function getParentAccessCode(string $studentId): string
    {
        $normalized = strtoupper(preg_replace('/\s+/', '-', trim($studentId)));
        $salt = "GURO_PARENT_SALT";
        $combined = $normalized . $salt;
        $sum = 0;
        $len = strlen($combined);
        for ($i = 0; $i < $len; $i++) {
            $sum += ord($combined[$i]) * ($i + 1);
        }
        return (string) (100000 + ($sum % 900000));
    }

    public function run(): void
    {
        $email = 'student@guro.dev';
        $password = 'Password123';
        $name = 'Sample Student';
        $studentId = 'SAMPLE-STUDENT';

        if (!User::where('email', $email)->exists()) {
            User::create([
                'user_id' => 'USR-STUDENT',
                'email' => $email,
                'password_hash' => $this->hashPassword($password),
                'name' => $name,
                'role' => 'student',
                'classroom_id' => null,
                'parent_access_token' => $this->getParentAccessCode($studentId),
            ]);
        }
    }
}
