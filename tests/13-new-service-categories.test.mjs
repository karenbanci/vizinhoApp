import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 13: New Service Categories (Movers, Massage, Makeup, Cabeleleiro)', () => {
  it('should include new categories in backend me.mjs', () => {
    const backendFile = path.resolve('server/routes/me.mjs')
    const content = fs.readFileSync(backendFile, 'utf8')

    assert.match(content, /id: 'movers'/)
    assert.match(content, /id: 'massage'/)
    assert.match(content, /id: 'makeup'/)
    assert.match(content, /id: 'cabeleleiro'/)
  })

  it('should include new categories in frontend data.ts', () => {
    const frontendFile = path.resolve('src/data.ts')
    const content = fs.readFileSync(frontendFile, 'utf8')

    assert.match(content, /id: 'movers', label: 'Movers'/)
    assert.match(content, /id: 'massage', label: 'Massagem'/)
    assert.match(content, /id: 'makeup', label: 'Makeup'/)
    assert.match(content, /id: 'cabeleleiro', label: 'Cabeleireiro'/)
  })

  it('should have translations for all new categories in i18n.tsx', () => {
    const i18nFile = path.resolve('src/i18n.tsx')
    const content = fs.readFileSync(i18nFile, 'utf8')

    assert.match(content, /'cat\.movers': 'Movers'/)
    assert.match(content, /'cat\.massage': 'Massagem'/)
    assert.match(content, /'cat\.makeup': 'Makeup'/)
    assert.match(content, /'cat\.cabeleleiro': 'Cabeleireiro'/)
    assert.match(content, /'cat\.massage': 'Massage'/)
    assert.match(content, /'cat\.cabeleleiro': 'Hairdresser'/)
  })
})
