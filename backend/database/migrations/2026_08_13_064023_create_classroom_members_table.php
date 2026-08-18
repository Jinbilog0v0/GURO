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
        Schema::create('classroom_members', function (Blueprint $table) {
            $table->id();
            $table->string('classroom_id', 50);
            $table->string('student_id', 100);
            $table->timestamps();

            $table->unique(['classroom_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classroom_members');
    }
};
