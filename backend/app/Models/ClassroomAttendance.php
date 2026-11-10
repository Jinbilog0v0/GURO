<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomAttendance extends Model
{
    use HasFactory;

    protected $table = 'classroom_attendances';

    protected $fillable = [
        'classroom_id',
        'student_id',
        'attendance_date',
        'status',
        'remarks',
        'recorded_by_user_id',
    ];

    protected $casts = [
        'attendance_date' => 'date',
    ];
}
