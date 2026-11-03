<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceNotification extends Model
{
    use HasFactory;

    protected $table = 'attendance_notifications';

    protected $fillable = [
        'student_id',
        'parent_id',
        'parent_email',
        'parent_phone',
        'channel',
        'session_date',
        'status',
    ];

    protected $casts = [
        'session_date' => 'datetime',
    ];
}
