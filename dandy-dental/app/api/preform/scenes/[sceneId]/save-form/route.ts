import { preformPost, PreformError } from '@/lib/preform-client';
import path from 'path';
import { PREPARED_SCENES_DIR } from '@/lib/constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const { fileName } = await request.json();

    const filePath = path.resolve(process.cwd(), PREPARED_SCENES_DIR, fileName || `${Date.now()}.form`);

    const data = await preformPost(`/scene/${sceneId}/save-form/`, {
      file: filePath,
    });
    return Response.json({ ...(data as Record<string, unknown>), filePath });
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to save form' }, { status: 500 });
  }
}
