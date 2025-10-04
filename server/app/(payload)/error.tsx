'use client'

export default function AdminError({ error, reset }: { error: any; reset: () => void }) {
  console.error('[Admin UI] Error boundary caught:', error)
  return (
    <html>
      <body style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Admin Error</h1>
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {String(error?.message || error)}
        </pre>
        <button onClick={() => reset()} style={{ marginTop: 12 }}>
          Try again
        </button>
      </body>
    </html>
  )
}
