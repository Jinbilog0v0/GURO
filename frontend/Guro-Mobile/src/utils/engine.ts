/**
 * Types representing the difficulty tiers and adaptive routing instructions.
 */
export type DifficultyTier = 'Easy' | 'Average' | 'Difficult';
export type RoutingInstruction = 'advance' | 'repeat' | 'drop';

/**
 * Robust implementation of the Fisher-Yates (Knuth) Shuffle algorithm.
 * Returns a deeply cloned, shuffled copy of the input array to prevent answer leakage
 * and avoid mutation side-effects on the original list.
 * 
 * @template T The type of elements in the array.
 * @param {T[]} array The array containing items (e.g., question options, activities) to shuffle.
 * @returns {T[]} A new array containing the shuffled elements.
 */
export function shuffle<T>(array: T[]): T[] {
  if (!Array.isArray(array)) {
    throw new TypeError('Input must be a valid array.');
  }

  // Deep clone the array using JSON serialization to ensure nested objects are copied
  const copy: T[] = JSON.parse(JSON.stringify(array));
  
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  
  return copy;
}

/**
 * Rule-based routing function to calculate the adaptive progression step
 * based on a student's percentage score in an assessment category.
 * 
 * Thresholds applied:
 * - Score >= 80%: 'advance' (move up a tier if possible)
 * - Score 50% - 79%: 'repeat' (maintain current tier)
 * - Score < 50%: 'drop' (move down a tier if possible)
 * 
 * @param {number} score The percentage score obtained (0 to 100).
 * @param {DifficultyTier} currentDifficulty The difficulty tier of the assessment just taken.
 * @returns {RoutingInstruction} The routing instruction for the next activity.
 */
export function calculateNextDifficulty(
  score: number,
  currentDifficulty: DifficultyTier
): RoutingInstruction {
  // Input validation
  if (typeof score !== 'number' || isNaN(score)) {
    throw new TypeError('Score must be a valid number.');
  }
  if (score < 0 || score > 100) {
    throw new RangeError('Score must be between 0 and 100 inclusive.');
  }
  const allowedDifficulties: DifficultyTier[] = ['Easy', 'Average', 'Difficult'];
  if (!allowedDifficulties.includes(currentDifficulty)) {
    throw new TypeError(`Invalid currentDifficulty: ${currentDifficulty}. Must be 'Easy', 'Average', or 'Difficult'.`);
  }

  // Threshold Routing Logic
  if (score >= 80) {
    return 'advance';
  } else if (score >= 50) {
    return 'repeat';
  } else {
    return 'drop';
  }
}
