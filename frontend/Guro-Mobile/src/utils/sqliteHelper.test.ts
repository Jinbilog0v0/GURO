import * as SQLite from 'expo-sqlite';
import {
  saveLocalProgress,
  getLocalProgress,
  getUnsyncedProgress,
  markEventsAsSynced,
  saveLocalItemBank,
  getLocalItemBank
} from './sqliteHelper';
import { ProgressEvent, ItemBank } from '../store/useAppStore';

// Access the mocked database instance
const getMockDb = async () => {
  return await SQLite.openDatabaseAsync('guro_local.db');
};

describe('SQLite Helper (Mobile Offline Persistence)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Progress Tracking', () => {
    const mockEvent: ProgressEvent = {
      eventId: 'EVT-123',
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 8,
      totalQuestions: 10,
      timestamp: new Date().toISOString(),
      synced: false
    };

    test('saveLocalProgress should execute INSERT statement', async () => {
      const db = await getMockDb();
      await saveLocalProgress(mockEvent);

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO student_progress'),
        expect.arrayContaining([mockEvent.eventId, 'Mathematics', 4])
      );
    });

    test('getLocalProgress should return mapped events', async () => {
      const db = await getMockDb();
      (db.getAllAsync as jest.Mock).mockResolvedValue([
        {
          event_id: 'EVT-123',
          subject: 'Mathematics',
          grade_level: 4,
          topic: 'Fractions',
          score: 8,
          total_questions: 10,
          timestamp: '2026-06-11T00:00:00Z',
          synced: 0
        }
      ]);

      const results = await getLocalProgress();
      expect(results).toHaveLength(1);
      expect(results[0].eventId).toBe('EVT-123');
      expect(results[0].synced).toBe(false);
    });

    test('markEventsAsSynced should update the synced flag', async () => {
      const db = await getMockDb();
      await markEventsAsSynced(['EVT-123', 'EVT-456']);

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE student_progress SET synced = 1 WHERE event_id IN (?,?)'),
        ['EVT-123', 'EVT-456']
      );
    });
  });

  describe('Item Bank Caching', () => {
    const mockItemBank: ItemBank = {
      'English': {
        '4': {
          'Nouns': {
            studyContent: {
              introduction: 'Introduction to Nouns',
              definitions: [
                {
                  term: 'Noun',
                  definition: 'A naming word.',
                  examples: ['dog', 'cat']
                }
              ],
              summary: ['Nouns are names.']
            },
            'Easy': {
              'Multiple-Choice': [
                {
                  id: 'Q-1',
                  questionText: 'Test Question',
                  options: ['A', 'B'],
                  correctAnswer: 'A',
                  feedback: { en: 'Yes', fil: 'Oo' }
                }
              ]
            }
          }
        }
      }
    };

    test('saveLocalItemBank should clear old data and insert new questions and study content', async () => {
      const db = await getMockDb();
      await saveLocalItemBank(mockItemBank);

      // Verify deletes
      expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM local_item_bank'));
      expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM local_study_content'));
      
      // Verify inserts
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO local_item_bank'),
        expect.arrayContaining(['Q-1', 'English', 4, 'Nouns', 'Easy', 'Multiple-Choice'])
      );

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO local_study_content'),
        expect.arrayContaining([
          'English',
          4,
          'Nouns',
          'Introduction to Nouns',
          expect.stringContaining('A naming word.'),
          expect.stringContaining('Nouns are names.')
        ])
      );
    });

    test('getLocalItemBank should rebuild the complex hierarchy including study content', async () => {
      const db = await getMockDb();
      (db.getAllAsync as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('local_item_bank')) {
          return Promise.resolve([
            {
              id: 'Q-1',
              subject: 'English',
              grade_level: 4,
              topic: 'Nouns',
              difficulty: 'Easy',
              category: 'Multiple-Choice',
              question_text: 'Test Question',
              options: JSON.stringify(['A', 'B']),
              correct_answer: 'A',
              feedback_en: 'Yes',
              feedback_fil: 'Oo'
            }
          ]);
        } else if (query.includes('local_study_content')) {
          return Promise.resolve([
            {
              subject: 'English',
              grade_level: 4,
              topic: 'Nouns',
              introduction: 'Introduction to Nouns',
              definitions: JSON.stringify([
                {
                  term: 'Noun',
                  definition: 'A naming word.',
                  examples: ['dog', 'cat']
                }
              ]),
              summary: JSON.stringify(['Nouns are names.'])
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const bank = await getLocalItemBank();
      expect(bank).not.toBeNull();
      expect(bank!['English']['4']['Nouns']['Easy']['Multiple-Choice']).toHaveLength(1);
      expect(bank!['English']['4']['Nouns']['Easy']['Multiple-Choice'][0].id).toBe('Q-1');
      expect(bank!['English']['4']['Nouns'].studyContent).toBeDefined();
      expect(bank!['English']['4']['Nouns'].studyContent!.introduction).toBe('Introduction to Nouns');
    });
  });
});
