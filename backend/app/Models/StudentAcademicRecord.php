<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAcademicRecord extends Model
{
    protected $fillable = [
        'student_id',
        'classroom_id',
        'school_year',
        'grade_level',
        'subject',
        'pre_test_score',
        'post_test_score',
        'learning_gain',
        'term_1_score',
        'term_2_score',
        'term_3_score',
        'term_4_score',
        'final_average',
        'promotional_status',
        'promoted_to_grade',
        'teacher_user_id',
        'remarks',
    ];

    protected $casts = [
        'pre_test_score' => 'float',
        'post_test_score' => 'float',
        'learning_gain' => 'float',
        'term_1_score' => 'float',
        'term_2_score' => 'float',
        'term_3_score' => 'float',
        'term_4_score' => 'float',
        'final_average' => 'float',
        'grade_level' => 'integer',
        'promoted_to_grade' => 'integer',
    ];
}
