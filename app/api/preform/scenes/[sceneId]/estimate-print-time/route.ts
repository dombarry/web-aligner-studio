import { preformPost, PreformError } from '@/lib/preform-client';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const data = await preformPost(`/scene/${sceneId}/estimate-print-time/`);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to estimate print time' }, { status: 500 });
  }
}
