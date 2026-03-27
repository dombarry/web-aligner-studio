import { preformGet, PreformError } from '@/lib/preform-client';

export async function GET() {
  try {
    const data = await preformGet('/list-materials/');
    return Response.json(data);
  } catch (error) {
    if (error instanceof PreformError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}
