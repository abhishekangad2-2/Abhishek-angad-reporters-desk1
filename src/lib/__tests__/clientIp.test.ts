import { describe, it, expect } from 'vitest'
import { clientIpFromXff } from '../clientIp'

// Security-critical: the client must not be able to forge the IP used for rate
// limiting / the admin allowlist. On Cloud Run the trustworthy IP is the
// right-most hop (appended by Google's edge); default TRUSTED_PROXY_HOPS=0.
describe('clientIpFromXff', () => {
  it('returns the single real IP when no proxies prepend', () => {
    expect(clientIpFromXff('203.0.113.7')).toBe('203.0.113.7')
  })

  it('takes the right-most hop, ignoring client-forged prefixes', () => {
    // Attacker prepends a fake IP; Google appends the real connecting IP last.
    expect(clientIpFromXff('1.1.1.1, 203.0.113.7')).toBe('203.0.113.7')
  })

  it('is not fooled by a spoofed allowlisted-looking first entry', () => {
    expect(clientIpFromXff('10.0.0.1, 10.0.0.2, 198.51.100.9')).toBe('198.51.100.9')
  })

  it('trims whitespace', () => {
    expect(clientIpFromXff('  203.0.113.7  ')).toBe('203.0.113.7')
  })

  it('returns "unknown" for empty / missing headers', () => {
    expect(clientIpFromXff('')).toBe('unknown')
    expect(clientIpFromXff(null)).toBe('unknown')
    expect(clientIpFromXff(undefined)).toBe('unknown')
  })
})
