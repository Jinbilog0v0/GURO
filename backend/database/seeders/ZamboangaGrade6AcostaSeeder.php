<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\User;
use Illuminate\Database\Seeder;

class ZamboangaGrade6AcostaSeeder extends Seeder
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
        $combined = $normalized . $salt;
        $hash = crc32($combined);
        $code = (string) (100000 + (abs($hash) % 900000));

        // Ensure absolute uniqueness across all users in the database
        while (User::where('parent_access_token', $code)->where('user_id', '!=', $studentId)->exists()) {
            $code = (string) random_int(100000, 999999);
        }

        return $code;
    }

    public function run(): void
    {
        $teacherPassword = 'Teacher2026!';
        $studentPassword = 'Guro2026!';
        $parentPassword = 'Parent2026!';

        $teacherHash = $this->hashPassword($teacherPassword);
        $studentHash = $this->hashPassword($studentPassword);
        $parentHash = $this->hashPassword($parentPassword);

        // 1. Seed or retrieve Teacher Meyer Marlene Acosta
        $teacher = User::updateOrCreate(
            ['email' => 'marlene.acosta@guro.app'],
            [
                'user_id' => 'USR-TCHR-ACOSTA',
                'password_hash' => $teacherHash,
                'name' => 'Meyer Marlene Acosta',
                'first_name' => 'Meyer Marlene',
                'last_name' => 'Acosta',
                'role' => 'teacher',
                'verification_status' => 'approved',
                'school_name' => 'Zamboanga Central School',
                'school_id_number' => '199006',
                'verified_at' => now(),
            ]
        );

        // Also ensure fallback teacher@guro.dev is available and approved
        User::where('email', 'teacher@guro.dev')->update([
            'verification_status' => 'approved',
            'school_name' => 'Zamboanga Central School',
            'school_id_number' => '199006',
            'verified_at' => now(),
        ]);

        // 2. Comprehensive Grade 6 Item Bank (Mathematics AND English Seeder Lessons)
        $customItemBank = [
            'Mathematics' => [
                '6' => [
                    'Operations on Fractions and Decimals' => [
                        'studyContent' => [
                            'title' => 'Adding and Subtracting Fractions & Decimals',
                            'description' => 'Master step-by-step methods to solve addition and subtraction of fractions and decimals in real-world scenarios.',
                            'orderIndex' => 1,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'm6-frac-e1',
                                    'questionText' => 'What is 1/4 + 2/4 in simplest form?',
                                    'question' => 'What is 1/4 + 2/4 in simplest form?',
                                    'options' => ['3/4', '3/8', '1/2', '2/4'],
                                    'correctAnswer' => '3/4',
                                    'answer' => '3/4',
                                    'feedback' => [
                                        'en' => 'When denominators are the same, add the numerators: 1 + 2 = 3. The answer is 3/4.',
                                        'fil' => 'Dahil magkapareho ang denominator, idagdag ang numerator: 1 + 2 = 3. Ang sagot ay 3/4.',
                                    ],
                                    'explanation' => 'Add numerators directly when denominators match: 1/4 + 2/4 = 3/4.',
                                ],
                                [
                                    'id' => 'm6-frac-e2',
                                    'questionText' => 'What is 0.75 written as a fraction in simplest form?',
                                    'question' => 'What is 0.75 written as a fraction in simplest form?',
                                    'options' => ['3/4', '75/10', '1/2', '7/5'],
                                    'correctAnswer' => '3/4',
                                    'answer' => '3/4',
                                    'feedback' => [
                                        'en' => '0.75 = 75/100, which reduces by dividing numerator and denominator by 25 to get 3/4.',
                                        'fil' => 'Ang 0.75 ay 75/100. I-divide ang itaas at ibaba sa 25 upang maging 3/4.',
                                    ],
                                    'explanation' => '0.75 is 75 hundredths (75/100). Divided by 25/25, it simplifies to 3/4.',
                                ],
                            ],
                        ],
                        'Average' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'm6-frac-a1',
                                    'questionText' => 'Solve: 2/3 + 1/6 in simplest form.',
                                    'question' => 'Solve: 2/3 + 1/6 in simplest form.',
                                    'options' => ['5/6', '3/9', '1/2', '3/6'],
                                    'correctAnswer' => '5/6',
                                    'answer' => '5/6',
                                    'feedback' => [
                                        'en' => 'Find the common denominator (6): 2/3 = 4/6. Then 4/6 + 1/6 = 5/6.',
                                        'fil' => 'Gamitin ang least common denominator (6): 2/3 = 4/6. Pagkatapos 4/6 + 1/6 = 5/6.',
                                    ],
                                    'explanation' => 'Least Common Denominator is 6. 4/6 + 1/6 = 5/6.',
                                ],
                                [
                                    'id' => 'm6-frac-a2',
                                    'questionText' => 'Aling Maria bought 2.5 kg of rice and 1.75 kg of sugar. What is the total weight of her purchase?',
                                    'question' => 'Aling Maria bought 2.5 kg of rice and 1.75 kg of sugar. What is the total weight of her purchase?',
                                    'options' => ['4.25 kg', '3.80 kg', '4.15 kg', '4.50 kg'],
                                    'correctAnswer' => '4.25 kg',
                                    'answer' => '4.25 kg',
                                    'feedback' => [
                                        'en' => 'Line up the decimal points: 2.50 + 1.75 = 4.25 kg.',
                                        'fil' => 'Itapat ang decimal points: 2.50 + 1.75 = 4.25 kg.',
                                    ],
                                    'explanation' => '2.50 + 1.75 = 4.25 kg.',
                                ],
                            ],
                        ],
                        'Difficult' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'm6-frac-d1',
                                    'questionText' => 'A recipe calls for 3 1/2 cups of flour. If Marco already has 1 3/4 cups, how many more cups does he need?',
                                    'question' => 'A recipe calls for 3 1/2 cups of flour. If Marco already has 1 3/4 cups, how many more cups does he need?',
                                    'options' => ['1 3/4 cups', '2 1/4 cups', '1 1/2 cups', '2 cups'],
                                    'correctAnswer' => '1 3/4 cups',
                                    'answer' => '1 3/4 cups',
                                    'feedback' => [
                                        'en' => '3 1/2 - 1 3/4 = 3 2/4 - 1 3/4 = 2 6/4 - 1 3/4 = 1 3/4 cups.',
                                        'fil' => '3 1/2 - 1 3/4 = 3 2/4 - 1 3/4 = 1 3/4 cups.',
                                    ],
                                    'explanation' => 'Convert to improper fractions or borrow: 7/2 - 7/4 = 14/4 - 7/4 = 7/4 = 1 3/4 cups.',
                                ],
                            ],
                        ],
                    ],
                    'Ratios, Proportions, and Percentages' => [
                        'studyContent' => [
                            'title' => 'Ratios, Proportions & Percentages',
                            'description' => 'Understand how quantities compare and how to compute percentage, rate, and base in DepEd word problems.',
                            'orderIndex' => 2,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'm6-ratio-e1',
                                    'questionText' => 'In a class of 38 students, 8 are boys and 30 are girls. What is the ratio of boys to girls in simplest form?',
                                    'question' => 'In a class of 38 students, 8 are boys and 30 are girls. What is the ratio of boys to girls in simplest form?',
                                    'options' => ['4:15', '8:30', '4:19', '15:4'],
                                    'correctAnswer' => '4:15',
                                    'answer' => '4:15',
                                    'feedback' => [
                                        'en' => 'Divide both 8 and 30 by 2: 8 ÷ 2 = 4, 30 ÷ 2 = 15. The ratio is 4:15.',
                                        'fil' => 'I-divide ang 8 at 30 sa 2: 8 ÷ 2 = 4, 30 ÷ 2 = 15. Ang ratio ay 4:15.',
                                    ],
                                    'explanation' => '8:30 simplified by dividing both terms by 2 gives 4:15.',
                                ],
                            ],
                        ],
                        'Average' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'm6-ratio-a1',
                                    'questionText' => 'What is 25% of 80 pupils?',
                                    'question' => 'What is 25% of 80 pupils?',
                                    'options' => ['20 pupils', '25 pupils', '15 pupils', '30 pupils'],
                                    'correctAnswer' => '20 pupils',
                                    'answer' => '20 pupils',
                                    'feedback' => [
                                        'en' => '25% is equal to 1/4 or 0.25. 0.25 × 80 = 20 pupils.',
                                        'fil' => 'Ang 25% ay katumbas ng 1/4 o 0.25. 0.25 × 80 = 20 mag-aaral.',
                                    ],
                                    'explanation' => 'Percentage = Rate × Base = 0.25 × 80 = 20.',
                                ],
                            ],
                        ],
                        'Difficult' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'm6-ratio-d1',
                                    'questionText' => 'A pair of school shoes originally priced at ₱1,200 is on sale at a 20% discount. How much is the discounted selling price?',
                                    'question' => 'A pair of school shoes originally priced at ₱1,200 is on sale at a 20% discount. How much is the discounted selling price?',
                                    'options' => ['₱960', '₱1,000', '₱240', '₱900'],
                                    'correctAnswer' => '₱960',
                                    'answer' => '₱960',
                                    'feedback' => [
                                        'en' => 'Discount = 20% of ₱1,200 = ₱240. Sale price = ₱1,200 - ₱240 = ₱960.',
                                        'fil' => 'Discount = 20% ng ₱1,200 = ₱240. Bagong presyo = ₱1,200 - ₱240 = ₱960.',
                                    ],
                                    'explanation' => 'Sale price is 80% of original price: 0.80 × ₱1,200 = ₱960.',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'English' => [
                '6' => [
                    'Elements of a Short Story' => [
                        'studyContent' => [
                            'title' => 'Key Elements of a Short Story',
                            'description' => 'Learn the foundational narrative components: Setting, Characters, Plot, Conflict, and Theme.',
                            'orderIndex' => 1,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'e6-elem-e1',
                                    'questionText' => 'Which story element tells where and when the story takes place?',
                                    'question' => 'Which story element tells where and when the story takes place?',
                                    'options' => ['Setting', 'Characters', 'Plot', 'Theme'],
                                    'correctAnswer' => 'Setting',
                                    'answer' => 'Setting',
                                    'feedback' => [
                                        'en' => 'The setting includes the time, place, and environment where the narrative happens.',
                                        'fil' => 'Ang tagpuan (setting) ay tumutukoy sa lugar at panahon kung kailan naganap ang kuwento.',
                                    ],
                                    'explanation' => 'Setting establishes the physical location and historical or temporal context.',
                                ],
                                [
                                    'id' => 'e6-elem-e2',
                                    'questionText' => 'Who is the main character in a story who typically faces the central conflict?',
                                    'question' => 'Who is the main character in a story who typically faces the central conflict?',
                                    'options' => ['Protagonist', 'Antagonist', 'Narrator', 'Secondary character'],
                                    'correctAnswer' => 'Protagonist',
                                    'answer' => 'Protagonist',
                                    'feedback' => [
                                        'en' => 'The protagonist is the central character around whom the story revolves.',
                                        'fil' => 'Ang bida o protagonist ang pangunahing tauhan sa kuwento.',
                                    ],
                                    'explanation' => 'The protagonist drives the story forward and confronts the primary struggle.',
                                ],
                            ],
                        ],
                        'Average' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'e6-elem-a1',
                                    'questionText' => 'What is the highest point of interest or emotional tension in a story called?',
                                    'question' => 'What is the highest point of interest or emotional tension in a story called?',
                                    'options' => ['Climax', 'Exposition', 'Resolution', 'Rising Action'],
                                    'correctAnswer' => 'Climax',
                                    'answer' => 'Climax',
                                    'feedback' => [
                                        'en' => 'The climax is the turning point of the narrative with the greatest intensity.',
                                        'fil' => 'Ang kasukdulan (climax) ang pinakakapana-panabik na bahagi ng kuwento.',
                                    ],
                                    'explanation' => 'The climax represents the turning point where the conflict reaches peak intensity.',
                                ],
                            ],
                        ],
                        'Difficult' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'e6-elem-d1',
                                    'questionText' => 'In the fable "The Tortoise and the Hare", what is the underlying moral or central idea known as?',
                                    'question' => 'In the fable "The Tortoise and the Hare", what is the underlying moral or central idea known as?',
                                    'options' => ['Theme', 'Conflict', 'Setting', 'Point of View'],
                                    'correctAnswer' => 'Theme',
                                    'answer' => 'Theme',
                                    'feedback' => [
                                        'en' => 'The theme is the underlying life lesson or universal truth conveyed by the author ("Slow and steady wins the race").',
                                        'fil' => 'Ang tema (theme) ang pangunahing aral o mensahe ng kuwento.',
                                    ],
                                    'explanation' => 'Theme is the central message or insight into life revealed through the literature.',
                                ],
                            ],
                        ],
                    ],
                    'Figures of Speech (Simile, Metaphor, Personification)' => [
                        'studyContent' => [
                            'title' => 'Identifying Figures of Speech',
                            'description' => 'Explore figurative language that enhances literary expression, including similes, metaphors, and personification.',
                            'orderIndex' => 2,
                        ],
                        'Easy' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'e6-fig-e1',
                                    'questionText' => '"Her smile was as bright as the morning sun." Which figure of speech is used here?',
                                    'question' => '"Her smile was as bright as the morning sun." Which figure of speech is used here?',
                                    'options' => ['Simile', 'Metaphor', 'Personification', 'Hyperbole'],
                                    'correctAnswer' => 'Simile',
                                    'answer' => 'Simile',
                                    'feedback' => [
                                        'en' => 'A simile compares two different things using the words "like" or "as".',
                                        'fil' => 'Pagtutulad (Simile) ang tawag sa paghahambing na gumagamit ng salitang "as" o "like".',
                                    ],
                                    'explanation' => 'The comparison uses "as bright as", which characterizes a simile.',
                                ],
                            ],
                        ],
                        'Average' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'e6-fig-a1',
                                    'questionText' => '"The gentle wind whispered secrets through the mango trees." Which figure of speech gives human qualities to the wind?',
                                    'question' => '"The gentle wind whispered secrets through the mango trees." Which figure of speech gives human qualities to the wind?',
                                    'options' => ['Personification', 'Simile', 'Metaphor', 'Irony'],
                                    'correctAnswer' => 'Personification',
                                    'answer' => 'Personification',
                                    'feedback' => [
                                        'en' => 'Personification attributes human traits, behaviors, or emotions to non-human things (the wind "whispering").',
                                        'fil' => 'Pagsasatao (Personification) ang pagbibigay ng katangian ng tao sa mga bagay.',
                                    ],
                                    'explanation' => 'The act of whispering is a human behavior applied here to wind.',
                                ],
                            ],
                        ],
                        'Difficult' => [
                            'multiple-choice' => [
                                [
                                    'id' => 'e6-fig-d1',
                                    'questionText' => '"Education is the passport to a brighter future." What figure of speech makes this direct comparison without using "like" or "as"?',
                                    'question' => '"Education is the passport to a brighter future." What figure of speech makes this direct comparison without using "like" or "as"?',
                                    'options' => ['Metaphor', 'Simile', 'Personification', 'Onomatopoeia'],
                                    'correctAnswer' => 'Metaphor',
                                    'answer' => 'Metaphor',
                                    'feedback' => [
                                        'en' => 'A metaphor states that one thing IS another to emphasize a shared symbolic quality without using "like" or "as".',
                                        'fil' => 'Pagwawangis (Metaphor) ang tuwirang paghahambing nang hindi gumagamit ng "tulad ng" o "as/like".',
                                    ],
                                    'explanation' => 'A direct figurative equation without comparison markers is a metaphor.',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        // 3. Create or update Classroom for Grade 6 - Meyer Marlene Acosta
        $classroomId = 'GURO-6ACOSTA';
        $classroom = Classroom::updateOrCreate(
            ['classroom_id' => $classroomId],
            [
                'teacher_user_id' => $teacher->id,
                'teacher_name' => $teacher->name,
                'subject' => 'Mathematics & English',
                'grade_level' => 6,
                'section_name' => 'Grade 6 - Marlene Acosta',
                'school_year' => '2026-2027',
                'term' => 'Quarter 1',
                'custom_item_bank' => $customItemBank,
                'consultation_hours' => 'Monday to Friday: 3:00 PM - 5:00 PM',
                'show_quiz_answers' => true,
                'expires_at' => now()->addYear(),
            ]
        );

        // 4. Complete 38 Students Roster from DepEd School Form 1 (SF 1)
        $studentsRoster = [
            // MALES (8)
            [
                'lrn' => '126207190184',
                'first_name' => 'Albvin',
                'middle_name' => 'Martinez',
                'last_name' => 'Amsid',
                'gender' => 'Male',
                'parent_name' => 'Almer Amsid',
            ],
            [
                'lrn' => '159006200307',
                'first_name' => 'Paul Francis',
                'middle_name' => 'Corpus',
                'last_name' => 'Divina',
                'gender' => 'Male',
                'parent_name' => 'Rhomel Divina',
            ],
            [
                'lrn' => '199006200120',
                'first_name' => 'Russell Rose',
                'middle_name' => 'Nurie',
                'last_name' => 'Hussain',
                'gender' => 'Male',
                'parent_name' => 'Rosmer Hussain',
            ],
            [
                'lrn' => '199006160300',
                'first_name' => 'Shukree',
                'middle_name' => 'Ibrahim',
                'last_name' => 'Lumandong',
                'gender' => 'Male',
                'parent_name' => 'Saraban Lumandong',
            ],
            [
                'lrn' => '199006200081',
                'first_name' => 'Mohammad Izyan',
                'middle_name' => 'Akari',
                'last_name' => 'Muharrani',
                'gender' => 'Male',
                'parent_name' => 'Yaser Muharrani',
            ],
            [
                'lrn' => '126108200068',
                'first_name' => 'Xhian Franz',
                'middle_name' => 'Babiera',
                'last_name' => 'Paragas',
                'gender' => 'Male',
                'parent_name' => 'Shincain Paragas',
            ],
            [
                'lrn' => '199006200150',
                'first_name' => 'Nicko John',
                'middle_name' => 'Acabo',
                'last_name' => 'Ruelo',
                'gender' => 'Male',
                'parent_name' => 'Lei Ruelo',
            ],
            [
                'lrn' => '199006200277',
                'first_name' => 'Judielle',
                'middle_name' => 'Puyod',
                'last_name' => 'Sanguila',
                'gender' => 'Male',
                'parent_name' => 'Samson Sanguila',
            ],

            // FEMALES (30)
            [
                'lrn' => '199006200086',
                'first_name' => 'Dezza Mae',
                'middle_name' => 'Sanang',
                'last_name' => 'Abdurahman',
                'gender' => 'Female',
                'parent_name' => 'Putor Abdurahman',
            ],
            [
                'lrn' => '199006200215',
                'first_name' => 'Aniqa',
                'middle_name' => 'Hadjiruddin',
                'last_name' => 'Ajibul',
                'gender' => 'Female',
                'parent_name' => 'Margani Ajibul',
            ],
            [
                'lrn' => '125909200090',
                'first_name' => 'Norbaida',
                'middle_name' => 'Sabdani',
                'last_name' => 'Alid',
                'gender' => 'Female',
                'parent_name' => 'Abdulbayan Alid',
            ],
            [
                'lrn' => '126203200097',
                'first_name' => 'Shane',
                'middle_name' => null,
                'last_name' => 'Alie',
                'gender' => 'Female',
                'parent_name' => 'Rose Fay Alie',
            ],
            [
                'lrn' => '199006200102',
                'first_name' => 'Ysabella Pauline',
                'middle_name' => 'Salvador',
                'last_name' => 'Amora',
                'gender' => 'Female',
                'parent_name' => 'Salvador Amora',
            ],
            [
                'lrn' => '199006200304',
                'first_name' => 'Cheleslie Rae',
                'middle_name' => 'Garcitos',
                'last_name' => 'Ascabano',
                'gender' => 'Female',
                'parent_name' => 'Garcitos Ascabano',
            ],
            [
                'lrn' => '199006200197',
                'first_name' => 'Fatima Sarah',
                'middle_name' => 'Nassal',
                'last_name' => 'Bandahala',
                'gender' => 'Female',
                'parent_name' => 'Nassal Bandahala',
            ],
            [
                'lrn' => '125533200014',
                'first_name' => 'Althea Kisses',
                'middle_name' => 'Garcitos',
                'last_name' => 'Caputilla',
                'gender' => 'Female',
                'parent_name' => 'Garcitos Caputilla',
            ],
            [
                'lrn' => '126225200115',
                'first_name' => 'Francesca Pilar',
                'middle_name' => 'Dayak',
                'last_name' => 'Climaco',
                'gender' => 'Female',
                'parent_name' => 'Dayak Climaco',
            ],
            [
                'lrn' => '199006200010',
                'first_name' => 'Steffie',
                'middle_name' => 'Cayetano',
                'last_name' => 'Espinosa',
                'gender' => 'Female',
                'parent_name' => 'Cayetano Espinosa',
            ],
            [
                'lrn' => '199006200224',
                'first_name' => 'Alhya Mheel',
                'middle_name' => 'Benzonan',
                'last_name' => 'Guzman',
                'gender' => 'Female',
                'parent_name' => 'Benzonan Guzman',
            ],
            [
                'lrn' => '136476200214',
                'first_name' => 'Raaina',
                'middle_name' => 'Daham',
                'last_name' => 'Iyang',
                'gender' => 'Female',
                'parent_name' => 'Daham Iyang',
            ],
            [
                'lrn' => '217061190010',
                'first_name' => 'Menalyn',
                'middle_name' => 'Jumala',
                'last_name' => 'Maddan',
                'gender' => 'Female',
                'parent_name' => 'Jumala Maddan',
            ],
            [
                'lrn' => '126108200080',
                'first_name' => 'Brianna Keith',
                'middle_name' => 'Saga',
                'last_name' => 'Maglasang',
                'gender' => 'Female',
                'parent_name' => 'Saga Maglasang',
            ],
            [
                'lrn' => '199006200231',
                'first_name' => 'Farhata',
                'middle_name' => 'Abdulmajid',
                'last_name' => 'Nixon',
                'gender' => 'Female',
                'parent_name' => 'Abdulmajid Nixon',
            ],
            [
                'lrn' => '199006200232',
                'first_name' => 'Mia',
                'middle_name' => 'Mohammad',
                'last_name' => 'Petring',
                'gender' => 'Female',
                'parent_name' => 'Mohammad Petring',
            ],
            [
                'lrn' => '126215190039',
                'first_name' => 'Lyniel Myrrh',
                'middle_name' => 'Ancero',
                'last_name' => 'Prado',
                'gender' => 'Female',
                'parent_name' => 'Ancero Prado',
            ],
            [
                'lrn' => '126151200002',
                'first_name' => 'Allenjiea',
                'middle_name' => 'De Leon',
                'last_name' => 'Resola',
                'gender' => 'Female',
                'parent_name' => 'De Leon Resola',
            ],
            [
                'lrn' => '199006200096',
                'first_name' => 'Shaimae',
                'middle_name' => 'Atara',
                'last_name' => 'Saballa',
                'gender' => 'Female',
                'parent_name' => 'Atara Saballa',
            ],
            [
                'lrn' => '199006200005',
                'first_name' => 'Fatima Irene',
                'middle_name' => 'Pindatun',
                'last_name' => 'Sahirani',
                'gender' => 'Female',
                'parent_name' => 'Pindatun Sahirani',
            ],
            [
                'lrn' => '133065180033',
                'first_name' => 'Alyana',
                'middle_name' => 'Jackaria',
                'last_name' => 'Samad',
                'gender' => 'Female',
                'parent_name' => 'Jackaria Samad',
            ],
            [
                'lrn' => '199006200007',
                'first_name' => 'Sczhyne Nerelie',
                'middle_name' => 'Ramos',
                'last_name' => 'Sarahani',
                'gender' => 'Female',
                'parent_name' => 'Ramos Sarahani',
            ],
            [
                'lrn' => '125888200016',
                'first_name' => 'Mitch',
                'middle_name' => 'Arceno',
                'last_name' => 'Sebial',
                'gender' => 'Female',
                'parent_name' => 'Arceno Sebial',
            ],
            [
                'lrn' => '199006200087',
                'first_name' => 'Fatima Sharifa',
                'middle_name' => 'Padilla',
                'last_name' => 'Suhaili',
                'gender' => 'Female',
                'parent_name' => 'Padilla Suhaili',
            ],
            [
                'lrn' => '199006200082',
                'first_name' => 'Jannica',
                'middle_name' => 'Ponce',
                'last_name' => 'Tan',
                'gender' => 'Female',
                'parent_name' => 'Ponce Tan',
            ],
            [
                'lrn' => '199006200061',
                'first_name' => 'Mary Yvonne',
                'middle_name' => 'Mira',
                'last_name' => 'Tomong',
                'gender' => 'Female',
                'parent_name' => 'Mira Tomong',
            ],
            [
                'lrn' => '199006200070',
                'first_name' => 'Paula Franchesca',
                'middle_name' => 'Mariano',
                'last_name' => 'Torres',
                'gender' => 'Female',
                'parent_name' => 'Mariano Torres',
            ],
            [
                'lrn' => '199006200072',
                'first_name' => 'Zyana Bernadette',
                'middle_name' => 'Adora',
                'last_name' => 'Traigo',
                'gender' => 'Female',
                'parent_name' => 'Adora Traigo',
            ],
            [
                'lrn' => '199006200008',
                'first_name' => 'Fatima Nezreen',
                'middle_name' => 'Jikirani',
                'last_name' => 'Tutong',
                'gender' => 'Female',
                'parent_name' => 'Jikirani Tutong',
            ],
            [
                'lrn' => '199006200088',
                'first_name' => 'Wadznalyn',
                'middle_name' => 'Alpha',
                'last_name' => 'Usman',
                'gender' => 'Female',
                'parent_name' => 'Alpha Usman',
            ],
        ];

        // Seed or update the 38 Students
        foreach ($studentsRoster as $st) {
            $lrn = $st['lrn'];
            $firstName = $st['first_name'];
            $middleName = $st['middle_name'];
            $lastName = $st['last_name'];
            $gender = $st['gender'];
            $fullName = trim($firstName . ($middleName ? ' ' . $middleName : '') . ' ' . $lastName);
            $studentUserId = 'LRN-' . $lrn;
            $email = strtolower("lrn{$lrn}@student.guro.local");
            $parentAccessCode = $this->getParentAccessCode($studentUserId);

            $studentUser = User::updateOrCreate(
                ['lrn' => $lrn],
                [
                    'user_id' => $studentUserId,
                    'email' => $email,
                    'password_hash' => $studentHash,
                    'name' => "{$fullName} (Grade 6 - Marlene Acosta)",
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'gender' => $gender,
                    'role' => 'student',
                    'classroom_id' => $classroomId,
                    'parent_access_token' => $parentAccessCode,
                    'verification_status' => 'approved',
                ]
            );

            ClassroomMember::updateOrCreate(
                [
                    'classroom_id' => $classroomId,
                    'student_id' => $studentUserId,
                ],
                [
                    'lrn' => $lrn,
                    'gender' => $gender,
                    'section_name' => 'Grade 6 - Marlene Acosta',
                    'status' => 'enrolled',
                ]
            );
        }

        // 5. Seed Parent Testing Accounts
        $parentAmsid = User::updateOrCreate(
            ['email' => 'parent.amsid@guro.app'],
            [
                'user_id' => 'USR-PRNT-AMSID',
                'password_hash' => $parentHash,
                'name' => 'Almer Amsid (Parent)',
                'first_name' => 'Almer',
                'last_name' => 'Amsid',
                'role' => 'parent',
                'verification_status' => 'approved',
                'verified_at' => now(),
            ]
        );
        User::where('lrn', '126207190184')->update(['parent_user_id' => $parentAmsid->id]);

        $parentDivina = User::updateOrCreate(
            ['email' => 'parent.divina@guro.app'],
            [
                'user_id' => 'USR-PRNT-DIVINA',
                'password_hash' => $parentHash,
                'name' => 'Rhomel Divina (Parent)',
                'first_name' => 'Rhomel',
                'last_name' => 'Divina',
                'role' => 'parent',
                'verification_status' => 'approved',
                'verified_at' => now(),
            ]
        );
        User::where('lrn', '159006200307')->update(['parent_user_id' => $parentDivina->id]);

        $parentAmora = User::updateOrCreate(
            ['email' => 'parent.amora@guro.app'],
            [
                'user_id' => 'USR-PRNT-AMORA',
                'password_hash' => $parentHash,
                'name' => 'Salvador Amora (Parent)',
                'first_name' => 'Salvador',
                'last_name' => 'Amora',
                'role' => 'parent',
                'verification_status' => 'approved',
                'verified_at' => now(),
            ]
        );
        User::where('lrn', '199006200102')->update(['parent_user_id' => $parentAmora->id]);
    }
}
