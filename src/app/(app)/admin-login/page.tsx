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
    <div className="rd-login">
      <div className="rd-login__card">
        <div className="rd-login__brand">
          <span className="rd-login__kicker">Editor access</span>
          <h1 className="rd-login__title">ReportersDesk</h1>
          <p className="rd-login__sub">Abhishek Angad Ink</p>
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="rd-login__form">
            <fieldset disabled={loading} className="rd-login__fieldset">
              <label className="rd-login__label">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="rd-login__input"
                />
              </label>
              <label className="rd-login__label">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="rd-login__input"
                />
              </label>
              {error && <p className="rd-login__error">{error}</p>}
              <button type="submit" className="rd-login__btn">
                {loading ? 'Logging in…' : 'Log in'}
              </button>
            </fieldset>
          </form>
        )}

        {step === 'enrollment' && (
          <div className="rd-login__form">
            <h2 className="rd-login__h2">Set up two-factor authentication</h2>
            {!qrDataUrl ? (
              <>
                <p className="rd-login__text">You need to set up 2FA to access the admin panel.</p>
                <button onClick={handleEnrollmentStart} disabled={enrollmentLoading} className="rd-login__btn">
                  {enrollmentLoading ? 'Starting…' : 'Start enrollment'}
                </button>
              </>
            ) : (
              <>
                <p className="rd-login__text">Scan this QR code with your authenticator app:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="2FA QR Code" className="rd-login__qr" />
                <p className="rd-login__hint">After scanning, enter the 6-digit code:</p>
                <form onSubmit={handleEnrollmentConfirm}>
                  <fieldset disabled={enrollmentLoading} className="rd-login__fieldset">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={enrollmentCode}
                      onChange={(e) => setEnrollmentCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      pattern="\d{6}"
                      required
                      className="rd-login__input rd-login__input--code"
                    />
                    {error && <p className="rd-login__error">{error}</p>}
                    <button type="submit" className="rd-login__btn">
                      {enrollmentLoading ? 'Confirming…' : 'Confirm & verify'}
                    </button>
                  </fieldset>
                </form>
                {backupCodes.length > 0 && (
                  <div className="rd-login__backup">
                    <p className="rd-login__backup-title">⚠️ Save your backup codes now</p>
                    <code className="rd-login__backup-codes">{backupCodes.join('\n')}</code>
                    <p className="rd-login__hint">
                      Keep these safe. Each can be used once if you lose your authenticator.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'totp-input' && (
          <form onSubmit={handleTotpSubmit} className="rd-login__form">
            <fieldset disabled={loading} className="rd-login__fieldset">
              <p className="rd-login__text">Enter the 6-digit code from your authenticator app:</p>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
                required
                className="rd-login__input rd-login__input--code"
              />
              {error && <p className="rd-login__error">{error}</p>}
              <button type="submit" className="rd-login__btn">
                {loading ? 'Verifying…' : 'Verify & log in'}
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  )
}
