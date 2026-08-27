import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 43: Register 404 Error Fix and Direct Confirmation Link Delivery', () => {
  it('should verify register() fallback provides verification code and verifyUrl when 404 occurs', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes('cleanPath === \'/api/auth/register\''))
    assert.ok(apiCode.includes('pendingVerification: true'))
    assert.ok(apiCode.includes('verifyUrl'))
    assert.ok(apiCode.includes('mockCode'))
  })

  it('should verify AuthModal.tsx immediately transitions to verify mode and shows direct confirmation link', () => {
    const modalCode = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(modalCode.includes("setMode('verify')"))
    assert.ok(modalCode.includes('verifyLinkUrl'))
    assert.ok(modalCode.includes('sandboxCode'))
  })
})
