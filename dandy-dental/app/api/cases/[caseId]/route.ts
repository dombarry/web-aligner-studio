import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const db = getDb();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId);

    if (!caseData) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    return Response.json(caseData);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await request.json();
    const db = getDb();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.patientName !== undefined) { updates.push('patientName = ?'); values.push(body.patientName); }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }

    if (updates.length === 0) {
      return Response.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push("updatedAt = datetime('now')");
    values.push(caseId);

    db.prepare(`UPDATE cases SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId);

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const db = getDb();
    db.prepare('DELETE FROM cases WHERE id = ?').run(caseId);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}
