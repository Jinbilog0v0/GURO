import * as SQLite from 'expo-sqlite';
import { ProgressEvent, Question, ItemBank } from '../store/useAppStore';

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Initialize SQLite connection and create tables
export async function getLocalDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  
  const db = await SQLite.openDatabaseAsync('guro_local.db');
  
  // Enable Write-Ahead Logging (WAL) for better concurrent performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  
  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS student_progress (
      event_id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      grade_level INTEGER NOT NULL,
      topic TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS local_item_bank (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      grade_level INTEGER NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      category TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON string array
      correct_answer TEXT NOT NULL,
      feedback_en TEXT NOT NULL,
      feedback_fil TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_study_content (
      subject TEXT NOT NULL,
      grade_level INTEGER NOT NULL,
      topic TEXT NOT NULL,
      introduction TEXT NOT NULL,
      definitions TEXT NOT NULL, -- JSON string array
      summary TEXT NOT NULL, -- JSON string array
      PRIMARY KEY (subject, grade_level, topic)
    );

    CREATE TABLE IF NOT EXISTS parent_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  dbInstance = db;
  return db;
}

// --- STUDENT PROGRESS EVENTS METHODS ---

export async function saveLocalProgress(event: ProgressEvent): Promise<void> {
  const db = await getLocalDb();
  await db.runAsync(
    `INSERT INTO student_progress (event_id, subject, grade_level, topic, score, total_questions, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.eventId,
      event.subject,
      event.gradeLevel,
      event.topic,
      event.score,
      event.totalQuestions,
      event.timestamp,
      event.synced ? 1 : 0
    ]
  );
}

export async function getLocalProgress(): Promise<ProgressEvent[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<{
    event_id: string;
    subject: string;
    grade_level: number;
    topic: string;
    score: number;
    total_questions: number;
    timestamp: string;
    synced: number;
  }>('SELECT * FROM student_progress ORDER BY timestamp DESC');

  return rows.map((row) => ({
    eventId: row.event_id,
    subject: row.subject,
    gradeLevel: row.grade_level,
    topic: row.topic,
    score: row.score,
    totalQuestions: row.total_questions,
    timestamp: row.timestamp,
    synced: row.synced === 1,
  }));
}

export async function getUnsyncedProgress(): Promise<ProgressEvent[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<{
    event_id: string;
    subject: string;
    grade_level: number;
    topic: string;
    score: number;
    total_questions: number;
    timestamp: string;
    synced: number;
  }>('SELECT * FROM student_progress WHERE synced = 0');

  return rows.map((row) => ({
    eventId: row.event_id,
    subject: row.subject,
    gradeLevel: row.grade_level,
    topic: row.topic,
    score: row.score,
    totalQuestions: row.total_questions,
    timestamp: row.timestamp,
    synced: false,
  }));
}

export async function markEventsAsSynced(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  const db = await getLocalDb();
  const placeholders = eventIds.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE student_progress SET synced = 1 WHERE event_id IN (${placeholders})`,
    eventIds
  );
}

export async function clearLocalProgress(): Promise<void> {
  const db = await getLocalDb();
  await db.runAsync('DELETE FROM student_progress');
}

// --- LOCAL ITEM BANK METHODS ---

export async function saveLocalItemBank(itemBank: ItemBank): Promise<void> {
  const db = await getLocalDb();
  
  const runOperations = async () => {
    // Clear old cached data first
    await db.runAsync('DELETE FROM local_item_bank');
    await db.runAsync('DELETE FROM local_study_content');

    // Insert new questions and study content
    for (const subject of Object.keys(itemBank)) {
      const subjectData = itemBank[subject];
      for (const grade of Object.keys(subjectData)) {
        const gradeData = subjectData[grade];
        for (const topic of Object.keys(gradeData)) {
          const topicData = gradeData[topic];

          // Save study content if present
          if (topicData.studyContent) {
            const sc = topicData.studyContent;
            await db.runAsync(
              `INSERT INTO local_study_content 
               (subject, grade_level, topic, introduction, definitions, summary)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                subject,
                parseInt(grade, 10),
                topic,
                sc.introduction,
                JSON.stringify(sc.definitions),
                JSON.stringify(sc.summary)
              ]
            );
          }

          // Save questions
          for (const difficulty of Object.keys(topicData)) {
            if (difficulty === 'studyContent') continue;
            const diffData = topicData[difficulty];
            for (const category of Object.keys(diffData)) {
              const questions = diffData[category];
              if (Array.isArray(questions)) {
                for (const q of questions) {
                  await db.runAsync(
                    `INSERT INTO local_item_bank 
                     (id, subject, grade_level, topic, difficulty, category, question_text, options, correct_answer, feedback_en, feedback_fil)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      q.id,
                      subject,
                      parseInt(grade, 10),
                      topic,
                      difficulty,
                      category,
                      q.questionText,
                      JSON.stringify(q.options),
                      q.correctAnswer,
                      q.feedback.en,
                      q.feedback.fil
                    ]
                  );
                }
              }
            }
          }
        }
      }
    }
  };

  if (typeof db.withTransactionAsync === 'function') {
    await db.withTransactionAsync(runOperations);
  } else {
    await runOperations();
  }
}

export async function getLocalItemBank(): Promise<ItemBank | null> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<{
    id: string;
    subject: string;
    grade_level: number;
    topic: string;
    difficulty: string;
    category: string;
    question_text: string;
    options: string;
    correct_answer: string;
    feedback_en: string;
    feedback_fil: string;
  }>('SELECT * FROM local_item_bank');

  const studyRows = await db.getAllAsync<{
    subject: string;
    grade_level: number;
    topic: string;
    introduction: string;
    definitions: string;
    summary: string;
  }>('SELECT * FROM local_study_content');

  if (rows.length === 0 && studyRows.length === 0) return null;

  const itemBank: ItemBank = {};

  // Rebuild questions
  rows.forEach((row) => {
    const { subject, grade_level, topic, difficulty, category } = row;
    const gradeStr = grade_level.toString();

    if (!itemBank[subject]) itemBank[subject] = {};
    if (!itemBank[subject][gradeStr]) itemBank[subject][gradeStr] = {};
    if (!itemBank[subject][gradeStr][topic]) itemBank[subject][gradeStr][topic] = {};
    if (!itemBank[subject][gradeStr][topic][difficulty]) {
      itemBank[subject][gradeStr][topic][difficulty] = {};
    }
    if (!itemBank[subject][gradeStr][topic][difficulty][category]) {
      itemBank[subject][gradeStr][topic][difficulty][category] = [];
    }

    const q: Question = {
      id: row.id,
      questionText: row.question_text,
      options: JSON.parse(row.options),
      correctAnswer: row.correct_answer,
      feedback: {
        en: row.feedback_en,
        fil: row.feedback_fil,
      },
    };

    itemBank[subject][gradeStr][topic][difficulty][category].push(q);
  });

  // Rebuild study content
  studyRows.forEach((row) => {
    const { subject, grade_level, topic } = row;
    const gradeStr = grade_level.toString();

    if (!itemBank[subject]) itemBank[subject] = {};
    if (!itemBank[subject][gradeStr]) itemBank[subject][gradeStr] = {};
    if (!itemBank[subject][gradeStr][topic]) itemBank[subject][gradeStr][topic] = {};

    itemBank[subject][gradeStr][topic].studyContent = {
      introduction: row.introduction,
      definitions: JSON.parse(row.definitions),
      summary: JSON.parse(row.summary)
    };
  });

  return itemBank;
}

// --- PARENT SETTINGS METHODS ---

export async function saveParentSetting(key: string, value: string): Promise<void> {
  const db = await getLocalDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO parent_settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function getParentSetting(key: string): Promise<string | null> {
  const db = await getLocalDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM parent_settings WHERE key = ?',
    [key]
  );
  return row ? row.value : null;
}
