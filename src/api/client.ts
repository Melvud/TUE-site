// src/api/client.ts

// ================== Вычисляем адрес API (надёжно) ==================
const RAW = (import.meta as any)?.env?.VITE_API_URL || ""; // напр. https://tue-site-backend.onrender.com/api

function guessRenderBackendOrigin(): string | null {
  if (typeof window === "undefined") return null;
  const { protocol, host } = window.location;
  // Пример: tue-site-frontend.onrender.com -> tue-site-backend.onrender.com
  if (/\.onrender\.com$/i.test(host) && /-frontend\./i.test(host)) {
    return `${protocol}//${host.replace(/-frontend\./i, "-backend.")}`;
  }
  return null;
}

function splitBase(u: string): { origin: string; prefix: string } {
  try {
    if (/^https?:\/\//i.test(u)) {
      const url = new URL(u);
      const origin = url.origin; // https://…onrender.com
      let prefix = url.pathname || "";
      if (!prefix) prefix = "/api";
      // гарантируем формат /api (без хвостового /)
      prefix = "/" + prefix.replace(/^\/+/, "").replace(/\/+$/, "");
      return { origin, prefix };
    }
  } catch {}
  return { origin: "", prefix: "" };
}

// 1) Если VITE_API_URL задана и абсолютная — используем её.
let ORIGIN = "";
let API_PREFIX = "/api";
if (RAW) {
  const { origin, prefix } = splitBase(RAW);
  if (origin) {
    ORIGIN = origin;
    API_PREFIX = prefix || "/api";
  }
}

// 2) Если переменная не подхватилась — пробуем угадать Render-бэкенд.
if (!ORIGIN && typeof window !== "undefined") {
  const guessed = guessRenderBackendOrigin();
  if (guessed) {
    ORIGIN = guessed;
    API_PREFIX = "/api";
  }
}

// 3) Фолбэк: локальная разработка (Vite proxy)
if (!ORIGIN && typeof window !== "undefined") {
  ORIGIN = window.location.origin; // http://localhost:5173
  API_PREFIX = "/api"; // пойдёт через Vite proxy к Node
}

// Собираем окончательный базовый адрес (без хвостового /)
function joinApi(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  // убираем повторное /api у path, т.к. у нас есть API_PREFIX
  const trimmed = p.replace(/^\/api(\/|$)/, "/");
  return `${ORIGIN}${API_PREFIX}${trimmed}`.replace(/(?<!:)\/{2,}/g, "/").replace(/^https?:\//, (m) => m + "/");
}

// ================== Утилиты для файлов ==================
export function toFileUrl(u?: string): string | undefined {
  if (!u) return u;
  try {
    if (/^https?:\/\//i.test(u)) {
      const url = new URL(u);
      url.pathname = url.pathname.replace(/\/uploads\//, "/server/uploads/");
      return url.toString();
    }
    let path = u.startsWith("/") ? u : `/${u}`;
    path = path.replace(/^\/uploads\//, "/server/uploads/");
    if (!/^\/server\/uploads\//.test(path)) {
      path = `/server/uploads/${path.replace(/^\/+/, "")}`;
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
      .replace(/src="\/uploads\//g, `src="${ORIGIN}/server/uploads/`)
      .replace(/src="https?:\/\/[^"]+\/uploads\//g, `src="${ORIGIN}/server/uploads/`)
      .replace(/src="\/server\/uploads\//g, `src="${ORIGIN}/server/uploads/`)
      .replace(/src="https?:\/\/[^"]+\/server\/uploads\//g, `src="${ORIGIN}/server/uploads/`);
  } catch {
    return html;
  }
}

// ================== Базовые fetch-помощники ==================
function withAuth(headers: HeadersInit = {}, token?: string) {
  const h = new Headers(headers);
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => null);
      const msg = (j && (j.error || j.message)) || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    } else {
      const t = await res.text().catch(() => "");
      throw new Error(t || `HTTP ${res.status}: ${res.statusText}`);
    }
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return undefined as unknown as T;
}

// ================== Универсальные API-методы ==================
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return fetchJSON<T>(joinApi(path), {
    headers: withAuth({}, token),
    credentials: "include",
  });
}

export async function apiPost<T>(path: string, body?: any, token?: string): Promise<T> {
  return fetchJSON<T>(joinApi(path), {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }, token),
    body: JSON.stringify(clean(body ?? {})),
    credentials: "include",
  });
}

export async function apiPut<T>(path: string, body?: any, token?: string): Promise<T> {
  return fetchJSON<T>(joinApi(path), {
    method: "PUT",
    headers: withAuth({ "Content-Type": "application/json" }, token),
    body: JSON.stringify(clean(body ?? {})),
    credentials: "include",
  });
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  await fetchJSON<void>(joinApi(path), {
    method: "DELETE",
    headers: withAuth({}, token),
    credentials: "include",
  });
}

function clean<T extends object>(obj: T): T {
  const o: Record<string, any> = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) o[k] = v;
  });
  return o as T;
}

// ================== Обёртки для доменной логики ==================
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

export const apiGetEvents      = () => apiGet<EventPayload[]>("/events");
export const apiGetNews        = () => apiGet<NewsPayload[]>("/news");
export const apiCreateEvent    = (d: EventPayload, token?: string) => apiPost<EventPayload>("/events", d, token);
export const apiUpdateEvent    = (id: string | number, d: EventPayload, token?: string) => apiPut<EventPayload>(`/events/${id}`, d, token);
export const apiDeleteEvent    = (id: string | number, token?: string) => apiDelete(`/events/${id}`, token);
export const apiCreateNews     = (d: NewsPayload, token?: string) => apiPost<NewsPayload>("/news", d, token);
export const apiUpdateNews     = (id: string | number, d: NewsPayload, token?: string) => apiPut<NewsPayload>(`/news/${id}`, d, token);
export const apiDeleteNews     = (id: string | number, token?: string) => apiDelete(`/news/${id}`, token);

// Upload (вернёт абсолютный URL файла вида https://…/server/uploads/xxx)
export async function apiUploadFile(file: File, token?: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const resp = await fetchJSON<{ url: string }>(joinApi("/upload"), {
    method: "POST",
    headers: withAuth({}, token),
    body: fd,
    credentials: "include",
  });
  return toFileUrl(resp.url)!;
}

// ================== Отладочная подсказка ==================
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.debug("[client] API = ", `${ORIGIN}${API_PREFIX}`);
}
