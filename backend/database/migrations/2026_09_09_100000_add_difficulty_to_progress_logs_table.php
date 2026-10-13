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
        Schema::table('progress_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('progress_logs', 'difficulty')) {
                $table->string('difficulty', 50)->nullable()->after('total_questions');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('progress_logs', function (Blueprint $table) {
            if (Schema::hasColumn('progress_logs', 'difficulty')) {
                $table->dropColumn('difficulty');
            }
        });
    }
};
