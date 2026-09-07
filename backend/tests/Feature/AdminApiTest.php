<?php

use App\Models\User;
use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\ProgressLog;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createAdminUser() {
    $salt = bin2hex(random_bytes(16));
    $hash = hash_pbkdf2('sha512', 'adminpass123', $salt, 1000, 64);
    
    return User::create([
        'user_id' => 'USR-ADMIN01',
        'email' => 'admin@guro.dev',
        'password_hash' => "{$salt}:{$hash}",
        'name' => 'Admin User',
        'role' => 'admin',
    ]);
}

it('can fetch admin overview and health status', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/overview');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'metrics' => [
                'totalUsers',
                'rolesBreakdown',
                'totalClassrooms',
                'activeClassrooms',
                'totalProgressLogs',
                'totalAiLogs',
            ],
            'health' => [
                'database',
                'cache',
                'aiEngine',
                'itemBankStorage',
                'serverTime',
            ],
            'recentSyncs',
        ]);
});

it('can purge master item bank and classroom caches', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/cache-purge');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);
});

it('can search and filter users in admin user directory', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test')->plainTextToken;

    User::create([
        'user_id' => 'USR-TCH01',
        'email' => 'teacher1@school.edu',
        'password_hash' => 'dummy:hash',
        'name' => 'Teacher One',
        'role' => 'teacher',
    ]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/users?role=teacher');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'users' => [
                '*' => ['id', 'userId', 'email', 'name', 'role'],
            ],
        ]);

    expect(count($response->json('users')))->toBe(1);
    expect($response->json('users.0.email'))->toBe('teacher1@school.edu');
});

it('can update a user role and reset password', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test')->plainTextToken;

    $target = User::create([
        'user_id' => 'USR-TARGET',
        'email' => 'target@school.edu',
        'password_hash' => 'dummy:hash',
        'name' => 'Target User',
        'role' => 'teacher',
    ]);

    // Update Role
    $roleRes = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/admin/users/{$target->id}/update-role", [
            'role' => 'admin',
        ]);
    $roleRes->assertStatus(200)->assertJson(['success' => true]);
    expect($target->fresh()->role)->toBe('admin');

    // Reset Password
    $pwRes = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/admin/users/{$target->id}/reset-password", [
            'password' => 'NewSecretPassword123!',
        ]);
    $pwRes->assertStatus(200)->assertJson(['success' => true]);
    expect($target->fresh()->password_hash)->toContain(':');
});

it('can list classrooms and toggle lock status', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test')->plainTextToken;

    $classroom = Classroom::create([
        'classroom_id' => 'MATH-G4-SECT1',
        'teacher_user_id' => $admin->id,
        'teacher_name' => 'Admin Teacher',
        'subject' => 'Mathematics',
        'grade_level' => 4,
        'expires_at' => null,
    ]);

    // Get Classrooms
    $listRes = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/classrooms');
    $listRes->assertStatus(200)
        ->assertJsonStructure([
            'classrooms' => [
                '*' => ['id', 'classroomId', 'teacherName', 'subject', 'gradeLevel', 'enrolledStudents', 'isLocked'],
            ],
        ]);

    // Toggle Lock
    $lockRes = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/admin/classrooms/{$classroom->id}/toggle-lock");
    $lockRes->assertStatus(200)
        ->assertJson([
            'success' => true,
            'isLocked' => true,
        ]);
});

it('can compute aggregated institutional report summaries', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test')->plainTextToken;

    ProgressLog::create([
        'event_id' => 'EVT-ADM-01',
        'student_id' => 'STU-001',
        'classroom_id' => 'ROOM1',
        'subject' => 'Mathematics',
        'grade_level' => 4,
        'topic' => 'Fractions',
        'score' => 8,
        'total_questions' => 10,
        'difficulty' => 'Average',
        'timestamp' => now(),
    ]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/reports/summary');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'totalAssessments',
            'mathAverage',
            'englishAverage',
            'gradeBreakdown',
            'topicMastery',
        ]);
});

it('registers teacher with pending verification and blocks classroom creation until approved', function () {
    // 1. Register new teacher
    $regRes = $this->postJson('/api/auth/register', [
        'email' => 'newteacher@school.edu',
        'password' => 'TeacherPass123!',
        'first_name' => 'Corazon',
        'last_name' => 'Aquino',
        'role' => 'teacher',
        'school_name' => 'Manila Central High',
        'school_id_number' => 'DEPED-102938',
        'id_document' => 'data:image/png;base64,sampleIdDocumentData',
    ]);

    $regRes->assertStatus(200)
        ->assertJson([
            'success' => true,
            'user' => [
                'role' => 'teacher',
                'verificationStatus' => 'pending',
                'schoolName' => 'Manila Central High',
                'schoolIdNumber' => 'DEPED-102938',
            ],
        ]);

    $teacherId = $regRes->json('user.userId');

    // 2. Attempt logging in while pending -> Should return 403 Forbidden
    $loginPendingRes = $this->postJson('/api/auth/login', [
        'email' => 'newteacher@school.edu',
        'password' => 'TeacherPass123!',
    ]);

    $loginPendingRes->assertStatus(403)
        ->assertJson([
            'verification_status' => 'pending',
        ]);

    // 3. Admin views pending verifications
    $admin = createAdminUser();
    $adminToken = $admin->createToken('test')->plainTextToken;

    $this->flushHeaders();
    app('auth')->forgetGuards();
    $verifListRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->getJson('/api/admin/teacher-verifications?status=pending');

    $verifListRes->assertStatus(200)
        ->assertJsonStructure([
            'verifications' => [
                '*' => ['id', 'userId', 'email', 'name', 'schoolName', 'schoolIdNumber', 'verificationStatus', 'idDocumentPath'],
            ],
            'counts' => ['pending', 'approved', 'rejected', 'total'],
        ]);
    expect($verifListRes->json('counts.pending'))->toBeGreaterThanOrEqual(1);

    // 4. Admin approves teacher verification
    $userModel = User::where('user_id', $teacherId)->first();
    $this->flushHeaders();
    app('auth')->forgetGuards();
    $reviewRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->postJson("/api/admin/teacher-verifications/{$userModel->id}/review", [
            'action' => 'approve',
        ]);

    $reviewRes->assertStatus(200)
        ->assertJson([
            'success' => true,
            'user' => [
                'verificationStatus' => 'approved',
            ],
        ]);

    expect($userModel->fresh()->verification_status)->toBe('approved');

    // 4.5. Admin fetches verification queue with approved status
    $this->flushHeaders();
    app('auth')->forgetGuards();
    $postApproveQueueRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->getJson('/api/admin/teacher-verifications?status=all');
    $postApproveQueueRes->assertStatus(200)
        ->assertJsonStructure([
            'verifications' => [
                '*' => ['id', 'userId', 'email', 'name', 'verificationStatus', 'verifiedAt'],
            ],
            'counts' => ['pending', 'approved', 'rejected', 'total'],
        ]);
    expect($postApproveQueueRes->json('counts.approved'))->toBeGreaterThanOrEqual(1);

    // 5. Approved teacher can now log in and create classrooms
    $this->flushHeaders();
    app('auth')->forgetGuards();
    $loginApprovedRes = $this->postJson('/api/auth/login', [
        'email' => 'newteacher@school.edu',
        'password' => 'TeacherPass123!',
    ]);
    $loginApprovedRes->assertStatus(200);
    $approvedToken = $loginApprovedRes->json('token');

    $classResApproved = $this->withHeader('Authorization', "Bearer {$approvedToken}")
        ->postJson('/api/classroom/create', [
            'teacherName' => 'Teacher Corazon',
            'subject' => 'Mathematics',
            'gradeLevel' => 4,
        ]);

    $classResApproved->assertStatus(200)
        ->assertJsonStructure(['classroomId', 'teacherName', 'subject', 'gradeLevel']);
});

it('can delete a teacher verification application from admin side', function () {
    $teacher = User::create([
        'user_id' => 'USR-DEL-TEACH',
        'email' => 'deleteteacher@school.edu',
        'password_hash' => 'hash',
        'name' => 'Teacher To Delete',
        'role' => 'teacher',
        'verification_status' => 'rejected',
        'rejection_reason' => 'Retry',
    ]);

    $admin = createAdminUser();
    $adminToken = $admin->createToken('test')->plainTextToken;

    $res = $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->deleteJson("/api/admin/teacher-verifications/{$teacher->id}");

    $res->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    expect(User::where('user_id', 'USR-DEL-TEACH')->exists())->toBeFalse();
});

