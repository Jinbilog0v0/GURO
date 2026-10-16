<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\ProgressLog;
use App\Models\StudentAcademicRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoClassroomSeeder extends Seeder
{
    private function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha512', $password, $salt, 1000, 64);

        return "{$salt}:{$hash}";
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

    public function run(): void
    {
        $defaultPassword = 'Password123';
        $passwordHash = $this->hashPassword($defaultPassword);

        // 1. Seed or retrieve Demo Teacher
        $teacher = User::updateOrCreate(
            ['email' => 'teacher@guro.dev'],
            [
                'user_id' => 'USR-TEACHER',
                'password_hash' => $passwordHash,
                'name' => 'Teacher Maria Santos',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'role' => 'teacher',
                'verification_status' => 'approved',
                'school_name' => 'Jose Rizal Elementary School',
                'school_id_number' => 'SCH-10924',
                'verified_at' => now()->subMonths(3),
            ]
        );

        // Also ensure pheinz@gmail.com is approved teacher
        User::where('email', 'pheinz@gmail.com')->update([
            'verification_status' => 'approved',
            'school_name' => 'Jose Rizal Elementary School',
            'verified_at' => now()->subMonths(3),
        ]);

        // 2. Demo Classroom setup
        $classroomId = 'GURO-4RIZAL';
        $sectionName = 'Grade 4 - Rizal';
        $schoolYear = '2026-2027';
        $term = 'Quarter 1';

        $customItemBank = [
            'Mathematics' => [
                '4' => [
                    'Fractions' => [
                        'studyContent' => [
                            'title' => 'Understanding Fractions',
                            'description' => 'Learn numerators, denominators, and proper/improper fractions.',
                            'orderIndex' => 1,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-frac-e1',
                                    'questionText' => 'In the fraction 3/4, what number is the numerator?',
                                    'question' => 'In the fraction 3/4, what number is the numerator?',
                                    'options' => ['3', '4', '7', '1'],
                                    'correctAnswer' => '3',
                                    'answer' => '3',
                                    'feedback' => ['en' => 'The numerator is the top number in a fraction.', 'fil' => 'Ang numerator ay ang numero sa itaas ng fraction.'],
                                    'explanation' => 'The numerator is the top number in a fraction.',
                                ],
                            ],
                        ],
                        'Average' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-frac-a1',
                                    'questionText' => 'What is 2/5 + 1/5 in simplest form?',
                                    'question' => 'What is 2/5 + 1/5 in simplest form?',
                                    'options' => ['3/5', '3/10', '2/10', '1/5'],
                                    'correctAnswer' => '3/5',
                                    'answer' => '3/5',
                                    'feedback' => ['en' => 'With like denominators, add numerators: 2 + 1 = 3.', 'fil' => 'Kapag magkapareho ang denominator, idagdag ang numerator: 2 + 1 = 3.'],
                                    'explanation' => 'With like denominators, add numerators: 2 + 1 = 3.',
                                ],
                            ],
                        ],
                        'Difficult' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-frac-d1',
                                    'questionText' => 'Convert 7/2 into a mixed number.',
                                    'question' => 'Convert 7/2 into a mixed number.',
                                    'options' => ['3 1/2', '2 1/2', '3 2/3', '4 1/2'],
                                    'correctAnswer' => '3 1/2',
                                    'answer' => '3 1/2',
                                    'feedback' => ['en' => '7 divided by 2 is 3 remainder 1, hence 3 1/2.', 'fil' => 'Ang 7 hinati sa 2 ay 3 may tirang 1, kaya 3 1/2.'],
                                    'explanation' => '7 divided by 2 is 3 remainder 1, hence 3 1/2.',
                                ],
                            ],
                        ],
                    ],
                    'Decimals' => [
                        'studyContent' => [
                            'title' => 'Decimals & Place Values',
                            'description' => 'Tenths, hundredths, and adding basic decimals.',
                            'orderIndex' => 2,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-dec-e1',
                                    'questionText' => 'What is 0.5 expressed as a fraction?',
                                    'question' => 'What is 0.5 expressed as a fraction?',
                                    'options' => ['1/2', '1/5', '5/100', '2/5'],
                                    'correctAnswer' => '1/2',
                                    'answer' => '1/2',
                                    'feedback' => ['en' => '0.5 equals 5/10 which reduces to 1/2.', 'fil' => 'Ang 0.5 ay katumbas ng 5/10 na kapag pinaliit ay 1/2.'],
                                    'explanation' => '0.5 equals 5/10 which reduces to 1/2.',
                                ],
                            ],
                        ],
                        'Average' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-dec-a1',
                                    'questionText' => 'What is 1.25 + 0.75?',
                                    'question' => 'What is 1.25 + 0.75?',
                                    'options' => ['2.00', '1.90', '2.50', '1.85'],
                                    'correctAnswer' => '2.00',
                                    'answer' => '2.00',
                                    'feedback' => ['en' => '1.25 plus 0.75 equals 2.00.', 'fil' => 'Ang 1.25 dagdagan ng 0.75 ay 2.00.'],
                                    'explanation' => '1.25 plus 0.75 equals 2.00.',
                                ],
                            ],
                        ],
                    ],
                    'Multiplication & Division' => [
                        'studyContent' => [
                            'title' => 'Multiplication & Long Division',
                            'description' => 'Multi-digit multiplication and division with remainders.',
                            'orderIndex' => 3,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-mul-e1',
                                    'questionText' => 'What is 12 x 8?',
                                    'question' => 'What is 12 x 8?',
                                    'options' => ['96', '84', '92', '108'],
                                    'correctAnswer' => '96',
                                    'answer' => '96',
                                    'feedback' => ['en' => '12 multiplied by 8 equals 96.', 'fil' => 'Ang 12 kapag pinarami ng 8 ay 96.'],
                                    'explanation' => '12 multiplied by 8 equals 96.',
                                ],
                            ],
                        ],
                    ],
                    'Geometry' => [
                        'studyContent' => [
                            'title' => 'Perimeter, Area & Shapes',
                            'description' => 'Properties of quadrilaterals, triangles, and perimeter formulas.',
                            'orderIndex' => 4,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-geo-e1',
                                    'questionText' => 'What is the perimeter of a square with side length 5 cm?',
                                    'question' => 'What is the perimeter of a square with side length 5 cm?',
                                    'options' => ['20 cm', '25 cm', '15 cm', '10 cm'],
                                    'correctAnswer' => '20 cm',
                                    'answer' => '20 cm',
                                    'feedback' => ['en' => 'Perimeter of a square = 4 x side = 4 x 5 = 20 cm.', 'fil' => 'Perimeter ng square = 4 x gilid = 4 x 5 = 20 cm.'],
                                    'explanation' => 'Perimeter of a square = 4 x side = 4 x 5 = 20 cm.',
                                ],
                            ],
                        ],
                    ],
                    'Word Problems' => [
                        'studyContent' => [
                            'title' => 'DepEd Math Problem Solving',
                            'description' => 'Real-world practical math problem scenarios.',
                            'orderIndex' => 5,
                        ],
                        'Average' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'q-word-a1',
                                    'questionText' => 'Maria bought 3 notebooks at 25 pesos each. How much did she pay in total?',
                                    'question' => 'Maria bought 3 notebooks at 25 pesos each. How much did she pay in total?',
                                    'options' => ['75 pesos', '65 pesos', '85 pesos', '50 pesos'],
                                    'correctAnswer' => '75 pesos',
                                    'answer' => '75 pesos',
                                    'feedback' => ['en' => '3 times 25 equals 75 pesos.', 'fil' => '3 beses ng 25 ay 75 pesos.'],
                                    'explanation' => '3 times 25 equals 75 pesos.',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        Classroom::updateOrCreate(
            ['classroom_id' => $classroomId],
            [
                'teacher_user_id' => $teacher->id,
                'teacher_name' => $teacher->name,
                'subject' => 'Mathematics',
                'grade_level' => 4,
                'section_name' => $sectionName,
                'school_year' => $schoolYear,
                'term' => $term,
                'custom_item_bank' => $customItemBank,
                'expires_at' => now()->addYear(),
            ]
        );

        // 3. Define 20 Students Roster with realistic Filipino names
        $studentsData = [
            // Tier 1: 100% Explored All - Juan Dela Cruz
            [
                'id' => 'STU-001',
                'email' => 'student01@guro.dev',
                'name' => 'Juan Dela Cruz',
                'first_name' => 'Juan',
                'middle_name' => 'Protacio',
                'last_name' => 'Dela Cruz',
                'tier' => 'master',
                'target_avg' => 96.5,
                'status' => 'promoted',
                'promoted_to_grade' => 5,
            ],
            // Tier 2: High Achievers (82% - 92% mastery)
            [
                'id' => 'STU-002',
                'email' => 'student02@guro.dev',
                'name' => 'Maria Clara Santos',
                'first_name' => 'Maria Clara',
                'middle_name' => 'Reyes',
                'last_name' => 'Santos',
                'tier' => 'high',
                'target_avg' => 92.0,
                'status' => 'promoted',
                'promoted_to_grade' => 5,
            ],
            [
                'id' => 'STU-003',
                'email' => 'student03@guro.dev',
                'name' => 'Joshua Garcia',
                'first_name' => 'Joshua',
                'middle_name' => 'Alcantara',
                'last_name' => 'Garcia',
                'tier' => 'high',
                'target_avg' => 89.0,
                'status' => 'promoted',
                'promoted_to_grade' => 5,
            ],
            [
                'id' => 'STU-004',
                'email' => 'student04@guro.dev',
                'name' => 'Angel Locsin',
                'first_name' => 'Angel',
                'middle_name' => 'Colmenares',
                'last_name' => 'Locsin',
                'tier' => 'high',
                'target_avg' => 86.5,
                'status' => 'promoted',
                'promoted_to_grade' => 5,
            ],
            [
                'id' => 'STU-005',
                'email' => 'student05@guro.dev',
                'name' => 'Daniel Padilla',
                'first_name' => 'Daniel',
                'middle_name' => 'Ford',
                'last_name' => 'Padilla',
                'tier' => 'high',
                'target_avg' => 84.0,
                'status' => 'promoted',
                'promoted_to_grade' => 5,
            ],
            [
                'id' => 'STU-006',
                'email' => 'student06@guro.dev',
                'name' => 'Kathryn Bernardo',
                'first_name' => 'Kathryn',
                'middle_name' => 'Manuel',
                'last_name' => 'Bernardo',
                'tier' => 'high',
                'target_avg' => 82.0,
                'status' => 'promoted',
                'promoted_to_grade' => 5,
            ],
            // Tier 3: Average Learners (65% - 78% mastery)
            [
                'id' => 'STU-007',
                'email' => 'student07@guro.dev',
                'name' => 'James Reid',
                'first_name' => 'James',
                'middle_name' => 'Robert',
                'last_name' => 'Reid',
                'tier' => 'average',
                'target_avg' => 78.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-008',
                'email' => 'student08@guro.dev',
                'name' => 'Nadine Lustre',
                'first_name' => 'Nadine',
                'middle_name' => 'Alexis',
                'last_name' => 'Lustre',
                'tier' => 'average',
                'target_avg' => 75.5,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-009',
                'email' => 'student09@guro.dev',
                'name' => 'Alden Richards',
                'first_name' => 'Alden',
                'middle_name' => 'Faulkerson',
                'last_name' => 'Richards',
                'tier' => 'average',
                'target_avg' => 74.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-010',
                'email' => 'student10@guro.dev',
                'name' => 'Maine Mendoza',
                'first_name' => 'Maine',
                'middle_name' => 'Capili',
                'last_name' => 'Mendoza',
                'tier' => 'average',
                'target_avg' => 72.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-011',
                'email' => 'student11@guro.dev',
                'name' => 'Enrique Gil',
                'first_name' => 'Enrique',
                'middle_name' => 'Mari',
                'last_name' => 'Gil',
                'tier' => 'average',
                'target_avg' => 70.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-012',
                'email' => 'student12@guro.dev',
                'name' => 'Liza Soberano',
                'first_name' => 'Liza',
                'middle_name' => 'Hope',
                'last_name' => 'Soberano',
                'tier' => 'average',
                'target_avg' => 68.5,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-013',
                'email' => 'student13@guro.dev',
                'name' => 'Bea Alonzo',
                'first_name' => 'Bea',
                'middle_name' => 'Phylbert',
                'last_name' => 'Alonzo',
                'tier' => 'average',
                'target_avg' => 67.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-014',
                'email' => 'student14@guro.dev',
                'name' => 'John Lloyd Cruz',
                'first_name' => 'John Lloyd',
                'middle_name' => 'Espidol',
                'last_name' => 'Cruz',
                'tier' => 'average',
                'target_avg' => 65.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            // Tier 4: Needs Remediation / Diagnostic Alerts (44% - 56% mastery)
            [
                'id' => 'STU-015',
                'email' => 'student15@guro.dev',
                'name' => 'Sarah Geronimo',
                'first_name' => 'Sarah',
                'middle_name' => 'Asher',
                'last_name' => 'Geronimo',
                'tier' => 'remedial',
                'target_avg' => 56.0,
                'status' => 'remedial',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-016',
                'email' => 'student16@guro.dev',
                'name' => 'Matteo Guidicelli',
                'first_name' => 'Matteo',
                'middle_name' => 'Gian',
                'last_name' => 'Guidicelli',
                'tier' => 'remedial',
                'target_avg' => 52.0,
                'status' => 'remedial',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-017',
                'email' => 'student17@guro.dev',
                'name' => 'Dingdong Dantes',
                'first_name' => 'Dingdong',
                'middle_name' => 'Jose',
                'last_name' => 'Dantes',
                'tier' => 'remedial',
                'target_avg' => 48.0,
                'status' => 'remedial',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-018',
                'email' => 'student18@guro.dev',
                'name' => 'Marian Rivera',
                'first_name' => 'Marian',
                'middle_name' => 'Gracia',
                'last_name' => 'Rivera',
                'tier' => 'remedial',
                'target_avg' => 44.0,
                'status' => 'retained',
                'promoted_to_grade' => null,
            ],
            // Tier 5: Newly Enrolled / Baseline (Pre-test or single quiz)
            [
                'id' => 'STU-019',
                'email' => 'student19@guro.dev',
                'name' => 'Vice Ganda',
                'first_name' => 'Vice',
                'middle_name' => 'Jose',
                'last_name' => 'Ganda',
                'tier' => 'new',
                'target_avg' => 60.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
            [
                'id' => 'STU-020',
                'email' => 'student20@guro.dev',
                'name' => 'Anne Curtis',
                'first_name' => 'Anne',
                'middle_name' => 'Ojales',
                'last_name' => 'Curtis',
                'tier' => 'new',
                'target_avg' => 70.0,
                'status' => 'enrolled',
                'promoted_to_grade' => null,
            ],
        ];

        // 4. Create Students & Classroom Members
        $studentUserMap = [];
        foreach ($studentsData as $st) {
            $parentAccessCode = $this->getParentAccessCode($st['id']);

            $studentUser = User::updateOrCreate(
                ['email' => $st['email']],
                [
                    'user_id' => $st['id'],
                    'password_hash' => $passwordHash,
                    'name' => $st['name'],
                    'first_name' => $st['first_name'],
                    'middle_name' => $st['middle_name'],
                    'last_name' => $st['last_name'],
                    'role' => 'student',
                    'classroom_id' => $classroomId,
                    'parent_access_token' => $parentAccessCode,
                ]
            );

            $studentUserMap[$st['id']] = $studentUser;

            ClassroomMember::updateOrCreate(
                [
                    'classroom_id' => $classroomId,
                    'student_id' => $st['id'],
                ],
                [
                    'section_name' => $sectionName,
                    'status' => $st['status'],
                    'promoted_to_grade' => $st['promoted_to_grade'],
                    'final_average' => $st['target_avg'],
                    'promoted_at' => $st['status'] === 'promoted' ? now()->subDays(5) : null,
                ]
            );
        }

        // 5. Create Demo Parent account
        User::updateOrCreate(
            ['email' => 'parent@guro.dev'],
            [
                'user_id' => 'USR-PARENT',
                'password_hash' => $passwordHash,
                'name' => 'Sample Parent',
                'first_name' => 'Sample',
                'last_name' => 'Parent',
                'role' => 'parent',
                'classroom_id' => null,
                'parent_access_token' => null,
            ]
        );

        // Clean prior demo progress logs to ensure clean re-seeding
        ProgressLog::where('classroom_id', $classroomId)->delete();
        ProgressLog::whereIn('student_id', array_column($studentsData, 'id'))->delete();
        StudentAcademicRecord::where('classroom_id', $classroomId)->delete();

        // 6. Generate Progress Logs
        $allTopics = [
            'Fractions',
            'Decimals',
            'Multiplication & Division',
            'Geometry',
            'Word Problems',
        ];

        $logsToInsert = [];
        $academicRecords = [];
        $baseDate = Carbon::now()->subDays(28);

        // --- A. STUDENT 1: 100% EXPLORED ALL TOPICS & ASSESSMENTS ---
        $stu1Id = 'STU-001';
        $dayOffset = 1;

        foreach ($allTopics as $topicIndex => $topic) {
            // Pre-test
            $logsToInsert[] = [
                'event_id' => "EVT-DEMO-STU001-{$topicIndex}-PRE",
                'student_id' => $stu1Id,
                'classroom_id' => $classroomId,
                'section_name' => $sectionName,
                'subject' => 'Mathematics',
                'grade_level' => 4,
                'topic' => $topic,
                'score' => 4,
                'total_questions' => 5,
                'difficulty' => 'Average',
                'assessment_type' => 'pre-test',
                'school_year' => $schoolYear,
                'term' => $term,
                'timestamp' => $baseDate->copy()->addDays($dayOffset)->setHour(9)->setMinute(15),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $dayOffset++;

            // Practice: Easy (Perfect Score)
            $logsToInsert[] = [
                'event_id' => "EVT-DEMO-STU001-{$topicIndex}-EASY",
                'student_id' => $stu1Id,
                'classroom_id' => $classroomId,
                'section_name' => $sectionName,
                'subject' => 'Mathematics',
                'grade_level' => 4,
                'topic' => $topic,
                'score' => 5,
                'total_questions' => 5,
                'difficulty' => 'Easy',
                'assessment_type' => 'practice',
                'school_year' => $schoolYear,
                'term' => $term,
                'timestamp' => $baseDate->copy()->addDays($dayOffset)->setHour(10)->setMinute(30),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $dayOffset++;

            // Practice: Average (Perfect Score)
            $logsToInsert[] = [
                'event_id' => "EVT-DEMO-STU001-{$topicIndex}-AVG",
                'student_id' => $stu1Id,
                'classroom_id' => $classroomId,
                'section_name' => $sectionName,
                'subject' => 'Mathematics',
                'grade_level' => 4,
                'topic' => $topic,
                'score' => 5,
                'total_questions' => 5,
                'difficulty' => 'Average',
                'assessment_type' => 'practice',
                'school_year' => $schoolYear,
                'term' => $term,
                'timestamp' => $baseDate->copy()->addDays($dayOffset)->setHour(14)->setMinute(0),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $dayOffset++;

            // Practice: Difficult (High Score 4 or 5)
            $logsToInsert[] = [
                'event_id' => "EVT-DEMO-STU001-{$topicIndex}-DIFF",
                'student_id' => $stu1Id,
                'classroom_id' => $classroomId,
                'section_name' => $sectionName,
                'subject' => 'Mathematics',
                'grade_level' => 4,
                'topic' => $topic,
                'score' => $topicIndex % 2 === 0 ? 5 : 4,
                'total_questions' => 5,
                'difficulty' => 'Difficult',
                'assessment_type' => 'practice',
                'school_year' => $schoolYear,
                'term' => $term,
                'timestamp' => $baseDate->copy()->addDays($dayOffset)->setHour(15)->setMinute(45),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $dayOffset++;

            // Checkpoint Quiz
            $logsToInsert[] = [
                'event_id' => "EVT-DEMO-STU001-{$topicIndex}-CHK",
                'student_id' => $stu1Id,
                'classroom_id' => $classroomId,
                'section_name' => $sectionName,
                'subject' => 'Mathematics',
                'grade_level' => 4,
                'topic' => $topic,
                'score' => 10,
                'total_questions' => 10,
                'difficulty' => 'Average',
                'assessment_type' => 'checkpoint',
                'school_year' => $schoolYear,
                'term' => $term,
                'timestamp' => $baseDate->copy()->addDays($dayOffset)->setHour(11)->setMinute(10),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $dayOffset++;

            // Post-test (Perfect 100%)
            $logsToInsert[] = [
                'event_id' => "EVT-DEMO-STU001-{$topicIndex}-POST",
                'student_id' => $stu1Id,
                'classroom_id' => $classroomId,
                'section_name' => $sectionName,
                'subject' => 'Mathematics',
                'grade_level' => 4,
                'topic' => $topic,
                'score' => 5,
                'total_questions' => 5,
                'difficulty' => 'Average',
                'assessment_type' => 'post-test',
                'school_year' => $schoolYear,
                'term' => $term,
                'timestamp' => $baseDate->copy()->addDays($dayOffset)->setHour(16)->setMinute(20),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $dayOffset++;
        }

        // Also add English exploration for Student 1 (Explored all curriculum)
        $englishTopics = ['Figurative Language', 'Adjectives'];
        foreach ($englishTopics as $eIdx => $eTopic) {
            $logsToInsert[] = [
                'event_id' => "EVT-DEMO-STU001-ENG-{$eIdx}",
                'student_id' => $stu1Id,
                'classroom_id' => $classroomId,
                'section_name' => $sectionName,
                'subject' => 'English',
                'grade_level' => 4,
                'topic' => $eTopic,
                'score' => 5,
                'total_questions' => 5,
                'difficulty' => 'Average',
                'assessment_type' => 'practice',
                'school_year' => $schoolYear,
                'term' => $term,
                'timestamp' => Carbon::now()->subDays(2)->setHour(13)->setMinute(30),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // --- B. STUDENTS 2 TO 20: STAGGERED REALISTIC PROGRESS ---
        for ($i = 1; $i < count($studentsData); $i++) {
            $st = $studentsData[$i];
            $sId = $st['id'];
            $tier = $st['tier'];

            // Topics attempted based on tier
            $topicsAttempted = match ($tier) {
                'high' => array_slice($allTopics, 0, 4),        // 4 out of 5 topics
                'average' => array_slice($allTopics, 0, 3),     // 3 out of 5 topics
                'remedial' => array_slice($allTopics, 0, 2),    // 2 out of 5 topics
                'new' => array_slice($allTopics, 0, 1),         // 1 topic
            };

            foreach ($topicsAttempted as $tIdx => $topic) {
                // Pre-test
                $preScore = match ($tier) {
                    'high' => rand(3, 4),
                    'average' => rand(2, 3),
                    'remedial' => rand(1, 2),
                    'new' => rand(2, 4),
                };

                $logsToInsert[] = [
                    'event_id' => "EVT-DEMO-{$sId}-{$tIdx}-PRE",
                    'student_id' => $sId,
                    'classroom_id' => $classroomId,
                    'section_name' => $sectionName,
                    'subject' => 'Mathematics',
                    'grade_level' => 4,
                    'topic' => $topic,
                    'score' => $preScore,
                    'total_questions' => 5,
                    'difficulty' => 'Average',
                    'assessment_type' => 'pre-test',
                    'school_year' => $schoolYear,
                    'term' => $term,
                    'timestamp' => Carbon::now()->subDays(25 - $tIdx * 4)->setHour(8 + ($i % 8))->setMinute(10 + $i),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if ($tier === 'new') {
                    // New students only take pre-test and maybe 1 easy practice
                    if ($i === 18) { // Student 19 has 1 practice quiz
                        $logsToInsert[] = [
                            'event_id' => "EVT-DEMO-{$sId}-{$tIdx}-PRAC",
                            'student_id' => $sId,
                            'classroom_id' => $classroomId,
                            'section_name' => $sectionName,
                            'subject' => 'Mathematics',
                            'grade_level' => 4,
                            'topic' => $topic,
                            'score' => 3,
                            'total_questions' => 5,
                            'difficulty' => 'Easy',
                            'assessment_type' => 'practice',
                            'school_year' => $schoolYear,
                            'term' => $term,
                            'timestamp' => Carbon::now()->subDays(3)->setHour(14)->setMinute(20),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    continue;
                }

                // Practice Quizzes
                $practiceScore = match ($tier) {
                    'high' => rand(4, 5),
                    'average' => rand(3, 4),
                    'remedial' => rand(2, 3),
                };

                $logsToInsert[] = [
                    'event_id' => "EVT-DEMO-{$sId}-{$tIdx}-PRAC-E",
                    'student_id' => $sId,
                    'classroom_id' => $classroomId,
                    'section_name' => $sectionName,
                    'subject' => 'Mathematics',
                    'grade_level' => 4,
                    'topic' => $topic,
                    'score' => $practiceScore,
                    'total_questions' => 5,
                    'difficulty' => 'Easy',
                    'assessment_type' => 'practice',
                    'school_year' => $schoolYear,
                    'term' => $term,
                    'timestamp' => Carbon::now()->subDays(20 - $tIdx * 4)->setHour(9 + ($i % 6))->setMinute(15),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Average difficulty
                $avgScore = match ($tier) {
                    'high' => rand(4, 5),
                    'average' => rand(3, 4),
                    'remedial' => rand(1, 2), // Low score triggers diagnostic alerts
                };

                $logsToInsert[] = [
                    'event_id' => "EVT-DEMO-{$sId}-{$tIdx}-PRAC-A",
                    'student_id' => $sId,
                    'classroom_id' => $classroomId,
                    'section_name' => $sectionName,
                    'subject' => 'Mathematics',
                    'grade_level' => 4,
                    'topic' => $topic,
                    'score' => $avgScore,
                    'total_questions' => 5,
                    'difficulty' => 'Average',
                    'assessment_type' => 'practice',
                    'school_year' => $schoolYear,
                    'term' => $term,
                    'timestamp' => Carbon::now()->subDays(15 - $tIdx * 4)->setHour(11 + ($i % 5))->setMinute(35),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Post-test (High achievers and average learners take post-tests)
                if (in_array($tier, ['high', 'average'])) {
                    $postScore = match ($tier) {
                        'high' => rand(4, 5),
                        'average' => rand(3, 4),
                    };

                    $logsToInsert[] = [
                        'event_id' => "EVT-DEMO-{$sId}-{$tIdx}-POST",
                        'student_id' => $sId,
                        'classroom_id' => $classroomId,
                        'section_name' => $sectionName,
                        'subject' => 'Mathematics',
                        'grade_level' => 4,
                        'topic' => $topic,
                        'score' => $postScore,
                        'total_questions' => 5,
                        'difficulty' => 'Average',
                        'assessment_type' => 'post-test',
                        'school_year' => $schoolYear,
                        'term' => $term,
                        'timestamp' => Carbon::now()->subDays(7 - $tIdx * 2)->setHour(14 + ($i % 3))->setMinute(50),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        // Insert all progress logs in chunks
        foreach (array_chunk($logsToInsert, 50) as $chunk) {
            ProgressLog::insert($chunk);
        }

        // 7. Seed Student Academic Records for EOSY SF9/SF10
        foreach ($studentsData as $st) {
            $learningGain = match ($st['tier']) {
                'master' => 100.0,
                'high' => rand(40, 75) + 0.5,
                'average' => rand(20, 45) + 0.2,
                'remedial' => rand(0, 15) + 0.1,
                'new' => null,
            };

            $preAvg = match ($st['tier']) {
                'master' => 80.0,
                'high' => rand(65, 78) + 0.0,
                'average' => rand(50, 65) + 0.0,
                'remedial' => rand(35, 48) + 0.0,
                'new' => 60.0,
            };

            $postAvg = match ($st['tier']) {
                'master' => 100.0,
                'high' => rand(85, 96) + 0.0,
                'average' => rand(70, 80) + 0.0,
                'remedial' => rand(45, 55) + 0.0,
                'new' => null,
            };

            $promotionalStatus = match ($st['status']) {
                'promoted' => 'PROMOTED',
                'remedial' => 'REMEDIAL',
                'retained' => 'RETAINED',
                default => 'ELIGIBLE FOR PROMOTION',
            };

            $remarks = match ($st['tier']) {
                'master' => 'Demonstrated exceptional mastery across all mathematics units.',
                'high' => 'Consistently high performance and strong analytical skills.',
                'average' => 'Satisfactory performance; ready for Grade 5 curriculum.',
                'remedial' => 'Requires targeted remedial intervention in fractions and division.',
                'new' => 'Recently enrolled; baseline diagnostics established.',
            };

            StudentAcademicRecord::create([
                'student_id' => $st['id'],
                'classroom_id' => $classroomId,
                'school_year' => $schoolYear,
                'grade_level' => 4,
                'subject' => 'Mathematics',
                'pre_test_score' => $preAvg,
                'post_test_score' => $postAvg,
                'learning_gain' => $learningGain,
                'term_1_score' => $st['target_avg'],
                'final_average' => $st['target_avg'],
                'promotional_status' => $promotionalStatus,
                'promoted_to_grade' => $st['promoted_to_grade'],
                'teacher_user_id' => $teacher->id,
                'remarks' => $remarks,
            ]);
        }
    }
}
