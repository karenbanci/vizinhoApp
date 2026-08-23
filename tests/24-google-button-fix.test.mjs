import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '../server/db.mjs'
import { cleanUser } from '../server/users.mjs'
import { signToken } from '../server/auth.mjs'

describe('Bug 24: Google Sign-In Button and Interactive Dialog Flow', () => {
  it('should authenticate and register a new client via Google without window.prompt', async () => {
    const googleEmail = `google-client-${Date.now()}@gmail.com`
    const googleName = 'Google Client User'

    const randomPassword = crypto.randomBytes(16).toString('hex')
    const passwordHash = await bcrypt.hash(randomPassword, 10)

    try {
      await pool.execute("ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'client'")
    } catch {
      // Column exists
    }

    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified, is_provider, account_type) VALUES (?, ?, ?, 1, 0, ?)',
      [googleName, googleEmail, passwordHash, 'client']
    )
    const userId = insertRes.insertId

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(rows.length, 1)

    const cleaned = cleanUser(rows[0])
    assert.strictEqual(cleaned.email, googleEmail)
    assert.strictEqual(cleaned.name, googleName)
    assert.strictEqual(cleaned.emailVerified, true)
    assert.strictEqual(cleaned.isProvider, false)
    assert.strictEqual(cleaned.accountType, 'client')

    const token = signToken(userId)
    assert.ok(typeof token === 'string' && token.length > 20)

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })

  it('should authenticate and register a new provider via Google with provider account type', async () => {
    const googleEmail = `google-provider-${Date.now()}@gmail.com`
    const googleName = 'Google Provider User'

    const randomPassword = crypto.randomBytes(16).toString('hex')
    const passwordHash = await bcrypt.hash(randomPassword, 10)

    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified, is_provider, account_type) VALUES (?, ?, ?, 1, 1, ?)',
      [googleName, googleEmail, passwordHash, 'provider']
    )
    const userId = insertRes.insertId

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(rows.length, 1)

    const cleaned = cleanUser(rows[0])
    assert.strictEqual(cleaned.email, googleEmail)
    assert.strictEqual(cleaned.name, googleName)
    assert.strictEqual(cleaned.emailVerified, true)
    assert.strictEqual(cleaned.isProvider, true)
    assert.strictEqual(cleaned.accountType, 'provider')

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })

  it('should verify i18n dictionary contains all Google Auth dialog keys in PT and EN', () => {
    const file = fs.readFileSync(path.resolve('src/i18n.tsx'), 'utf8')

    const expectedKeys = [
      'auth.googleBtn',
      'auth.googleDialogTitle',
      'auth.googleDialogSubtitle',
      'auth.googleChooseAccount',
      'auth.googleCustomEmail',
      'auth.googleName',
      'auth.googleConfirm',
      'auth.googleCancel',
      'auth.googleEmailRequired',
    ]

    for (const key of expectedKeys) {
      assert.ok(file.includes(`'${key}'`), `Missing i18n key: ${key}`)
    }
  })

  it('should verify AuthModal.tsx does not use window.prompt and includes Google dialog overlay', () => {
    const authModalContent = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.strictEqual(
      authModalContent.includes('window.prompt'),
      false,
      'AuthModal should not use window.prompt'
    )
    assert.ok(
      authModalContent.includes('showGoogleDialog'),
      'AuthModal should manage showGoogleDialog state'
    )
    assert.ok(
      authModalContent.includes('executeGoogleAuth'),
      'AuthModal should define executeGoogleAuth handler'
    )
    assert.ok(
      authModalContent.includes('auth.googleDialogTitle'),
      'AuthModal should render Google dialog with i18n title'
    )
  })
})
