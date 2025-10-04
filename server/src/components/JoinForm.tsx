'use client'

import { useState } from 'react'

type Field = {
  id?: string
  name: string
  label: string
  type: string
  required?: boolean
  placeholder?: string | null
  options?: Array<{ value: string; id?: string }> | null
}

export default function JoinForm({ fields = [] }: { fields?: Field[] }) {
  const [sent, setSent] = useState<null | 'ok' | string>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // ✅ Сохраняем ссылку на форму ДО асинхронной операции
    const form = e.currentTarget
    
    setBusy(true)
    setSent(null)

    const formData = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Join Us form',
          type: 'join',
          ...formData,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit')

      setSent('ok')
      form.reset() // ✅ Используем сохраненную ссылку
    } catch (err: any) {
      setSent(err?.message ?? 'Failed to submit')
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
                rows={4}
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
                  const value = typeof opt === 'string' ? opt : opt.value
                  const key = typeof opt === 'object' && opt.id ? opt.id : i
                  return (
                    <option key={key} value={value}>
                      {value}
                    </option>
                  )
                })}
              </select>
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
        {busy ? 'Submitting…' : 'Submit application'}
      </button>

      {sent && (
        <p className={`text-sm ${sent === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
          {sent === 'ok' ? 'Application sent!' : sent}
        </p>
      )}
    </form>
  )
}