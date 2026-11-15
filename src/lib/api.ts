const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(
        'Verification timed out waiting for the server. Please check your connection and try again.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function parseApiResponse<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();

  if (!contentType.includes('application/json')) {
    if (res.status === 404) {
      throw new Error(
        'Backend API endpoint (/api/*) could not be reached on this host. Verify the server API routes and database environment variables are deployed.'
      );
    }
    const preview = rawText.replace(/\s+/g, ' ').trim().slice(0, 140);
    throw new Error(
      `Server returned an unexpected response (HTTP ${res.status})${preview ? `: ${preview}` : ''}`
    );
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(`Received malformed JSON from server (HTTP ${res.status}).`);
  }
}
