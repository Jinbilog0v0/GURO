<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('student_id', 50)->index();
            $table->string('parent_id', 50)->nullable();
            $table->string('parent_email', 255)->nullable();
            $table->string('parent_phone', 50)->nullable();
            $table->string('channel', 20)->default('email');
            $table->timestamp('session_date')->useCurrent();
            $table->string('status', 50)->default('sent');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_notifications');
    }
};
