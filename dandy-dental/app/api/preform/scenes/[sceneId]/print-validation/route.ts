import { preformGet, PreformError } from '@/lib/preform-client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const data = await preformGet(`/scene/${sceneId}/print-validation/`);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to validate' }, { status: 500 });
  }
}
