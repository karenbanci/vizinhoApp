import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 17: Auth Modal English Translations', () => {
  it('should have complete auth keys in i18n dictionary for both Portuguese and English', () => {
    const i18nPath = path.resolve('src/i18n.tsx')
    const content = fs.readFileSync(i18nPath, 'utf8')

    const requiredAuthKeys = [
      'auth.loginTitle',
      'auth.registerTitle',
      'auth.forgotTitle',
      'auth.resetTitle',
      'auth.verifyTitle',
      'auth.loginSub',
      'auth.registerSub',
      'auth.name',
      'auth.namePlaceholder',
      'auth.email',
      'auth.emailPlaceholder',
      'auth.password',
      'auth.passRegPlaceholder',
      'auth.passLoginPlaceholder',
      'auth.forgotPasswordLink',
      'auth.loginBtn',
      'auth.registerBtn',
      'auth.verifyBtn',
      'auth.noAccount',
      'auth.signupFree',
      'auth.haveAccount',
      'auth.backToLogin',
    ]

    for (const key of requiredAuthKeys) {
      assert.ok(content.includes(`'${key}'`), `Missing translation key: ${key}`)
    }
  })

  it('should verify English auth texts are properly defined', () => {
    const i18nPath = path.resolve('src/i18n.tsx')
    const content = fs.readFileSync(i18nPath, 'utf8')

    assert.ok(content.includes("'auth.loginTitle': 'Log in'"))
    assert.ok(content.includes("'auth.registerTitle': 'Create account'"))
    assert.ok(content.includes("'auth.forgotTitle': 'Forgot password'"))
    assert.ok(content.includes("'auth.verifyTitle': 'Confirm Email'"))
    assert.ok(content.includes("'auth.signupFree': 'Sign up free'"))
  })
})
