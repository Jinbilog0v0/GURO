<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('verification_status')->default('approved')->after('role');
            $table->string('school_name')->nullable()->after('verification_status');
            $table->string('school_id_number')->nullable()->after('school_name');
            $table->longText('id_document_path')->nullable()->after('school_id_number');
            $table->text('rejection_reason')->nullable()->after('id_document_path');
            $table->timestamp('verified_at')->nullable()->after('rejection_reason');
            $table->unsignedBigInteger('verified_by')->nullable()->after('verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'verification_status',
                'school_name',
                'school_id_number',
                'id_document_path',
                'rejection_reason',
                'verified_at',
                'verified_by',
            ]);
        });
    }
};
