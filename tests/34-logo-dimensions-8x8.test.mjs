import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 34: Logo Visible 8x8 Dimensions & Square Ratio', () => {
  it('should verify src/images/logo.png is a square aspect ratio image (width === height)', () => {
    const buf = fs.readFileSync(path.resolve('src/images/logo.png'))
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)

    assert.ok(width > 0 && height > 0)
    assert.strictEqual(width, height, `Logo must be square (got ${width}x${height})`)
  })

  it('should verify Logo.tsx uses w-8 h-8 dimensions for standard size', () => {
    const logoCode = fs.readFileSync(path.resolve('src/components/Logo.tsx'), 'utf8')
    assert.ok(logoCode.includes("'w-8 h-8 rounded-xl'"))
  })

  it('should verify AuthModal.tsx and ProfilePage.tsx use w-8 h-8 for the logo', () => {
    const authModalCode = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(authModalCode.includes('w-8 h-8'))

    const profilePageCode = fs.readFileSync(path.resolve('src/pages/ProfilePage.tsx'), 'utf8')
    assert.ok(profilePageCode.includes('w-8 h-8'))
  })
})
