<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rate_limit_configs', function (Blueprint $table) {
            $table->id();
            $table->string('role')->unique();           // e.g. 'teacher', 'lesson-builder'
            $table->unsignedInteger('max_requests');     // max calls allowed in the window
            $table->unsignedInteger('window_minutes');   // rolling window in minutes
            $table->boolean('is_enabled')->default(true);
            $table->text('notes')->nullable();           // developer-visible description
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rate_limit_configs');
    }
};
