import { preformPost, PreformError } from '@/lib/preform-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const body = await request.json();
    const data = await preformPost(`/scene/${sceneId}/label/`, body);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to apply label' }, { status: 500 });
  }
}
