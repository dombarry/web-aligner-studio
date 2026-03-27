import { getDb } from '@/lib/db';
import { readFile } from 'fs/promises';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    const db = getDb();
    const scan = db.prepare('SELECT diskPath, originalName FROM scans WHERE id = ?').get(uploadId) as { diskPath: string; originalName: string } | undefined;

    if (!scan) {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = await readFile(scan.diskPath);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `inline; filename="${scan.originalName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('File serve error:', error);
    return Response.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
