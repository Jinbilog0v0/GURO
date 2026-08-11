import { shuffle, calculateNextDifficulty, evaluateRemediationRouting, DifficultyTier } from './engine';

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
});
