'use client'

import { useState } from 'react'

type Field = {
  id?: string
  name: string
  label: string
  type: string
  required?: boolean
  placeholder?: string | null
  rows?: number | null
  options?: Array<{ label: string; value: string; id?: string }> | null
}

type ContactFormProps = {
  fields?: Field[]
  submitButtonText?: string
  successMessage?: string
}

export default function ContactForm({
  fields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true, rows: 6 },
  ],
  submitButtonText = 'Send message',
  successMessage = 'Message sent!',
}: ContactFormProps) {
  const [sent, setSent] = useState<null | 'ok' | string>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget

    setBusy(true)
    setSent(null)

    const formData = Object.fromEntries(new FormData(form).entries())

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

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to send')
      }

      setSent('ok')
      form.reset()
    } catch (err: any) {
      setSent(err?.message ?? 'Failed to send')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-6">
      {fields.map((field) => {
        const fieldKey = field.id || field.name

        if (field.type === 'textarea') {
          return (
            <div key={fieldKey}>
              <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
              <textarea
                name={field.name}
                required={field.required}
                placeholder={field.placeholder || ''}
                className="w-full bg-slate-800 p-3 rounded text-white"
                rows={field.rows || 6}
              />
            </div>
          )
        }

        if (field.type === 'select' && field.options) {
          return (
            <div key={fieldKey}>
              <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
              <select
                name={field.name}
                required={field.required}
                className="w-full bg-slate-800 p-3 rounded text-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Select...
                </option>
                {field.options.map((opt, i) => {
                  const key = opt.id || i
                  return (
                    <option key={key} value={opt.value}>
                      {opt.label}
                    </option>
                  )
                })}
              </select>
            </div>
          )
        }

        if (field.type === 'checkbox') {
          return (
            <div key={fieldKey} className="flex items-center gap-3">
              <input
                name={field.name}
                type="checkbox"
                required={field.required}
                className="w-5 h-5 bg-slate-800 rounded"
              />
              <label className="text-sm text-slate-300">{field.label}</label>
            </div>
          )
        }

        return (
          <div key={fieldKey}>
            <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
            <input
              name={field.name}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder || ''}
              className="w-full bg-slate-800 p-3 rounded text-white"
            />
          </div>
        )
      })}

      <button
        disabled={busy}
        className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-white font-bold py-3 px-6 rounded"
      >
        {busy ? 'Sending…' : submitButtonText}
      </button>

      {sent && (
        <p className={`text-sm ${sent === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
          {sent === 'ok' ? successMessage : sent}
        </p>
      )}
    </form>
  )
}