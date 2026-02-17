import { supabase } from '@/integrations/supabase/client';

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://pl-conso-backend.onrender.com';

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_BASE_URL}${path}`;
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${session.access_token}`);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => 'Request failed');
    throw new Error(msg || `Request failed (${response.status})`);
  }

  return response;
}

export async function backendJson<T = unknown>(path: string, init: RequestInit = {}) {
  const response = await backendFetch(path, init);
  return response.json() as Promise<T>;
}

export async function backendBlob(path: string, init: RequestInit = {}) {
  const response = await backendFetch(path, init);
  return response.blob();
}
