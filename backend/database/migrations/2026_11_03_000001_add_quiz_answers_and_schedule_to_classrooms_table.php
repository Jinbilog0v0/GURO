<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            if (!Schema::hasColumn('classrooms', 'show_quiz_answers')) {
                $table->boolean('show_quiz_answers')->default(true);
            }
            if (!Schema::hasColumn('classrooms', 'consultation_hours')) {
                $table->string('consultation_hours', 255)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropColumn(['show_quiz_answers', 'consultation_hours']);
        });
    }
};
