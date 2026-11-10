<?php

namespace App\Http\Controllers;

use App\Models\AiGenerationLog;
use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, ['admin', 'developer'])) {
            abort(403, 'Unauthorized. Administrator access required.');
        }
    }

    private function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha512', $password, $salt, 1000, 64);

        return "{$salt}:{$hash}";
    }

    private function formatIso($date): ?string
    {
        if (! $date) {
            return null;
        }
        if ($date instanceof \DateTimeInterface) {
            return $date->format(\DateTimeInterface::ATOM);
        }
        $ts = strtotime($date);

        return $ts ? date('c', $ts) : (string) $date;
    }

    // GET /api/admin/overview
    public function overview(Request $request)
    {
        $this->authorizeAdmin($request);

        $totalUsers = User::count();
        $rolesBreakdown = User::selectRaw('role, count(*) as count')->groupBy('role')->pluck('count', 'role')->toArray();
        $pendingVerifications = User::where('role', 'teacher')->where('verification_status', 'pending')->count();

        $totalClassrooms = Classroom::count();
        $activeClassrooms = Classroom::where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        })->count();

        $totalProgressLogs = ProgressLog::count();
        $totalAiLogs = AiGenerationLog::count();

        $dbStatus = 'Healthy';
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $dbStatus = 'Degraded';
        }

        $geminiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');
        $itemBankPath = base_path('database/data/item_bank.json');
        if (! file_exists($itemBankPath)) {
            $itemBankPath = base_path('../frontend/Guro-Mobile/assets/item_bank.json');
        }

        $health = [
            'database' => $dbStatus,
            'cache' => Cache::has('global_item_bank') ? 'Cached (Active)' : 'Ready (Cold)',
            'aiEngine' => ! empty($geminiKey) ? 'Configured (Gemini 2.5 Flash)' : 'Missing GEMINI_API_KEY',
            'itemBankStorage' => file_exists($itemBankPath) ? 'Online (JSON Valid)' : 'Missing Asset File',
            'serverTime' => now()->toIso8601String(),
        ];

        $recentSyncs = ProgressLog::latest('timestamp')->take(8)->get();

        return response()->json([
            'metrics' => [
                'totalUsers' => $totalUsers,
                'rolesBreakdown' => $rolesBreakdown,
                'pendingVerifications' => $pendingVerifications,
                'totalClassrooms' => $totalClassrooms,
                'activeClassrooms' => $activeClassrooms,
                'totalProgressLogs' => $totalProgressLogs,
                'totalAiLogs' => $totalAiLogs,
            ],
            'health' => $health,
            'recentSyncs' => $recentSyncs,
        ]);
    }

    // POST /api/admin/cache-purge
    public function purgeCache(Request $request)
    {
        $this->authorizeAdmin($request);

        Cache::forget('global_item_bank');

        // Find and forget classroom caches
        $classrooms = Classroom::pluck('classroom_id');
        foreach ($classrooms as $cid) {
            Cache::forget('classroom_bank_'.strtoupper($cid));
        }

        return response()->json([
            'success' => true,
            'message' => 'System master item bank and classroom caches purged successfully.',
        ]);
    }

    // GET /api/admin/users
    public function getUsers(Request $request)
    {
        $this->authorizeAdmin($request);

        $search = trim($request->query('search', ''));
        $role = trim($request->query('role', ''));

        $query = User::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('user_id', 'like', "%{$search}%")
                    ->orWhere('school_name', 'like', "%{$search}%");

                if (str_contains($search, ',')) {
                    $parts = array_map('trim', explode(',', $search, 2));
                    $l = $parts[0] ?? '';
                    $f = $parts[1] ?? '';
                    if ($l !== '' && $f !== '') {
                        $q->orWhere(function ($sub) use ($l, $f) {
                            $sub->where('last_name', 'like', "%{$l}%")
                                ->where('first_name', 'like', "%{$f}%");
                        });
                    }
                } else {
                    $words = preg_split('/\s+/', $search);
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
        }

        if ($role !== '' && $role !== 'all') {
            $roleLower = strtolower($role);
            if (in_array($roleLower, ['admin', 'developer', 'admin/developer', 'admin-developer', 'admin / developer', 'admin/dev', 'admin / dev', 'admindev', 'admin_developer'])) {
                $query->whereIn('role', ['admin', 'developer']);
            } else {
                $query->where('role', $roleLower);
            }
        }

        $users = $query->orderBy('created_at', 'desc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'userId' => $u->user_id,
                'email' => $u->email,
                'name' => $u->name,
                'firstName' => $u->first_name,
                'middleName' => $u->middle_name,
                'lastName' => $u->last_name,
                'role' => $u->role,
                'classroomId' => $u->classroom_id,
                'parentAccessToken' => $u->parent_access_token,
                'verificationStatus' => $u->verification_status ?? 'approved',
                'schoolName' => $u->school_name,
                'schoolIdNumber' => $u->school_id_number,
                'idDocumentPath' => $u->id_document_path,
                'rejectionReason' => $u->rejection_reason,
                'verifiedAt' => $this->formatIso($u->verified_at),
                'createdAt' => $this->formatIso($u->created_at),
            ];
        });

        $counts = [
            'all' => User::count(),
            'teacher' => User::where('role', 'teacher')->count(),
            'parent' => User::where('role', 'parent')->count(),
            'student' => User::where('role', 'student')->count(),
            'admin' => User::whereIn('role', ['admin', 'developer'])->count(),
        ];

        return response()->json([
            'users' => $users,
            'counts' => $counts,
        ]);
    }

    // POST /api/admin/users/{id}/update-role
    public function updateUserRole(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $request->validate([
            'role' => 'required|in:student,teacher,parent,admin,developer',
        ]);

        $user = User::where('id', $id)->orWhere('user_id', $id)->first();
        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $user->role = strtolower($request->input('role'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "User role updated to {$user->role}.",
            'user' => [
                'userId' => $user->user_id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
            ],
        ]);
    }

    // POST /api/admin/users/{id}/reset-password
    public function resetUserPassword(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $request->validate([
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/'],
        ], [
            'password.regex' => 'Password must contain alphanumeric characters and at least one special symbol.',
            'password.min' => 'Password must be at least 8 characters long.',
        ]);

        $user = User::where('id', $id)->orWhere('user_id', $id)->first();
        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $user->password_hash = $this->hashPassword($request->input('password'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Password reset successfully for user {$user->name}.",
        ]);
    }

    // DELETE /api/admin/users/{id}
    public function deleteUser(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $user = User::where('id', $id)->orWhere('user_id', $id)->first();
        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'You cannot delete your own logged-in account.'], 400);
        }

        // Clean up classroom member records if student
        ClassroomMember::where('student_id', $user->user_id)->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.',
        ]);
    }

    // GET /api/admin/classrooms
    public function getClassrooms(Request $request)
    {
        $this->authorizeAdmin($request);

        $search = trim($request->query('search', ''));
        $subject = trim($request->query('subject', ''));

        $query = Classroom::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('classroom_id', 'like', "%{$search}%")
                    ->orWhere('teacher_name', 'like', "%{$search}%");
            });
        }

        if ($subject !== '' && $subject !== 'all') {
            $query->where('subject', $subject);
        }

        $classrooms = $query->orderBy('created_at', 'desc')->get()->map(function ($c) {
            $isLocked = $c->expires_at && $c->expires_at <= now();
            $enrolledCount = ClassroomMember::where('classroom_id', $c->classroom_id)->count();

            return [
                'id' => $c->id,
                'classroomId' => $c->classroom_id,
                'teacherUserId' => $c->teacher_user_id,
                'teacherName' => $c->teacher_name,
                'subject' => $c->subject,
                'gradeLevel' => $c->grade_level,
                'sectionName' => $c->section_name ?? null,
                'schoolYear' => $c->school_year ?? '2026-2027',
                'term' => $c->term ?? 'Quarter 1',
                'enrolledStudents' => $enrolledCount,
                'isLocked' => $isLocked,
                'expiresAt' => $this->formatIso($c->expires_at),
                'createdAt' => $this->formatIso($c->created_at),
            ];
        });

        return response()->json(['classrooms' => $classrooms]);
    }

    // POST /api/admin/classrooms/{id}/toggle-lock
    public function toggleLockClassroom(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $classroom = Classroom::where('id', $id)->orWhere('classroom_id', $id)->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        $isCurrentlyLocked = $classroom->expires_at && $classroom->expires_at <= now();
        if ($isCurrentlyLocked) {
            // Unlock
            $classroom->expires_at = null;
            $msg = 'Classroom pairing unlocked.';
        } else {
            // Lock
            $classroom->expires_at = now()->subMinute();
            $msg = 'Classroom pairing locked.';
        }

        $classroom->save();

        return response()->json([
            'success' => true,
            'message' => $msg,
            'isLocked' => ! $isCurrentlyLocked,
        ]);
    }

    // POST /api/admin/classrooms/{id}/reassign
    public function reassignClassroom(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $request->validate([
            'teacher_name' => 'required|string',
            'teacher_user_id' => 'nullable|integer',
        ]);

        $classroom = Classroom::where('id', $id)->orWhere('classroom_id', $id)->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        $classroom->teacher_name = trim($request->input('teacher_name'));
        if ($request->filled('teacher_user_id')) {
            $classroom->teacher_user_id = $request->input('teacher_user_id');
        }
        $classroom->save();

        return response()->json([
            'success' => true,
            'message' => 'Classroom reassigned successfully.',
            'classroom' => $classroom,
        ]);
    }

    // DELETE /api/admin/classrooms/{id}
    public function deleteClassroom(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $classroom = Classroom::where('id', $id)->orWhere('classroom_id', $id)->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        ClassroomMember::where('classroom_id', $classroom->classroom_id)->delete();
        $classroom->delete();

        return response()->json([
            'success' => true,
            'message' => 'Classroom archived and removed.',
        ]);
    }

        // POST /api/admin/classrooms/{id}/batch-students
    public function batchStudents(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $classroom = Classroom::where('id', $id)->orWhere('classroom_id', $id)->first();
        if (! $classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        $rawText = $request->input('raw_text');
        $studentsList = $request->input('students');

        $entries = [];

        if (is_array($studentsList) && count($studentsList) > 0) {
            $entries = $studentsList;
        } elseif (! empty($rawText)) {
            $lines = explode("\n", str_replace("\r", "", trim($rawText)));
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with(strtolower($line), 'lrn')) {
                    continue;
                }

                $delimiter = strpos($line, "\t") !== false ? "\t" : ',';
                $parts = array_map('trim', explode($delimiter, $line));

                if (count($parts) >= 3) {
                    $lrn = preg_replace('/\D/', '', $parts[0]);
                    if (count($parts) >= 5) {
                        $lastName = $parts[1];
                        $firstName = $parts[2];
                        $middleName = $parts[3] ?: null;
                        $gender = ucfirst(strtolower($parts[4]));
                    } elseif (count($parts) === 4) {
                        $lastName = $parts[1];
                        $firstName = $parts[2];
                        $middleName = null;
                        $gender = ucfirst(strtolower($parts[3]));
                    } else {
                        $nameParts = explode(' ', $parts[1]);
                        $firstName = $nameParts[0];
                        $lastName = count($nameParts) > 1 ? $nameParts[count($nameParts) - 1] : 'Learner';
                        $middleName = count($nameParts) > 2 ? implode(' ', array_slice($nameParts, 1, -1)) : null;
                        $gender = ucfirst(strtolower($parts[2]));
                    }

                    if (strlen($lrn) === 12) {
                        $entries[] = [
                            'lrn' => $lrn,
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'middle_name' => $middleName,
                            'gender' => in_array($gender, ['Female', 'F']) ? 'Female' : 'Male',
                        ];
                    }
                }
            }
        }

        if (empty($entries)) {
            return response()->json(['error' => 'No valid student entries found with 12-digit DepEd LRNs.'], 422);
        }

        $defaultPassword = $request->input('default_password') ?: 'Guro2026!';
        $created = [];
        $existing = [];

        DB::beginTransaction();
        try {
            foreach ($entries as $entry) {
                $lrn = $entry['lrn'];
                $firstName = $entry['first_name'];
                $lastName = $entry['last_name'];
                $middleName = $entry['middle_name'] ?? null;
                $gender = $entry['gender'] ?? 'Male';

                $user = User::where('lrn', $lrn)->first();
                if ($user) {
                    $member = ClassroomMember::firstOrCreate([
                        'classroom_id' => $classroom->classroom_id,
                        'student_id' => $user->user_id,
                    ], [
                        'lrn' => $lrn,
                        'gender' => $gender,
                        'section_name' => $classroom->section_name,
                        'status' => 'enrolled',
                    ]);
                    $user->classroom_id = $classroom->classroom_id;
                    $user->save();

                    $existing[] = [
                        'studentId' => $user->user_id,
                        'lrn' => $lrn,
                        'name' => $user->name,
                        'gender' => $gender,
                        'parentAccessToken' => $user->parent_access_token,
                        'status' => 'Enrolled Existing',
                    ];
                } else {
                    $fullName = trim($firstName . ($middleName ? ' ' . $middleName : '') . ' ' . $lastName);
                    $displayFullName = $classroom->section_name ? "{$fullName} ({$classroom->section_name})" : $fullName;
                    $studentUserId = 'LRN-' . $lrn;
                    if (User::where('user_id', $studentUserId)->exists()) {
                        $studentUserId .= '-' . strtoupper(\Illuminate\Support\Str::random(3));
                    }

                    $normalized = strtoupper(preg_replace('/\s+/', '-', trim($studentUserId)));
                    $salt = 'GURO_PARENT_SALT';
                    $combined = $normalized . $salt;
                    $sum = 0;
                    $len = strlen($combined);
                    for ($i = 0; $i < $len; $i++) {
                        $sum += ord($combined[$i]) * ($i + 1);
                    }
                    $accessCode = (string) (100000 + ($sum % 900000));

                    $email = strtolower("lrn{$lrn}@student.guro.local");
                    if (User::where('email', $email)->exists()) {
                        $email = strtolower("lrn{$lrn}." . \Illuminate\Support\Str::random(4) . "@student.guro.local");
                    }

                    $user = User::create([
                        'user_id' => $studentUserId,
                        'lrn' => $lrn,
                        'email' => $email,
                        'password_hash' => $this->hashPassword($defaultPassword),
                        'name' => $displayFullName,
                        'first_name' => $firstName,
                        'middle_name' => $middleName,
                        'last_name' => $lastName,
                        'gender' => $gender,
                        'role' => 'student',
                        'classroom_id' => $classroom->classroom_id,
                        'parent_access_token' => $accessCode,
                        'verification_status' => 'approved',
                    ]);

                    ClassroomMember::create([
                        'classroom_id' => $classroom->classroom_id,
                        'student_id' => $studentUserId,
                        'lrn' => $lrn,
                        'gender' => $gender,
                        'section_name' => $classroom->section_name,
                        'status' => 'enrolled',
                    ]);

                    $created[] = [
                        'studentId' => $user->user_id,
                        'lrn' => $lrn,
                        'name' => $user->name,
                        'gender' => $gender,
                        'email' => $user->email,
                        'temporaryPassword' => $defaultPassword,
                        'parentAccessToken' => $accessCode,
                        'status' => 'Newly Created & Enrolled',
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Successfully processed ' . (count($created) + count($existing)) . " student records into section {$classroom->section_name}.",
                'summary' => [
                    'totalProcessed' => count($created) + count($existing),
                    'createdCount' => count($created),
                    'existingEnrolledCount' => count($existing),
                    'classroom' => $classroom->classroom_id,
                    'sectionName' => $classroom->section_name,
                    'teacherName' => $classroom->teacher_name,
                ],
                'records' => array_merge($created, $existing),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Batch enrollment failed: ' . $e->getMessage()], 500);
        }
    }

// GET /api/admin/reports/summary
    public function getReportsSummary(Request $request)
    {
        $this->authorizeAdmin($request);

        $allLogs = ProgressLog::all();
        $totalAttempts = $allLogs->count();

        // Calculate math vs english stats
        $mathLogs = $allLogs->where('subject', 'Mathematics');
        $engLogs = $allLogs->where('subject', 'English');

        $mathAvg = $mathLogs->count() > 0
            ? round($mathLogs->avg(fn ($l) => ($l->score / max(1, $l->total_questions)) * 100))
            : 0;

        $engAvg = $engLogs->count() > 0
            ? round($engLogs->avg(fn ($l) => ($l->score / max(1, $l->total_questions)) * 100))
            : 0;

        // Grade level averages
        $gradeBreakdown = [];
        foreach ([4, 5, 6] as $grade) {
            $gradeLogs = $allLogs->where('grade_level', $grade);
            $gradeBreakdown["Grade {$grade}"] = [
                'totalAttempts' => $gradeLogs->count(),
                'averageScore' => $gradeLogs->count() > 0
                    ? round($gradeLogs->avg(fn ($l) => ($l->score / max(1, $l->total_questions)) * 100))
                    : 0,
                'masteryRate' => $gradeLogs->count() > 0
                    ? round(($gradeLogs->filter(fn ($l) => ($l->score / max(1, $l->total_questions)) >= 0.8)->count() / max(1, $gradeLogs->count())) * 100)
                    : 0,
            ];
        }

        // Topic mastery statistics
        $topicsData = [];
        $topicGroups = $allLogs->groupBy(fn ($l) => "{$l->subject}_{$l->grade_level}_{$l->topic}");
        foreach ($topicGroups as $key => $group) {
            $sample = $group->first();
            $avgScore = round($group->avg(fn ($l) => ($l->score / max(1, $l->total_questions)) * 100));
            $masteredCount = $group->filter(fn ($l) => ($l->score / max(1, $l->total_questions)) >= 0.8)->count();
            $masteryRate = round(($masteredCount / max(1, $group->count())) * 100);

            $topicsData[] = [
                'key' => $key,
                'subject' => $sample->subject,
                'gradeLevel' => $sample->grade_level,
                'topic' => $sample->topic,
                'totalAttempts' => $group->count(),
                'averageScore' => $avgScore,
                'masteryRate' => $masteryRate,
                'isStruggling' => $avgScore < 60,
            ];
        }

        return response()->json([
            'totalAssessments' => $totalAttempts,
            'mathAverage' => $mathAvg,
            'englishAverage' => $engAvg,
            'gradeBreakdown' => $gradeBreakdown,
            'topicMastery' => $topicsData,
        ]);
    }

    // GET /api/admin/sync-logs
    public function getSyncTelemetry(Request $request)
    {
        $this->authorizeAdmin($request);

        $logs = ProgressLog::latest('timestamp')->take(50)->get();

        return response()->json(['syncLogs' => $logs]);
    }

    // GET /api/admin/teacher-verifications
    public function getTeacherVerifications(Request $request)
    {
        $this->authorizeAdmin($request);

        $status = trim($request->query('status', 'all'));
        $search = trim($request->query('search', ''));

        $query = User::where('role', 'teacher');

        if ($status !== '' && $status !== 'all') {
            $query->where('verification_status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('user_id', 'like', "%{$search}%")
                    ->orWhere('school_name', 'like', "%{$search}%")
                    ->orWhere('school_id_number', 'like', "%{$search}%");

                if (str_contains($search, ',')) {
                    $parts = array_map('trim', explode(',', $search, 2));
                    $l = $parts[0] ?? '';
                    $f = $parts[1] ?? '';
                    if ($l !== '' && $f !== '') {
                        $q->orWhere(function ($sub) use ($l, $f) {
                            $sub->where('last_name', 'like', "%{$l}%")
                                ->where('first_name', 'like', "%{$f}%");
                        });
                    }
                } else {
                    $words = preg_split('/\s+/', $search);
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
        }

        $verifications = $query->orderBy('created_at', 'desc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'userId' => $u->user_id,
                'email' => $u->email,
                'name' => $u->name,
                'firstName' => $u->first_name,
                'middleName' => $u->middle_name,
                'lastName' => $u->last_name,
                'schoolName' => $u->school_name,
                'schoolIdNumber' => $u->school_id_number,
                'idDocumentPath' => $u->id_document_path,
                'verificationStatus' => $u->verification_status ?? 'approved',
                'rejectionReason' => $u->rejection_reason,
                'verifiedAt' => $this->formatIso($u->verified_at),
                'verifiedBy' => $u->verified_by,
                'createdAt' => $this->formatIso($u->created_at),
            ];
        });

        $counts = [
            'pending' => User::where('role', 'teacher')->where('verification_status', 'pending')->count(),
            'approved' => User::where('role', 'teacher')->where('verification_status', 'approved')->count(),
            'rejected' => User::where('role', 'teacher')->where('verification_status', 'rejected')->count(),
            'total' => User::where('role', 'teacher')->count(),
        ];

        return response()->json([
            'verifications' => $verifications,
            'counts' => $counts,
        ]);
    }

    // POST /api/admin/teacher-verifications/{id}/review
    public function reviewTeacherVerification(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $request->validate([
            'action' => 'required|in:approve,reject',
            'reason' => 'nullable|string',
        ]);

        $user = User::where('id', $id)->orWhere('user_id', $id)->first();
        if (! $user) {
            return response()->json(['error' => 'Teacher account not found.'], 404);
        }

        if ($user->role !== 'teacher') {
            return response()->json(['error' => 'Account is not a teacher.'], 400);
        }

        $action = $request->input('action');
        $reason = trim($request->input('reason', ''));

        if ($action === 'approve') {
            $user->verification_status = 'approved';
            $user->verified_at = now();
            $user->verified_by = $request->user()->id;
            $user->rejection_reason = null;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => "Teacher application for {$user->name} has been approved.",
                'user' => [
                    'id' => $user->id,
                    'userId' => $user->user_id,
                    'name' => $user->name,
                    'verificationStatus' => $user->verification_status,
                    'verifiedAt' => $this->formatIso($user->verified_at),
                ],
            ]);
        } else {
            if ($reason === '') {
                $reason = 'Document verification did not match requirements or credentials could not be validated.';
            }

            $user->verification_status = 'rejected';
            $user->rejection_reason = $reason;
            $user->verified_at = now();
            $user->verified_by = $request->user()->id;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => "Teacher application for {$user->name} has been marked as rejected.",
                'user' => [
                    'id' => $user->id,
                    'userId' => $user->user_id,
                    'name' => $user->name,
                    'verificationStatus' => $user->verification_status,
                    'rejectionReason' => $user->rejection_reason,
                    'verifiedAt' => $this->formatIso($user->verified_at),
                ],
            ]);
        }
    }

    // DELETE /api/admin/teacher-verifications/{id}
    public function deleteTeacherVerification(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $user = User::where('id', $id)->orWhere('user_id', $id)->first();
        if (! $user) {
            return response()->json(['error' => 'Teacher account not found.'], 404);
        }

        if ($user->role !== 'teacher') {
            return response()->json(['error' => 'Account is not a teacher.'], 400);
        }

        // Clean up classroom member records if any
        ClassroomMember::where('student_id', $user->user_id)->delete();
        $userName = $user->name;
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "Teacher application for {$userName} has been removed.",
        ]);
    }
}
