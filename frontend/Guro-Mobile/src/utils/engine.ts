/**
 * Types representing the difficulty tiers and adaptive routing instructions.
 */
export type DifficultyTier = 'Easy' | 'Average' | 'Difficult';
export type RoutingInstruction = 'advance' | 'repeat' | 'drop';

/** Unified mastery threshold used across mobile quiz results, progress badges, and web dashboard labels. */
export const MASTERY_THRESHOLD = 80;

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

export interface RemediationRoutingResult {
  instruction: 'advance' | 'scaffold_review' | 'prerequisite_return';
  tier: DifficultyTier;
  targetLesson?: LessonSequenceItem;
  remedialConcept?: string;
  feedbackTitle: string;
  feedbackMessage: string;
  suggestedActionLabel: string;
}

/**
 * Advanced adaptive routing function evaluating student performance thresholds
 * and determining actionable remediation pathways.
 *
 * Routing logic:
 * - Score >= 80%: 'advance' (Mastery achieved, unlock next tier or topic)
 * - Score 50% - 79%: 'scaffold_review' (Borderline result, trigger guided micro-lesson on current topic)
 * - Score < 50%: 'prerequisite_return' (Critical skill gap, return to prerequisite topic or foundation review)
 */
export function evaluateRemediationRouting(
  score: number,
  subject: string,
  currentGrade: number,
  currentTopic: string,
  currentDifficulty: DifficultyTier = 'Average'
): RemediationRoutingResult {
  if (typeof score !== 'number' || isNaN(score)) {
    throw new TypeError('Score must be a valid number.');
  }

  // Threshold Routing Logic
  if (score >= MASTERY_THRESHOLD) {
    const nextTier: DifficultyTier = currentDifficulty === 'Easy' ? 'Average' : 'Difficult';
    return {
      instruction: 'advance',
      tier: nextTier,
      feedbackTitle: 'Mastery Achieved! 🎉',
      feedbackMessage: `Outstanding job! You scored ${score}%. You have demonstrated solid mastery and are ready to advance.`,
      suggestedActionLabel: 'Next Topic / Tier',
    };
  } else if (score >= 50) {
    return {
      instruction: 'scaffold_review',
      tier: currentDifficulty,
      remedialConcept: currentTopic,
      feedbackTitle: 'Guided Micro-Review 💡',
      feedbackMessage: `You scored ${score}%. You are close to mastery! Let's do a guided micro-review on "${currentTopic}" before retrying to lock in your score.`,
      suggestedActionLabel: 'Start Micro-Review',
    };
  } else {
    const seq = LESSON_SEQUENCE[subject] || [];
    const currentIndex = seq.findIndex((item) => item.grade === currentGrade && item.topic === currentTopic);
    const prereq = currentIndex > 0 ? seq[currentIndex - 1] : undefined;

    const lowerTier: DifficultyTier = currentDifficulty === 'Difficult' ? 'Average' : 'Easy';

    return {
      instruction: 'prerequisite_return',
      tier: lowerTier,
      targetLesson: prereq,
      feedbackTitle: 'Foundational Re-Routing 📚',
      feedbackMessage: prereq
        ? `You scored ${score}%. We detected foundational gaps. Let's return to "${prereq.topic}" (Grade ${prereq.grade}) to rebuild essential skills before re-attempting ${currentTopic}.`
        : `You scored ${score}%. Let's step down to ${lowerTier} level and review core building blocks for "${currentTopic}".`,
      suggestedActionLabel: prereq ? `Review ${prereq.topic}` : 'Review Fundamentals',
    };
  }
}


/**
 * 1:1 Strict Lesson Progression Sequence across grades.
 */
export interface LessonSequenceItem {
  grade: number;
  topic: string;
}

export const LESSON_SEQUENCE: Record<string, LessonSequenceItem[]> = {
  Mathematics: [
    { grade: 4, topic: 'Fractions' },
    { grade: 5, topic: 'Decimals' },
    { grade: 6, topic: 'Algebraic Equations' }
  ],
  English: [
    { grade: 4, topic: 'Figurative Language' },
    { grade: 5, topic: 'Short Story Comprehension' },
    { grade: 5, topic: 'Adjectives' },
    { grade: 6, topic: 'Idiomatic Expressions' }
  ]
};

export interface ProgressLogItem {
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
}

/**
 * Checks if a lesson is locked based on strict 1:1 progression sequence.
 * A lesson is unlocked if:
 * 1. It's the first lesson in the subject sequence.
 * 2. Or, the student passed the previous lesson in the sequence with >= 80% score.
 * 3. Or, the grade of the lesson is strictly less than the student's specified (preferred) grade.
 * 4. Or, the grade of the lesson equals the student's specified grade, and the previous lesson is of a lower grade level (bypass lower grade requirements).
 */
export function isLessonLocked(
  subject: string,
  gradeLevel: number,
  topic: string,
  studentProgress: ProgressLogItem[],
  preferredGrade: number
): boolean {
  const seq = LESSON_SEQUENCE[subject];
  if (!seq) return false;

  const index = seq.findIndex((item) => item.grade === gradeLevel && item.topic === topic);
  if (index <= 0) return false;

  const prevLesson = seq[index - 1];
  const hasPassedPrev = studentProgress.some(
    (p) =>
      p.subject === subject &&
      p.gradeLevel === prevLesson.grade &&
      p.topic === prevLesson.topic &&
      p.totalQuestions > 0 &&
      (p.score / p.totalQuestions) >= 0.8
  );
  if (hasPassedPrev) return false;

  if (gradeLevel < preferredGrade) return false;

  if (gradeLevel === preferredGrade && prevLesson.grade < preferredGrade) return false;

  return true;
}
