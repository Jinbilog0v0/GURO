<?php

use App\Models\User;
use App\Models\Classroom;
use App\Models\ProgressLog;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can register a new user with PBKDF2 hashing', function () {
    $response = $this->postJson('/api/auth/register', [
        'email' => 'teacher@example.com',
        'password' => 'securepassword123',
        'name' => 'John Doe',
        'role' => 'teacher'
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'user' => ['userId', 'email', 'name', 'role', 'classroomId']
        ]);

    $user = User::where('email', 'teacher@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->role)->toBe('teacher');
    expect($user->password_hash)->toContain(':'); // Ensure it contains salt:hash
});

it('can login an existing user', function () {
    // Register first
    $this->postJson('/api/auth/register', [
        'email' => 'parent@example.com',
        'password' => 'parentpassword',
        'name' => 'Jane Smith',
        'role' => 'parent'
    ]);

    // Attempt login
    $response = $this->postJson('/api/auth/login', [
        'email' => 'parent@example.com',
        'password' => 'parentpassword'
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true
        ])
        ->assertJsonStructure([
            'user' => ['userId', 'email', 'name', 'role', 'classroomId']
        ]);
});

it('can promote a guest student to a registered account and migrate logs', function () {
    // Seed some progress logs for anonymous student
    ProgressLog::create([
        'event_id' => 'EVT-001',
        'student_id' => 'GUEST-XYZ',
        'classroom_id' => null,
        'subject' => 'Mathematics',
        'grade_level' => 4,
        'topic' => 'Fractions',
        'score' => 4,
        'total_questions' => 5,
        'timestamp' => now()
    ]);

    $response = $this->postJson('/api/auth/promote', [
        'anonymousStudentId' => 'GUEST-XYZ',
        'email' => 'student@example.com',
        'password' => 'studentpass',
        'name' => 'Alex Brown'
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'studentId' => 'ALEX-BROWN'
        ]);

    // Check that the progress log student_id was migrated
    $log = ProgressLog::where('event_id', 'EVT-001')->first();
    expect($log->student_id)->toBe('ALEX-BROWN');

    // Check user was created
    $user = User::where('email', 'student@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->role)->toBe('student');
});

it('can create a classroom and verify its invite code', function () {
    $response = $this->postJson('/api/classroom/create', [
        'teacherName' => 'Mrs. Davis',
        'subject' => 'English',
        'gradeLevel' => 5
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'classroomId', 'teacherName', 'subject', 'gradeLevel', 'customItemBank'
        ]);

    $classCode = $response->json('classroomId');

    // Verify classroom code
    $verifyRes = $this->getJson("/api/classroom/verify?code={$classCode}");
    $verifyRes->assertStatus(200)
        ->assertJson([
            'classroomId' => $classCode,
            'teacherName' => 'Mrs. Davis',
            'subject' => 'English'
        ]);
});

it('can sync telemetry progress logs and retrieve them', function () {
    $response = $this->postJson('/api/sync', [
        'studentId' => 'STUDENT-1',
        'classroomId' => 'ENG-G5-ABC',
        'events' => [
            [
                'eventId' => 'LOG-100',
                'subject' => 'English',
                'gradeLevel' => 5,
                'topic' => 'Adjectives',
                'score' => 3,
                'totalQuestions' => 5,
                'timestamp' => now()->toIso8601String()
            ]
        ]
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'received' => 1,
            'newSynced' => 1
        ]);

    // Fetch progress logs
    $progressRes = $this->getJson('/api/progress?classroomId=ENG-G5-ABC');
    $progressRes->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment([
            'eventId' => 'LOG-100',
            'studentId' => 'STUDENT-1'
        ]);

    // Rejects progress request without filters
    $noFilterRes = $this->getJson('/api/progress');
    $noFilterRes->assertStatus(400)
        ->assertJsonFragment(['error' => 'Missing required filters. Provide classroomId or both studentId and accessCode.']);

    // Rejects progress request with studentId but missing accessCode
    $missingCodeRes = $this->getJson('/api/progress?studentId=STUDENT-1');
    $missingCodeRes->assertStatus(400);

    // Rejects progress request with studentId but wrong accessCode
    $wrongCodeRes = $this->getJson('/api/progress?studentId=STUDENT-1&accessCode=000000');
    $wrongCodeRes->assertStatus(403)
        ->assertJsonFragment(['error' => 'Invalid parent access code.']);

    // Accept progress request with studentId and correct accessCode
    $salt = "GURO_PARENT_SALT";
    $combined = "STUDENT-1" . $salt;
    $sum = 0;
    $len = strlen($combined);
    for ($i = 0; $i < $len; $i++) {
        $sum += ord($combined[$i]) * ($i + 1);
    }
    $correctCode = (string) (100000 + ($sum % 900000));

    $correctRes = $this->getJson("/api/progress?studentId=STUDENT-1&accessCode={$correctCode}");
    $correctRes->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment([
            'eventId' => 'LOG-100',
            'studentId' => 'STUDENT-1'
        ]);
});

it('can generate a lesson from text', function () {
    $this->mock(App\Services\GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateQuestions')
            ->once()
            ->with('English', 5, 'Nouns', 'Lesson Content', null)
            ->andReturn([
                'studyContent' => [
                    'introduction' => 'Intro text',
                    'definitions' => [],
                    'summary' => []
                ],
                'questions' => []
            ]);
    });

    $response = $this->postJson('/api/generate', [
        'subject' => 'English',
        'grade' => 5,
        'topic' => 'Nouns',
        'lessonText' => 'Lesson Content',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'studyContent' => [
                'introduction' => 'Intro text'
            ],
            'questions' => []
        ]);
});

it('can generate a lesson from PDF base64', function () {
    $this->mock(App\Services\GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateQuestions')
            ->once()
            ->with('English', 5, 'Nouns', null, 'encoded_pdf_data')
            ->andReturn([
                'studyContent' => [
                    'introduction' => 'Intro text',
                    'definitions' => [],
                    'summary' => []
                ],
                'questions' => []
            ]);
    });

    $response = $this->postJson('/api/generate', [
        'subject' => 'English',
        'grade' => 5,
        'topic' => 'Nouns',
        'pdf' => 'encoded_pdf_data',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'studyContent' => [
                'introduction' => 'Intro text'
            ],
            'questions' => []
        ]);
});
