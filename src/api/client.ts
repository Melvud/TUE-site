// src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') || '';

type FetchOpts = {
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  signal?: AbortSignal;
  draft?: boolean; // если true — добавим ?draft=true (предпросмотр Payload)
};

function makeURL(path: string, query?: Record<string, any>, draft?: boolean) {
  const url = new URL((BASE || '') + path, window.location.origin);
  const q = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === 'object') q.set(k, JSON.stringify(v));
      else q.set(k, String(v));
    });
  }
  // предпросмотр Payload (черновики) — требует активной админ-сессии
  if (draft) q.set('draft', 'true');
  const qs = q.toString();
  return qs ? `${url.pathname}?${qs}` : url.pathname;
}

async function request<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = 'GET', headers, body, signal, query, draft } = opts;
  const url = makeURL(path, query, draft);
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
    credentials: 'include', // чтобы черновики были доступны при логине в Payload
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return (ct.includes('application/json') ? res.json() : (res.text() as any)) as T;
}

export const apiGet = <T = any>(path: string, query?: Record<string, any>, draft?: boolean) =>
  request<T>(path, { method: 'GET', query, draft });

export const apiPost = <T = any>(path: string, body?: any, draft?: boolean) =>
  request<T>(path, { method: 'POST', body, draft });

export const apiPut = <T = any>(path: string, body?: any, draft?: boolean) =>
  request<T>(path, { method: 'PUT', body, draft });

export const apiDelete = <T = any>(path: string, draft?: boolean) =>
  request<T>(path, { method: 'DELETE', draft });

// Вспомогательная утилита для абсолютного URL медиадокумента Payload
export function mediaUrl(media: any): string {
  if (!media) return '';
  if (typeof media === 'string') return media;
  // payload cloud storage обычно отдаёт .url
  if (media.url) return media.url;
  // fallback: filename (локальные аплоады), попробуем /media/<filename> или /uploads/<filename>
  if (media.filename) return `/media/${media.filename}`;
  return '';
}
