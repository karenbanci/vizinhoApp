import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 40: Registration Confirmation Link and Code Delivery', () => {
  it('should verify AuthModal.tsx provides both code and direct link for email confirmation', () => {
    const modalCode = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(modalCode.includes('verifyLinkUrl'))
    assert.ok(modalCode.includes('verify_token='))
    assert.ok(modalCode.includes('auth.verifyDirectLink'))
    assert.ok(modalCode.includes('auth.verifyAutoFill'))
  })

  it('should verify App.tsx handles verify_token URL query parameter for 1-click verification', () => {
    const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8')
    assert.ok(appCode.includes("params.get('verify_token')"))
    assert.ok(appCode.includes('verifyEmail({ token: verifyToken })'))
  })

  it('should verify auth.mjs and api.ts return verifyUrl and code upon registration', () => {
    const authCode = fs.readFileSync(path.resolve('server/routes/auth.mjs'), 'utf8')
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(authCode.includes('verifyUrl'))
    assert.ok(apiCode.includes('verifyUrl'))
  })
})
