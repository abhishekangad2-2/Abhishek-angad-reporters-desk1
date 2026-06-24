import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'

export function generateTotpSecret() {
  return generateSecret()
}

export async function generateEnrollmentQr(email: string, secret: string) {
  const otpauthUrl = generateURI({
    secret,
    issuer: 'ReportersDesk',
    label: email,
    strategy: 'totp',
  })
  return QRCode.toDataURL(otpauthUrl)
}

export function verifyTotpCode(secret: string, code: string) {
  const result = verifySync({
    secret,
    token: code,
    epochTolerance: 30, // 30 seconds drift tolerance (equivalent to window: 1)
    strategy: 'totp',
  })
  return result.valid
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
