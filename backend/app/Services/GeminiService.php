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

        $prompt .= "Generate both studyContent and questions for:\n".
                  '- Subject: '.$subject."\n".
                  '- Grade Level: '.$grade."\n".
                  '- Topic: '.$topic."\n\n".
                  "Ensure the studyContent uses simple, engaging, age-appropriate language for Grade {$grade} students.\n".
                  "The questions should span Easy, Average, and Difficult tiers, and enforce feedback explaining the answer in English (both en and fil feedback fields must be populated with the English explanation).";

        $parts[] = ['text' => $prompt];

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
                        ]
                    ],
                    'required' => ['introduction', 'definitions', 'summary']
                ],
                'questions' => [
                    'type' => 'ARRAY',
                    'description' => 'An array of generated assessment questions based on the lesson text.',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'id' => ['type' => 'STRING', 'description' => 'Unique uppercase question ID, e.g., ENG-G5-ADJ-001.'],
                            'difficulty' => ['type' => 'STRING', 'enum' => ['Easy', 'Average', 'Difficult']],
                            'category' => ['type' => 'STRING', 'enum' => ['Multiple-Choice', 'Paragraph Comprehension', 'Figures of Speech']],
                            'questionText' => ['type' => 'STRING', 'description' => 'The text of the question or prompt.'],
                            'options' => [
                                'type' => 'ARRAY',
                                'items' => ['type' => 'STRING'],
                                'description' => 'Exactly 4 multiple-choice options.',
                            ],
                            'correctAnswer' => ['type' => 'STRING', 'description' => 'The option string representing the correct answer.'],
                            'feedback' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'en' => ['type' => 'STRING', 'description' => 'Feedback in English explaining the answer.'],
                                    'fil' => ['type' => 'STRING', 'description' => 'Feedback in English explaining the answer (duplicate of en).'],
                                ],
                                'required' => ['en', 'fil'],
                            ],
                        ],
                        'required' => ['id', 'difficulty', 'category', 'questionText', 'options', 'correctAnswer', 'feedback'],
                    ],
                ],
            ],
            'required' => ['studyContent', 'questions'],
        ];

        Log::info("[GeminiService] Triggering Gemini generation for {$subject} Grade {$grade} - Topic: {$topic}");

        $response = Http::withHeaders([
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
