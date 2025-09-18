// src/api/client.ts

// ============ Определение базового API-адреса ============
const RAW_API_BASE = (import.meta as any)?.env?.VITE_API_URL || ''; // напр. https://…/api
const API_BASE = (RAW_API_BASE || '/api').replace(/\/+$/, '');      // обрезаем хвостовые /
/// origin сервера (для файлов/абс. ссылок)
const API_ORIGIN = (() => {
  try {
    if (/^https?:\/\//i.test(API_BASE)) return new URL(API_BASE).origin;
  } catch {}
  // если API_BASE относительный (локальная разработка) — используем origin текущего сайта
  if (typeof window !== 'undefined' && window.location) return window.location.origin;
  return '';
})();

// ============ Утилиты для URL ============
/** Собирает корректный URL запроса.
 * - если path абсолютный http(s) — возвращаем как есть
 * - если path начинается с /api — клеим к ORIGIN API_BASE (чтобы работало и с абсолютным backend)
 * - иначе клеим к API_BASE (которая уже содержит /api)
 */
function toApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const p = path.startsWith('/') ? path : `/${path}`;

  if (p.startsWith('/api')) {
    // Всегда шлём на origin бэкенда (если API_BASE абсолютный) либо на текущий origin (если локально)
    const origin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${origin}${p}`;
  }

  // Стандартный случай: API_BASE уже оканчивается на /api
  return `${API_BASE}${p}`;
}

/** Приводит путь файла к абсолютному URL сервера и заставляет использовать /server/uploads/. */
export function toFileUrl(u?: string): string | undefined {
  if (!u) return u;

  // 1) абсолютная ссылка
  if (/^https?:\/\//i.test(u)) {
    try {
      const url = new URL(u);
      // заменяем /uploads/ на /server/uploads/
      url.pathname = url.pathname.replace(/\/uploads\//, '/server/uploads/');
      return url.toString();
    } catch {
      return u;
    }
  }

  // 2) относительный путь
  let path = u.startsWith('/') ? u : `/${u}`;
  path = path.replace(/^\/uploads\//, '/server/uploads/'); // принудительно /server/uploads/
  if (!/^\/server\/uploads\//.test(path)) {
    // если пришло просто имя файла — добавим префикс
    path = `/server/uploads/${path.replace(/^\/+/, '')}`;
  }
  return `${API_ORIGIN}${path}`;
}

/** Заменяет в HTML все src="/uploads/…" и абсолютные …/uploads/… на абсолютные ссылки /server/uploads/… от API_ORIGIN */
export function fixUploadsInHtml(html?: string): string | undefined {
  if (!html) return html;
  try {
    return html
      .replace(/src="\/uploads\//g, `src="${API_ORIGIN}/server/uploads/`)
      .replace(/src="https?:\/\/[^"]+\/uploads\//g, `src="${API_ORIGIN}/server/uploads/`)
      .replace(/src="\/server\/uploads\//g, `src="${API_ORIGIN}/server/uploads/`)
      .replace(/src="https?:\/\/[^"]+\/server\/uploads\//g, `src="${API_ORIGIN}/server/uploads/`);
  } catch {
    return html;
  }
}

// ============ Базовые fetch-помощники ============
function withAuth(headers: HeadersInit = {}, token?: string) {
  const h = new Headers(headers);
  if (token) h.set('Authorization', `Bearer ${token}`);
  return h;
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    // Попробуем достать осмысленную ошибку
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
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  // нет тела — вернём undefined как T
  return undefined as unknown as T;
}

// ============ Публичные API-функции ============
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return fetchJSON<T>(toApiUrl(path), {
    headers: withAuth({}, token),
    credentials: 'include',
  });
}

export async function apiPost<T>(path: string, body?: any, token?: string): Promise<T> {
  return fetchJSON<T>(toApiUrl(path), {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(body ?? {})),
    credentials: 'include',
  });
}

export async function apiPut<T>(path: string, body?: any, token?: string): Promise<T> {
  return fetchJSON<T>(toApiUrl(path), {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }, token),
    body: JSON.stringify(clean(body ?? {})),
    credentials: 'include',
  });
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  await fetchJSON<void>(toApiUrl(path), {
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

// ============ Загрузка файлов ============
/** Отправляет файл на POST /api/upload, возвращает абсолютный URL вида https://…/server/uploads/xxx */
export async function apiUploadFile(file: File, token?: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);

  const resp = await fetchJSON<{ url: string }>(toApiUrl('/api/upload'), {
    method: 'POST',
    headers: withAuth({}, token), // не задаём Content-Type вручную для FormData
    body: fd,
    credentials: 'include',
  });

  const fileUrl = resp?.url;
  if (!fileUrl) throw new Error('Upload response has no "url"');

  // Нормализуем к абсолютному URL
  return toFileUrl(fileUrl)!;
}

// ============ Удобные врапперы для событий/новостей ============
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

export const apiGetEvents = () => apiGet<EventPayload[]>('/api/events');
export const apiGetNews   = () => apiGet<NewsPayload[]>('/api/news');

export const apiCreateEvent = (data: EventPayload, token?: string) =>
  apiPost<EventPayload>('/api/events', data, token);

export const apiUpdateEvent = (id: string | number, data: EventPayload, token?: string) =>
  apiPut<EventPayload>(`/api/events/${id}`, data, token);

export const apiCreateNews = (data: NewsPayload, token?: string) =>
  apiPost<NewsPayload>('/api/news', data, token);

export const apiUpdateNews = (id: string | number, data: NewsPayload, token?: string) =>
  apiPut<NewsPayload>(`/api/news/${id}`, data, token);

export const apiDeleteEvent = (id: string | number, token?: string) =>
  apiDelete(`/api/events/${id}`, token);

export const apiDeleteNews = (id: string | number, token?: string) =>
  apiDelete(`/api/news/${id}`, token);

// ============ Отладочная подсказка в консоль ============
if (typeof window !== 'undefined') {
  const resolved = /^https?:\/\//i.test(API_BASE) ? API_BASE : `${window.location.origin}${API_BASE}`;
  // eslint-disable-next-line no-console
  console.debug('[client] API_BASE =', resolved);
}
