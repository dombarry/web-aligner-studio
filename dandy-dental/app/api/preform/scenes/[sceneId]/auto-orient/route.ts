import { preformPost, PreformError } from '@/lib/preform-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // No body provided - that's fine, send without body
    }
    const data = await preformPost(`/scene/${sceneId}/auto-orient/`, body);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to auto-orient' }, { status: 500 });
  }
}
