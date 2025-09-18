// src/context/DataContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Event, News, AuthUser } from '../types';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';
import { toFileUrl, fixUploadsInHtml } from '../api/client';

interface DataContextShape {
  events: Event[];
  news: News[];
  loading: boolean;

  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;

  refresh: () => Promise<void>;

  createEvent: (payload: Partial<Event>) => Promise<Event>;
  updateEvent: (id: string, payload: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;

  createNews: (payload: Partial<News>) => Promise<News>;
  updateNews: (id: string, payload: Partial<News>) => Promise<News>;
  deleteNews: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextShape | null>(null);

const eqId = (a: string | number, b: string | number) => String(a) === String(b);

function usePersistedToken() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem('auth_token'); } catch { return null; }
  });
  useEffect(() => {
    try {
      if (token) localStorage.setItem('auth_token', token);
      else localStorage.removeItem('auth_token');
    } catch {}
  }, [token]);
  return { token, setToken } as const;
}

// Нормализация путей картинок и контента под /uploads/
function normalizeEvent(e: any): Event {
  const cover = toFileUrl(e?.coverUrl) ?? e?.coverUrl;
  const html = fixUploadsInHtml(e?.content) ?? e?.content;
  return { ...(e || {}), coverUrl: cover, content: html };
}
function normalizeNews(n: any): News {
  const cover = toFileUrl(n?.coverUrl) ?? n?.coverUrl;
  const html = fixUploadsInHtml(n?.content) ?? n?.content;
  return { ...(n || {}), coverUrl: cover, content: html };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, setToken } = usePersistedToken();
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAuthenticated = Boolean(token);

  // Админский GET с фолбэком на публичный, если /admin недоступен (404)
  const getWithFallback = async <T,>(adminPath: string, publicPath: string): Promise<T> => {
    if (isAuthenticated && token) {
      try {
        return await apiGet<T>(adminPath, token);
      } catch {
        // 404/ошибка — используем публичный
      }
    }
    return await apiGet<T>(publicPath);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [n, e] = await Promise.all([
        getWithFallback<any[]>('/api/news/admin', '/api/news'),
        getWithFallback<any[]>('/api/events/admin', '/api/events'),
      ]);

      const nn = (Array.isArray(n) ? n : [])
        .filter((x) => x && typeof x === 'object')
        .map(normalizeNews);

      const ee = (Array.isArray(e) ? e : [])
        .filter((x) => x && typeof x === 'object')
        .map(normalizeEvent);

      setNews(nn);
      setEvents(ee);
    } catch {
      // В случае любой ошибки не валим рендер — просто отдаём пустые списки
      setNews([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    const resp = await apiPost<{ token: string; user: AuthUser }>('/api/auth/login', { email, password });
    if (!resp || !resp.token) throw new Error('Login failed');
    setToken(resp.token);
    setUser(resp.user);
    await load();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    void load();
  };

  const createEvent = async (payload: Partial<Event>) => {
    const created = await apiPost<Event>('/api/events', payload, token || undefined);
    const normalized = normalizeEvent(created);
    setEvents((s) => {
      let next = [normalized, ...s];
      if ((normalized as any).latest) {
        next = next.map((e) => (eqId((e as any).id, (normalized as any).id) ? normalized : { ...(e as any), latest: false as any }));
      }
      return next;
    });
    return normalized;
  };

  const updateEvent = async (id: string, payload: Partial<Event>) => {
    const updated = await apiPut<Event>(`/api/events/${id}`, payload, token || undefined);
    const normalized = normalizeEvent(updated);
    setEvents((s) => {
      let next = s.map((e) => (eqId((e as any).id, id) ? normalized : e));
      if ((normalized as any).latest) {
        next = next.map((e) => (eqId((e as any).id, id) ? normalized : { ...(e as any), latest: false as any }));
      }
      return next;
    });
    return normalized;
  };

  const deleteEvent = async (id: string) => {
    await apiDelete(`/api/events/${id}`, token || undefined);
    setEvents((s) => s.filter((e) => !eqId((e as any).id, id)));
  };

  const createNews = async (payload: Partial<News>) => {
    const created = await apiPost<News>('/api/news', payload, token || undefined);
    const normalized = normalizeNews(created);
    setNews((s) => [normalized, ...s]);
    return normalized;
  };

  const updateNews = async (id: string, payload: Partial<News>) => {
    const updated = await apiPut<News>(`/api/news/${id}`, payload, token || undefined);
    const normalized = normalizeNews(updated);
    setNews((s) => s.map((n) => (eqId((n as any).id, id) ? normalized : n)));
    return normalized;
  };

  const deleteNews = async (id: string) => {
    await apiDelete(`/api/news/${id}`, token || undefined);
    setNews((s) => s.filter((n) => !eqId((n as any).id, id)));
  };

  const value = useMemo<DataContextShape>(
    () => ({
      events, news, loading,
      isAuthenticated, token, user, login, logout,
      refresh: load,
      createEvent, updateEvent, deleteEvent,
      createNews, updateNews, deleteNews,
    }),
    [events, news, loading, isAuthenticated, token, user]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
