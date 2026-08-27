import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 44: 502 Bad Gateway Resilient Fallback for Forgot Password', () => {
  it('should verify vite.config.ts configures proxy error handler for offline backend', () => {
    const viteCode = fs.readFileSync(path.resolve('vite.config.ts'), 'utf8')
    assert.ok(viteCode.includes('proxy.on(\'error\''))
    assert.ok(viteCode.includes('Backend offline'))
  })

  it('should verify api.ts handles 502 Bad Gateway on forgot password endpoint', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes('res.status === 502'))
    assert.ok(apiCode.includes('cleanPath === \'/api/auth/forgot-password\''))
    assert.ok(apiCode.includes('rst_'))
  })

  it('should verify AuthModal.tsx renders 1-click reset button', () => {
    const modalCode = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(modalCode.includes('auth.resetPasswordNow'))
    assert.ok(modalCode.includes('resetUrl'))
  })
})
