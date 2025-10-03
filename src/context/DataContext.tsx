// src/context/DataContext.tsx
import React from 'react';
import { apiGet, mediaUrl } from '../api/client';
import type {
  Event,
  News,
  TeamMember,
  HomePageContent,
  AboutPageContent,
  JoinUsPageContent,
} from '../types';

type DataContextType = {
  loading: boolean;
  events: Event[];
  news: News[];
  members: TeamMember[];
  pastMembers: TeamMember[];
  homePageContent: HomePageContent | null;
  aboutPageContent: AboutPageContent | null;
  joinUsPageContent: JoinUsPageContent | null;
  reload: () => Promise<void>;
};

const DataContext = React.createContext<DataContextType>({
  loading: true,
  events: [],
  news: [],
  members: [],
  pastMembers: [],
  homePageContent: null,
  aboutPageContent: null,
  joinUsPageContent: null,
  reload: async () => {},
});

export const useData = () => React.useContext(DataContext);

function usePreviewFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const p = new URLSearchParams(window.location.search);
  return p.get('preview') === '1';
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = React.useState(true);

  const [events, setEvents] = React.useState<Event[]>([]);
  const [news, setNews] = React.useState<News[]>([]);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [pastMembers, setPastMembers] = React.useState<TeamMember[]>([]);
  const [homePageContent, setHome] = React.useState<HomePageContent | null>(null);
  const [aboutPageContent, setAbout] = React.useState<AboutPageContent | null>(null);
  const [joinUsPageContent, setJoin] = React.useState<JoinUsPageContent | null>(null);

  const draft = usePreviewFlag();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // ===== Globals =====
      const home = await apiGet<any>('/api/globals/home', undefined, draft).catch(() => null);
      const about = await apiGet<any>('/api/globals/about', undefined, draft).catch(() => null);
      const join = await apiGet<any>('/api/globals/join', undefined, draft).catch(() => null);

      setHome(
        home
          ? {
              typedPhrases: Array.isArray(home.typedPhrases)
                ? home.typedPhrases
                : (home.typedPhrases?.map?.((x: any) => x?.value) ?? []),
              heroImage: mediaUrl(home?.hero?.image) || home?.heroImage || '',
            }
          : { typedPhrases: [], heroImage: '' }
      );

      setAbout(
        about
          ? {
              sections: Array.isArray(about.sections)
                ? about.sections.map((s: any) => ({
                    id: s.id || cryptoRandom(),
                    type: s.layout || s.type || 'text-image',
                    title: s.title || '',
                    text: s.text || '',
                    image: mediaUrl(s.image) || s.image || '',
                  }))
                : [],
            }
          : { sections: [] }
      );

      setJoin(
        join
          ? {
              introText: join.introText || '',
              detailsHtml: join.detailsHtml || '',
              formFields: Array.isArray(join.formFields)
                ? join.formFields.map((f: any) => ({
                    id: f.id || cryptoRandom(),
                    name: f.name,
                    label: f.label,
                    type: f.type,
                    required: !!f.required,
                    placeholder: f.placeholder,
                    options: Array.isArray(f.options) ? f.options.map((o: any) => (typeof o === 'string' ? o : o?.value)) : undefined,
                  }))
                : [],
            }
          : { introText: '', detailsHtml: '', formFields: [] }
      );

      // ===== Collections =====
      // EVENTS
      const eventsRes = await apiGet<any>('/api/events', { limit: 100, sort: '-createdAt' }, draft);
      const eventsDocs = Array.isArray(eventsRes?.docs) ? eventsRes.docs : Array.isArray(eventsRes) ? eventsRes : [];
      setEvents(
        eventsDocs.map((e: any) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          date: e.date,
          coverUrl: mediaUrl(e.cover) || e.coverUrl || e.image || '',
          googleFormUrl: e.googleFormUrl,
          summary: e.summary,
          content: e.content || '',
          published: !!e.published,
          latest: !!e.latest,
          publishAt: e.publishAt || null,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        }))
      );

      // NEWS
      const newsRes = await apiGet<any>('/api/news', { limit: 100, sort: '-createdAt' }, draft);
      const newsDocs = Array.isArray(newsRes?.docs) ? newsRes.docs : Array.isArray(newsRes) ? newsRes : [];
      setNews(
        newsDocs.map((n: any) => ({
          id: n.id,
          slug: n.slug,
          title: n.title,
          date: n.date,
          author: n.author,
          coverUrl: mediaUrl(n.cover) || n.coverUrl || n.image || '',
          image: mediaUrl(n.cover) || n.coverUrl || n.image || '',
          summary: n.summary,
          snippet: n.snippet || n.summary,
          content: n.content || '',
          published: !!n.published,
          publishAt: n.publishAt || null,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        }))
      );

      // MEMBERS
      const membersRes = await apiGet<any>('/api/members', { limit: 200, sort: 'order' }, draft);
      const membersDocs = Array.isArray(membersRes?.docs) ? membersRes.docs : Array.isArray(membersRes) ? membersRes : [];
      setMembers(
        membersDocs.map((m: any) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          photoUrl: mediaUrl(m.photo) || m.photoUrl || m.image || '',
          email: m.email,
          linkedin: m.linkedin,
          instagram: m.instagram,
          order: m.order ?? 0,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }))
      );

      // PAST MEMBERS — доступ закрыт публично в конфиге, поэтому просто пробуем и молча игнорируем 403
      try {
        const pastRes = await apiGet<any>('/api/membersPast', { limit: 200, sort: '-createdAt' }, draft);
        const pastDocs = Array.isArray(pastRes?.docs) ? pastRes.docs : Array.isArray(pastRes) ? pastRes : [];
        setPastMembers(
          pastDocs.map((m: any) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            photoUrl: mediaUrl(m.photo) || m.photoUrl || m.image || '',
          }))
        );
      } catch {
        setPastMembers([]); // нет прав — не проблема, страница обойдётся без этого списка
      }
    } finally {
      setLoading(false);
    }
  }, [draft]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <DataContext.Provider
      value={{
        loading,
        events,
        news,
        members,
        pastMembers,
        homePageContent,
        aboutPageContent,
        joinUsPageContent,
        reload: load,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Простой генератор id для форм/секций
function cryptoRandom() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
