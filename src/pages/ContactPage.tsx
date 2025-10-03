// src/pages/ContactPage.tsx
import React from 'react';
import Section from '../components/Section';
import { apiPost } from '../api/client';

const ContactPage: React.FC = () => {
  const [sent, setSent] = React.useState<null | 'ok' | string>(null);
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setSent(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await apiPost('/api/forms/submit', {
        subject: 'Contact form',
        type: 'contact',
        ...data,
      });
      setSent('ok');
      form.reset();
    } catch (err: any) {
      setSent(err?.message ?? 'Failed to send');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white">
      <div className="pt-28 pb-10 text-center">
        <h1 className="text-4xl font-extrabold">Contact Us</h1>
        <p className="text-slate-300 mt-2">We usually reply within 1–2 days.</p>
      </div>

      <Section>
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input name="name" required className="w-full bg-slate-800 p-3 rounded" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input name="email" type="email" required className="w-full bg-slate-800 p-3 rounded" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Message</label>
            <textarea name="message" rows={6} required className="w-full bg-slate-800 p-3 rounded" />
          </div>
          <button
            disabled={busy}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-white font-bold py-3 px-6 rounded"
          >
            {busy ? 'Sending…' : 'Send message'}
          </button>
          {sent && (
            <p className={`text-sm ${sent === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {sent === 'ok' ? 'Message sent!' : sent}
            </p>
          )}
        </form>
      </Section>
    </div>
  );
};

export default ContactPage;
