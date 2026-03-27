import { preformGet, PreformError } from '@/lib/preform-client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const { operationId } = await params;
    const data = await preformGet(`/operations/${operationId}/`);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to fetch operation' }, { status: 500 });
  }
}
