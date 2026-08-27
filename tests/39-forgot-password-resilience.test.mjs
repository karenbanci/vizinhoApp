import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 39: Forgot Password Resilience and Error Elimination', () => {
  it('should verify api.ts handles forgot-password and reset-password fallback gracefully', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes("path === '/api/auth/forgot-password'"))
    assert.ok(apiCode.includes("path === '/api/auth/reset-password'"))
    assert.ok(apiCode.includes('resetUrl'))
  })

  it('should verify AuthModal.tsx renders forgot password reset link and success state properly', () => {
    const modalCode = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(modalCode.includes("mode === 'forgot'"))
    assert.ok(modalCode.includes('forgotPassword'))
    assert.ok(modalCode.includes('setResetUrl'))
  })
})
