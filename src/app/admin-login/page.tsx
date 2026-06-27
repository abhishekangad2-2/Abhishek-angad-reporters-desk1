'use client'

import { useState } from 'react'

type LoginStep = 'credentials' | 'totp-input' | 'enrollment'

export default function AdminLoginPage() {
  const [step, setStep] = useState<LoginStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Email + Password
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Login failed')
        return
      }

      const data = await res.json()
      setPendingToken(data.pendingToken)

      if (data.requiresEnrollment) {
        setStep('enrollment')
      } else if (data.requiresTotp) {
        setStep('totp-input')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: TOTP Verification
  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken, code }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Verification failed')
        return
      }

      // Success — session cookies set. Use a hard navigation so the request to
      // /cms carries the new cookies through the auth middleware. A
      // client-side router.push fetches the RSC payload through the
      // redirecting middleware and can fail with "this page couldn't load".
      window.location.href = '/cms'
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Enrollment
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [enrollmentCode, setEnrollmentCode] = useState('')
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)

  const handleEnrollmentStart = async () => {
    setEnrollmentLoading(true)
    try {
      const res = await fetch('/api/auth/enroll-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Enrollment failed')
        return
      }

      const data = await res.json()
      setQrDataUrl(data.qrDataUrl)
      setBackupCodes(data.backupCodes)
    } catch (err) {
      setError('Failed to start enrollment')
    } finally {
      setEnrollmentLoading(false)
    }
  }

  const handleEnrollmentConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnrollmentLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/confirm-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken, code: enrollmentCode }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Confirmation failed')
        return
      }

      // Success — enrollment complete AND logged in: confirm-enrollment set
      // the session cookies, so there's no need to enter a second code. Hard
      // navigate to the admin (carries cookies through the middleware).
      window.location.href = '/cms'
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setEnrollmentLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>ReportersDesk Admin</h1>

      {step === 'credentials' && (
        <form onSubmit={handleCredentialsSubmit}>
          <fieldset disabled={loading}>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.5rem' }}
                />
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.5rem' }}
                />
              </label>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">{loading ? 'Logging in...' : 'Login'}</button>
          </fieldset>
        </form>
      )}

      {step === 'enrollment' && (
        <div>
          <h2>Set Up Two-Factor Authentication</h2>
          {!qrDataUrl ? (
            <div>
              <p>You need to set up 2FA to access the admin panel.</p>
              <button onClick={handleEnrollmentStart} disabled={enrollmentLoading}>
                {enrollmentLoading ? 'Starting...' : 'Start Enrollment'}
              </button>
            </div>
          ) : (
            <div>
              <p>Scan this QR code with your authenticator app:</p>
              <img src={qrDataUrl} alt="2FA QR Code" style={{ maxWidth: '200px' }} />
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                After scanning, enter the 6-digit code from your authenticator app:
              </p>
              <form onSubmit={handleEnrollmentConfirm}>
                <fieldset disabled={enrollmentLoading}>
                  <input
                    type="text"
                    value={enrollmentCode}
                    onChange={(e) => setEnrollmentCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                    style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
                  />
                  {error && <p style={{ color: 'red' }}>{error}</p>}
                  <button type="submit">{enrollmentLoading ? 'Confirming...' : 'Confirm & Verify'}</button>
                </fieldset>
              </form>
              {backupCodes.length > 0 && (
                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>⚠️ Save your backup codes now:</p>
                  <code style={{ display: 'block', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                    {backupCodes.join('\n')}
                  </code>
                  <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Keep these in a safe place. Each can be used once if you lose access to your authenticator.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'totp-input' && (
        <form onSubmit={handleTotpSubmit}>
          <fieldset disabled={loading}>
            <p>Enter the 6-digit code from your authenticator app:</p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
                required
                style={{ display: 'block', width: '100%' }}
              />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">{loading ? 'Verifying...' : 'Verify & Login'}</button>
          </fieldset>
        </form>
      )}
    </div>
  )
}
