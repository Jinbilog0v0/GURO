<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    public function generateQuestions(string $subject, int $grade, string $topic, ?string $lessonText, ?string $pdfBase64 = null): array
    {
        set_time_limit(180);
        $apiKey = env('GEMINI_API_KEY');
        if (! $apiKey) {
            throw new \Exception('GEMINI_API_KEY environment variable is not configured.');
        }

        $parts = [];

        if ($pdfBase64) {
            $parts[] = [
                'inlineData' => [
                    'mimeType' => 'application/pdf',
                    'data' => $pdfBase64,
                ],
            ];
        }

        $prompt = "You are an expert curriculum designer and test engineer.\n".
                  "Analyze the following lesson content and structure it into a comprehensive child-friendly study guide and a set of diagnostic questions.\n\n";

        if ($lessonText) {
            $prompt .= "Lesson Content:\n".
                       "\"\"\"\n".
                       $lessonText."\n".
                       "\"\"\"\n\n";
        }

        if ($pdfBase64) {
            $prompt .= "Analyze the attached PDF document as the lesson content.\n\n";
        }

        $prompt .= "Generate both studyContent (including a short, interactive 2-3 question refresherQuiz to test understanding) and questions for:\n".
                  '- Subject: '.$subject."\n".
                  '- Grade Level: '.$grade."\n".
                  '- Topic: '.$topic."\n\n".
                  "Ensure the studyContent uses simple, engaging, age-appropriate language for Grade {$grade} students.\n".
                  "The questions should span Easy, Average, and Difficult tiers.\n".
                  "Include a diverse mix of question types: 'multiple-choice', 'fill-in-the-blank' (using one '[[blank]]' inside the sentence), and 'drag-drop-matching' (matching antonyms, synonyms, or translations).\n".
                  "Enforce feedback explaining the answer in English (both en and fil feedback fields must be populated with the English explanation).";

        $parts[] = ['text' => $prompt];

        $categories = [];
        $types = ['multiple-choice', 'fill-in-the-blank', 'drag-drop-matching', 'true-false'];

        if (strtolower($subject) === 'mathematics') {
            if ($grade === 4) {
                $categories = ['Fractions'];
                $types[] = 'fraction-builder';
            } elseif ($grade === 5) {
                $categories = ['Decimals'];
            } else {
                $categories = ['Algebraic Equations'];
            }
        } else { // English
            if ($grade === 4) {
                $categories = ['Figures of Speech'];
                $types[] = 'swipe-card';
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
                            'description' => 'A welcoming, engaging, child-friendly introduction to the topic suitable for Grade ' . $grade . ' students.'
                        ],
                        'definitions' => [
                            'type' => 'ARRAY',
                            'description' => 'Key terms, concepts, or rules introduced in the lesson, with clear definitions and examples.',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'term' => [
                                        'type' => 'STRING',
                                        'description' => 'The vocabulary term or core concept.'
                                    ],
                                    'definition' => [
                                        'type' => 'STRING',
                                        'description' => 'A simple, child-friendly definition.'
                                    ],
                                    'examples' => [
                                        'type' => 'ARRAY',
                                        'description' => '2-3 simple, relatable real-world examples illustrating the term.',
                                        'items' => ['type' => 'STRING']
                                    ]
                                ],
                                'required' => ['term', 'definition', 'examples']
                            ]
                        ],
                        'summary' => [
                            'type' => 'ARRAY',
                            'description' => 'A bulleted list of 3-5 key takeaway points of the lesson.',
                            'items' => ['type' => 'STRING']
                        ],
                        'refresherQuiz' => [
                            'type' => 'ARRAY',
                            'description' => 'A short list of 2-3 quick multiple-choice refresher questions to test the student immediately after reading.',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'questionText' => [
                                        'type' => 'STRING',
                                        'description' => 'A simple, quick question about the concepts introduced.'
                                    ],
                                    'options' => [
                                        'type' => 'ARRAY',
                                        'description' => 'Exactly 3 simple, child-friendly options.',
                                        'items' => ['type' => 'STRING']
                                    ],
                                    'correctAnswer' => [
                                        'type' => 'STRING',
                                        'description' => 'The correct option value, which must match exactly one of the options.'
                                    ],
                                    'explanation' => [
                                        'type' => 'STRING',
                                        'description' => 'A short, positive, child-friendly explanation for why this is correct.'
                                    ]
                                ],
                                'required' => ['questionText', 'options', 'correctAnswer', 'explanation']
                            ]
                        ]
                    ],
                    'required' => ['introduction', 'definitions', 'summary', 'refresherQuiz']
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
                            'options' => [
                                'type' => 'ARRAY',
                                'items' => ['type' => 'STRING'],
                                'description' => 'For multiple-choice and fill-in-the-blank, exactly 4 options. For true-false and swipe-card, exactly 2 options. For drag-drop-matching, list all matching items. For fraction-builder, exactly 2 items representing the target numerator at index 0 and denominator at index 1 (e.g. ["3", "4"]).',
                            ],
                            'matchingPairs' => [
                                'type' => 'OBJECT',
                                'description' => 'Optional. For drag-drop-matching questions. Key-value pairs representing correct matches (e.g., {"Hot": "Cold", "Fast": "Slow"}).',
                                'properties' => (object)[],
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

        $response = Http::withoutVerifying()->withHeaders([
            'Content-Type' => 'application/json',
        ])->timeout(120)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => $parts,
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema' => $schema,
                'temperature' => 0.2,
            ],
        ]);

        if ($response->failed()) {
            Log::error('[GeminiService] API Request failed: '.$response->body());
            throw new \Exception('Gemini generation failed. API response: '.$response->status());
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

        return json_decode($text, true);
    }
}
