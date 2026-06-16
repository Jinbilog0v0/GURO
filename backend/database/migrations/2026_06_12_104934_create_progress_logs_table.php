<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('progress_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 50)->unique();
            $table->string('student_id', 100);
            $table->string('classroom_id', 50)->nullable();
            $table->string('subject', 100);
            $table->integer('grade_level');
            $table->string('topic', 255);
            $table->integer('score');
            $table->integer('total_questions');
            $table->timestamp('timestamp');
            $table->timestamp('synced_at')->useCurrent();
            $table->timestamps();

            $table->index('classroom_id');
            $table->index('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progress_logs');
    }
};
