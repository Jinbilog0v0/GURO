<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parent_teacher_messages', function (Blueprint $table) {
            $table->boolean('is_unsent')->default(false)->after('message_body');
            $table->timestamp('unsent_at')->nullable()->after('is_unsent');
            $table->text('original_message_body')->nullable()->after('unsent_at');
            $table->json('edit_history')->nullable()->after('original_message_body');
            $table->timestamp('edited_at')->nullable()->after('edit_history');
        });
    }

    public function down(): void
    {
        Schema::table('parent_teacher_messages', function (Blueprint $table) {
            $table->dropColumn([
                'is_unsent',
                'unsent_at',
                'original_message_body',
                'edit_history',
                'edited_at',
            ]);
        });
    }
};
