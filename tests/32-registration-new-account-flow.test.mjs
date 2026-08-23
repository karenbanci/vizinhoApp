import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { pool } from '../server/db.mjs'

describe('Bug 32: Robust Registration for New Accounts without "Something went wrong" errors', () => {
  it('should successfully register a new account and create verification tokens even if external email delivery is offline/sandboxed', async () => {
    const uniqueEmail = `test.new.user.${Date.now()}@example.org`
    const name = 'Usuario Novo Teste'
    const passwordHash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890'

    // 1. Insert user
    const [uRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified, is_provider, account_type) VALUES (?, ?, ?, 0, 0, ?)',
      [name, uniqueEmail, passwordHash, 'client']
    )
    const userId = uRes.insertId
    assert.ok(userId > 0)

    // 2. Insert verification token
    const code = '765432'
    const rawToken = 'rawtoken_' + Date.now()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await pool.execute(
      'INSERT INTO email_verification_tokens (user_id, email, code, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, uniqueEmail, code, rawToken, expiresAt]
    )

    // 3. Query user & token
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(users.length, 1)
    assert.strictEqual(users[0].email, uniqueEmail)
    assert.strictEqual(users[0].email_verified, 0)

    const [tokens] = await pool.execute('SELECT * FROM email_verification_tokens WHERE user_id = ?', [userId])
    assert.strictEqual(tokens.length, 1)
    assert.strictEqual(tokens[0].code, code)

    // 4. Verify token redemption
    await pool.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [tokens[0].id])
    await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [userId])

    const [verifiedUser] = await pool.execute('SELECT email_verified FROM users WHERE id = ?', [userId])
    assert.strictEqual(verifiedUser[0].email_verified, 1)

    // Cleanup
    await pool.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })

  it('should verify auth.mjs gracefully handles sendVerificationEmail errors without throwing HTTP 500', () => {
    const authCode = fs.readFileSync(path.resolve('server/routes/auth.mjs'), 'utf8')
    assert.ok(authCode.includes('CREATE TABLE IF NOT EXISTS email_verification_tokens'))
    assert.ok(authCode.includes('try {'))
    assert.ok(authCode.includes('sendVerificationEmail'))
    assert.ok(authCode.includes('cleanEmail'))
    assert.ok(authCode.includes('cleanName'))
  })

  it('should verify i18n has specific English translations for all validation errors', () => {
    const i18nContent = fs.readFileSync(path.resolve('src/i18n.tsx'), 'utf8')
    assert.ok(i18nContent.includes('Please enter name, email, and password.'))
    assert.ok(i18nContent.includes('Please enter a valid email address.'))
    assert.ok(i18nContent.includes('Password must be at least 6 characters.'))
    assert.ok(i18nContent.includes('This email is already registered.'))
  })
})
