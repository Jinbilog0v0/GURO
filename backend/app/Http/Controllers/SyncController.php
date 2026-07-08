<?php

namespace App\Http\Controllers;

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

        $newEventsAppended = [];
        $eventIds = array_column($events, 'eventId');

        // Query all existing event IDs in a single query
        $existingEventIds = ProgressLog::whereIn('event_id', $eventIds)->pluck('event_id')->toArray();
        $existingLookup = array_flip($existingEventIds);

        $recordsToInsert = [];
        $now = now();

        foreach ($events as $evt) {
            $eventId = $evt['eventId'];

            // Prevent duplicate insertion
            if (!isset($existingLookup[$eventId])) {
                $recordsToInsert[] = [
                    'event_id' => $eventId,
                    'student_id' => $studentId,
                    'classroom_id' => $classroomId ?: null,
                    'subject' => $evt['subject'],
                    'grade_level' => (int) $evt['gradeLevel'],
                    'topic' => $evt['topic'],
                    'score' => (int) $evt['score'],
                    'total_questions' => (int) $evt['totalQuestions'],
                    'timestamp' => $evt['timestamp'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $newEventsAppended[] = [
                    'eventId' => $eventId,
                    'studentId' => $studentId,
                    'classroomId' => $classroomId ?: null,
                    'subject' => $evt['subject'],
                    'gradeLevel' => (int) $evt['gradeLevel'],
                    'topic' => $evt['topic'],
                    'score' => (int) $evt['score'],
                    'totalQuestions' => (int) $evt['totalQuestions'],
                    'timestamp' => $evt['timestamp'],
                ];
            }
        }

        if (!empty($recordsToInsert)) {
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
        $studentId = $request->query('studentId');
        $accessToken = $request->query('accessCode');

        if ($studentId) {
            $studentId = strtoupper(preg_replace('/\s+/', '-', trim($studentId)));
        }

        $hasClassroom = !empty($classroomId);
        $hasStudentAndToken = !empty($studentId) && !empty($accessToken);

        if (!$hasClassroom && !$hasStudentAndToken) {
            return response()->json([
                'error' => 'Missing required filters. Provide classroomId or both studentId and accessCode.'
            ], 400);
        }

        if ($hasStudentAndToken) {
            $expectedCode = $this->getParentAccessCode($studentId);
            if ($accessToken !== $expectedCode) {
                return response()->json(['error' => 'Invalid parent access code.'], 403);
            }
        }

        try {
            $query = ProgressLog::query();
            if ($hasClassroom) {
                $query->where('classroom_id', strtoupper($classroomId));
            }
            if ($hasStudentAndToken) {
                $query->where('student_id', $studentId);
            }

            $logs = $query->orderBy('timestamp', 'desc')->limit(100)->get();

            $formatted = $logs->map(fn ($row) => [
                'eventId' => $row->event_id,
                'studentId' => $row->student_id,
                'classroomId' => $row->classroom_id,
                'subject' => $row->subject,
                'gradeLevel' => $row->grade_level,
                'topic' => $row->topic,
                'score' => $row->score,
                'totalQuestions' => $row->total_questions,
                'timestamp' => $row->timestamp,
            ]);

            return response()->json($formatted);
        } catch (\Exception $e) {
            \Log::error('GetProgress error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Failed to read synced progress database: ' . $e->getMessage()], 500);
        }
    }

    private function getParentAccessCode(string $studentId): string
    {
        $normalized = strtoupper(preg_replace('/\s+/', '-', trim($studentId)));
        $salt = "GURO_PARENT_SALT";
        $combined = $normalized . $salt;
        $sum = 0;
        $len = strlen($combined);
        for ($i = 0; $i < $len; $i++) {
            $sum += ord($combined[$i]) * ($i + 1);
        }
        return (string) (100000 + ($sum % 900000));
    }
}
