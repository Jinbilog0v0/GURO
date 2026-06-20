<?php

namespace App\Http\Controllers;

use App\Models\ProgressLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        $accessCode = $request->query('accessCode');

        $hasClassroom = !empty($classroomId);
        $hasStudentAndCode = !empty($studentId) && !empty($accessCode);

        if (!$hasClassroom && !$hasStudentAndCode) {
            return response()->json([
                'error' => 'Missing required filters. Provide classroomId or both studentId and accessCode.'
            ], 400);
        }

        if ($hasStudentAndCode) {
            $expectedCode = $this->getParentAccessCode($studentId);
            if ($accessCode !== $expectedCode) {
                return response()->json([
                    'error' => 'Invalid parent access code.'
                ], 403);
            }
        }

        try {
            $query = ProgressLog::query();
            if ($hasClassroom) {
                $query->where('classroom_id', strtoupper($classroomId));
            }
            if ($hasStudentAndCode) {
                $query->where('student_id', strtoupper($studentId));
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
            return response()->json(['error' => 'Failed to read synced progress database.'], 500);
        }
    }

    private function getParentAccessCode(string $studentId): string
    {
        $salt = "GURO_PARENT_SALT";
        $combined = $studentId . $salt;
        $sum = 0;
        $len = strlen($combined);
        for ($i = 0; $i < $len; $i++) {
            $sum += ord($combined[$i]) * ($i + 1);
        }
        return (string) (100000 + ($sum % 900000));
    }

    // GET /api/sync-stream
    public function syncStream()
    {
        $response = new StreamedResponse(function () {
            // Keep track of the last processed primary key id to stream new records only
            $lastSeenId = ProgressLog::max('id') ?: 0;

            // Enforce connection retry parameter for EventSource client
            echo "retry: 10000\n\n";
            ob_flush();
            flush();

            while (true) {
                // Check if connection is aborted by client
                if (connection_aborted()) {
                    break;
                }

                // Query for new progress logs
                $newLogs = ProgressLog::where('id', '>', $lastSeenId)
                    ->orderBy('id', 'asc')
                    ->get();

                if ($newLogs->isNotEmpty()) {
                    $lastSeenId = $newLogs->last()->id;

                    $eventsPayload = $newLogs->map(fn ($log) => [
                        'eventId' => $log->event_id,
                        'studentId' => $log->student_id,
                        'classroomId' => $log->classroom_id,
                        'subject' => $log->subject,
                        'gradeLevel' => $log->grade_level,
                        'topic' => $log->topic,
                        'score' => $log->score,
                        'totalQuestions' => $log->total_questions,
                        'timestamp' => $log->timestamp,
                    ])->toArray();

                    echo 'data: '.json_encode($eventsPayload)."\n\n";
                    ob_flush();
                    flush();
                }

                // Heartbeat keepalive format
                echo ": heartbeat\n\n";
                ob_flush();
                flush();

                sleep(2);
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no'); // Prevent Nginx buffering

        return $response;
    }
}
