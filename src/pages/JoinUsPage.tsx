// src/pages/JoinUsPage.tsx
import React from 'react';
import Section from '../components/Section';
import { apiPost } from '../api/client';

const JoinUsPage: React.FC = () => {
  const [sent, setSent] = React.useState<null | 'ok' | string>(null);
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setSent(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await apiPost('/api/members', data);
      setSent('ok');
      form.reset();
    } catch (err: any) {
      setSent(err?.message ?? 'Failed to submit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white">
      <div className="pt-28 pb-10 text-center">
        <h1 className="text-4xl font-extrabold">Join Us</h1>
        <p className="text-slate-300 mt-2">Apply to become a member.</p>
      </div>

      <Section>
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Full name</label>
            <input name="name" required className="w-full bg-slate-800 p-3 rounded" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input name="email" type="email" required className="w-full bg-slate-800 p-3 rounded" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Level</label>
            <input name="level" placeholder="e.g. Undergraduate" className="w-full bg-slate-800 p-3 rounded" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Department</label>
            <input name="department" className="w-full bg-slate-800 p-3 rounded" />
          </div>

          <button
            disabled={busy}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-white font-bold py-3 px-6 rounded"
          >
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
          {sent && (
            <p className={`text-sm ${sent === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {sent === 'ok' ? 'Application sent!' : sent}
            </p>
          )}
        </form>
      </Section>
    </div>
  );
};

export default JoinUsPage;
