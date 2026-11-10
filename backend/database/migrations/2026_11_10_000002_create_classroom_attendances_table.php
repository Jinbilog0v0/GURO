<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classroom_attendances', function (Blueprint $table) {
            $table->id();
            $table->string('classroom_id', 50)->index();
            $table->string('student_id', 50)->index();
            $table->date('attendance_date')->index();
            $table->string('status', 20)->default('present'); // present, late, absent, excused
            $table->string('remarks', 255)->nullable();
            $table->string('recorded_by_user_id', 50)->nullable();
            $table->timestamps();

            $table->unique(['classroom_id', 'student_id', 'attendance_date'], 'classroom_student_date_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classroom_attendances');
    }
};
