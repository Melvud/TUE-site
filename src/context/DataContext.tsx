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

// helpers to normalize file URLs coming from API/DB
function normalizeEvent(e: Event): Event {
  return {
    ...e,
    coverUrl: (toFileUrl((e as any).coverUrl) as any) ?? (e as any).coverUrl,
    content: (fixUploadsInHtml((e as any).content) as any) ?? (e as any).content,
  };
}
function normalizeNews(n: News): News {
  return {
    ...n,
    coverUrl: (toFileUrl((n as any).coverUrl) as any) ?? (n as any).coverUrl,
    content: (fixUploadsInHtml((n as any).content) as any) ?? (n as any).content,
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, setToken } = usePersistedToken();
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAuthenticated = Boolean(token);

  const getWithFallback = async <T,>(adminPath: string, publicPath: string): Promise<T> => {
    if (isAuthenticated && token) {
      try {
        return await apiGet<T>(adminPath, token);
      } catch { /* fallback below */ }
    }
    return await apiGet<T>(publicPath);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [n, e] = await Promise.all([
        getWithFallback<News[]>('/api/news/admin', '/api/news'),
        getWithFallback<Event[]>('/api/events/admin', '/api/events'),
      ]);
      const nn = (Array.isArray(n) ? n : []).map(normalizeNews);
      const ee = (Array.isArray(e) ? e : []).map(normalizeEvent);
      setNews(nn);
      setEvents(ee);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    const { token: t, user } = await apiPost<{ token: string; user: AuthUser }>(
      '/api/auth/login',
      { email, password }
    );
    setToken(t);
    setUser(user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
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
