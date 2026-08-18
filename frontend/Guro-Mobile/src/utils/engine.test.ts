import { shuffle, calculateNextDifficulty, evaluateRemediationRouting, isLessonLocked, DifficultyTier } from './engine';

describe('Algorithmic Engine (Mobile)', () => {
  
  describe('shuffle()', () => {
    test('should return a new array with the same elements', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      
      expect(result).toHaveLength(input.length);
      expect(result.sort()).toEqual(input.sort());
    });

    test('should be a deep copy (not mutate original)', () => {
      const input = [{ id: 1, text: 'A' }, { id: 2, text: 'B' }];
      const result = shuffle(input);
      
      // Mutate the result
      result[0].text = 'MUTATED';
      
      expect(input[0].text).toBe('A');
      expect(result[0].text).toBe('MUTATED');
    });

    test('should throw error on invalid input', () => {
      // @ts-ignore
      expect(() => shuffle(null)).toThrow(TypeError);
    });
  });

  describe('calculateNextDifficulty()', () => {
    const tiers: DifficultyTier[] = ['Easy', 'Average', 'Difficult'];

    test('should return "advance" for scores >= 80%', () => {
      expect(calculateNextDifficulty(80, 'Easy')).toBe('advance');
      expect(calculateNextDifficulty(95, 'Average')).toBe('advance');
      expect(calculateNextDifficulty(100, 'Difficult')).toBe('advance');
    });

    test('should return "repeat" for scores between 50% and 79%', () => {
      expect(calculateNextDifficulty(50, 'Easy')).toBe('repeat');
      expect(calculateNextDifficulty(75, 'Average')).toBe('repeat');
      expect(calculateNextDifficulty(79, 'Difficult')).toBe('repeat');
    });

    test('should return "drop" for scores < 50%', () => {
      expect(calculateNextDifficulty(0, 'Easy')).toBe('drop');
      expect(calculateNextDifficulty(49, 'Average')).toBe('drop');
      expect(calculateNextDifficulty(12, 'Difficult')).toBe('drop');
    });

    test('should throw error for invalid scores', () => {
      expect(() => calculateNextDifficulty(-1, 'Easy')).toThrow(RangeError);
      expect(() => calculateNextDifficulty(101, 'Easy')).toThrow(RangeError);
      // @ts-ignore
      expect(() => calculateNextDifficulty('100', 'Easy')).toThrow(TypeError);
    });

    test('should throw error for invalid difficulty tier', () => {
      // @ts-ignore
      expect(() => calculateNextDifficulty(80, 'Hardest')).toThrow(TypeError);
    });
  });

  describe('evaluateRemediationRouting()', () => {
    test('should return "advance" for score >= 80%', () => {
      const result = evaluateRemediationRouting(85, 'Mathematics', 5, 'Decimals');
      expect(result.instruction).toBe('advance');
      expect(result.feedbackTitle).toContain('Mastery Achieved');
    });

    test('should return "scaffold_review" for borderline score (50-79%)', () => {
      const result = evaluateRemediationRouting(65, 'Mathematics', 5, 'Decimals');
      expect(result.instruction).toBe('scaffold_review');
      expect(result.suggestedActionLabel).toBe('Start Micro-Review');
    });

    test('should return "prerequisite_return" and target prerequisite topic for score < 50%', () => {
      // For Mathematics Grade 5 Decimals, prerequisite in sequence is Grade 4 Fractions
      const result = evaluateRemediationRouting(40, 'Mathematics', 5, 'Decimals');
      expect(result.instruction).toBe('prerequisite_return');
      expect(result.targetLesson).toEqual({ grade: 4, topic: 'Fractions' });
      expect(result.feedbackMessage).toContain('Fractions');
    });
  });

  describe('isLessonLocked()', () => {
    const mockProgress = [
      {
        subject: 'Mathematics',
        gradeLevel: 4,
        topic: 'Fractions',
        score: 8,
        totalQuestions: 10,
        timestamp: '2026-08-17T21:10:19+08:00',
        synced: true,
      },
    ];

    test('should return false for the first lesson in the default sequence', () => {
      expect(isLessonLocked('Mathematics', 4, 'Fractions', [], 4)).toBe(false);
    });

    test('should return true for the next lesson in the sequence if the previous one is not passed', () => {
      expect(isLessonLocked('Mathematics', 5, 'Decimals', [], 4)).toBe(true);
    });

    test('should return false for the next lesson in the sequence if the previous one is passed', () => {
      expect(isLessonLocked('Mathematics', 5, 'Decimals', mockProgress, 4)).toBe(false);
    });

    test('should enforce chronological sequence locking when itemBank contains orderIndex', () => {
      const mockItemBank = {
        Mathematics: {
          '5': {
            Decimals: {
              studyContent: {
                introduction: '...',
                definitions: [],
                summary: [],
                orderIndex: 2,
              },
            },
          },
          '4': {
            Fractions: {
              studyContent: {
                introduction: '...',
                definitions: [],
                summary: [],
                orderIndex: 1,
              },
            },
          },
        },
      };

      // Since orderIndex: 1 is Fractions and 2 is Decimals:
      // Fractions has index 0 -> unlocked
      expect(isLessonLocked('Mathematics', 4, 'Fractions', [], 5, mockItemBank)).toBe(false);

      // Decimals has index 1 -> locked until Fractions is passed
      expect(isLessonLocked('Mathematics', 5, 'Decimals', [], 5, mockItemBank)).toBe(true);

      // Passed Fractions -> Decimals should be unlocked
      expect(isLessonLocked('Mathematics', 5, 'Decimals', mockProgress, 5, mockItemBank)).toBe(false);
    });
  });
});
