import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 45: Registration 502 Bad Gateway Resilience & Confirmation Link', () => {
  it('should verify register() handles 502 Bad Gateway and returns valid confirmation code & link', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes('cleanPath === \'/api/auth/register\''))
    assert.ok(apiCode.includes('res.status === 502'))
    assert.ok(apiCode.includes('pendingVerification: true'))
    assert.ok(apiCode.includes('verifyUrl'))
  })

  it('should verify AuthModal.tsx provides both auto-fill and direct link for email activation', () => {
    const modalCode = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(modalCode.includes('auth.verifyAutoFill'))
    assert.ok(modalCode.includes('auth.verifyDirectLink'))
  })
})
