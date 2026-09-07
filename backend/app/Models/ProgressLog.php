<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgressLog extends Model
{
    protected $fillable = [
        'event_id',
        'student_id',
        'classroom_id',
        'subject',
        'grade_level',
        'topic',
        'score',
        'total_questions',
        'difficulty',
        'assessment_type',
        'school_year',
        'term',
        'timestamp',
        'synced_at',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'synced_at' => 'datetime',
    ];
}
