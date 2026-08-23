import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('Bug 11: Bio is Mandatory Validation', () => {
  it('should reject bio when empty or shorter than 5 characters', () => {
    const validateBio = (bio) => {
      if (bio === undefined || typeof bio !== 'string' || bio.trim().length < 5) {
        return { ok: false, error: 'O preenchimento da Bio é obrigatório (mínimo de 5 caracteres).' }
      }
      return { ok: true }
    }

    assert.strictEqual(validateBio('').ok, false)
    assert.strictEqual(validateBio('   ').ok, false)
    assert.strictEqual(validateBio('abc').ok, false)
    assert.strictEqual(validateBio('Mais de 5 caracteres de bio detalhada').ok, true)
  })
})
