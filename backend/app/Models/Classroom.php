<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    protected $fillable = [
        'classroom_id',
        'teacher_name',
        'subject',
        'grade_level',
        'custom_item_bank',
        'expires_at',
    ];

    protected $casts = [
        'custom_item_bank' => 'array',
        'expires_at' => 'datetime',
    ];
}
