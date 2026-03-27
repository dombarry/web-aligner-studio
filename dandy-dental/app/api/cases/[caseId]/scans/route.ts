import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const db = getDb();
    const scans = db.prepare(
      'SELECT * FROM scans WHERE caseId = ? ORDER BY pairGroup, originalName'
    ).all(caseId);
    return Response.json({ scans });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch scans' }, { status: 500 });
  }
}
