<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['user_id', 'lrn', 'email', 'password_hash', 'name', 'role', 'classroom_id', 'parent_access_token', 'parent_user_id', 'first_name', 'middle_name', 'last_name', 'gender', 'verification_status', 'school_name', 'school_id_number', 'id_document_path', 'rejection_reason', 'verified_at', 'verified_by', 'email_verified_at'])]
#[Hidden(['password_hash'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $casts = [
        'verified_at' => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    /**
     * Get the password for the user.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Children linked to this parent.
     */
    public function children()
    {
        return $this->hasMany(User::class, 'parent_user_id', 'user_id');
    }

    /**
     * Parent linked to this student.
     */
    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_user_id', 'user_id');
    }
}
