// src/context/DataContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Event, News, AuthUser } from '../types';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';

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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, setToken } = usePersistedToken();
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAuthenticated = Boolean(token);

  const load = async () => {
    setLoading(true);
    try {
      const newsPath = isAuthenticated ? '/api/news/admin' : '/api/news';
      const eventsPath = isAuthenticated ? '/api/events/admin' : '/api/events';
      const [n, e] = await Promise.all([
        apiGet<News[]>(newsPath, token),
        apiGet<Event[]>(eventsPath, token),
      ]);
      setNews(Array.isArray(n) ? n : []);
      setEvents(Array.isArray(e) ? e : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

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
    const created = await apiPost<Event>('/api/events', payload, token);
    setEvents((s) => [created, ...s]);
    return created;
  };
  const updateEvent = async (id: string, payload: Partial<Event>) => {
    const updated = await apiPut<Event>(`/api/events/${id}`, payload, token);
    setEvents((s) => s.map((e) => (e.id === id ? updated : e)));
    return updated;
  };
  const deleteEvent = async (id: string) => {
    await apiDelete(`/api/events/${id}`, token);
    setEvents((s) => s.filter((e) => e.id !== id));
  };

  const createNews = async (payload: Partial<News>) => {
    const created = await apiPost<News>('/api/news', payload, token);
    setNews((s) => [created, ...s]);
    return created;
  };
  const updateNews = async (id: string, payload: Partial<News>) => {
    const updated = await apiPut<News>(`/api/news/${id}`, payload, token);
    setNews((s) => s.map((n) => (n.id === id ? updated : n)));
    return updated;
  };
  const deleteNews = async (id: string) => {
    await apiDelete(`/api/news/${id}`, token);
    setNews((s) => s.filter((n) => n.id !== id));
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
