import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'

// Allow ±1 step (~30s) of clock drift between the server and the
// authenticator app — too tight a window causes real, confusing failures.
authenticator.options = { window: 1 }

export function generateTotpSecret() {
  return authenticator.generateSecret()
}

export async function generateEnrollmentQr(email: string, secret: string) {
  const otpauthUrl = authenticator.keyuri(email, 'ReportersDesk', secret)
  return QRCode.toDataURL(otpauthUrl)
}

export function verifyTotpCode(secret: string, code: string) {
  return authenticator.check(code, secret)
}

export function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => Math.random().toString(36).slice(2, 10).toUpperCase())
}

export async function hashBackupCode(code: string) {
  return bcrypt.hash(code, 10)
}

export async function verifyBackupCode(code: string, hash: string) {
  return bcrypt.compare(code, hash)
}
