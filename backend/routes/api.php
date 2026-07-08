<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\RateLimitController;
use Illuminate\Support\Facades\Route;

// Public — no authentication required
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/promote', [AuthController::class, 'promote']);
Route::post('/auth/forgot-password/send-code', [AuthController::class, 'sendRecoveryCode']);
Route::post('/auth/forgot-password/verify-code', [AuthController::class, 'verifyRecoveryCode']);
Route::get('/classroom/verify', [ClassroomController::class, 'verifyCode']);
Route::get('/item-bank', [ClassroomController::class, 'getItemBank']);
Route::post('/sync', [SyncController::class, 'syncTelemetry']);
Route::get('/progress', [SyncController::class, 'getProgress']);

// Protected — valid Sanctum token required for Teachers
Route::middleware('auth:sanctum')->group(function () {
    // Item Bank & Generation
    Route::post('/generate', [ClassroomController::class, 'generateLesson']);
    Route::post('/save', [ClassroomController::class, 'saveToItemBank']);

    // Classroom Management
    Route::post('/classroom/create', [ClassroomController::class, 'createClassroom']);
    Route::post('/classroom/lock', [ClassroomController::class, 'lockClassroom']);
    Route::post('/classroom/claim', [ClassroomController::class, 'claimTemplateBank']);
    Route::post('/classroom/update-lesson', [ClassroomController::class, 'updateClassroomLesson']);
    Route::post('/classroom/delete-lesson', [ClassroomController::class, 'deleteClassroomLesson']);

    // Developer — Rate Limit Management
    Route::prefix('dev')->group(function () {
        Route::get('/rate-limits',          [RateLimitController::class, 'index']);
        Route::put('/rate-limits/{role}',   [RateLimitController::class, 'upsert']);
        Route::delete('/rate-limits/{role}',[RateLimitController::class, 'destroy']);
        Route::get('/rate-limits/usage',    [RateLimitController::class, 'usage']);
    });
});
