import { PREFORM_BASE_URL } from './constants';

export class PreformError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'PreformError';
  }
}

export async function preformFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${PREFORM_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new PreformError(res.status, `PreForm API error (${res.status}): ${body}`);
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof PreformError) throw error;
    throw new PreformError(503, `Cannot reach PreForm Server at ${PREFORM_BASE_URL}: ${error}`);
  }
}

export async function preformGet<T = unknown>(path: string): Promise<T> {
  return preformFetch<T>(path, { method: 'GET' });
}

export async function preformPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return preformFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function preformDelete<T = unknown>(path: string): Promise<T> {
  return preformFetch<T>(path, { method: 'DELETE' });
}
