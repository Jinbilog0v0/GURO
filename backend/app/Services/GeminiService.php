<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    public function generateQuestions(string $subject, int $grade, string $topic, ?string $lessonText, ?string $pdfBase64 = null, int $questionCount = 12): array
    {
        set_time_limit(180);
        $rawKey = config('services.gemini.key') ?: env('GEMINI_API_KEY');
        $apiKey = trim(trim((string) $rawKey), '"\'');
        if (! $apiKey) {
            throw new \Exception('GEMINI_API_KEY environment variable is not configured.');
        }

        $targetCount = max(10, min($questionCount, 30));
        $easyCount = (int) ceil($targetCount * 0.35);
        $averageCount = (int) ceil($targetCount * 0.40);
        $difficultCount = max(2, $targetCount - $easyCount - $averageCount);

        $parts = [];

        if ($pdfBase64) {
            $parts[] = [
                'inlineData' => [
                    'mimeType' => 'application/pdf',
                    'data' => $pdfBase64,
                ],
            ];
        }

        $prompt = "You are an elite elementary education curriculum specialist and psychometrician.\n".
                  "Your mission is to generate a comprehensive, highly engaging study module and a robust, extensive diagnostic question bank.\n\n";

        if ($lessonText) {
            $prompt .= "Lesson Source Material:\n".
                       "\"\"\"\n".
                       $lessonText."\n".
                       "\"\"\"\n\n";
        } elseif ($pdfBase64) {
            $prompt .= "Analyze the attached PDF document as the primary lesson content.\n\n";
        } else {
            $prompt .= "Synthesize a full DepEd/K-12 aligned lesson module and question bank for the specified grade and topic.\n\n";
        }

        $prompt .= "Generate comprehensive studyContent and at least {$targetCount} high-quality assessment questions for:\n".
                  '- Subject: '.$subject."\n".
                  '- Grade Level: '.$grade."\n".
                  '- Topic: '.$topic."\n\n".
                  "STUDY GUIDE REQUIREMENTS (studyContent):\n".
                  "- In-depth, encouraging, age-appropriate introduction explaining the topic with real-world analogies suitable for Grade {$grade} students.\n".
                  "- 4 to 6 detailed definitions or core concept rules with 2 to 3 crystal-clear, relatable examples each.\n".
                  "- 4 to 6 bulleted summary takeaway points.\n".
                  "- A 3 to 5 question interactive refresherQuiz embedded in the study guide for instant practice.\n\n".
                  "QUESTION BANK REQUIREMENTS (questions):\n".
                  "- Generate AT LEAST {$targetCount} distinct, high-quality assessment questions.\n".
                  "- Difficulty breakdown: at least {$easyCount} Easy questions, {$averageCount} Average questions, and {$difficultCount} Difficult questions.\n".
                  "- Include a diverse, balanced mix of question types across all tiers:\n".
                  "  * 'multiple-choice': 4 distinct plausible options with one clear correct answer.\n".
                  "  * 'fill-in-the-blank': A complete sentence with exactly one '[[blank]]' placeholder, and 4 plausible options.\n".
                  "  * 'drag-drop-matching': Matching 3 to 4 related pairs (e.g., term to definition, antonyms, equations to answers).\n".
                  "  * 'true-false': Conceptual statements testing key principles (2 options: 'True' and 'False').\n".
                  "  * 'swipe-card': Rapid classification or decision scenarios (2 options).\n";

        if (strtolower($subject) === 'mathematics') {
            $prompt .= "  * 'fraction-builder': Target numerator at options[0] and denominator at options[1] (e.g. ['3', '4']).\n";
        }

        $prompt .= "- Feedback: Provide detailed step-by-step explanations in English for why the correct answer is right (populate both 'en' and 'fil' feedback keys).\n".
                   '- Educational Visuals: Suggest relevant Unsplash educational photo URLs for studyContent and question visual aids where helpful.';

        $parts[] = ['text' => $prompt];

        $categories = [];
        $types = ['multiple-choice', 'fill-in-the-blank', 'drag-drop-matching', 'true-false', 'swipe-card'];

        if (strtolower($subject) === 'mathematics') {
            $types[] = 'fraction-builder';
            if ($grade === 4) {
                $categories = ['Fractions'];
            } elseif ($grade === 5) {
                $categories = ['Decimals'];
            } else {
                $categories = ['Algebraic Equations'];
            }
        } else { // English
            if ($grade === 4) {
                $categories = ['Figures of Speech'];
            } elseif ($grade === 5) {
                $categories = ['Reading/Paragraph Comprehension'];
            } else {
                $categories = ['Idiomatic Expressions'];
            }
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'studyContent' => [
                    'type' => 'OBJECT',
                    'description' => 'Structured, child-friendly study guide and teaching materials extracted from the lesson content.',
                    'properties' => [
                        'introduction' => [
                            'type' => 'STRING',
                            'description' => 'A welcoming, engaging, child-friendly introduction to the topic suitable for Grade '.$grade.' students.',
                        ],
                        'imageUrl' => [
                            'type' => 'STRING',
                            'description' => 'Optional. A valid high-quality educational illustration or photo URL from Unsplash representing the topic.',
                        ],
                        'definitions' => [
                            'type' => 'ARRAY',
                            'description' => 'Key terms, concepts, or rules introduced in the lesson, with clear definitions, examples, and optional visual aid URLs.',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'term' => [
                                        'type' => 'STRING',
                                        'description' => 'The vocabulary term or core concept.',
                                    ],
                                    'definition' => [
                                        'type' => 'STRING',
                                        'description' => 'A simple, child-friendly definition.',
                                    ],
                                    'examples' => [
                                        'type' => 'ARRAY',
                                        'description' => '2-3 simple, relatable real-world examples illustrating the term.',
                                        'items' => ['type' => 'STRING'],
                                    ],
                                    'imageUrl' => [
                                        'type' => 'STRING',
                                        'description' => 'Optional. A valid high-quality educational illustration or photo URL from Unsplash representing this term/concept.',
                                    ],
                                ],
                                'required' => ['term', 'definition', 'examples'],
                            ],
                        ],
                        'orderIndex' => [
                            'type' => 'INTEGER',
                            'description' => 'Sequential lesson order index (e.g. 1, 2, 3...) indicating pedagogical progression order within the grade level.',
                        ],
                        'quarter' => [
                            'type' => 'STRING',
                            'description' => 'Academic term or DepEd quarter, e.g. "Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4".',
                        ],
                        'bloomLevel' => [
                            'type' => 'STRING',
                            'description' => 'Primary Bloom cognitive level for this lesson (e.g., "Remembering", "Understanding", "Applying", "Analyzing").',
                        ],
                        'prerequisites' => [
                            'type' => 'ARRAY',
                            'description' => 'Optional list of prerequisite topic names that should precede this lesson.',
                            'items' => ['type' => 'STRING'],
                        ],
                        'summary' => [
                            'type' => 'ARRAY',
                            'description' => 'A bulleted list of 3-5 key takeaway points of the lesson.',
                            'items' => ['type' => 'STRING'],
                        ],
                        'refresherQuiz' => [
                            'type' => 'ARRAY',
                            'description' => 'A short list of 2-3 quick multiple-choice refresher questions to test the student immediately after reading.',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'questionText' => [
                                        'type' => 'STRING',
                                        'description' => 'A simple, quick question about the concepts introduced.',
                                    ],
                                    'options' => [
                                        'type' => 'ARRAY',
                                        'description' => 'Exactly 3 simple, child-friendly options.',
                                        'items' => ['type' => 'STRING'],
                                    ],
                                    'correctAnswer' => [
                                        'type' => 'STRING',
                                        'description' => 'The correct option value, which must match exactly one of the options.',
                                    ],
                                    'explanation' => [
                                        'type' => 'STRING',
                                        'description' => 'A short, positive, child-friendly explanation for why this is correct.',
                                    ],
                                ],
                                'required' => ['questionText', 'options', 'correctAnswer', 'explanation'],
                            ],
                        ],
                    ],
                    'required' => ['introduction', 'definitions', 'summary', 'refresherQuiz', 'imageUrl'],
                ],
                'questions' => [
                    'type' => 'ARRAY',
                    'description' => 'An array of generated assessment questions based on the lesson text, including a mix of multiple-choice, fill-in-the-blank, and drag-drop-matching formats.',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'id' => ['type' => 'STRING', 'description' => 'Unique uppercase question ID, e.g., ENG-G5-ADJ-001.'],
                            'difficulty' => ['type' => 'STRING', 'enum' => ['Easy', 'Average', 'Difficult']],
                            'category' => ['type' => 'STRING', 'enum' => $categories],
                            'type' => ['type' => 'STRING', 'enum' => $types],
                            'questionText' => ['type' => 'STRING', 'description' => 'The question text. For fill-in-the-blank, include exactly one "[[blank]]" placeholder.'],
                            'imageUrl' => ['type' => 'STRING', 'description' => 'Optional. A valid Unsplash photo URL representing visual aids for the question. Only include if visual helper is beneficial.'],
                            'options' => [
                                'type' => 'ARRAY',
                                'items' => ['type' => 'STRING'],
                                'description' => 'For multiple-choice and fill-in-the-blank, exactly 4 options. For true-false and swipe-card, exactly 2 options. For drag-drop-matching, list all matching items. For fraction-builder, exactly 2 items representing the target numerator at index 0 and denominator at index 1 (e.g. ["3", "4"]).',
                            ],
                            'matchingPairs' => [
                                'type' => 'ARRAY',
                                'description' => 'Optional. For drag-drop-matching questions. A list of key-value pairs representing correct matches (e.g., [{"key": "Hot", "value": "Cold"}]). Must contain exactly 3 to 4 pairs.',
                                'items' => [
                                    'type' => 'OBJECT',
                                    'properties' => [
                                        'key' => [
                                            'type' => 'STRING',
                                            'description' => 'The word or phrase on the left side.',
                                        ],
                                        'value' => [
                                            'type' => 'STRING',
                                            'description' => 'The matching word or phrase on the right side.',
                                        ],
                                    ],
                                    'required' => ['key', 'value'],
                                ],
                            ],
                            'correctAnswer' => ['type' => 'STRING', 'description' => 'For multiple-choice and fill-in-the-blank, the correct option string. For drag-drop-matching, a string summary of correct pairs.'],
                            'feedback' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'en' => ['type' => 'STRING', 'description' => 'Feedback in English explaining the answer.'],
                                    'fil' => ['type' => 'STRING', 'description' => 'Feedback in English explaining the answer (duplicate of en).'],
                                ],
                                'required' => ['en', 'fil'],
                            ],
                        ],
                        'required' => ['id', 'difficulty', 'category', 'type', 'questionText', 'options', 'correctAnswer', 'feedback'],
                    ],
                ],
            ],
            'required' => ['studyContent', 'questions'],
        ];

        Log::info("[GeminiService] Triggering Gemini generation for {$subject} Grade {$grade} - Topic: {$topic}");

        $baseUrl = rtrim((string) (config('services.gemini.base_url') ?: env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com')), '/');
        $model = config('services.gemini.model') ?: env('GEMINI_MODEL', 'gemini-3-flash-preview');

        $response = Http::withoutVerifying()->withHeaders([
            'Content-Type' => 'application/json',
        ])->timeout(120)->post("{$baseUrl}/v1beta/models/{$model}:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => $parts,
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema' => $schema,
                'temperature' => 0.2,
                'thinkingConfig' => [
                    'thinkingBudget' => 0,
                ],
            ],
        ]);

        if ($response->failed()) {
            $errData = $response->json();
            $geminiMsg = $errData['error']['message'] ?? $response->body();
            Log::error('[GeminiService] API Request failed: '.$response->body());
            throw new \Exception("Gemini generation failed: {$geminiMsg}");
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        $result = json_decode($text, true) ?: [];

        // Ensure studyContent has verified high-quality educational visual aids
        if (isset($result['studyContent']) && is_array($result['studyContent'])) {
            $result['studyContent']['imageUrl'] = self::resolveEducationalVisual(
                $result['studyContent']['imageUrl'] ?? '',
                $subject,
                $grade,
                $topic,
                'intro'
            );

            if (isset($result['studyContent']['definitions']) && is_array($result['studyContent']['definitions'])) {
                foreach ($result['studyContent']['definitions'] as &$def) {
                    $def['imageUrl'] = self::resolveEducationalVisual(
                        $def['imageUrl'] ?? '',
                        $subject,
                        $grade,
                        $topic,
                        $def['term'] ?? ''
                    );
                }
            }

            if (! isset($result['studyContent']['orderIndex']) || ! is_numeric($result['studyContent']['orderIndex'])) {
                $result['studyContent']['orderIndex'] = 1;
            }
            if (empty($result['studyContent']['quarter'])) {
                $result['studyContent']['quarter'] = 'Quarter 1';
            }
        }

        // Convert matchingPairs from array of {"key": "...", "value": "..."} to associative array and sanitize question images
        if (isset($result['questions']) && is_array($result['questions'])) {
            foreach ($result['questions'] as &$q) {
                if (isset($q['matchingPairs']) && is_array($q['matchingPairs'])) {
                    $pairs = [];
                    foreach ($q['matchingPairs'] as $item) {
                        if (isset($item['key'], $item['value'])) {
                            $pairs[$item['key']] = $item['value'];
                        }
                    }
                    $q['matchingPairs'] = $pairs;
                }

                if (! empty($q['imageUrl'])) {
                    $q['imageUrl'] = self::resolveEducationalVisual(
                        $q['imageUrl'],
                        $subject,
                        $grade,
                        $topic,
                        $q['category'] ?? ''
                    );
                }
            }
        }

        return $result;
    }

    public static function resolveEducationalVisual(?string $url, string $subject, int $grade, string $topic, string $context = ''): ?string
    {
        $subKey = strtolower($subject);
        $topKey = strtolower(trim($topic));
        $contextKey = strtolower(trim($context));

        // 1. Comprehensive curated Unsplash high-res educational photo bank for primary school curriculum
        $visualCatalog = [
            'mathematics' => [
                'fraction pie' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
                'fraction circle' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
                'fractions' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
                'decimals grid' => 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
                'decimals' => 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
                'number line' => 'https://images.unsplash.com/photo-1583912267550-d44d7a125e7e?auto=format&fit=crop&w=600&q=80',
                'place value' => 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=600&q=80',
                'algebra' => 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
                'equations' => 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
                'geometry' => 'https://images.unsplash.com/photo-1583912267550-d44d7a125e7e?auto=format&fit=crop&w=600&q=80',
                'shapes' => 'https://images.unsplash.com/photo-1583912267550-d44d7a125e7e?auto=format&fit=crop&w=600&q=80',
                'angles' => 'https://images.unsplash.com/photo-1583912267550-d44d7a125e7e?auto=format&fit=crop&w=600&q=80',
                'numbers' => 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=600&q=80',
                'addition' => 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=600&q=80',
                'subtraction' => 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=600&q=80',
                'multiplication' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
                'division' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
                'measurement' => 'https://images.unsplash.com/photo-1583912267550-d44d7a125e7e?auto=format&fit=crop&w=600&q=80',
                'statistics' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
                'graph' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
                'money' => 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=600&q=80',
            ],
            'science' => [
                'solar system' => 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80',
                'planets' => 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80',
                'space' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
                'water cycle' => 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=600&q=80',
                'weather' => 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=600&q=80',
                'photosynthesis' => 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
                'plants' => 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
                'animals' => 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=600&q=80',
                'ecosystem' => 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
                'human body' => 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600&q=80',
                'matter' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
                'energy' => 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
            ],
            'english' => [
                'figures of speech' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
                'simile' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
                'metaphor' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
                'personification' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
                'reading' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
                'comprehension' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
                'idioms' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
                'vocabulary' => 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
                'grammar' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
                'story' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
                'writing' => 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
                'poetry' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
            ],
            'filipino' => [
                'panitikan' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
                'tula' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
                'pabula' => 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=600&q=80',
                'balarila' => 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
            ],
        ];

        // 2. Check catalog match
        $catKey = 'english';
        if (str_contains($subKey, 'math')) {
            $catKey = 'mathematics';
        } elseif (str_contains($subKey, 'scien')) {
            $catKey = 'science';
        } elseif (str_contains($subKey, 'filip') || str_contains($subKey, 'tagalog')) {
            $catKey = 'filipino';
        }

        if (isset($visualCatalog[$catKey])) {
            foreach ($visualCatalog[$catKey] as $key => $verifiedUrl) {
                if (str_contains($topKey, $key) || ($contextKey !== '' && $contextKey !== 'intro' && str_contains($contextKey, $key))) {
                    return $verifiedUrl;
                }
            }
        }

        // Check cross-category catalog matches
        foreach ($visualCatalog as $cName => $cList) {
            foreach ($cList as $k => $verifiedUrl) {
                if (str_contains($topKey, $k) || ($contextKey !== '' && $contextKey !== 'intro' && str_contains($contextKey, $k))) {
                    return $verifiedUrl;
                }
            }
        }

        // 3. Dynamic Educational AI Visual Generator via Pollinations
        // Construct a safe, clean, child-friendly illustration prompt based on the target term/topic
        $targetTerm = ($contextKey !== '' && $contextKey !== 'intro') ? $context : $topic;
        $cleanTerm = preg_replace('/[^a-zA-Z0-9\s]/', '', $targetTerm);
        $cleanTerm = trim(preg_replace('/\s+/', ' ', $cleanTerm));
        if (empty($cleanTerm)) {
            $cleanTerm = preg_replace('/[^a-zA-Z0-9\s]/', '', $topic);
        }

        $dimension = ($contextKey !== '' && $contextKey !== 'intro') ? 'width=600&height=400' : 'width=800&height=500';
        $promptStr = "clean educational vector infographic diagram of {$cleanTerm} for elementary grade {$grade} {$subject}, simple colorful flat textbook diagram, high contrast educational graphic, white clean background, accurate pedagogical chart";
        $encodedPrompt = urlencode($promptStr);

        return "https://image.pollinations.ai/prompt/{$encodedPrompt}?{$dimension}&nologo=true&seed=42";
    }
}
