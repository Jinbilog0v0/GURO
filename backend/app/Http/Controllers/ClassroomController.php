<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\RateLimitConfig;
use App\Models\AiGenerationLog;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassroomController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    private function getItemBankPath(): string
    {
        return base_path('../frontend/guro-mobile/assets/item_bank.json');
    }

    // GET /api/item-bank
    public function getItemBank(Request $request)
    {
        $classroomId = $request->query('classroomId');

        try {
            if ($classroomId) {
                $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
                if (!$classroom) {
                    return response()->json(['error' => 'Classroom not found.'], 404);
                }

                $data = \Illuminate\Support\Facades\Cache::remember("classroom_bank_" . strtoupper($classroomId), 3600, function () use ($classroom) {
                    if (! empty($classroom->custom_item_bank) && count($classroom->custom_item_bank) > 0) {
                        return $classroom->custom_item_bank;
                    }
                    // Fallback to global bank if custom bank is empty
                    $path = $this->getItemBankPath();
                    if (! file_exists($path)) {
                        return [];
                    }
                    return json_decode(file_get_contents($path), true) ?: [];
                });
                return response()->json($data);
            }

            $data = \Illuminate\Support\Facades\Cache::remember('global_item_bank', 3600, function () {
                $path = $this->getItemBankPath();
                if (! file_exists($path)) {
                    return [];
                }
                return json_decode(file_get_contents($path), true) ?: [];
            });

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to read item bank.'], 500);
        }
    }

    // POST /api/generate
    public function generateLesson(Request $request)
    {
        $request->validate([
            'subject' => 'required|string',
            'grade' => 'required',
            'topic' => 'required|string',
            'lessonText' => 'required_without:pdf|nullable|string',
            'pdf' => 'required_without:lessonText|nullable|string',
        ]);

        // ── Rate limit enforcement ────────────────────────────────────────────
        $user = $request->user();
        $role = $user->role ?? 'teacher';

        $config = RateLimitConfig::where('role', $role)->where('is_enabled', true)->first();

        if ($config) {
            $since = now()->subMinutes($config->window_minutes);
            $usageCount = AiGenerationLog::where('user_id', $user->id)
                ->where('generated_at', '>=', $since)
                ->count();

            if ($usageCount >= $config->max_requests) {
                $resetAt = AiGenerationLog::where('user_id', $user->id)
                    ->where('generated_at', '>=', $since)
                    ->oldest('generated_at')
                    ->value('generated_at');

                $resetIn = $resetAt
                    ? (int) ceil(now()->diffInMinutes($resetAt->addMinutes($config->window_minutes), false))
                    : $config->window_minutes;

                return response()->json([
                    'error'          => "AI generation rate limit reached. You have used {$usageCount}/{$config->max_requests} requests in the last {$config->window_minutes} minutes.",
                    'limit'          => $config->max_requests,
                    'window_minutes' => $config->window_minutes,
                    'used'           => $usageCount,
                    'reset_in_minutes' => max(1, $resetIn),
                ], 429);
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        $subject = $request->input('subject');
        $grade = (int) $request->input('grade');
        $topic = $request->input('topic');
        $lessonText = $request->input('lessonText');
        $pdf = $request->input('pdf');

        try {
            $result = $this->geminiService->generateQuestions($subject, $grade, $topic, $lessonText, $pdf);

            // Log successful generation for rate tracking
            AiGenerationLog::create([
                'user_id' => $user->id,
                'role'    => $role,
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gemini generation failed: ' . $e->getMessage()], 500);
        }
    }

    // POST /api/save
    public function saveToItemBank(Request $request)
    {
        $request->validate([
            'subject' => 'required|string',
            'grade' => 'required',
            'topic' => 'required|string',
            'questions' => 'required|array',
            'studyContent' => 'nullable|array',
        ]);

        $subject = $request->input('subject');
        $grade = (string) $request->input('grade');
        $topic = $request->input('topic');
        $questions = $request->input('questions');
        $studyContent = $request->input('studyContent');

        try {
            $path = $this->getItemBankPath();
            $bank = [];
            if (file_exists($path)) {
                $bank = json_decode(file_get_contents($path), true) ?: [];
            }

            if (! isset($bank[$subject])) {
                $bank[$subject] = [];
            }
            if (! isset($bank[$subject][$grade])) {
                $bank[$subject][$grade] = [];
            }
            $bank[$subject][$grade][$topic] = [];

            // Grab a reference
            $topicNode = &$bank[$subject][$grade][$topic];

            if ($studyContent) {
                $topicNode['studyContent'] = $studyContent;
            }

            foreach ($questions as $q) {
                $difficulty = $q['difficulty'];
                $category = $q['category'];

                if (! isset($topicNode[$difficulty])) {
                    $topicNode[$difficulty] = [];
                }
                if (! isset($topicNode[$difficulty][$category])) {
                    $topicNode[$difficulty][$category] = [];
                }

                $topicNode[$difficulty][$category][] = [
                    'id' => $q['id'],
                    'questionText' => $q['questionText'],
                    'options' => $q['options'],
                    'correctAnswer' => $q['correctAnswer'],
                    'feedback' => $q['feedback'],
                ];
            }

            file_put_contents($path, json_encode($bank, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            \Illuminate\Support\Facades\Cache::forget('global_item_bank');

            return response()->json(['success' => true, 'count' => count($questions)]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to write updated questions to local item_bank.json database.'], 500);
        }
    }

    // GET /api/classroom/verify
    public function verifyCode(Request $request)
    {
        $code = $request->query('code');
        if (! $code) {
            return response()->json(['error' => 'Missing code parameter.'], 400);
        }

        $classroom = Classroom::where('classroom_id', strtoupper($code))->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if ($classroom->expires_at && $classroom->expires_at->isPast()) {
            return response()->json(['error' => 'Classroom invite code has expired. Pairing session is locked.'], 403);
        }

        return response()->json([
            'classroomId' => $classroom->classroom_id,
            'teacherName' => $classroom->teacher_name,
            'subject' => $classroom->subject,
            'gradeLevel' => $classroom->grade_level,
            'customItemBank' => $classroom->custom_item_bank ?: (object) [],
            'expiresAt' => $classroom->expires_at ? $classroom->expires_at->toIso8601String() : null,
        ]);
    }

    // POST /api/classroom/create
    public function createClassroom(Request $request)
    {
        $request->validate([
            'teacherName' => 'required|string',
            'subject' => 'required|string',
            'gradeLevel' => 'required',
            'duration' => 'nullable|integer',
        ]);

        $teacherName = trim($request->input('teacherName'));
        $subject = trim($request->input('subject'));
        $gradeLevel = $request->input('gradeLevel');
        $duration = $request->input('duration'); // In minutes

        // Generate invite code
        $subjectPrefix = strtoupper(substr($subject, 0, 3));
        $randomSuffix = strtoupper(Str::random(3));
        $classroomId = "{$subjectPrefix}-G{$gradeLevel}-{$randomSuffix}";

        $expiresAt = null;
        if ($duration && (int)$duration > 0) {
            $expiresAt = now()->addMinutes((int)$duration);
        }

        $classroom = Classroom::create([
            'classroom_id' => $classroomId,
            'teacher_user_id' => $request->user()->id,
            'teacher_name' => $teacherName,
            'subject' => $subject,
            'grade_level' => (int) $gradeLevel,
            'custom_item_bank' => (object) [],
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'classroomId' => $classroom->classroom_id,
            'teacherName' => $classroom->teacher_name,
            'subject' => $classroom->subject,
            'gradeLevel' => $classroom->grade_level,
            'customItemBank' => $classroom->custom_item_bank,
            'expiresAt' => $classroom->expires_at ? $classroom->expires_at->toIso8601String() : null,
        ]);
    }

    // POST /api/classroom/lock
    public function lockClassroom(Request $request)
    {
        $classroomId = $request->input('classroomId');
        if (! $classroomId) {
            return response()->json(['error' => 'Missing classroomId.'], 400);
        }

        $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if ($classroom->teacher_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $classroom->expires_at = now();
        $classroom->save();

        return response()->json([
            'success' => true,
            'classroomId' => $classroom->classroom_id,
            'expiresAt' => $classroom->expires_at->toIso8601String(),
        ]);
    }

    // POST /api/classroom/claim
    public function claimTemplateBank(Request $request)
    {
        $classroomId = $request->input('classroomId');
        if (! $classroomId) {
            return response()->json(['error' => 'Missing classroomId.'], 400);
        }

        $path = $this->getItemBankPath();
        if (! file_exists($path)) {
            return response()->json(['error' => 'Global item bank templates not found.'], 500);
        }

        $globalBank = json_decode(file_get_contents($path), true) ?: [];

        $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if ($classroom->teacher_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $selections = $request->input('selections');
        if ($selections && is_array($selections)) {
            $bank = $classroom->custom_item_bank ?: [];
            foreach ($selections as $sel) {
                $subj = $sel['subject'] ?? null;
                $grd = (string)($sel['grade'] ?? '');
                $top = $sel['topic'] ?? null;

                if ($subj && $grd && $top) {
                    if (isset($globalBank[$subj][$grd][$top])) {
                        if (!isset($bank[$subj])) {
                            $bank[$subj] = [];
                        }
                        if (!isset($bank[$subj][$grd])) {
                            $bank[$subj][$grd] = [];
                        }
                        $bank[$subj][$grd][$top] = $globalBank[$subj][$grd][$top];
                    }
                }
            }
            $classroom->custom_item_bank = $bank;
        } else {
            $classroom->custom_item_bank = $globalBank;
        }

        $classroom->save();
        \Illuminate\Support\Facades\Cache::forget("classroom_bank_" . strtoupper($classroomId));

        return response()->json(['success' => true, 'customItemBank' => $classroom->custom_item_bank]);
    }

    // POST /api/classroom/update-lesson
    public function updateClassroomLesson(Request $request)
    {
        $request->validate([
            'classroomId' => 'required|string',
            'subject' => 'required|string',
            'grade' => 'required',
            'topic' => 'required|string',
            'questions' => 'required|array',
            'studyContent' => 'nullable|array',
        ]);

        $classroomId = $request->input('classroomId');
        $subject = $request->input('subject');
        $grade = (string) $request->input('grade');
        $topic = $request->input('topic');
        $questions = $request->input('questions');
        $studyContent = $request->input('studyContent');

        $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if ($classroom->teacher_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $bank = $classroom->custom_item_bank ?: [];
        if (empty($bank)) {
            $path = $this->getItemBankPath();
            if (file_exists($path)) {
                $bank = json_decode(file_get_contents($path), true) ?: [];
            }
        }

        if (! isset($bank[$subject])) {
            $bank[$subject] = [];
        }
        if (! isset($bank[$subject][$grade])) {
            $bank[$subject][$grade] = [];
        }
        $bank[$subject][$grade][$topic] = [];

        $topicNode = &$bank[$subject][$grade][$topic];

        if ($studyContent) {
            $topicNode['studyContent'] = $studyContent;
        }

        foreach ($questions as $q) {
            $difficulty = $q['difficulty'];
            $category = $q['category'];

            if (! isset($topicNode[$difficulty])) {
                $topicNode[$difficulty] = [];
            }
            if (! isset($topicNode[$difficulty][$category])) {
                $topicNode[$difficulty][$category] = [];
            }

            $topicNode[$difficulty][$category][] = [
                'id' => $q['id'],
                'questionText' => $q['questionText'],
                'options' => $q['options'],
                'correctAnswer' => $q['correctAnswer'],
                'feedback' => $q['feedback'],
            ];
        }

        $classroom->custom_item_bank = $bank;
        $classroom->save();
        \Illuminate\Support\Facades\Cache::forget("classroom_bank_" . strtoupper($classroomId));

        return response()->json(['success' => true, 'count' => count($questions)]);
    }

    // POST /api/classroom/delete-lesson
    public function deleteClassroomLesson(Request $request)
    {
        $request->validate([
            'classroomId' => 'required|string',
            'subject' => 'required|string',
            'grade' => 'required',
            'topic' => 'required|string',
        ]);

        $classroomId = $request->input('classroomId');
        $subject = $request->input('subject');
        $grade = (string) $request->input('grade');
        $topic = $request->input('topic');

        $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if ($classroom->teacher_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $bank = $classroom->custom_item_bank ?: [];
        if (isset($bank[$subject][$grade][$topic])) {
            unset($bank[$subject][$grade][$topic]);
            
            // Clean up empty arrays to keep it clean
            if (empty($bank[$subject][$grade])) {
                unset($bank[$subject][$grade]);
            }
            if (empty($bank[$subject])) {
                unset($bank[$subject]);
            }
            
            $classroom->custom_item_bank = $bank;
            $classroom->save();
            \Illuminate\Support\Facades\Cache::forget("classroom_bank_" . strtoupper($classroomId));
        }

        return response()->json(['success' => true, 'customItemBank' => $classroom->custom_item_bank]);
    }
}
