import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const jobs = db.prepare(
      `SELECT j.*, c.patientName
       FROM jobs j LEFT JOIN cases c ON j.caseId = c.id
       ORDER BY j.submittedAt DESC`
    ).all();
    return Response.json({ jobs });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuidv4();

    db.prepare(
      `INSERT INTO jobs (id, caseId, sceneId, printerName, printerId, jobName, status, formFilePath, estimatedTime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.caseId || null,
      body.sceneId || null,
      body.printerName || '',
      body.printerId || '',
      body.jobName || '',
      body.status || 'submitted',
      body.formFilePath || null,
      body.estimatedTime || null
    );

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    return Response.json(job, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
