<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentTeacherMessage extends Model
{
    protected $table = 'parent_teacher_messages';

    protected $fillable = [
        'classroom_id',
        'student_id',
        'sender_id',
        'sender_name',
        'sender_role',
        'receiver_id',
        'message_body',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}
