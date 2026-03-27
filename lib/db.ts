import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'web-aligner-studio.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      patientName TEXT NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'completed')),
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      caseId TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      originalName TEXT NOT NULL,
      diskPath TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      pairGroup TEXT,
      uploadedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      caseId TEXT REFERENCES cases(id),
      sceneId TEXT,
      printerName TEXT DEFAULT '',
      printerId TEXT DEFAULT '',
      jobName TEXT DEFAULT '',
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'printing', 'completed', 'failed')),
      formFilePath TEXT,
      estimatedTime INTEGER,
      submittedAt TEXT DEFAULT (datetime('now')),
      completedAt TEXT
    );
  `);
}
