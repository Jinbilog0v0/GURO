<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    // POST /api/sync
    public function syncTelemetry(Request $request)
    {
        $request->validate([
            'studentId' => 'required|string',
            'events' => 'required|array',
            'classroomId' => 'nullable|string',
        ]);

        $studentId = $request->input('studentId');
        $events = $request->input('events');
        $classroomId = $request->input('classroomId');
        $normClassroomId = $classroomId ? strtoupper(trim($classroomId)) : null;

        $sectionName = null;
        if ($normClassroomId) {
            $classroom = Classroom::where('classroom_id', $normClassroomId)->first();
            $sectionName = $classroom ? $classroom->section_name : null;

            $member = ClassroomMember::firstOrCreate([
                'classroom_id' => $normClassroomId,
                'student_id' => $studentId,
            ], [
                'section_name' => $sectionName,
            ]);

            if ($sectionName && $member->section_name !== $sectionName) {
                $member->section_name = $sectionName;
                $member->save();
            }

            // Also update the student user's classroom_id column if the user exists
            $studentUser = User::where('user_id', $studentId)->first();
            if ($studentUser && $studentUser->classroom_id !== $normClassroomId) {
                $studentUser->classroom_id = $normClassroomId;
                $studentUser->save();
            }

            // Associate any previous null classroom_id logs for this student
            ProgressLog::where('student_id', $studentId)
                ->whereNull('classroom_id')
                ->update(['classroom_id' => $normClassroomId]);
        }

        $newEventsAppended = [];
        $eventIds = array_column($events, 'eventId');

        // Query all existing event IDs in a single query
        $existingEventIds = ProgressLog::whereIn('event_id', $eventIds)->pluck('event_id')->toArray();
        $existingLookup = array_flip($existingEventIds);

        $recordsToInsert = [];
        $now = now();

        foreach ($events as $evt) {
            $eventId = $evt['eventId'];
            $assessmentType = $evt['assessmentType'] ?? $evt['assessment_type'] ?? 'practice';
            $schoolYear = $evt['schoolYear'] ?? $evt['school_year'] ?? '2026-2027';
            $term = $evt['term'] ?? 'Quarter 1';
            $evtSection = $evt['sectionName'] ?? $evt['section_name'] ?? $sectionName;
            $rawSubject = trim($evt['subject'] ?? 'Mathematics');
            $normSubject = (strcasecmp($rawSubject, 'Math') === 0 || strcasecmp($rawSubject, 'Mathematics') === 0) ? 'Mathematics' : $rawSubject;

            // Prevent duplicate insertion
            if (! isset($existingLookup[$eventId])) {
                $recordsToInsert[] = [
                    'event_id' => $eventId,
                    'student_id' => $studentId,
                    'classroom_id' => $normClassroomId ?: null,
                    'section_name' => $evtSection,
                    'subject' => $normSubject,
                    'grade_level' => (int) $evt['gradeLevel'],
                    'topic' => $evt['topic'],
                    'score' => (int) $evt['score'],
                    'total_questions' => (int) $evt['totalQuestions'],
                    'difficulty' => $evt['difficulty'] ?? 'Average',
                    'assessment_type' => $assessmentType,
                    'school_year' => $schoolYear,
                    'term' => $term,
                    'timestamp' => $evt['timestamp'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $newEventsAppended[] = [
                    'eventId' => $eventId,
                    'studentId' => $studentId,
                    'classroomId' => $normClassroomId ?: null,
                    'sectionName' => $evtSection,
                    'subject' => $normSubject,
                    'gradeLevel' => (int) $evt['gradeLevel'],
                    'topic' => $evt['topic'],
                    'score' => (int) $evt['score'],
                    'totalQuestions' => (int) $evt['totalQuestions'],
                    'difficulty' => $evt['difficulty'] ?? 'Average',
                    'assessmentType' => $assessmentType,
                    'schoolYear' => $schoolYear,
                    'term' => $term,
                    'timestamp' => $evt['timestamp'],
                ];
            }
        }

        if (! empty($recordsToInsert)) {
            ProgressLog::insert($recordsToInsert);
        }

        return response()->json([
            'success' => true,
            'received' => count($events),
            'newSynced' => count($newEventsAppended),
        ]);
    }

    // GET /api/progress
    public function getProgress(Request $request)
    {
        $classroomId = $request->query('classroomId');
        $rawStudentId = $request->query('studentId');
        $accessToken = $request->query('accessCode');
        $termFilter = $request->query('term');
        $yearFilter = $request->query('schoolYear');
        $typeFilter = $request->query('assessmentType');
        $sectionFilter = $request->query('section');

        $hasClassroom = ! empty($classroomId);
        $hasStudent = ! empty($rawStudentId);

        if (! $hasClassroom && ! $hasStudent) {
            return response()->json([
                'error' => 'Missing required filters. Provide classroomId or studentId.',
            ], 400);
        }

        $targetStudentIds = [];

        // If studentId is provided, we MUST validate the accessCode
        if ($hasStudent) {
            if (empty($accessToken)) {
                return response()->json(['error' => 'Missing required accessCode for student query.'], 400);
            }

            $searchResolution = $this->resolveStudentSearch($rawStudentId);
            $targetStudentIds = $searchResolution['targetIds'];
            $validAccessCodes = $searchResolution['validAccessCodes'];

            if (! in_array(trim($accessToken), $validAccessCodes)) {
                return response()->json(['error' => 'Invalid parent access code.'], 403);
            }
        } else {
            // Classroom-only query: must be authenticated as the teacher of this classroom (or admin/developer)
            $user = $request->user('sanctum');
            if (! $user || ! in_array($user->role, ['teacher', 'admin', 'developer'])) {
                return response()->json(['error' => 'Unauthenticated. Classroom query requires an authenticated teacher session.'], 401);
            }

            $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
            if (! $classroom) {
                return response()->json(['error' => 'Classroom not found.'], 404);
            }

            $isOwner = in_array($user->role, ['admin', 'developer'])
                || ((int) $classroom->teacher_user_id === (int) $user->id)
                || ($classroom->teacher_user_id === $user->user_id)
                || ($classroom->teacher_name === $user->name);

            if (! $isOwner) {
                return response()->json(['error' => 'Forbidden. You are not the teacher of this classroom.'], 403);
            }
        }

        try {
            $query = ProgressLog::query();
            if ($hasClassroom) {
                $normClassroomId = strtoupper(trim($classroomId));
                $memberStudentIds = ClassroomMember::where('classroom_id', $normClassroomId)->pluck('student_id')->toArray();

                $query->where(function ($q) use ($normClassroomId, $memberStudentIds) {
                    $q->where('classroom_id', $normClassroomId);
                    if (! empty($memberStudentIds)) {
                        $q->orWhereIn('student_id', $memberStudentIds);
                    }
                });
            }
            if ($hasStudent && ! empty($targetStudentIds)) {
                $query->whereIn('student_id', $targetStudentIds);
            }
            if ($sectionFilter && $sectionFilter !== 'All') {
                $query->where('section_name', $sectionFilter);
            }
            if ($termFilter && $termFilter !== 'All') {
                $query->where('term', $termFilter);
            }
            if ($yearFilter && $yearFilter !== 'All') {
                $query->where('school_year', $yearFilter);
            }
            if ($typeFilter && $typeFilter !== 'All') {
                $query->where('assessment_type', $typeFilter);
            }

            $logs = $query->orderBy('timestamp', 'desc')->limit(200)->get();

            $formatted = $logs->map(fn ($row) => [
                'eventId' => $row->event_id,
                'studentId' => $row->student_id,
                'classroomId' => $row->classroom_id ?: ($hasClassroom ? strtoupper(trim($classroomId)) : null),
                'sectionName' => $row->section_name,
                'subject' => (strcasecmp($row->subject, 'Math') === 0 || strcasecmp($row->subject, 'Mathematics') === 0) ? 'Mathematics' : $row->subject,
                'gradeLevel' => $row->grade_level,
                'topic' => $row->topic,
                'score' => $row->score,
                'totalQuestions' => $row->total_questions,
                'difficulty' => $row->difficulty ?? 'Average',
                'assessmentType' => $row->assessment_type ?? 'practice',
                'schoolYear' => $row->school_year ?? '2026-2027',
                'term' => $row->term ?? 'Quarter 1',
                'timestamp' => $row->timestamp,
            ]);

            return response()->json($formatted);
        } catch (\Exception $e) {
            \Log::error('GetProgress error: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['error' => 'Failed to read synced progress database: '.$e->getMessage()], 500);
        }
    }

    /**
     * Resolve student identity and matching IDs from raw query (e.g. "Cruz, Juan", "Juan Cruz", "CRUZ-JUAN", etc.)
     */
    private function resolveStudentSearch(string $rawQuery): array
    {
        $cleaned = trim($rawQuery);
        $targetIds = [];
        $validAccessCodes = [];

        // 1. Direct normalization of the input query string
        $normalizedInput = strtoupper(preg_replace('/[^\w\-]/', '-', $cleaned));
        $normalizedInput = preg_replace('/-+/', '-', $normalizedInput);
        $normalizedInput = trim($normalizedInput, '-');

        if ($normalizedInput !== '') {
            $targetIds[] = $normalizedInput;
            $validAccessCodes[] = $this->getParentAccessCode($normalizedInput);
        }
        $targetIds[] = $cleaned;
        $validAccessCodes[] = $this->getParentAccessCode($cleaned);

        // If comma present in query (e.g. "Cruz, Juan")
        if (str_contains($cleaned, ',')) {
            $parts = array_map('trim', explode(',', $cleaned, 2));
            $l = preg_replace('/[^\w]/', '', $parts[0] ?? '');
            $f = preg_replace('/[^\w]/', '', $parts[1] ?? '');
            if ($l !== '' && $f !== '') {
                $lfSlug = strtoupper("{$l}-{$f}");
                $flSlug = strtoupper("{$f}-{$l}");
                $targetIds[] = $lfSlug;
                $targetIds[] = $flSlug;
                $validAccessCodes[] = $this->getParentAccessCode($lfSlug);
                $validAccessCodes[] = $this->getParentAccessCode($flSlug);
                $validAccessCodes[] = $this->getParentAccessCode("{$f} {$l}");
                $validAccessCodes[] = $this->getParentAccessCode("{$l} {$f}");
            }
        } else {
            $words = preg_split('/\s+/', $cleaned);
            if (count($words) >= 2) {
                $w1 = preg_replace('/[^\w]/', '', $words[0]);
                $w2 = preg_replace('/[^\w]/', '', $words[count($words) - 1]);
                if ($w1 !== '' && $w2 !== '') {
                    $w1w2Slug = strtoupper("{$w1}-{$w2}");
                    $w2w1Slug = strtoupper("{$w2}-{$w1}");
                    $targetIds[] = $w1w2Slug;
                    $targetIds[] = $w2w1Slug;
                    $validAccessCodes[] = $this->getParentAccessCode($w1w2Slug);
                    $validAccessCodes[] = $this->getParentAccessCode($w2w1Slug);
                }
            }
        }

        // 2. Check in User model for registered student accounts
        $userQuery = User::where(function ($q) use ($cleaned, $normalizedInput) {
            $q->where('user_id', $cleaned)
                ->orWhere('user_id', $normalizedInput)
                ->orWhere('email', strtolower($cleaned))
                ->orWhere('name', 'like', "%{$cleaned}%")
                ->orWhere('first_name', 'like', "%{$cleaned}%")
                ->orWhere('last_name', 'like', "%{$cleaned}%");

            if (str_contains($cleaned, ',')) {
                $parts = array_map('trim', explode(',', $cleaned, 2));
                $last = $parts[0] ?? '';
                $first = $parts[1] ?? '';
                if ($last !== '' && $first !== '') {
                    $q->orWhere(function ($sub) use ($last, $first) {
                        $sub->where('last_name', 'like', "%{$last}%")
                            ->where('first_name', 'like', "%{$first}%");
                    });
                }
            } else {
                $words = preg_split('/\s+/', $cleaned);
                if (count($words) >= 2) {
                    $w1 = $words[0];
                    $w2 = $words[count($words) - 1];
                    $q->orWhere(function ($sub) use ($w1, $w2) {
                        $sub->where(function ($s1) use ($w1, $w2) {
                            $s1->where('last_name', 'like', "%{$w1}%")->where('first_name', 'like', "%{$w2}%");
                        })->orWhere(function ($s2) use ($w1, $w2) {
                            $s2->where('first_name', 'like', "%{$w1}%")->where('last_name', 'like', "%{$w2}%");
                        });
                    });
                }
            }
        });

        $matchedUsers = $userQuery->get();

        foreach ($matchedUsers as $u) {
            if ($u->user_id) {
                $targetIds[] = $u->user_id;
                $validAccessCodes[] = $this->getParentAccessCode($u->user_id);
            }
            if ($u->parent_access_token) {
                $validAccessCodes[] = $u->parent_access_token;
            }
            if ($u->name) {
                $targetIds[] = $u->name;
                $targetIds[] = strtoupper(str_replace(' ', '-', $u->name));
                $validAccessCodes[] = $this->getParentAccessCode($u->name);
                $validAccessCodes[] = $this->getParentAccessCode(strtoupper(str_replace(' ', '-', $u->name)));
            }
            if ($u->last_name && $u->first_name) {
                $lastFirst = strtoupper($u->last_name.'-'.$u->first_name);
                $firstLast = strtoupper($u->first_name.'-'.$u->last_name);
                $targetIds[] = $lastFirst;
                $targetIds[] = $firstLast;
                $validAccessCodes[] = $this->getParentAccessCode($lastFirst);
                $validAccessCodes[] = $this->getParentAccessCode($firstLast);
                $validAccessCodes[] = $this->getParentAccessCode($u->last_name.', '.$u->first_name);
                $validAccessCodes[] = $this->getParentAccessCode($u->first_name.' '.$u->last_name);
            }
        }

        // 3. Search in ProgressLog table directly for existing student_id records matching patterns
        $logMatches = ProgressLog::where(function ($q) use ($cleaned, $normalizedInput) {
            $q->where('student_id', $cleaned)
                ->orWhere('student_id', $normalizedInput)
                ->orWhere('student_id', 'like', "%{$normalizedInput}%");
            if (str_contains($cleaned, ',')) {
                $parts = array_map('trim', explode(',', $cleaned, 2));
                $l = $parts[0] ?? '';
                $f = $parts[1] ?? '';
                if ($l !== '' && $f !== '') {
                    $q->orWhere(function ($sub) use ($l, $f) {
                        $sub->where('student_id', 'like', "%{$l}%")
                            ->where('student_id', 'like', "%{$f}%");
                    });
                }
            }
        })->pluck('student_id')->unique()->toArray();

        foreach ($logMatches as $logId) {
            $targetIds[] = $logId;
            $validAccessCodes[] = $this->getParentAccessCode($logId);
        }

        return [
            'targetIds' => array_values(array_unique(array_filter($targetIds))),
            'validAccessCodes' => array_values(array_unique(array_filter($validAccessCodes))),
        ];
    }

    private function getParentAccessCode(string $studentId): string
    {
        $normalized = strtoupper(preg_replace('/\s+/', '-', trim($studentId)));
        $salt = 'GURO_PARENT_SALT';
        $combined = $normalized.$salt;
        $sum = 0;
        $len = strlen($combined);
        for ($i = 0; $i < $len; $i++) {
            $sum += ord($combined[$i]) * ($i + 1);
        }

        return (string) (100000 + ($sum % 900000));
    }
}
