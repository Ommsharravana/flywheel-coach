'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('[GlobalError] Caught error:', error);
    console.error('[GlobalError] Error message:', error.message);
    console.error('[GlobalError] Error digest:', error.digest);
    console.error('[GlobalError] Error stack:', error.stack);
  }, [error]);

  return (
    <html>
      <body style={{ backgroundColor: '#0a0a0a', color: '#fafafa', fontFamily: 'system-ui' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: '#1c1917',
            border: '1px solid #292524',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2 style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              Global Error
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#d6d3d1', fontSize: '14px', marginBottom: '8px' }}>
                <strong style={{ color: '#fafafa' }}>Error:</strong>{' '}
                {error.message || 'Unknown error'}
              </p>
              {error.digest && (
                <p style={{ color: '#a8a29e', fontSize: '14px' }}>
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={reset}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #44403c',
                  borderRadius: '6px',
                  color: '#fafafa',
                  cursor: 'pointer'
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#a8a29e',
                  cursor: 'pointer'
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
