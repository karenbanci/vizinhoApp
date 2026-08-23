import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 4: Centered Provider Profile Modal', () => {
  it('should render provider profile modal centered in the window', () => {
    const file = path.resolve('src/components/ProfileDrawer.tsx')
    assert.strictEqual(fs.existsSync(file), true)
    const content = fs.readFileSync(file, 'utf8')

    // Verify center placement classes
    assert.match(content, /fixed inset-0 z-50 flex items-center justify-center/)
    assert.match(content, /max-w-2xl/)
    assert.match(content, /rounded-3xl/)
  })
})
