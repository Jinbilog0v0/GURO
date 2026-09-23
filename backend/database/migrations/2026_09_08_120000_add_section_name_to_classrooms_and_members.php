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
        // 1. Add section_name to classrooms
        Schema::table('classrooms', function (Blueprint $table) {
            if (!Schema::hasColumn('classrooms', 'section_name')) {
                $table->string('section_name', 100)->nullable()->after('grade_level');
            }
        });

        // 2. Add section_name to classroom_members
        Schema::table('classroom_members', function (Blueprint $table) {
            if (!Schema::hasColumn('classroom_members', 'section_name')) {
                $table->string('section_name', 100)->nullable()->after('student_id');
            }
        });

        // 3. Add section_name to progress_logs
        Schema::table('progress_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('progress_logs', 'section_name')) {
                $table->string('section_name', 100)->nullable()->after('classroom_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('progress_logs', function (Blueprint $table) {
            if (Schema::hasColumn('progress_logs', 'section_name')) {
                $table->dropColumn('section_name');
            }
        });

        Schema::table('classroom_members', function (Blueprint $table) {
            if (Schema::hasColumn('classroom_members', 'section_name')) {
                $table->dropColumn('section_name');
            }
        });

        Schema::table('classrooms', function (Blueprint $table) {
            if (Schema::hasColumn('classrooms', 'section_name')) {
                $table->dropColumn('section_name');
            }
        });
    }
};
