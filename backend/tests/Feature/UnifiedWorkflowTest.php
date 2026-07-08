<?php

use App\Models\User;
use App\Models\Classroom;
use App\Models\ProgressLog;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('executes the full unified workflow (Teacher -> Student -> Parent)', function () {
    // ── STEP 1: Seed / Create Teacher ──
    $teacher = User::create([
        'user_id' => 'USR-TEACH-WORKFLOW',
        'email' => 'teacher@guro.dev',
        'password_hash' => 'some_hash',
        'name' => 'Mrs. Davis',
        'role' => 'teacher'
    ]);

    // Create Classroom via API
    $classResponse = $this->actingAs($teacher, 'sanctum')->postJson('/api/classroom/create', [
        'teacherName' => 'Mrs. Davis',
        'subject' => 'Mathematics',
        'gradeLevel' => 4
    ]);

    $classResponse->assertStatus(200);
    $classroomId = $classResponse->json('classroomId');
    expect($classroomId)->not->toBeNull();

    // ── STEP 2: Verify Classroom Join & Download Flow (Student Side) ──
    $student = User::create([
        'user_id' => 'USR-STUDENT-WORKFLOW',
        'email' => 'student@guro.dev',
        'password_hash' => 'some_hash',
        'name' => 'Alex',
        'role' => 'student'
    ]);

    // Student verifies the classroom invite code
    $verifyResponse = $this->getJson("/api/classroom/verify?code={$classroomId}");
    $verifyResponse->assertStatus(200)
        ->assertJson([
            'classroomId' => $classroomId,
            'teacherName' => 'Mrs. Davis',
            'subject' => 'Mathematics',
            'gradeLevel' => 4
        ]);

    // Student downloads the item bank
    $bankResponse = $this->getJson("/api/item-bank?classroomId={$classroomId}");
    $bankResponse->assertStatus(200);

    // ── STEP 3: Student Completes Lessons & Syncs Telemetry ──
    $syncResponse = $this->postJson('/api/sync', [
        'studentId' => $student->user_id,
        'classroomId' => $classroomId,
        'events' => [
            [
                'eventId' => 'EVT-LOG-WORKFLOW-1',
                'subject' => 'Mathematics',
                'gradeLevel' => 4,
                'topic' => 'Fractions',
                'score' => 4,
                'totalQuestions' => 5,
                'timestamp' => now()->toIso8601String()
            ]
        ]
    ]);

    $syncResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'received' => 1,
            'newSynced' => 1
        ]);

    // ── STEP 4: Parent Log-In & Progress Tracker Query ──
    // Parent fetches child's telemetry statistics
    $parentQueryResponse = $this->getJson("/api/progress?studentId={$student->user_id}&classroomId={$classroomId}");

    $parentQueryResponse->assertStatus(200)
        ->assertJsonCount(1);

    // Verify content has correct scoring logic
    $syncedLog = $parentQueryResponse->json(0);
    expect($syncedLog['eventId'])->toBe('EVT-LOG-WORKFLOW-1');
    expect($syncedLog['score'])->toBe(4);
    expect($syncedLog['totalQuestions'])->toBe(5);

    // ── STEP 5: Teacher Views Dashboard Diagnostics Alerts ──
    $teacherAlertsResponse = $this->getJson("/api/progress?classroomId={$classroomId}");

    $teacherAlertsResponse->assertStatus(200)
        ->assertJsonCount(1);
});
