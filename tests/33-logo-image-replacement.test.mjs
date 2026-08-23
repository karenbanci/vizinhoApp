import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 33: Replace Logo with src/images/logo.png', () => {
  it('should verify src/images/logo.png exists and is a valid image asset', () => {
    const logoPath = path.resolve('src/images/logo.png')
    assert.ok(fs.existsSync(logoPath), 'src/images/logo.png must exist')
    const stat = fs.statSync(logoPath)
    assert.ok(stat.size > 0, 'logo.png must not be empty')
  })

  it('should verify src/components/Logo.tsx imports src/images/logo.png and renders brand logo', () => {
    const logoComponent = fs.readFileSync(path.resolve('src/components/Logo.tsx'), 'utf8')
    assert.ok(logoComponent.includes("import logoImg from '../images/logo.png'"))
    assert.ok(logoComponent.includes('alt="Vizinho"'))
  })

  it('should verify App.tsx, AuthModal.tsx, and ProfilePage.tsx use the new logo image asset', () => {
    const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8')
    assert.ok(appCode.includes("import Logo from './components/Logo'"))
    assert.ok(appCode.includes('<Logo size="md" />'))
    assert.ok(appCode.includes('<Logo size="xs"'))

    const authModalCode = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(authModalCode.includes("import logoImg from '../images/logo.png'"))
    assert.ok(authModalCode.includes('src={logoImg}'))

    const profilePageCode = fs.readFileSync(path.resolve('src/pages/ProfilePage.tsx'), 'utf8')
    assert.ok(profilePageCode.includes("import logoImg from '../images/logo.png'"))
    assert.ok(profilePageCode.includes('src={logoImg}'))
  })
})
