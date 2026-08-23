import { describe, it } from 'node:test'
import assert from 'node:assert'
import crypto from 'node:crypto'
import { pool } from '../server/db.mjs'
import { sendVerificationEmail } from '../server/services/email.mjs'

describe('Bug 14: Account Email Verification via Resend', () => {
  it('should generate a 6-digit verification code and token hash', () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    assert.strictEqual(code.length, 6)
    assert.match(code, /^\d{6}$/)

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    assert.strictEqual(tokenHash.length, 64)
  })

  it('should create unverified user, store verification code in database, and verify successfully', async () => {
    const testEmail = `verify-${Date.now()}@test.com`

    // 1. Create user with email_verified = 0
    const [uRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified) VALUES (?, ?, ?, 0)',
      ['Test Verifier', testEmail, 'hash_pass']
    )
    const userId = uRes.insertId

    // 2. Insert verification token
    const code = '654321'
    const rawToken = 'test-raw-token-' + Date.now()
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await pool.execute(
      'INSERT INTO email_verification_tokens (user_id, email, code, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, testEmail, code, tokenHash, expiresAt]
    )

    // 3. Query verification token
    const [tokens] = await pool.execute(
      'SELECT * FROM email_verification_tokens WHERE email = ? AND code = ? AND expires_at > NOW() AND used_at IS NULL',
      [testEmail, code]
    )
    assert.strictEqual(tokens.length, 1)

    // 4. Mark verified
    await pool.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [tokens[0].id])
    await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [userId])

    const [verifiedUser] = await pool.execute('SELECT email_verified FROM users WHERE id = ?', [userId])
    assert.strictEqual(verifiedUser[0].email_verified, 1)

    // 5. Cleanup
    await pool.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })

  it('should test sendVerificationEmail function targeting user registered email', async () => {
    const userEmail = `user-${Date.now()}@exemplo.com.br`
    const res = await sendVerificationEmail({
      to: userEmail,
      name: 'Usuario Cadastro',
      code: '888999',
      verifyLink: 'http://localhost:8443/?verify_token=sample123',
    })

    assert.ok(typeof res === 'object')
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.to, userEmail)
    assert.strictEqual(res.code, '888999')
  })
})
