// src/context/DataContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Event, News, AuthUser, HomePageContent, AboutPageContent, JoinUsPageContent } from '../types';
import { apiDelete, apiGet, apiPost, apiPut, apiGetPage, apiUpdatePage } from '../api/client';
import { toFileUrl, fixUploadsInHtml } from '../api/client';

type Member = {
  id: string | number;
  name: string;
  role: string;
  photoUrl: string;
  email?: string;
  linkedin?: string;
  instagram?: string;
  order?: number;
};

interface DataContextShape {
  events: Event[];
  news: News[];
  members: Member[];
  pastMembers: Member[];
  homePageContent: HomePageContent | null;
  aboutPageContent: AboutPageContent | null;
  joinUsPageContent: JoinUsPageContent | null;
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

  createMember: (payload: Partial<Member>) => Promise<Member>;
  updateMember: (id: string | number, payload: Partial<Member>) => Promise<Member>;
  deleteMember: (id: string | number) => Promise<void>;
  moveMemberToPast: (id: string | number) => Promise<void>;
  restorePastMember: (id: string | number) => Promise<void>;
  reorderMembers: (ids: Array<string | number>) => Promise<void>;

  updateHomePage: (content: HomePageContent) => Promise<void>;
  updateAboutPage: (content: AboutPageContent) => Promise<void>;
  updateJoinUsPage: (content: JoinUsPageContent) => Promise<void>;
}

const DataContext = createContext<DataContextShape | null>(null);

const eqId = (a: string | number, b: string | number) => String(a) === String(b);

function usePersistedToken() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (token) localStorage.setItem('auth_token', token);
      else localStorage.removeItem('auth_token');
    } catch {}
  }, [token]);
  return { token, setToken } as const;
}

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
function normalizeMember(m: any): Member {
  return {
    ...(m || {}),
    photoUrl: toFileUrl(m?.photoUrl) ?? m?.photoUrl,
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pastMembers, setPastMembers] = useState<Member[]>([]);
  const [homePageContent, setHomePageContent] = useState<HomePageContent | null>(null);
  const [aboutPageContent, setAboutPageContent] = useState<AboutPageContent | null>(null);
  const [joinUsPageContent, setJoinUsPageContent] = useState<JoinUsPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, setToken } = usePersistedToken();
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAuthenticated = Boolean(token);

  const getWithFallback = async <T,>(adminPath: string, publicPath: string): Promise<T> => {
    if (isAuthenticated && token) {
      try {
        return await apiGet<T>(adminPath, token);
      } catch {}
    }
    return await apiGet<T>(publicPath);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [n, e, m, pm, home, about, joinUs] = await Promise.all([
        getWithFallback<any[]>('/api/news/admin', '/api/news'),
        getWithFallback<any[]>('/api/events/admin', '/api/events'),
        getWithFallback<any[]>('/api/members/admin', '/api/members'),
        getWithFallback<any[]>('/api/members/past/admin', '/api/members/past'),
        apiGetPage<HomePageContent>('home').catch(() => null),
        apiGetPage<AboutPageContent>('about').catch(() => null),
        apiGetPage<JoinUsPageContent>('joinUs').catch(() => null),
      ]);

      const nn = (Array.isArray(n) ? n : [])
        .filter((x) => x && typeof x === 'object')
        .map(normalizeNews);

      const ee = (Array.isArray(e) ? e : [])
        .filter((x) => x && typeof x === 'object')
        .map(normalizeEvent);

      const mm = (Array.isArray(m) ? m : [])
        .filter((x) => x && typeof x === 'object')
        .map(normalizeMember)
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));

      const ppm = (Array.isArray(pm) ? pm : [])
        .filter((x) => x && typeof x === 'object')
        .map(normalizeMember);

      setNews(nn);
      setEvents(ee);
      setMembers(mm);
      setPastMembers(ppm);
      setHomePageContent(home);
      setAboutPageContent(about);
      setJoinUsPageContent(joinUs);
    } catch {
      setNews([]);
      setEvents([]);
      setMembers([]);
      setPastMembers([]);
      setHomePageContent(null);
      setAboutPageContent(null);
      setJoinUsPageContent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    const resp = await apiPost<{ token: string; user: AuthUser }>('/api/auth/login', {
      email,
      password,
    });
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
        next = next.map((e) =>
          eqId((e as any).id, (normalized as any).id)
            ? normalized
            : { ...(e as any), latest: false as any }
        );
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
        next = next.map((e) =>
          eqId((e as any).id, id) ? normalized : { ...(e as any), latest: false as any }
        );
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

  const createMember = async (payload: Partial<Member>) => {
    const created = await apiPost<Member>('/api/members', payload, token || undefined);
    const normalized = normalizeMember(created);
    setMembers((s) =>
      [...s, normalized].sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
    );
    return normalized;
  };
  const updateMember = async (id: string | number, payload: Partial<Member>) => {
    const updated = await apiPut<Member>(`/api/members/${id}`, payload, token || undefined);
    const normalized = normalizeMember(updated);
    setMembers((s) =>
      s
        .map((m) => (eqId(m.id as any, id as any) ? normalized : m))
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
    );
    return normalized;
  };
  const deleteMember = async (id: string | number) => {
    await apiDelete(`/api/members/${id}`, token || undefined);
    setMembers((s) => s.filter((m) => !eqId(m.id as any, id as any)));
  };
  const moveMemberToPast = async (id: string | number) => {
    await apiPost(`/api/members/${id}/move-to-past`, {}, token || undefined);
    await load();
  };
  const restorePastMember = async (id: string | number) => {
    await apiPost(`/api/past-members/${id}/restore`, {}, token || undefined);
    await load();
  };
  const reorderMembers = async (ids: Array<string | number>) => {
    await apiPost('/api/members/reorder', { ids }, token || undefined);
    await load();
  };

  const updateHomePage = async (content: HomePageContent) => {
    const updated = await apiUpdatePage('home', content, token || undefined);
    setHomePageContent(updated);
  };

  const updateAboutPage = async (content: AboutPageContent) => {
    const updated = await apiUpdatePage('about', content, token || undefined);
    setAboutPageContent(updated);
  };

  const updateJoinUsPage = async (content: JoinUsPageContent) => {
    const updated = await apiUpdatePage('joinUs', content, token || undefined);
    setJoinUsPageContent(updated);
  };

  const value = useMemo<DataContextShape>(
    () => ({
      events,
      news,
      members,
      pastMembers,
      homePageContent,
      aboutPageContent,
      joinUsPageContent,
      loading,
      isAuthenticated,
      token,
      user,
      login,
      logout,
      refresh: load,
      createEvent,
      updateEvent,
      deleteEvent,
      createNews,
      updateNews,
      deleteNews,
      createMember,
      updateMember,
      deleteMember,
      moveMemberToPast,
      restorePastMember,
      reorderMembers,
      updateHomePage,
      updateAboutPage,
      updateJoinUsPage,
    }),
    [
      events,
      news,
      members,
      pastMembers,
      homePageContent,
      aboutPageContent,
      joinUsPageContent,
      loading,
      isAuthenticated,
      token,
      user,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};