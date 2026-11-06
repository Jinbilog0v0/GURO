<?php

use App\Models\Classroom;
use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('binds created student directly to authenticated parent', function () {
    $parent = User::create([
        'user_id' => 'PAR-001',
        'email' => 'parent1@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Maria Dela Cruz',
        'role' => 'parent',
    ]);

    $response = $this->actingAs($parent, 'sanctum')->postJson('/api/parent/create-student', [
        'email' => 'juan.student@guro.dev',
        'password' => 'Password123!',
        'name' => 'Juan Dela Cruz',
        'section' => 'Rose',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('student.parentUserId', 'PAR-001');

    $studentInDb = User::where('email', 'juan.student@guro.dev')->first();
    expect($studentInDb)->not->toBeNull();
    expect($studentInDb->parent_user_id)->toBe('PAR-001');
    expect($studentInDb->role)->toBe('student');
});

it('lists all bound children for the authenticated parent', function () {
    $parent = User::create([
        'user_id' => 'PAR-002',
        'email' => 'parent2@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Jose Santos',
        'role' => 'parent',
    ]);

    $teacher = User::create([
        'user_id' => 'TEA-001',
        'email' => 'teacher.maria@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Teacher Maria',
        'role' => 'teacher',
    ]);

    $classroom = Classroom::create([
        'classroom_id' => 'MTH-G4-ROSE',
        'teacher_user_id' => $teacher->id,
        'teacher_name' => 'Teacher Maria',
        'subject' => 'Mathematics',
        'grade_level' => 4,
        'section_name' => 'Rose',
    ]);

    $child1 = User::create([
        'user_id' => 'STU-CHILD-1',
        'email' => 'child1@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Pedro Santos',
        'role' => 'student',
        'classroom_id' => 'MTH-G4-ROSE',
        'parent_user_id' => 'PAR-002',
    ]);

    $child2 = User::create([
        'user_id' => 'STU-CHILD-2',
        'email' => 'child2@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Ana Santos',
        'role' => 'student',
        'classroom_id' => 'MTH-G4-ROSE',
        'parent_user_id' => 'PAR-002',
    ]);

    // Child of another parent
    User::create([
        'user_id' => 'STU-OTHER-CHILD',
        'email' => 'other@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Stranger Child',
        'role' => 'student',
        'parent_user_id' => 'PAR-OTHER',
    ]);

    $response = $this->actingAs($parent, 'sanctum')->getJson('/api/parent/children');

    $response->assertStatus(200)
        ->assertJsonPath('success', true);

    $children = $response->json('children');
    expect(count($children))->toBe(2);
    expect(collect($children)->pluck('studentId')->toArray())->toContain('STU-CHILD-1', 'STU-CHILD-2');
    expect(collect($children)->pluck('studentId')->toArray())->not->toContain('STU-OTHER-CHILD');
});

it('allows parent to view child progress without access code and blocks unauthorized parents', function () {
    $parent = User::create([
        'user_id' => 'PAR-003',
        'email' => 'parent3@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Lourdes Reyes',
        'role' => 'parent',
    ]);

    $otherParent = User::create([
        'user_id' => 'PAR-004',
        'email' => 'parent4@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Nosy Neighbor Parent',
        'role' => 'parent',
    ]);

    $child = User::create([
        'user_id' => 'STU-CARLO-REYES',
        'email' => 'carlo.reyes@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Carlo Reyes',
        'role' => 'student',
        'parent_user_id' => 'PAR-003',
    ]);

    ProgressLog::create([
        'event_id' => 'EVT-1001',
        'student_id' => 'STU-CARLO-REYES',
        'subject' => 'Mathematics',
        'grade_level' => 4,
        'topic' => 'Fractions',
        'score' => 9,
        'total_questions' => 10,
        'timestamp' => now(),
    ]);

    // Authorized parent queries without accessCode -> Allowed!
    $resAuthorized = $this->actingAs($parent, 'sanctum')->getJson('/api/progress?studentId=STU-CARLO-REYES');
    $resAuthorized->assertStatus(200);
    expect(count($resAuthorized->json()))->toBe(1);
    expect($resAuthorized->json('0.topic'))->toBe('Fractions');

    // Unauthorized parent queries without accessCode -> Blocked with 403!
    $resUnauthorized = $this->actingAs($otherParent, 'sanctum')->getJson('/api/progress?studentId=STU-CARLO-REYES');
    $resUnauthorized->assertStatus(403)
        ->assertJson(['error' => 'Forbidden. You are not linked to this student record.']);
});

it('allows parent to claim an existing student with valid access code', function () {
    $parent = User::create([
        'user_id' => 'PAR-CLAIM-01',
        'email' => 'claim.parent@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Grace Lim',
        'role' => 'parent',
    ]);

    $student = User::create([
        'user_id' => 'STU-LEGACY-01',
        'email' => 'legacy.student@guro.dev',
        'password_hash' => 'hash123',
        'name' => 'Timothy Lim',
        'role' => 'student',
        'parent_access_token' => '543210',
        'parent_user_id' => null,
    ]);

    // Claim with wrong code -> 403
    $failRes = $this->actingAs($parent, 'sanctum')->postJson('/api/parent/claim-child', [
        'studentId' => 'STU-LEGACY-01',
        'accessCode' => '999999',
    ]);
    $failRes->assertStatus(403);

    // Claim with correct code -> Success!
    $successRes = $this->actingAs($parent, 'sanctum')->postJson('/api/parent/claim-child', [
        'studentId' => 'STU-LEGACY-01',
        'accessCode' => '543210',
    ]);
    $successRes->assertStatus(200)
        ->assertJsonPath('success', true);

    $student->refresh();
    expect($student->parent_user_id)->toBe('PAR-CLAIM-01');
});
