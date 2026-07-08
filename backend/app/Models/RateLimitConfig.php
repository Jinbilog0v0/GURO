<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RateLimitConfig extends Model
{
    protected $fillable = [
        'role',
        'max_requests',
        'window_minutes',
        'is_enabled',
        'notes',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];
}
