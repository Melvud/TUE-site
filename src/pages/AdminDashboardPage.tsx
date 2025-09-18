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
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from '../api/client';

type EventForm = {
  id?: string | number;
  title: string;
  // "YYYY-MM-DD" или "YYYY-MM-DD..YYYY-MM-DD"
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

// --- Members ---
type MemberForm = {
  id?: string | number;
  name: string;
  role: string;
  photoUrl: string;
  email?: string;
  linkedin?: string;
  instagram?: string;
  order?: number;
};

const idOf = (x: any) => x?.id ?? x?._id ?? x?.slug ?? null;
const sameId = (a: any, b: any) => {
  const A = idOf(a), B = idOf(b);
  return A != null && B != null && String(A) === String(B);
};

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
const EMPTY_MEMBER: MemberForm = {
  name: '',
  role: '',
  photoUrl: '',
  email: '',
  linkedin: '',
  instagram: '',
};

function splitDateRange(s?: string): { start: string; end: string } {
  const val = (s || '').trim();
  if (!val) return { start: '', end: '' };
  if (val.includes('..')) {
    const [a, b] = val.split('..').map((x) => x.trim());
    return { start: a || '', end: b || '' };
  }
  if (val.includes(' - ')) {
    const [a, b] = val.split(' - ').map((x) => x.trim());
    return { start: a || '', end: b || '' };
  }
  return { start: val, end: '' };
}

const AdminDashboardPage: React.FC = () => {
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  useEffect(() => { localStorage.setItem('token', token || ''); }, [token]);

  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [pastMembers, setPastMembers] = useState<any[]>([]);

  const [loading, setLoading] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const [ev, setEv] = useState<EventForm>(EMPTY_EVENT);
  const [nw, setNw] = useState<NewsForm>(EMPTY_NEWS);
  const [mb, setMb] = useState<MemberForm>(EMPTY_MEMBER);

  const [{ start: evStart, end: evEnd }, setEvRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const adminGet = async <T,>(adminPath: string, publicPath: string): Promise<T> => {
    if (token) {
      try { return await apiGet<T>(adminPath, token); }
      catch { /* fallback */ }
    }
    return await apiGet<T>(publicPath);
  };

  const loadAll = async () => {
    setLoading('loading');
    setError('');
    try {
      const [es, ns, ms, pms] = await Promise.all([
        apiGetEvents(),
        apiGetNews(),
        adminGet<any[]>('/api/members/admin', '/api/members'),
        adminGet<any[]>('/api/members/past/admin', '/api/members/past'),
      ]);
      setEvents(Array.isArray(es) ? es : []);
      setNews(Array.isArray(ns) ? ns : []);
      setMembers((Array.isArray(ms) ? ms : []).sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0)));
      setPastMembers(Array.isArray(pms) ? pms : []);
      setLoading('idle');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load data');
      setLoading('error');
    }
  };

  useEffect(() => { loadAll(); }, []);

  const setEvField = <K extends keyof EventForm>(k: K, v: EventForm[K]) =>
    setEv((p) => ({ ...p, [k]: v }));
  const setNwField = <K extends keyof NewsForm>(k: K, v: NewsForm[K]) =>
    setNw((p) => ({ ...p, [k]: v }));
  const setMbField = <K extends keyof MemberForm>(k: K, v: MemberForm[K]) =>
    setMb((p) => ({ ...p, [k]: v }));

  const resetEvent = () => { setEv(EMPTY_EVENT); setEvRange({ start: '', end: '' }); };
  const resetNews = () => setNw(EMPTY_NEWS);
  const resetMember = () => setMb(EMPTY_MEMBER);

  const saveEvent = async () => {
    const date = (evStart && evEnd && `${evStart}..${evEnd}`) || (evStart || '');
    const payload = { ...ev, date };
    try {
      if (payload.id != null) {
        const server = await apiUpdateEvent(payload.id, payload, token || undefined);
        setEvents((list) => list.map((it) => (sameId(it, payload) ? (server || { ...it, ...payload }) : it)));
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
        setNews((list) => list.map((it) => (sameId(it, payload) ? (server || { ...it, ...payload }) : it)));
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

  const removeEvent = async () => {
    const id = ev.id ?? idOf(ev);
    if (id == null) return;
    if (!confirm('Delete this event permanently?')) return;
    try {
      await apiDelete(`/api/events/${id}`, token || undefined);
      setEvents((list) => list.filter((it) => !sameId(it, ev)));
      resetEvent();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to delete event: ' + (e?.message || e));
    }
  };

  const removeNews = async () => {
    const id = nw.id ?? idOf(nw);
    if (id == null) return;
    if (!confirm('Delete this news item permanently?')) return;
    try {
      await apiDelete(`/api/news/${id}`, token || undefined);
      setNews((list) => list.filter((it) => !sameId(it, nw)));
      resetNews();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to delete news: ' + (e?.message || e));
    }
  };

  const editEvent = (it: any) => {
    const { start, end } = splitDateRange(it?.date);
    setEvRange({ start, end });
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
  };
  const editNews = (it: any) =>
    setNw({
      id: idOf(it) ?? undefined,
      title: it.title || '',
      coverUrl: it.coverUrl || '',
      summary: it.summary || '',
      content: it.content || '',
      published: !!it.published,
    });

  // --- Members CRUD ---
  const saveMember = async () => {
    if (!mb.name?.trim() || !mb.role?.trim() || !mb.photoUrl?.trim()) {
      alert('Name, Role and Photo are required');
      return;
    }
    const payload = { ...mb };
    try {
      let server;
      if (payload.id != null) {
        server = await apiPut(`/api/members/${payload.id}`, payload, token || undefined);
        setMembers((list) => list.map((it) => (sameId(it, payload) ? (server || { ...it, ...payload }) : it)));
      } else {
        server = await apiPost('/api/members', payload, token || undefined);
        setMembers((list) => (server ? [...list, server] : [...list, payload]));
      }
      resetMember();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to save member: ' + (e?.message || e));
    }
  };

  const editMember = (it: any) => {
    setMb({
      id: idOf(it) ?? undefined,
      name: it.name || '',
      role: it.role || '',
      photoUrl: it.photoUrl || it.image || '',
      email: it.email || '',
      linkedin: it.linkedin || '',
      instagram: it.instagram || '',
      order: it.order,
    });
  };

  const deleteMember = async (it?: any) => {
    const id = idOf(it ?? mb);
    if (id == null) return;
    if (!confirm('Delete this member permanently?')) return;
    try {
      await apiDelete(`/api/members/${id}`, token || undefined);
      setMembers((list) => list.filter((x) => !sameId(x, it ?? mb)));
      if (!it) resetMember();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to delete member: ' + (e?.message || e));
    }
  };

  const moveToPast = async (it?: any) => {
    const id = idOf(it ?? mb);
    if (id == null) return;
    try {
      await apiPost(`/api/members/${id}/move-to-past`, {}, token || undefined);
      await loadAll();
      if (!it) resetMember();
    } catch (e: any) {
      console.error(e);
      alert('Failed to move member to past: ' + (e?.message || e));
    }
  };

  const restoreFromPast = async (id: string | number) => {
    try {
      await apiPost(`/api/past-members/${id}/restore`, {}, token || undefined);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to restore member: ' + (e?.message || e));
    }
  };

  const deletePast = async (id: string | number) => {
    if (!confirm('Delete this past member permanently?')) return;
    try {
      await apiDelete(`/api/past-members/${id}`, token || undefined);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to delete past member: ' + (e?.message || e));
    }
  };

  // --- Reorder (drag & drop) ---
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const startDrag = (idx: number) => (e: React.DragEvent) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
  const overDrag = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const dropDrag = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx == null || dragIdx === idx) return;
    setMembers((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragIdx, 1);
      next.splice(idx, 0, item);
      return next;
    });
    setDragIdx(null);
  };
  const applyOrder = async () => {
    try {
      const ids = members.map((m) => idOf(m));
      await apiPost('/api/members/reorder', { ids }, token || undefined);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      alert('Failed to save order: ' + (e?.message || e));
    }
  };

  const fmtDate = (d?: string) => {
    if (!d) return '';
    const { start, end } = splitDateRange(d);
    const toIso = (s: string) => {
      const dd = new Date(s); return isNaN(+dd) ? String(s) : dd.toISOString().slice(0, 10);
    };
    return end ? `${toIso(start)}..${toIso(end)}` : toIso(start);
  };

  const [searchEv, setSearchEv] = useState('');
  const [searchNews, setSearchNews] = useState('');
  const [searchMembers, setSearchMembers] = useState('');
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
  const filteredMembers = useMemo(() => {
    const q = searchMembers.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m?.name || '').toLowerCase().includes(q) || (m?.role || '').toLowerCase().includes(q));
  }, [members, searchMembers]);

  // --- tabs ---
  const [tab, setTab] = useState<'events' | 'news' | 'members'>('events');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage events, news & members</p>
        </div>
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
          Failed to load: {error}. Make sure the backend is available at <code>/api</code>.
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-700">
        <nav className="flex gap-2">
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${tab === 'events' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setTab('events')}
          >
            Events
          </button>
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${tab === 'news' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setTab('news')}
          >
            News
          </button>
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${tab === 'members' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setTab('members')}
          >
            Members
          </button>
        </nav>
      </div>

      {/* Content */}
      {tab === 'events' ? (
        // ==== EVENTS TAB (как было) ====
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                <h2 className="text-xl font-bold mb-4">Event editor</h2>

                <label className="block text-sm mb-1 text-slate-300">Title</label>
                <input
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 mb-3"
                  placeholder="Title"
                  value={ev.title}
                  onChange={(e) => setEvField('title', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-slate-300">Start date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                      value={evStart}
                      onChange={(e) => setEvRange((p) => ({ ...p, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-slate-300">End date (optional)</label>
                    <input
                      type="date"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                      value={evEnd}
                      onChange={(e) => setEvRange((p) => ({ ...p, end: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Leave <em>End date</em> empty for a single-day event. Saved as <code>YYYY-MM-DD</code> or <code>YYYY-MM-DD..YYYY-MM-DD</code>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="w-full">
                    <ImageUploader
                      value={ev.coverUrl || ''}
                      onChange={(url) => setEvField('coverUrl', url || '')}
                      token={token}
                      label="Cover image"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm mb-1 text-slate-300">Google Form URL (Register)</label>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                      placeholder="https://forms.google.com/..."
                      value={ev.googleFormUrl || ''}
                      onChange={(e) => setEvField('googleFormUrl', e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Shown as “Register” button on event page</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm mb-1 text-slate-300">Short description</label>
                  <textarea
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                    placeholder="One or two sentences…"
                    rows={3}
                    value={ev.summary || ''}
                    onChange={(e) => setEvField('summary', e.target.value)}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm mb-2">Content</label>
                  <RichTextEditor
                    value={ev.content}
                    onChange={(html) => setEvField('content', html)}
                    token={token}
                    placeholder="Full event content…"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
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

                <div className="flex flex-wrap gap-3 mt-4">
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
                  {ev.id != null && (
                    <button
                      type="button"
                      className="rounded-lg bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-500"
                      onClick={removeEvent}
                    >
                      Delete event
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right column — list (sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-lg font-semibold">Existing events</h3>
                  <input
                    value={searchEv}
                    onChange={(e) => setSearchEv(e.target.value)}
                    placeholder="Search…"
                    className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
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
          </div>
        </section>
      ) : tab === 'news' ? (
        // ==== NEWS TAB (как было) ====
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                <h2 className="text-xl font-bold mb-4">News editor</h2>

                <label className="block text-sm mb-1 text-slate-300">Title</label>
                <input
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 mb-3"
                  placeholder="Title"
                  value={nw.title}
                  onChange={(e) => setNwField('title', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="w-full">
                    <ImageUploader
                      value={nw.coverUrl || ''}
                      onChange={(url) => setNwField('coverUrl', url || '')}
                      token={token}
                      label="Cover image"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm mb-1 text-slate-300">Short description</label>
                    <textarea
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                      placeholder="One or two sentences…"
                      rows={6}
                      value={nw.summary || ''}
                      onChange={(e) => setNwField('summary', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm mb-2">Content</label>
                  <RichTextEditor
                    value={nw.content}
                    onChange={(html) => setNwField('content', html)}
                    token={token}
                    placeholder="Full news content…"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
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

                <div className="flex flex-wrap gap-3 mt-4">
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
                  {nw.id != null && (
                    <button
                      type="button"
                      className="rounded-lg bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-500"
                      onClick={removeNews}
                    >
                      Delete news
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right column — list (sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-lg font-semibold">Existing news</h3>
                  <input
                    value={searchNews}
                    onChange={(e) => setSearchNews(e.target.value)}
                    placeholder="Search…"
                    className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
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
          </div>
        </section>
      ) : (
        // ==== MEMBERS TAB (новый) ====
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                <h2 className="text-xl font-bold mb-4">Members editor</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-slate-300">Name *</label>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                      placeholder="Full name"
                      value={mb.name}
                      onChange={(e) => setMbField('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-slate-300">Role / Position *</label>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                      placeholder="President, Treasurer, ..."
                      value={mb.role}
                      onChange={(e) => setMbField('role', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="w-full">
                    <ImageUploader
                      value={mb.photoUrl || ''}
                      onChange={(url) => setMbField('photoUrl', url || '')}
                      token={token}
                      label="Photo *"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1 text-slate-300">Email (link)</label>
                      <input
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                        placeholder="mailto:example@domain.com"
                        value={mb.email || ''}
                        onChange={(e) => setMbField('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-slate-300">LinkedIn</label>
                      <input
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                        placeholder="https://www.linkedin.com/in/username"
                        value={mb.linkedin || ''}
                        onChange={(e) => setMbField('linkedin', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-slate-300">Instagram</label>
                      <input
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                        placeholder="https://www.instagram.com/username"
                        value={mb.instagram || ''}
                        onChange={(e) => setMbField('instagram', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    type="button"
                    className="rounded-lg bg-cyan-600 px-5 py-2 font-semibold text-white hover:bg-cyan-500"
                    onClick={saveMember}
                  >
                    {mb.id ? 'Update member' : 'Create member'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 px-5 py-2 hover:bg-slate-800"
                    onClick={resetMember}
                  >
                    Reset
                  </button>
                  {mb.id != null && (
                    <>
                      <button
                        type="button"
                        className="rounded-lg bg-amber-600 px-5 py-2 font-semibold text-white hover:bg-amber-500"
                        onClick={() => moveToPast()}
                      >
                        Move to Past
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-500"
                        onClick={() => deleteMember()}
                      >
                        Delete member
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right column — CURRENT: длинные карточки + d&d */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold">Current members</h3>
                    <input
                      value={searchMembers}
                      onChange={(e) => setSearchMembers(e.target.value)}
                      placeholder="Search…"
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
                    />
                  </div>

                  <div className="space-y-2 max-h-[58vh] overflow-auto pr-1">
                    {filteredMembers.length === 0 && (
                      <div className="text-sm text-slate-400">
                        {loading === 'loading'
                          ? 'Loading…'
                          : 'No members yet. Create the first one.'}
                      </div>
                    )}

                    {filteredMembers.map((m, idx) => (
                      <div
                        key={String(idOf(m) ?? m.name)}
                        className="group rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-3 hover:bg-slate-800 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={startDrag(idx)}
                        onDragOver={overDrag}
                        onDrop={dropDrag(idx)}
                        title="Drag to reorder"
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-1 text-slate-400 w-6 text-right select-none">{idx + 1}.</div>
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-14 h-14 rounded-lg object-cover border border-slate-700" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-slate-700 grid place-items-center text-slate-300">N/A</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">{m.name}</div>
                            <div className="text-xs text-slate-400">{m.role}</div>
                            <ul className="mt-2 text-sm space-y-1">
                              {m.email && <li className="truncate">Email: <a className="text-cyan-400 hover:text-cyan-300" href={m.email} target="_blank" rel="noreferrer">{m.email}</a></li>}
                              {m.linkedin && <li className="truncate">LinkedIn: <a className="text-cyan-400 hover:text-cyan-300" href={m.linkedin} target="_blank" rel="noreferrer">{m.linkedin}</a></li>}
                              {m.instagram && <li className="truncate">Instagram: <a className="text-cyan-400 hover:text-cyan-300" href={m.instagram} target="_blank" rel="noreferrer">{m.instagram}</a></li>}
                            </ul>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-slate-600 px-2 py-1 text-xs hover:bg-slate-700"
                              onClick={() => editMember(m)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-amber-600 text-amber-300 px-2 py-1 text-xs hover:bg-amber-700/20"
                              onClick={() => moveToPast(m)}
                            >
                              To Past
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-rose-600 text-rose-300 px-2 py-1 text-xs hover:bg-rose-700/20"
                              onClick={() => deleteMember(m)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
                      onClick={applyOrder}
                    >
                      Apply order
                    </button>
                  </div>
                </div>

                {/* PAST members */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Past members</h3>
                  <div className="space-y-2 max-h-[40vh] overflow-auto pr-1">
                    {pastMembers.length === 0 && (
                      <div className="text-sm text-slate-400">Empty</div>
                    )}
                    {pastMembers.map((pm) => (
                      <div
                        key={String(idOf(pm) ?? pm.name)}
                        className="rounded-xl bg-slate-800/40 border border-slate-700 px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          {pm.photoUrl ? (
                            <img src={pm.photoUrl} alt={pm.name} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-700 grid place-items-center text-slate-300">N/A</div>
                          )}
                          <div className="font-semibold">{pm.name}</div>
                          <div className="ml-auto flex gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-cyan-600 text-cyan-300 px-2 py-1 text-xs hover:bg-cyan-700/20"
                              onClick={() => restoreFromPast(idOf(pm))}
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-rose-600 text-rose-300 px-2 py-1 text-xs hover:bg-rose-700/20"
                              onClick={() => deletePast(idOf(pm))}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboardPage;
