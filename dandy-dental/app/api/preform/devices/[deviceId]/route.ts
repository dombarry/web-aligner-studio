import { preformGet, PreformError } from '@/lib/preform-client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const data = await preformGet(`/devices/${deviceId}/`);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to fetch device' }, { status: 500 });
  }
}
