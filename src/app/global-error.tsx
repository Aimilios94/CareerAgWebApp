'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#09090b', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ textAlign: 'center', maxWidth: '448px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
              An unexpected error occurred. Please try again.
              {error.digest && (
                <span style={{ display: 'block', color: '#52525b', fontSize: '12px', marginTop: '8px', fontFamily: 'monospace' }}>
                  Error ID: {error.digest}
                </span>
              )}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px', borderRadius: '12px', border: 'none',
                backgroundColor: '#6d28d9', color: '#ffffff', fontSize: '14px',
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
