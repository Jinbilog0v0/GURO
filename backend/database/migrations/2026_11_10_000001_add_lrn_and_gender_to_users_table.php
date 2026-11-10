<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'lrn')) {
                $table->string('lrn', 12)->nullable()->index()->after('user_id');
            }
            if (! Schema::hasColumn('users', 'gender')) {
                $table->string('gender', 10)->nullable()->after('last_name');
            }
        });

        Schema::table('classroom_members', function (Blueprint $table) {
            if (! Schema::hasColumn('classroom_members', 'lrn')) {
                $table->string('lrn', 12)->nullable()->index()->after('student_id');
            }
            if (! Schema::hasColumn('classroom_members', 'gender')) {
                $table->string('gender', 10)->nullable()->after('section_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['lrn', 'gender']);
        });

        Schema::table('classroom_members', function (Blueprint $table) {
            $table->dropColumn(['lrn', 'gender']);
        });
    }
};
