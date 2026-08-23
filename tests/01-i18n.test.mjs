import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 1: i18n Internationalization (PT / EN)', () => {
  it('should have valid translation keys and translations for both languages', () => {
    const i18nPath = path.resolve('src/i18n.tsx')
    assert.strictEqual(fs.existsSync(i18nPath), true, 'src/i18n.tsx exists')
    const content = fs.readFileSync(i18nPath, 'utf8')

    // Verify key translation structures exist
    assert.match(content, /export type Language = 'pt' \| 'en'/)
    assert.match(content, /const pt = {/)
    assert.match(content, /const en: Record<TranslationKey, string> = {/)
    assert.match(content, /'nav\.explore'/)
    assert.match(content, /'nav\.howItWorks'/)
    assert.match(content, /'nav\.becomeProvider'/)
  })
})
