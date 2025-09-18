// src/pages/AdminDashboardPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import ImageUploader from '../components/ImageUploader';
import {
  apiGetEvents,
  apiCreateEvent,
  apiUpdateEvent,
  apiGetNews,
  apiCreateNews,
  apiUpdateNews,
} from '../api/client';

// ===== Типы формы (без расписания публикации) =====
type EventForm = {
  id?: string | number;
  title: string;
  date?: string;
  coverUrl?: string | null;
  googleFormUrl?: string;
  summary?: string;
  content: string;
  published: boolean;
  latest: boolean;
};

type NewsForm = {
  id?: string | number;
  title: string;
  coverUrl?: string | null;
  summary?: string;
  content: string;
  published: boolean;
};

// ===== Утилиты для id/сравнения =====
const idOf = (x: any) => x?.id ?? x?._id ?? x?.slug ?? null;
const sameId = (a: any, b: any) => {
  const A = idOf(a), B = idOf(b);
  return A != null && B != null && String(A) === String(B);
};

// ===== Пустые формы =====
const EMPTY_EVENT: EventForm = {
  title: '',
  date: '',
  coverUrl: '',
  googleFormUrl: '',
  summary: '',
  content: '',
  published: false,
  latest: false,
};
const EMPTY_NEWS: NewsForm = {
  title: '',
  coverUrl: '',
  summary: '',
  content: '',
  published: false,
};

const AdminDashboardPage: React.FC = () => {
  // ======= Токен администратора =======
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  useEffect(() => {
    localStorage.setItem('token', token || '');
  }, [token]);

  // ======= Списки и статусы =======
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  // ======= Формы =======
  const [ev, setEv] = useState<EventForm>(EMPTY_EVENT);
  const [nw, setNw] = useState<NewsForm>(EMPTY_NEWS);

  // ======= Загрузка данных из /api (db.json) =======
  const loadAll = async () => {
    setLoading('loading');
    setError('');
    try {
      const [es, ns] = await Promise.all([apiGetEvents(), apiGetNews()]);
      setEvents(Array.isArray(es) ? es : []);
      setNews(Array.isArray(ns) ? ns : []);
      setLoading('idle');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load data');
      setLoading('error');
    }
  };

  useEffect(() => {
    loadAll();
  }, []); // одна загрузка при входе на страницу

  // ======= Сеттеры полей =======
  const setEvField = <K extends keyof EventForm>(k: K, v: EventForm[K]) =>
    setEv((p) => ({ ...p, [k]: v }));
  const setNwField = <K extends keyof NewsForm>(k: K, v: NewsForm[K]) =>
    setNw((p) => ({ ...p, [k]: v }));

  const resetEvent = () => setEv(EMPTY_EVENT);
  const resetNews = () => setNw(EMPTY_NEWS);

  // ======= Сохранение/обновление =======
  const saveEvent = async () => {
    const payload = { ...ev };
    try {
      if (payload.id != null) {
        const server = await apiUpdateEvent(payload.id, payload, token || undefined);
        setEvents((list) =>
          list.map((it) => (sameId(it, payload) ? (server || { ...it, ...payload }) : it))
        );
      } else {
        const created = await apiCreateEvent(payload, token || undefined);
        setEvents((list) => (created ? [created, ...list] : [payload, ...list]));
      }
      resetEvent();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to save event: ' + (e?.message || e));
    }
  };

  const saveNews = async () => {
    const payload = { ...nw };
    try {
      if (payload.id != null) {
        const server = await apiUpdateNews(payload.id, payload, token || undefined);
        setNews((list) =>
          list.map((it) => (sameId(it, payload) ? (server || { ...it, ...payload }) : it))
        );
      } else {
        const created = await apiCreateNews(payload, token || undefined);
        setNews((list) => (created ? [created, ...list] : [payload, ...list]));
      }
      resetNews();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to save news: ' + (e?.message || e));
    }
  };

  // ======= Заполнение формы для редактирования =======
  const editEvent = (it: any) =>
    setEv({
      id: idOf(it) ?? undefined,
      title: it.title || '',
      date: it.date || '',
      coverUrl: it.coverUrl || it.image || '',
      googleFormUrl: it.googleFormUrl || '',
      summary: it.summary || it.description || '',
      content: it.content || '',
      published: !!it.published,
      latest: !!it.latest,
    });

  const editNews = (it: any) =>
    setNw({
      id: idOf(it) ?? undefined,
      title: it.title || '',
      coverUrl: it.coverUrl || '',
      summary: it.summary || '',
      content: it.content || '',
      published: !!it.published,
    });

  // ======= Удобный вывод даты в списках =======
  const fmtDate = (d?: string) => {
    if (!d) return '';
    const dd = new Date(d);
    return isNaN(+dd) ? String(d) : dd.toISOString().slice(0, 10);
    };

  // ======= Фильтры/поиск =======
  const [searchEv, setSearchEv] = useState('');
  const [searchNews, setSearchNews] = useState('');
  const filteredEvents = useMemo(() => {
    const q = searchEv.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => (e?.title || '').toLowerCase().includes(q));
  }, [events, searchEv]);
  const filteredNews = useMemo(() => {
    const q = searchNews.trim().toLowerCase();
    if (!q) return news;
    return news.filter((n) => (n?.title || '').toLowerCase().includes(q));
  }, [news, searchNews]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token (Bearer)"
            className="min-w-[260px] rounded-md bg-slate-800 border border-slate-700 px-3 py-2"
          />
          <button
            type="button"
            onClick={loadAll}
            className="rounded-md border border-slate-600 px-4 py-2 hover:bg-slate-800"
            title="Reload data from server"
          >
            Reload
          </button>
        </div>
      </div>

      {loading === 'loading' && (
        <div className="mb-6 text-slate-400">Loading data…</div>
      )}
      {loading === 'error' && (
        <div className="mb-6 text-rose-400">
          Failed to load: {error}. Проверь, что бэкенд запущен на /api и proxy Vite настроен.
        </div>
      )}

      {/* ====== EVENT FORM ====== */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Event editor</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ====== Левая часть — форма ====== */}
          <div className="lg:col-span-2 space-y-4">
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="Title"
              value={ev.title}
              onChange={(e) => setEvField('title', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="date"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                value={ev.date || ''}
                onChange={(e) => setEvField('date', e.target.value)}
              />

              {/* ☑️ Загрузка обложки (выбор файла или перетаскивание) */}
              <div className="w-full">
                <ImageUploader
                  value={ev.coverUrl || ''}
                  onChange={(url) => setEvField('coverUrl', url || '')}
                  token={token}
                  label="Cover image"
                />
              </div>
            </div>

            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="Google Form URL (for Register button)"
              value={ev.googleFormUrl || ''}
              onChange={(e) => setEvField('googleFormUrl', e.target.value)}
            />

            <textarea
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="Short description"
              rows={3}
              value={ev.summary || ''}
              onChange={(e) => setEvField('summary', e.target.value)}
            />

            <div>
              <label className="block text-sm mb-2">Content</label>
              <RichTextEditor
                value={ev.content}
                onChange={(html) => setEvField('content', html)}
                token={token}
                placeholder="Full event content…"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-cyan-500"
                  checked={ev.published}
                  onChange={(e) => setEvField('published', e.target.checked)}
                />
                <span>Published</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-cyan-500"
                  checked={ev.latest}
                  onChange={(e) => setEvField('latest', e.target.checked)}
                />
                <span>Featured (latest)</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg bg-cyan-600 px-5 py-2 font-semibold text-white hover:bg-cyan-500"
                onClick={saveEvent}
              >
                {ev.id ? 'Update event' : 'Create event'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-600 px-5 py-2 hover:bg-slate-800"
                onClick={resetEvent}
              >
                Reset
              </button>
            </div>
          </div>

          {/* ====== Правая часть — список существующих ====== */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold">Existing events</h3>
              <input
                value={searchEv}
                onChange={(e) => setSearchEv(e.target.value)}
                placeholder="Search…"
                className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-auto pr-1">
              {filteredEvents.length === 0 && (
                <div className="text-sm text-slate-400">
                  {loading === 'loading'
                    ? 'Loading…'
                    : 'No events found. Create a new one or press Reload.'}
                </div>
              )}
              {filteredEvents.map((it) => (
                <button
                  key={String(idOf(it) ?? it.title)}
                  className="w-full text-left rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 hover:bg-slate-800"
                  onClick={() => editEvent(it)}
                  title="Click to edit"
                >
                  <div className="text-sm text-slate-400">{fmtDate(it.date)}</div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-xs text-slate-400">
                    {it.published ? 'published' : 'draft'}
                    {it.latest ? ' • latest' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== NEWS FORM ====== */}
      <section>
        <h2 className="text-2xl font-bold mb-4">News editor</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Форма */}
          <div className="lg:col-span-2 space-y-4">
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="Title"
              value={nw.title}
              onChange={(e) => setNwField('title', e.target.value)}
            />

            {/* Картинка + краткое описание в 2 колонки */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <ImageUploader
                  value={nw.coverUrl || ''}
                  onChange={(url) => setNwField('coverUrl', url || '')}
                  token={token}
                  label="Cover image"
                />
              </div>
              <textarea
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                placeholder="Short description"
                rows={6}
                value={nw.summary || ''}
                onChange={(e) => setNwField('summary', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Content</label>
              <RichTextEditor
                value={nw.content}
                onChange={(html) => setNwField('content', html)}
                token={token}
                placeholder="Full news content…"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-cyan-500"
                  checked={nw.published}
                  onChange={(e) => setNwField('published', e.target.checked)}
                />
                <span>Published</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg bg-cyan-600 px-5 py-2 font-semibold text-white hover:bg-cyan-500"
                onClick={saveNews}
              >
                {nw.id ? 'Update news' : 'Create news'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-600 px-5 py-2 hover:bg-slate-800"
                onClick={resetNews}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Список */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold">Existing news</h3>
              <input
                value={searchNews}
                onChange={(e) => setSearchNews(e.target.value)}
                placeholder="Search…"
                className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-auto pr-1">
              {filteredNews.length === 0 && (
                <div className="text-sm text-slate-400">
                  {loading === 'loading'
                    ? 'Loading…'
                    : 'No news found. Create a new one or press Reload.'}
                </div>
              )}
              {filteredNews.map((it) => (
                <button
                  key={String(idOf(it) ?? it.title)}
                  className="w-full text-left rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 hover:bg-slate-800"
                  onClick={() => editNews(it)}
                  title="Click to edit"
                >
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-xs text-slate-400">
                    {it.published ? 'published' : 'draft'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
