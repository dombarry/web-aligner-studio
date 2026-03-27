import { preformPost, PreformError } from '@/lib/preform-client';
import { getDb } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const { uploadId, repairBehavior } = await request.json();

    // Look up the disk path from the scans table
    const db = getDb();
    const scan = db.prepare('SELECT diskPath FROM scans WHERE id = ?').get(uploadId) as { diskPath: string } | undefined;

    if (!scan) {
      return Response.json({ error: `Upload ${uploadId} not found` }, { status: 404 });
    }

    const data = await preformPost(`/scene/${sceneId}/import-model/`, {
      file: scan.diskPath,
      repair_behavior: repairBehavior || 'REPAIR',
    });

    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to import model' }, { status: 500 });
  }
}
