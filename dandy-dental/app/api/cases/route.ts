import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const cases = db.prepare(
      `SELECT c.*, COUNT(s.id) as scanCount
       FROM cases c LEFT JOIN scans s ON c.id = s.caseId
       GROUP BY c.id ORDER BY c.createdAt DESC`
    ).all();
    return Response.json({ cases });
  } catch (error) {
    console.error('Cases error:', error);
    return Response.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { patientName, notes } = await request.json();

    if (!patientName?.trim()) {
      return Response.json({ error: 'patientName is required' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(
      'INSERT INTO cases (id, patientName, notes) VALUES (?, ?, ?)'
    ).run(id, patientName.trim(), notes || '');

    const newCase = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    return Response.json(newCase, { status: 201 });
  } catch (error) {
    console.error('Create case error:', error);
    return Response.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
