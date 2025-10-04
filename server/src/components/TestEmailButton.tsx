'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

export const TestEmailButton: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const testEmail = useFormFields(([fields]) => fields?.testEmail?.value as string)
  const enabled = useFormFields(([fields]) => fields?.enabled?.value as boolean)

  const handleTest = async () => {
    if (!testEmail) {
      setStatus('error')
      setMessage('Please enter a test email address above')
      return
    }

    if (!enabled) {
      setStatus('error')
      setMessage('Please enable email sending first')
      return
    }

    setStatus('sending')
    setMessage('')

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(`✅ Test email sent to ${testEmail}! Check your inbox.`)
      } else {
        setStatus('error')
        setMessage(`❌ Failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      setStatus('idle')
      setMessage('')
    }, 5000)
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleTest}
        disabled={status === 'sending' || !testEmail || !enabled}
        className={`
          px-6 py-3 rounded-lg font-semibold transition-colors
          ${status === 'sending' ? 'bg-gray-400 cursor-not-allowed' : ''}
          ${status === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
          ${status === 'error' ? 'bg-red-500 hover:bg-red-600' : ''}
          ${status === 'idle' ? 'bg-blue-500 hover:bg-blue-600' : ''}
          text-white disabled:opacity-50
        `}
      >
        {status === 'sending' && '⏳ Sending...'}
        {status === 'success' && '✅ Sent!'}
        {status === 'error' && '❌ Failed'}
        {status === 'idle' && '📧 Send Test Email'}
      </button>

      {message && (
        <div
          className={`
            p-4 rounded-lg border
            ${status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${status === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
          `}
        >
          {message}
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>💡 <strong>Tip:</strong> Make sure to save your settings before testing.</p>
        <p>The test email will be sent using your current configuration.</p>
      </div>
    </div>
  )
}