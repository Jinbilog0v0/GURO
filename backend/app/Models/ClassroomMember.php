<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassroomMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'classroom_id',
        'student_id',
        'status',
        'promoted_to_grade',
        'final_average',
        'promoted_at',
    ];

    protected $casts = [
        'promoted_to_grade' => 'integer',
        'final_average' => 'float',
        'promoted_at' => 'datetime',
    ];
}
