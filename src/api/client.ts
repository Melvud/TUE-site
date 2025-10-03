// src/api/client.ts

// ================== Надёжное определение адреса API ==================
const RAW = (import.meta as any)?.env?.VITE_API_URL || '';

function guessRenderBackendOrigin(): string | null {
  if (typeof window === 'undefined') return null;
  const { protocol, host } = window.location;
  if (/\.onrender\.com$/i.test(host) && /-frontend\./i.test(host)) {
    return `${protocol}//${host.replace(/-frontend\./i, '-backend.')}`;
  }
  return null;
}

function splitBase(u: string): { origin: string; prefix: string } {
  try {
    if (/^https?:\/\//i.test(u)) {
      const url = new URL(u);
      const origin = url.origin;
      let prefix = url.pathname || '';
      prefix = '/' + (prefix.replace(/^\/+/, '') || 'api').replace(/\/+$/, '');
      return { origin, prefix };
    }
  } catch {}
  return { origin: '', prefix: '' };
}

let ORIGIN = '';
let API_PREFIX = '/api';

if (RAW) {
  const { origin, prefix } = splitBase(RAW);
  if (origin) {
    ORIGIN = origin;
    API_PREFIX = prefix || '/api';
  }
}

if (!ORIGIN && typeof window !== 'undefined') {
  const guessed = guessRenderBackendOrigin();
  if (guessed) {
    ORIGIN = guessed;
    API_PREFIX = '/api';
  }
}

if (!ORIGIN && typeof window !== 'undefined') {
  const isVite = /:5173$/.test(window.location.host);
  ORIGIN = isVite ? 'http://localhost:3000' : window.location.origin;
  API_PREFIX = '/api';
}

function joinApi(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const trimmed = p.replace(/^\/api(\/|$)/, '/');
  return `${ORIGIN}${API_PREFIX}${trimmed}`
    .replace(/(?<!:)\/{2,}/g, '/')
    .replace(/^https?:\//, (m) => m + '/');
}

// ================== Утилиты для файлов ==================
export function toFileUrl(u?: string): string | undefined {
  if (!u) return u;
  try {
    if (/^https?:\/\//i.test(u)) {
      const url = new URL(u);
      url.pathname = url.pathname
        .replace(/\/server\/uploads\//g, '/uploads/')
        .replace(/\/+uploads\//g, '/uploads/');
      return url.toString();
    }
    let path = u.startsWith('/') ? u : `/${u}`;
    path = path.replace(/^\/server\/uploads\//, '/uploads/').replace(/^\/+uploads\//, '/uploads/');
    if (!/^\/uploads\//.test(path)) {
      path = `/uploads/${path.replace(/^\/+/, '')}`;
    }
    return `${ORIGIN}${path}`;
  } catch {
    return u;
  }
}

export function fixUploadsInHtml(html?: string): string | undefined {
  if (!html) return html;
  try {
    return html
      .replace(/src="\/server\/uploads\//g, `src="${ORIGIN}/uploads/`)
      .replace(/src="https?:\/\/[^"]+\/server\/uploads\//g, `src="${ORIGIN}/uploads/`)
      .replace(/src="\/uploads\//g, `src="${ORIGIN}/uploads/`)
      .replace(/src="https?:\/\/[^"]+\/uploads\//g, `src="${ORIGIN}/uploads/`);
  } catch {
    return html;
  }
}

// ================== Базовые fetch-помощники ==================
function withAuth(headers: HeadersInit = {}, token?: string) {
  const h = new Headers(headers);
  if (token) h.set('Authorization', `Bearer ${token}`);
  return h;
}

async function readJsonIfAny<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return undefined as unknown as T;
}

async function fetchWithJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await res.json().catch(() => null);
      const msg = (j && (j.error || j.message)) || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    } else {
      const t = await res.text().catch(() => '');
      throw new Error(t || `HTTP ${res.status}: ${res.statusText}`);
    }
  }
  return readJsonIfAny<T>(res);
}

async function getWithAdminFallback<T>(path: string, token?: string): Promise<T> {
  const url = joinApi(path);
  const res = await fetch(url, {
    headers: withAuth({}, token),
    credentials: 'include',
  });

  if (res.ok) return readJsonIfAny<T>(res);

  if (res.status === 404 && /\/(news|events)\/admin\/?$/.test(new URL(url).pathname)) {
    const publicPath = path.replace(/\/admin\/?$/, '');
    const url2 = joinApi(publicPath);
    const res2 = await fetch(url2, {
      headers: withAuth({}, token),
      credentials: 'include',
    });
    if (res2.ok) return readJsonIfAny<T>(res2);
    const txt = await res2.text().catch(() => '');
    throw new Error(txt || `HTTP ${res2.status}: ${res2.statusText}`);
  }

  const txt = await res.text().catch(() => '');
  throw new Error(txt || `HTTP ${res.status}: ${res.statusText}`);
}

// ================== Универсальные API-методы ==================
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return getWithAdminFallback<T>(path, token);
}

export async function apiPost<T>(path: string, body?: any, token?: string): Promise<T> {
  return fetchWithJson<T>(joinApi(path), {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(body ?? {})),
    credentials: 'include',
  });
}

export async function apiPut<T>(path: string, body?: any, token?: string): Promise<T> {
  return fetchWithJson<T>(joinApi(path), {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(body ?? {})),
    credentials: 'include',
  });
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  await fetchWithJson<void>(joinApi(path), {
    method: 'DELETE',
    headers: withAuth({}, token),
    credentials: 'include',
  });
}

function clean<T extends object>(obj: T): T {
  const o: Record<string, any> = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) o[k] = v;
  });
  return o as T;
}

// ================== Доменные врапперы ==================
export type EventPayload = {
  id?: string | number;
  title: string;
  date?: string;
  coverUrl?: string;
  googleFormUrl?: string;
  summary?: string;
  content?: string;
  published?: boolean;
  latest?: boolean;
  publishAt?: string;
};

export type NewsPayload = {
  id?: string | number;
  title: string;
  coverUrl?: string;
  summary?: string;
  content?: string;
  published?: boolean;
  publishAt?: string;
};

export const apiGetEvents = () => apiGet<EventPayload[]>('/events');
export const apiGetNews = () => apiGet<NewsPayload[]>('/news');
export const apiCreateEvent = (d: EventPayload, token?: string) =>
  apiPost<EventPayload>('/events', d, token);
export const apiUpdateEvent = (id: string | number, d: EventPayload, token?: string) =>
  apiPut<EventPayload>(`/events/${id}`, d, token);
export const apiDeleteEvent = (id: string | number, token?: string) =>
  apiDelete(`/events/${id}`, token);
export const apiCreateNews = (d: NewsPayload, token?: string) =>
  apiPost<NewsPayload>('/news', d, token);
export const apiUpdateNews = (id: string | number, d: NewsPayload, token?: string) =>
  apiPut<NewsPayload>(`/news/${id}`, d, token);
export const apiDeleteNews = (id: string | number, token?: string) =>
  apiDelete(`/news/${id}`, token);

export async function apiUploadFile(file: File, token?: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const resp = await fetchWithJson<{ url: string }>(joinApi('/upload'), {
    method: 'POST',
    headers: withAuth({}, token),
    body: fd,
    credentials: 'include',
  });
  return toFileUrl(resp.url)!;
}

// ================== Pages API ==================
export async function apiGetPage<T>(pageName: string, token?: string): Promise<T> {
  return apiGet<T>(`/pages/${pageName}`, token);
}

export async function apiUpdatePage<T>(
  pageName: string,
  content: T,
  token?: string
): Promise<T> {
  return apiPut<T>(`/pages/${pageName}`, content, token);
}

// ================== Отладка ==================
if (typeof window !== 'undefined') {
  console.debug('[client] API =', `${ORIGIN}${API_PREFIX}`);
}