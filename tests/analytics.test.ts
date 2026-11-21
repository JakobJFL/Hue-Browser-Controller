import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isValidCfAnalyticsToken, shouldLoadAnalytics } from '../src/utils/analytics.ts'

describe('Cloudflare Web Analytics loader validation', () => {
  const validToken = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'

  it('accepts valid hex/UUID Cloudflare beacon tokens and rejects empty or malformed values', () => {
    assert.equal(isValidCfAnalyticsToken(validToken), true)
    assert.equal(isValidCfAnalyticsToken('12345678-1234-1234-1234-1234567890ab'), true)
    assert.equal(isValidCfAnalyticsToken(''), false)
    assert.equal(isValidCfAnalyticsToken(undefined), false)
    assert.equal(isValidCfAnalyticsToken('your_token_here'), false)
    assert.equal(isValidCfAnalyticsToken('<script>alert(1)</script>'), false)
  })

  it('loads analytics on production hostnames and skips localhost / loopback', () => {
    assert.equal(shouldLoadAnalytics(validToken, 'jakobjfl.github.io'), true)
    assert.equal(shouldLoadAnalytics(validToken, 'localhost'), false)
    assert.equal(shouldLoadAnalytics(validToken, '127.0.0.1'), false)
    assert.equal(shouldLoadAnalytics(validToken, '[::1]'), false)
    assert.equal(shouldLoadAnalytics('', 'jakobjfl.github.io'), false)
  })
})
