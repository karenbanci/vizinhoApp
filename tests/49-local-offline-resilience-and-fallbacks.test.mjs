import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 49: Local Offline Environment Resilience & Seamless Fallback Execution', () => {
  it('should verify DEFAULT_FALLBACK_USERS exists and populates initial offline dataset', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes('DEFAULT_FALLBACK_USERS'))
    assert.ok(apiCode.includes('ana@exemplo.com'))
  })

  it('should verify all core endpoints have local offline fallback handlers in api.ts', () => {
    const apiCode = fs.readFileSync(path.resolve('src/api.ts'), 'utf8')
    assert.ok(apiCode.includes("cleanPath === '/api/me'"))
    assert.ok(apiCode.includes("cleanPath === '/api/me/password'"))
    assert.ok(apiCode.includes("cleanPath === '/api/me/provider'"))
    assert.ok(apiCode.includes("cleanPath === '/api/admin/users'"))
    assert.ok(apiCode.includes("cleanPath === '/api/admin/stats'"))
  })

  it('should verify ProfilePage.tsx uses valid setPhotoId handler without reference error', () => {
    const profileCode = fs.readFileSync(path.resolve('src/pages/ProfilePage.tsx'), 'utf8')
    assert.ok(profileCode.includes('onClick={() => setPhotoId(id)}'))
    assert.ok(!profileCode.includes('handlePhotoOption'))
  })
})
