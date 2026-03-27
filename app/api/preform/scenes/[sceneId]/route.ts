import { preformGet, preformDelete, PreformError } from '@/lib/preform-client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const data = await preformGet(`/scene/${sceneId}/`);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to fetch scene' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const data = await preformDelete(`/scene/${sceneId}/`);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to delete scene' }, { status: 500 });
  }
}
