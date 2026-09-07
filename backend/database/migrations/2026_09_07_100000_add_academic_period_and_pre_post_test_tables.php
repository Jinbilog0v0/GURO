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
        // 1. Add academic year and term to classrooms
        Schema::table('classrooms', function (Blueprint $table) {
            if (!Schema::hasColumn('classrooms', 'school_year')) {
                $table->string('school_year', 20)->default('2026-2027')->after('grade_level');
            }
            if (!Schema::hasColumn('classrooms', 'term')) {
                $table->string('term', 20)->default('Quarter 1')->after('school_year');
            }
        });

        // 2. Add assessment_type, school_year, and term to progress_logs
        Schema::table('progress_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('progress_logs', 'assessment_type')) {
                $table->string('assessment_type', 30)->default('practice')->after('difficulty'); // 'pre-test', 'post-test', 'practice', 'checkpoint'
            }
            if (!Schema::hasColumn('progress_logs', 'school_year')) {
                $table->string('school_year', 20)->default('2026-2027')->after('assessment_type');
            }
            if (!Schema::hasColumn('progress_logs', 'term')) {
                $table->string('term', 20)->default('Quarter 1')->after('school_year');
            }
        });

        // 3. Add promotion tracking columns to classroom_members
        Schema::table('classroom_members', function (Blueprint $table) {
            if (!Schema::hasColumn('classroom_members', 'status')) {
                $table->string('status', 30)->default('enrolled')->after('student_id'); // 'enrolled', 'promoted', 'retained', 'remedial'
            }
            if (!Schema::hasColumn('classroom_members', 'promoted_to_grade')) {
                $table->integer('promoted_to_grade')->nullable()->after('status');
            }
            if (!Schema::hasColumn('classroom_members', 'final_average')) {
                $table->float('final_average')->nullable()->after('promoted_to_grade');
            }
            if (!Schema::hasColumn('classroom_members', 'promoted_at')) {
                $table->timestamp('promoted_at')->nullable()->after('final_average');
            }
        });

        // 4. Create student_academic_records for long-term SF9/SF10 transcripts
        if (!Schema::hasTable('student_academic_records')) {
            Schema::create('student_academic_records', function (Blueprint $table) {
                $table->id();
                $table->string('student_id', 100);
                $table->string('classroom_id', 50)->nullable();
                $table->string('school_year', 20); // e.g., '2026-2027'
                $table->integer('grade_level');    // e.g., 4
                $table->string('subject', 100);    // e.g., 'Mathematics', 'English', 'General'
                $table->float('pre_test_score')->nullable();
                $table->float('post_test_score')->nullable();
                $table->float('learning_gain')->nullable();
                $table->float('term_1_score')->nullable();
                $table->float('term_2_score')->nullable();
                $table->float('term_3_score')->nullable();
                $table->float('term_4_score')->nullable();
                $table->float('final_average')->nullable();
                $table->string('promotional_status', 30)->default('PROMOTED'); // 'PROMOTED', 'RETAINED', 'REMEDIAL'
                $table->integer('promoted_to_grade')->nullable();
                $table->unsignedBigInteger('teacher_user_id')->nullable();
                $table->text('remarks')->nullable();
                $table->timestamps();

                $table->index(['student_id', 'school_year', 'grade_level']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_academic_records');

        Schema::table('classroom_members', function (Blueprint $table) {
            $table->dropColumn(['status', 'promoted_to_grade', 'final_average', 'promoted_at']);
        });

        Schema::table('progress_logs', function (Blueprint $table) {
            $table->dropColumn(['assessment_type', 'school_year', 'term']);
        });

        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropColumn(['school_year', 'term']);
        });
    }
};
