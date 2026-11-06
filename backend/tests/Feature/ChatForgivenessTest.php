<?php

use App\Models\Classroom;
use App\Models\ParentTeacherMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->teacher = User::create([
        'user_id' => 'TEA-101',
        'email' => 'teacher@guro.dev',
        'password_hash' => 'hash',
        'name' => 'Teacher Santos',
        'role' => 'teacher',
    ]);

    $this->classroom = Classroom::create([
        'classroom_id' => 'CLS-401',
        'teacher_user_id' => $this->teacher->id,
        'subject' => 'Mathematics',
        'grade_level' => 4,
        'section_name' => 'Sampaguita',
        'teacher_name' => 'Teacher Santos',
    ]);
});

it('allows editing a message within 30 minutes and retains original text', function () {
    Carbon::setTestNow('2026-11-06 10:00:00');

    $msg = ParentTeacherMessage::create([
        'classroom_id' => 'CLS-401',
        'student_id' => 'STU-101',
        'sender_id' => 'TEA-101',
        'sender_name' => 'Teacher Santos',
        'sender_role' => 'teacher',
        'message_body' => 'Please review Chapter 2 by tomorrow.',
    ]);

    // Fast-forward 15 minutes (within 30 mins)
    Carbon::setTestNow('2026-11-06 10:15:00');

    $response = $this->postJson('/api/chat/edit', [
        'messageId' => $msg->id,
        'messageBody' => 'Correction: Please review Chapter 3 by tomorrow.',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message.message_body', 'Correction: Please review Chapter 3 by tomorrow.')
        ->assertJsonPath('message.original_message_body', 'Please review Chapter 2 by tomorrow.');

    $updated = $msg->fresh();
    expect($updated->message_body)->toBe('Correction: Please review Chapter 3 by tomorrow.');
    expect($updated->original_message_body)->toBe('Please review Chapter 2 by tomorrow.');
    expect($updated->edited_at)->not->toBeNull();
    expect(count($updated->edit_history))->toBe(1);
    expect($updated->edit_history[0]['previous_body'])->toBe('Please review Chapter 2 by tomorrow.');
});

it('blocks editing a message sent more than 30 minutes ago', function () {
    Carbon::setTestNow('2026-11-06 10:00:00');

    $msg = ParentTeacherMessage::create([
        'classroom_id' => 'CLS-401',
        'student_id' => 'STU-101',
        'sender_id' => 'PAR-101',
        'sender_name' => 'Parent Cruz',
        'sender_role' => 'parent',
        'message_body' => 'Will Juan have a quiz today?',
    ]);

    // Fast-forward 31 minutes (exceeded 30 mins)
    Carbon::setTestNow('2026-11-06 10:31:00');

    $response = $this->postJson('/api/chat/edit', [
        'messageId' => $msg->id,
        'messageBody' => 'Nevermind, already answered.',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('error', 'Messages can only be edited within 30 minutes of sending.');

    $updated = $msg->fresh();
    expect($updated->message_body)->toBe('Will Juan have a quiz today?');
    expect($updated->edited_at)->toBeNull();
});

it('allows unsending a message', function () {
    $msg = ParentTeacherMessage::create([
        'classroom_id' => 'CLS-401',
        'student_id' => 'STU-101',
        'sender_id' => 'TEA-101',
        'sender_name' => 'Teacher Santos',
        'sender_role' => 'teacher',
        'message_body' => 'Accidental message sent to wrong parent.',
    ]);

    $response = $this->postJson('/api/chat/unsend', [
        'messageId' => $msg->id,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message.is_unsent', true);

    $updated = $msg->fresh();
    expect($updated->is_unsent)->toBeTrue();
    expect($updated->unsent_at)->not->toBeNull();
});

it('prevents editing an unsent message', function () {
    $msg = ParentTeacherMessage::create([
        'classroom_id' => 'CLS-401',
        'student_id' => 'STU-101',
        'sender_id' => 'TEA-101',
        'sender_name' => 'Teacher Santos',
        'sender_role' => 'teacher',
        'message_body' => 'Initial text',
        'is_unsent' => true,
        'unsent_at' => now(),
    ]);

    $response = $this->postJson('/api/chat/edit', [
        'messageId' => $msg->id,
        'messageBody' => 'Trying to edit unsent',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('error', 'Cannot edit an unsent message.');
});
