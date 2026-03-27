import { preformGet, preformPost, PreformError } from '@/lib/preform-client';

export async function GET() {
  try {
    const data = await preformGet('/devices/');
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await preformPost('/discover-devices/', body);
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to discover devices' }, { status: 500 });
  }
}
