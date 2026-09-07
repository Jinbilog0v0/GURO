<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\ProgressLog;
use App\Models\StudentAcademicRecord;
use App\Models\User;
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
        return base_path('../frontend/Guro-Mobile/assets/item_bank.json');
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
                    $path = $this->getItemBankPath();
                    $globalBank = file_exists($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];

                    if (! empty($classroom->custom_item_bank) && count((array)$classroom->custom_item_bank) > 0) {
                        return array_replace_recursive($globalBank, (array)$classroom->custom_item_bank);
                    }
                    return $globalBank;
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

                $type = $q['type'] ?? null;
                if (!$type || $type === 'multiple-choice') {
                    if (!empty($q['matchingPairs'])) {
                        $type = 'drag-drop-matching';
                    } elseif (str_contains($q['questionText'], '[[blank]]') || str_contains($q['questionText'], '____') || str_contains($q['questionText'], '______')) {
                        $type = 'fill-in-the-blank';
                    } elseif (isset($q['options']) && count($q['options']) === 2 && (($q['options'][0] === 'True' && $q['options'][1] === 'False') || ($q['options'][0] === 'False' && $q['options'][1] === 'True'))) {
                        $type = 'true-false';
                    } else {
                        $type = 'multiple-choice';
                    }
                }

                $topicNode[$difficulty][$category][] = [
                    'id' => $q['id'],
                    'questionText' => $q['questionText'],
                    'options' => $q['options'],
                    'correctAnswer' => $q['correctAnswer'],
                    'feedback' => $q['feedback'],
                    'type' => $type,
                    'matchingPairs' => $q['matchingPairs'] ?? null,
                    'imageUrl' => $q['imageUrl'] ?? null,
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
            'schoolYear' => $classroom->school_year ?? '2026-2027',
            'term' => $classroom->term ?? 'Quarter 1',
            'customItemBank' => $classroom->custom_item_bank ?: (object) [],
            'expiresAt' => $classroom->expires_at ? $classroom->expires_at->toIso8601String() : null,
        ]);
    }

    // GET /api/classroom/active-subjects
    public function getActiveSubjects(Request $request)
    {
        $classroomId = $request->query('classroomId');
        if (!$classroomId) {
            return response()->json(['subjects' => ['Mathematics', 'English']]);
        }

        $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
        if (!$classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        $teacherId = $classroom->teacher_user_id;
        $teacherName = $classroom->teacher_name;
        $gradeLevel = (int) $classroom->grade_level;

        // Query all subjects associated with this teacher for this grade level
        $subjects = Classroom::where('grade_level', $gradeLevel)
            ->where(function ($q) use ($teacherId, $teacherName) {
                if ($teacherId) {
                    $q->where('teacher_user_id', $teacherId);
                }
                if ($teacherName) {
                    $q->orWhere('teacher_name', $teacherName);
                }
            })
            ->pluck('subject')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        // If no subjects found from other classrooms, use this classroom's primary subject
        if (empty($subjects) && !empty($classroom->subject)) {
            $subjects = [$classroom->subject];
        }

        // Also check if custom_item_bank has custom subjects defined for this grade level
        if (!empty($classroom->custom_item_bank) && is_array($classroom->custom_item_bank)) {
            foreach ($classroom->custom_item_bank as $bankSubj => $gradeData) {
                if (is_array($gradeData) && isset($gradeData[(string)$gradeLevel])) {
                    if (!in_array($bankSubj, $subjects)) {
                        $subjects[] = $bankSubj;
                    }
                }
            }
        }

        if (empty($subjects)) {
            $subjects = [$classroom->subject ?: 'Mathematics'];
        }

        return response()->json(['subjects' => array_values(array_unique($subjects))]);
    }

    // GET /api/classroom/my-classrooms
    public function getMyClassrooms(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $classrooms = Classroom::where('teacher_user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->classroom_id,
                    'classroomId' => $c->classroom_id,
                    'teacherName' => $c->teacher_name,
                    'subject' => $c->subject,
                    'gradeLevel' => $c->grade_level,
                    'schoolYear' => $c->school_year ?? '2026-2027',
                    'term' => $c->term ?? 'Quarter 1',
                    'customItemBank' => $c->custom_item_bank ?: (object) [],
                    'expiresAt' => $c->expires_at ? ($c->expires_at instanceof \DateTimeInterface ? $c->expires_at->toIso8601String() : date('c', strtotime($c->expires_at))) : null,
                    'createdAt' => $c->created_at ? ($c->created_at instanceof \DateTimeInterface ? $c->created_at->toIso8601String() : date('c', strtotime($c->created_at))) : null,
                ];
            });

        return response()->json(['classrooms' => $classrooms]);
    }

    // POST /api/classroom/create
    public function createClassroom(Request $request)
    {
        $request->validate([
            'teacherName' => 'required|string',
            'subject' => 'required|string',
            'gradeLevel' => 'required',
            'schoolYear' => 'nullable|string',
            'term' => 'nullable|string',
            'duration' => 'nullable|integer',
        ]);

        $user = $request->user();
        $status = $user ? ($user->fresh()->verification_status ?? 'approved') : 'approved';
        if ($user && $user->role === 'teacher' && $status !== 'approved') {
            return response()->json([
                'error' => 'Account verification required before creating live classrooms. Your application is currently ' . $status . ' administrator review.',
                'verification_status' => $status,
                'rejection_reason' => $user->fresh()->rejection_reason,
            ], 403);
        }

        $teacherName = trim($request->input('teacherName'));
        $subject = trim($request->input('subject'));
        $gradeLevel = $request->input('gradeLevel');
        $schoolYear = trim($request->input('schoolYear', '2026-2027'));
        $term = trim($request->input('term', 'Quarter 1'));
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
            'school_year' => $schoolYear ?: '2026-2027',
            'term' => $term ?: 'Quarter 1',
            'custom_item_bank' => (object) [],
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'classroomId' => $classroom->classroom_id,
            'teacherName' => $classroom->teacher_name,
            'subject' => $classroom->subject,
            'gradeLevel' => $classroom->grade_level,
            'schoolYear' => $classroom->school_year,
            'term' => $classroom->term,
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

        // Capture existing orderIndex if it exists
        $existingOrderIndex = null;
        if (isset($bank[$subject][$grade][$topic]['studyContent']['orderIndex'])) {
            $existingOrderIndex = $bank[$subject][$grade][$topic]['studyContent']['orderIndex'];
        }

        // Find max orderIndex across all existing topics
        $maxOrderIndex = 0;
        foreach ($bank as $subjKey => $grades) {
            if (!is_array($grades)) continue;
            foreach ($grades as $gradeKey => $topics) {
                if (!is_array($topics)) continue;
                foreach ($topics as $topicKey => $topicData) {
                    if (isset($topicData['studyContent']['orderIndex'])) {
                        $maxOrderIndex = max($maxOrderIndex, (int)$topicData['studyContent']['orderIndex']);
                    }
                }
            }
        }

        $newOrderIndex = $existingOrderIndex !== null ? $existingOrderIndex : ($maxOrderIndex + 1);

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
        } else {
            $topicNode['studyContent'] = [];
        }
        $topicNode['studyContent']['orderIndex'] = $newOrderIndex;

        foreach ($questions as $q) {
            $difficulty = $q['difficulty'];
            $category = $q['category'];

            if (! isset($topicNode[$difficulty])) {
                $topicNode[$difficulty] = [];
            }
            if (! isset($topicNode[$difficulty][$category])) {
                $topicNode[$difficulty][$category] = [];
            }

            $type = $q['type'] ?? null;
            if (!$type || $type === 'multiple-choice') {
                if (!empty($q['matchingPairs'])) {
                    $type = 'drag-drop-matching';
                } elseif (str_contains($q['questionText'], '[[blank]]') || str_contains($q['questionText'], '____') || str_contains($q['questionText'], '______')) {
                    $type = 'fill-in-the-blank';
                } elseif (isset($q['options']) && count($q['options']) === 2 && (($q['options'][0] === 'True' && $q['options'][1] === 'False') || ($q['options'][0] === 'False' && $q['options'][1] === 'True'))) {
                    $type = 'true-false';
                } else {
                    $type = 'multiple-choice';
                }
            }

            $topicNode[$difficulty][$category][] = [
                'id' => $q['id'],
                'questionText' => $q['questionText'],
                'options' => $q['options'],
                'correctAnswer' => $q['correctAnswer'],
                'feedback' => $q['feedback'],
                'type' => $type,
                'matchingPairs' => $q['matchingPairs'] ?? null,
                'imageUrl' => $q['imageUrl'] ?? null,
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

    public function pairStudent(Request $request)
    {
        $request->validate([
            'studentId' => 'required|string',
            'classroomId' => 'required|string',
            'gradeLevel' => 'nullable|integer',
        ]);

        $studentId = $request->input('studentId');
        $classroomId = strtoupper($request->input('classroomId'));
        $studentGrade = $request->input('gradeLevel');

        $classroom = Classroom::where('classroom_id', $classroomId)->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if (! $studentGrade) {
            $latestLog = ProgressLog::where('student_id', $studentId)->latest('timestamp')->first();
            if ($latestLog && $latestLog->grade_level) {
                $studentGrade = (int) $latestLog->grade_level;
            }
        }

        if ($studentGrade && (int) $studentGrade !== (int) $classroom->grade_level) {
            return response()->json([
                'error' => "Grade mismatch. This classroom is strictly for Grade {$classroom->grade_level} students only."
            ], 422);
        }

        // Register student to classroom
        $member = \App\Models\ClassroomMember::firstOrCreate([
            'classroom_id' => $classroomId,
            'student_id' => $studentId,
        ]);

        // Also update the student user's classroom_id column if the user exists
        $studentUser = \App\Models\User::where('user_id', $studentId)->first();
        if ($studentUser) {
            $studentUser->classroom_id = $classroomId;
            $studentUser->save();
        }

        return response()->json([
            'success' => true,
            'member' => $member,
            'classroom' => [
                'classroomId' => $classroom->classroom_id,
                'teacherName' => $classroom->teacher_name,
                'subject' => $classroom->subject,
                'gradeLevel' => $classroom->grade_level,
            ]
        ]);
    }

    public function getClassroomMembers(Request $request)
    {
        $classroomId = $request->query('classroomId');
        if (! $classroomId) {
            return response()->json(['error' => 'Missing classroomId parameter.'], 400);
        }

        $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        // Only the owner teacher can fetch members
        if ($classroom->teacher_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $members = ClassroomMember::where('classroom_id', strtoupper($classroomId))
            ->orderBy('student_id', 'asc')
            ->get()
            ->map(fn($m) => [
                'studentId' => $m->student_id,
                'status' => $m->status ?? 'enrolled',
                'promotedToGrade' => $m->promoted_to_grade,
                'finalAverage' => $m->final_average,
                'promotedAt' => $m->promoted_at ? $m->promoted_at->toIso8601String() : null,
                'joinedAt' => $m->created_at->toIso8601String(),
            ]);

        return response()->json($members);
    }

    // GET /api/classroom/eosy-report
    public function getEosyReport(Request $request)
    {
        $classroomId = $request->query('classroomId');
        if (! $classroomId) {
            return response()->json(['error' => 'Missing classroomId parameter.'], 400);
        }

        $classroom = Classroom::where('classroom_id', strtoupper($classroomId))->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if ($classroom->teacher_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $members = ClassroomMember::where('classroom_id', strtoupper($classroomId))->get();
        $studentIds = $members->pluck('student_id')->toArray();

        // Query all progress logs for this classroom or enrolled students
        $logs = ProgressLog::where(function ($q) use ($classroomId, $studentIds) {
            $q->where('classroom_id', strtoupper($classroomId))
              ->orWhereIn('student_id', $studentIds);
        })->get();

        $roster = [];

        foreach ($members as $member) {
            $sId = $member->student_id;
            $sLogs = $logs->where('student_id', $sId);

            // 1. Pre-Test and Post-Test statistics
            $preLogs = $sLogs->where('assessment_type', 'pre-test');
            $postLogs = $sLogs->where('assessment_type', 'post-test');

            $preAvg = $preLogs->count() > 0 
                ? round($preLogs->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100), 1)
                : null;

            $postAvg = $postLogs->count() > 0 
                ? round($postLogs->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100), 1)
                : null;

            $learningGain = null;
            if ($preAvg !== null && $postAvg !== null) {
                if ($preAvg < 100) {
                    $learningGain = round((($postAvg - $preAvg) / (100 - $preAvg)) * 100, 1);
                } else {
                    $learningGain = round($postAvg - $preAvg, 1);
                }
            }

            // 2. Term-by-Term (Quarterly) Averages
            $q1Logs = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 1', 'Term 1']));
            $q2Logs = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 2', 'Term 2']));
            $q3Logs = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 3', 'Term 3']));
            $q4Logs = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 4', 'Term 4']));

            $q1Avg = $q1Logs->count() > 0 ? round($q1Logs->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100), 1) : null;
            $q2Avg = $q2Logs->count() > 0 ? round($q2Logs->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100), 1) : null;
            $q3Avg = $q3Logs->count() > 0 ? round($q3Logs->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100), 1) : null;
            $q4Avg = $q4Logs->count() > 0 ? round($q4Logs->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100), 1) : null;

            // Compute overall general average (DepEd passing standard >= 75)
            $allScores = $sLogs->map(fn($l) => ($l->score / max(1, $l->total_questions)) * 100);
            $generalAverage = $allScores->count() > 0 ? round($allScores->avg(), 1) : 0;

            // Promotion status
            $currentGrade = (int) $classroom->grade_level;
            $nextGrade = $currentGrade < 6 ? $currentGrade + 1 : 6;
            
            $status = $member->status;
            if (!$status || $status === 'enrolled') {
                if ($generalAverage >= 75) {
                    $status = 'ELIGIBLE FOR PROMOTION';
                } elseif ($generalAverage >= 60) {
                    $status = 'CONDITIONAL / REMEDIAL';
                } else {
                    $status = 'RETAINED';
                }
            }

            $roster[] = [
                'studentId' => $sId,
                'status' => $status,
                'promotedToGrade' => $member->promoted_to_grade,
                'promotedAt' => $member->promoted_at ? $member->promoted_at->toIso8601String() : null,
                'preTestAvg' => $preAvg,
                'postTestAvg' => $postAvg,
                'learningGain' => $learningGain,
                'termAverages' => [
                    'Q1' => $q1Avg,
                    'Q2' => $q2Avg,
                    'Q3' => $q3Avg,
                    'Q4' => $q4Avg,
                ],
                'generalAverage' => $generalAverage,
                'currentGrade' => $currentGrade,
                'suggestedGrade' => $nextGrade,
                'totalQuizzesTaken' => $sLogs->count(),
            ];
        }

        return response()->json([
            'classroomId' => $classroom->classroom_id,
            'subject' => $classroom->subject,
            'gradeLevel' => $classroom->grade_level,
            'schoolYear' => $classroom->school_year ?? '2026-2027',
            'term' => $classroom->term ?? 'Quarter 1',
            'roster' => $roster,
        ]);
    }

    // POST /api/classroom/promote
    public function promoteStudents(Request $request)
    {
        $request->validate([
            'classroomId' => 'required|string',
            'studentIds' => 'required|array|min:1',
            'remarks' => 'nullable|string',
        ]);

        $classroomId = strtoupper($request->input('classroomId'));
        $studentIds = $request->input('studentIds');
        $remarks = $request->input('remarks');

        $classroom = Classroom::where('classroom_id', $classroomId)->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        if ($classroom->teacher_user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $currentGrade = (int) $classroom->grade_level;
        $nextGrade = $currentGrade < 6 ? $currentGrade + 1 : 6;
        $schoolYear = $classroom->school_year ?? '2026-2027';

        $promotedResults = [];
        $now = now();

        foreach ($studentIds as $sId) {
            $member = ClassroomMember::where('classroom_id', $classroomId)
                ->where('student_id', $sId)
                ->first();

            $sLogs = ProgressLog::where('student_id', $sId)
                ->where(function($q) use ($classroomId) {
                    $q->where('classroom_id', $classroomId)->orWhereNull('classroom_id');
                })->get();

            $preAvg = $sLogs->where('assessment_type', 'pre-test')->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100);
            $postAvg = $sLogs->where('assessment_type', 'post-test')->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100);
            $learningGain = ($preAvg !== null && $postAvg !== null && $preAvg < 100) 
                ? (($postAvg - $preAvg) / (100 - $preAvg)) * 100 
                : null;

            $q1Avg = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 1', 'Term 1']))->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100);
            $q2Avg = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 2', 'Term 2']))->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100);
            $q3Avg = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 3', 'Term 3']))->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100);
            $q4Avg = $sLogs->filter(fn($l) => in_array($l->term, ['Quarter 4', 'Term 4']))->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100);

            $allAvg = $sLogs->avg(fn($l) => ($l->score / max(1, $l->total_questions)) * 100) ?: 75.0;
            $finalAvg = round($allAvg, 1);

            if ($member) {
                $member->status = 'promoted';
                $member->promoted_to_grade = $nextGrade;
                $member->final_average = $finalAvg;
                $member->promoted_at = $now;
                $member->save();
            }

            // Save permanent transcript record in student_academic_records
            StudentAcademicRecord::updateOrCreate(
                [
                    'student_id' => $sId,
                    'school_year' => $schoolYear,
                    'grade_level' => $currentGrade,
                    'subject' => $classroom->subject,
                ],
                [
                    'classroom_id' => $classroomId,
                    'pre_test_score' => $preAvg ? round($preAvg, 1) : null,
                    'post_test_score' => $postAvg ? round($postAvg, 1) : null,
                    'learning_gain' => $learningGain ? round($learningGain, 1) : null,
                    'term_1_score' => $q1Avg ? round($q1Avg, 1) : null,
                    'term_2_score' => $q2Avg ? round($q2Avg, 1) : null,
                    'term_3_score' => $q3Avg ? round($q3Avg, 1) : null,
                    'term_4_score' => $q4Avg ? round($q4Avg, 1) : null,
                    'final_average' => $finalAvg,
                    'promotional_status' => 'PROMOTED',
                    'promoted_to_grade' => $nextGrade,
                    'teacher_user_id' => $request->user()->id,
                    'remarks' => $remarks ?: "Successfully promoted from Grade {$currentGrade} to Grade {$nextGrade}.",
                ]
            );

            $promotedResults[] = [
                'studentId' => $sId,
                'fromGrade' => $currentGrade,
                'toGrade' => $nextGrade,
                'finalAverage' => $finalAvg,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully promoted " . count($promotedResults) . " student(s) to Grade {$nextGrade}!",
            'promotedCount' => count($promotedResults),
            'promotedStudents' => $promotedResults,
        ]);
    }

    // GET /api/student/academic-history
    public function getStudentAcademicHistory(Request $request)
    {
        $studentId = $request->query('studentId');
        if (! $studentId) {
            return response()->json(['error' => 'Missing studentId parameter.'], 400);
        }

        $records = StudentAcademicRecord::where('student_id', strtoupper(preg_replace('/\s+/', '-', trim($studentId))))
            ->orderBy('school_year', 'desc')
            ->orderBy('grade_level', 'desc')
            ->get();

        return response()->json($records);
    }
}
