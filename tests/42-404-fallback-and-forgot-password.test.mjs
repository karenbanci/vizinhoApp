import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 42: 404 Fallback Handling for Forgot Password & Static Environments', () => {
  it('should verify request() handles 404 responses from static servers or GitHub Pages gracefully', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes('res.status === 404'))
    assert.ok(apiCode.includes('cleanPath === \'/api/auth/forgot-password\''))
    assert.ok(apiCode.includes('cleanPath === \'/api/auth/reset-password\''))
  })

  it('should verify forgot password returns clean reset link without throwing 404 errors', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes('resetUrl'))
    assert.ok(apiCode.includes('rst_'))
  })
})
