<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

// Authentication
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/promote', [AuthController::class, 'promote']);

// Item Bank & Generation
Route::get('/item-bank', [ClassroomController::class, 'getItemBank']);
Route::post('/generate', [ClassroomController::class, 'generateLesson']);
Route::post('/save', [ClassroomController::class, 'saveToItemBank']);

// Classroom Management
Route::get('/classroom/verify', [ClassroomController::class, 'verifyCode']);
Route::post('/classroom/create', [ClassroomController::class, 'createClassroom']);
Route::post('/classroom/lock', [ClassroomController::class, 'lockClassroom']);
Route::post('/classroom/claim', [ClassroomController::class, 'claimTemplateBank']);
Route::post('/classroom/update-lesson', [ClassroomController::class, 'updateClassroomLesson']);

// Progress Telemetry Sync
Route::post('/sync', [SyncController::class, 'syncTelemetry']);
Route::get('/progress', [SyncController::class, 'getProgress']);
Route::get('/sync-stream', [SyncController::class, 'syncStream']);
