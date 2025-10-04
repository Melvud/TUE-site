'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [sent, setSent] = useState<null | 'ok' | string>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setSent(null)

    const formData = Object.fromEntries(new FormData(e.currentTarget).entries())
    
    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Contact form',
          type: 'contact',
          ...formData,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to send')
      
      setSent('ok')
      e.currentTarget.reset()
    } catch (err: any) {
      setSent(err?.message ?? 'Failed to send')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm text-slate-300 mb-1">Name</label>
        <input name="name" required className="w-full bg-slate-800 p-3 rounded text-white" />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Email</label>
        <input name="email" type="email" required className="w-full bg-slate-800 p-3 rounded text-white" />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Message</label>
        <textarea name="message" rows={6} required className="w-full bg-slate-800 p-3 rounded text-white" />
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
  )
}