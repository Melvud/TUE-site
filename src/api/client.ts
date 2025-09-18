// src/api/client.ts
// Единый фронт-клиент для API. Корректно работает с Vite proxy ("/api" → бэкенд)
// и с прямым адресом через VITE_API_URL.
//
// Поддерживает:
//   apiGet/apiPost/apiPut/apiDelete
//   apiUploadFile
//   apiGetEvents/apiCreateEvent/apiUpdateEvent
//   apiGetNews/apiCreateNews/apiUpdateNews

// ======================= Конфигурация =======================
const RAW_BASE =
  (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:3000/api';

const API_BASE = RAW_BASE.replace(/\/+$/, ''); // http://localhost:3001/api
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin; // http://localhost:3001
  } catch {
    return 'http://localhost:3000';
  }
})();

const isBrowser =
  typeof window !== 'undefined' && typeof window.location !== 'undefined';

// ======================= Вспомогалки ========================
function withAuth(headers: HeadersInit = {}, token?: string) {
  const h = new Headers(headers);
  if (token) h.set('Authorization', `Bearer ${token}`);
  return h;
}

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return (await res.json()) as T;
  }
  // Пустой ответ
  return undefined as unknown as T;
}

/**
 * Сборка абсолютного URL:
 * - http(s) → как есть
 * - ПУТЬ С "/" В НАЧАЛЕ → идём на **текущий origin** (чтобы Vite proxy перехватил /api/*)
 *   (в браузере: http://localhost:5173 + /api/..., proxy → http://localhost:3001)
 *   вне браузера — используем API_ORIGIN как запасной вариант.
 * - относительный путь → склеиваем с API_BASE (например, events → http://localhost:3001/api/events)
 */
function toUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) {
    const origin = isBrowser ? window.location.origin : API_ORIGIN;
    return `${origin}${path}`;
  }
  return `${API_BASE}/${path.replace(/^\/+/, '')}`;
}

function clean<T extends object>(obj: T): T {
  const out: Record<string, any> = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out as T;
}

// ======================= Универсальные методы =======================
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return fetchJSON<T>(toUrl(path), {
    headers: withAuth({}, token),
    credentials: 'include',
  });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  return fetchJSON<T>(toUrl(path), {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  return fetchJSON<T>(toUrl(path), {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  await fetchJSON<void>(toUrl(path), {
    method: 'DELETE',
    headers: withAuth({}, token),
    credentials: 'include',
  });
}

// ======================= Типы =======================
export type EventPayload = {
  id?: string | number;
  title: string;
  date?: string;
  coverUrl?: string;
  googleFormUrl?: string;
  summary?: string;
  content?: string;
  published?: boolean;
  latest?: boolean;   // featured/latest
  publishAt?: string; // ISO datetime (optional)
};

export type NewsPayload = {
  id?: string | number;
  title: string;
  coverUrl?: string;
  summary?: string;
  content?: string;
  published?: boolean;
  publishAt?: string; // ISO datetime (optional)
};

// ======================= Upload =======================
/** Ожидается ответ { url: string }. Возвращает абсолютный URL. */
export async function apiUploadFile(file: File, token?: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);

  // Используем абсолютный путь с "/" — это пойдёт через Vite proxy
  const resp = await fetchJSON<{ url: string }>(toUrl('/api/upload'), {
    method: 'POST',
    headers: withAuth({}, token), // не ставим Content-Type вручную
    body: fd,
    credentials: 'include',
  });

  const fileUrl = resp?.url;
  if (!fileUrl) throw new Error('Upload response has no "url"');

  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const origin = isBrowser ? window.location.origin : API_ORIGIN;
  return `${origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

// ======================= Events (врапперы) =======================
export async function apiGetEvents(): Promise<EventPayload[]> {
  // ведущий "/" → через proxy на бекенд
  return fetchJSON<EventPayload[]>(toUrl('/api/events'), { credentials: 'include' });
}

export async function apiCreateEvent(
  data: EventPayload,
  token?: string
): Promise<EventPayload> {
  return fetchJSON<EventPayload>(toUrl('/api/events'), {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(data)),
    credentials: 'include',
  });
}

export async function apiUpdateEvent(
  id: string | number,
  data: EventPayload,
  token?: string
): Promise<EventPayload> {
  return fetchJSON<EventPayload>(toUrl(`/api/events/${id}`), {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(data)),
    credentials: 'include',
  });
}

// ======================= News (врапперы) =======================
export async function apiGetNews(): Promise<NewsPayload[]> {
  return fetchJSON<NewsPayload[]>(toUrl('/api/news'), { credentials: 'include' });
}

export async function apiCreateNews(
  data: NewsPayload,
  token?: string
): Promise<NewsPayload> {
  return fetchJSON<NewsPayload>(toUrl('/api/news'), {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(data)),
    credentials: 'include',
  });
}

export async function apiUpdateNews(
  id: string | number,
  data: NewsPayload,
  token?: string
): Promise<NewsPayload> {
  return fetchJSON<NewsPayload>(toUrl(`/api/news/${id}`), {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(data)),
    credentials: 'include',
  });
}

// ======================= (Опционально) delete-врапперы =======================
export const apiDeleteEvent = (id: string | number, token?: string) =>
  apiDelete(`/api/events/${id}`, token);

export const apiDeleteNews = (id: string | number, token?: string) =>
  apiDelete(`/api/news/${id}`, token);
