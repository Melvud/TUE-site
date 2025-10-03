// src/pages/JoinUsPage.tsx
import React from 'react';
import Section from '../components/Section';
import { apiPost } from '../api/client';
import { useData } from '../context/DataContext';

const JoinUsPage: React.FC = () => {
  const { joinUsPageContent } = useData();
  const [sent, setSent] = React.useState<null | 'ok' | string>(null);
  const [busy, setBusy] = React.useState(false);

  const introText =
    joinUsPageContent?.introText ||
    '<h2>Join the Photonics Society Eindhoven (PhE)</h2><p>Apply to become a member.</p>';
  const formFields = joinUsPageContent?.formFields || [];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setSent(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await apiPost('/api/join', data);
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
      </div>

      <Section>
        <div className="max-w-4xl mx-auto">
          <div
            className="prose prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: introText }}
          />

          <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-6">
            {formFields.map((field) => {
              if (field.type === 'textarea') {
                return (
                  <div key={field.id}>
                    <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
                    <textarea
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full bg-slate-800 p-3 rounded"
                      rows={4}
                    />
                  </div>
                );
              }

              if (field.type === 'select' && field.options) {
                return (
                  <div key={field.id}>
                    <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
                    <select
                      name={field.name}
                      required={field.required}
                      className="w-full bg-slate-800 p-3 rounded"
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={field.id}>
                  <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
                  <input
                    name={field.name}
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-800 p-3 rounded"
                  />
                </div>
              );
            })}

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
        </div>
      </Section>
    </div>
  );
};

export default JoinUsPage;