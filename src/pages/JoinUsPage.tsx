// src/pages/JoinUsPage.tsx
import React from 'react';
import Section from '../components/Section';
import { apiPost } from '../api/client';
import { useData } from '../context/DataContext';

const DEFAULT_DETAILS_HTML = `
  <h2>Join the Photonics Society Eindhoven (PhE)</h2>
  <p><strong>Quick sign-up:</strong> Use our Telegram bot for one-click registration—fill a short form and we’ll approve it in 1–2 days. You don’t need Optica membership to join PhE; you can always add it later for extra benefits. We’re an Optica Student Chapter but open to all optics enthusiasts. As a member, you’ll get early/priority access to event registrations. This year we’re also launching a members-only Telegram space with a random-coffee bot, mentorship program, and our community ecosystem (news, chat, networking) before anywhere else.</p>

  <h3>1) PhE Member (open to all optics enthusiasts)</h3>
  <p><em>No student status required.</em></p>
  <p><strong>Perks you get:</strong></p>
  <ul>
    <li>Priority access to event registrations</li>
    <li>Invite to our closed Telegram (random-coffee, mentorship, news &amp; networking)</li>
    <li>First to hear about collabs, site visits, and workshops</li>
  </ul>

  <h3>2) Optica Student Member (students &amp; PhDs)</h3>
  <p>If you’re a student (incl. PhD), we recommend also becoming an Optica (optica.org) student member:</p>
  <ul>
    <li><strong>Cost:</strong> $22/year (often reimbursable—ask your supervisor/department)</li>
    <li>After joining Optica, list <em>Photonics Society Eindhoven</em> as your Student Chapter</li>
  </ul>

  <p><strong>Why add Optica student membership?</strong></p>
  <ul>
    <li><strong>Community &amp; networking:</strong> global student network, visiting lecturers, mentors</li>
    <li><strong>Funding &amp; travel:</strong> eligibility for chapter grants, traveling-lecturer support, scholarships/travel grants, competitions</li>
    <li><strong>Career boost:</strong> reduced conference fees, programs, jobs &amp; internships, member resources</li>
    <li><strong>Leadership experience:</strong> run events, budgets, partnerships—great for CVs/PhD or industry applications</li>
    <li><strong>Typical activities:</strong> traveling lecturers, company/lab visits, outreach, career panels, Student Leadership Conference</li>
  </ul>

  <p><strong>Not a student?</strong><br/>
  You’re very welcome at our events without Optica membership.<br/>
  <em>Note:</em> when events are funded by Optica, priority may go to official Optica student members if required by the grant.</p>

  <h3>How to join</h3>
  <ul>
    <li><strong>Everyone:</strong> sign up via our Telegram bot (we’ll send the closed-channel invite + add you to the priority list)</li>
    <li><strong>Students:</strong> get Optica student membership → add <em>Photonics Society Eindhoven</em> as your chapter in your Optica account</li>
  </ul>

  <p class="text-sm opacity-80">Want this trimmed for Instagram/LinkedIn or turned into a flyer? We can make short and long versions with a CTA line.</p>
`;

const JoinUsPage: React.FC = () => {
  const { joinUsPageContent } = useData();
  const [sent, setSent] = React.useState<null | 'ok' | string>(null);
  const [busy, setBusy] = React.useState(false);

  // Intro text (отображается первым блоком)
  const introHtml =
    joinUsPageContent?.introText ||
    '<h2>Join the Photonics Society Eindhoven (PhE)</h2><p>Apply to become a member.</p>';

  // NEW: подробный блок с описанием (если нет в данных — используем дефолт из ТЗ)
  const detailsHtml = (joinUsPageContent as any)?.detailsHtml || DEFAULT_DETAILS_HTML;

  // Поля формы из данных админки
  const formFields = joinUsPageContent?.formFields || [];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setSent(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Добавим subject и тип формы — бэкенду будет проще маршрутизировать письмо
    const payload = {
      subject: 'Join Us form',
      type: 'join',
      ...data,
    };

    try {
      // Обновлено: шлём на /api/forms/submit, чтобы письмо уходило на почту
      await apiPost('/api/forms/submit', payload);
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
          {/* Вступительный блок из админки */}
          <div
            className="prose prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />

          {/* Подробности/правила/льготы — редактируемый блок detailsHtml (или дефолт) */}
          <div
            className="prose prose-invert max-w-none mb-10"
            dangerouslySetInnerHTML={{ __html: detailsHtml }}
          />

          {/* Форма заявки */}
          <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-6">
            {formFields.map((field) => {
              // textarea
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

              // select
              if (field.type === 'select' && Array.isArray((field as any).options)) {
                const options = (field as any).options as string[];
                return (
                  <div key={field.id}>
                    <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
                    <select
                      name={field.name}
                      required={field.required}
                      className="w-full bg-slate-800 p-3 rounded"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      {options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              // input text/email (и др. типы, если появятся)
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
