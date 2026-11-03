<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_teacher_messages', function (Blueprint $table) {
            $table->id();
            $table->string('classroom_id', 50)->index();
            $table->string('student_id', 50)->index();
            $table->string('sender_id', 50);
            $table->string('sender_name', 100);
            $table->string('sender_role', 50);
            $table->string('receiver_id', 50)->nullable();
            $table->text('message_body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_teacher_messages');
    }
};
