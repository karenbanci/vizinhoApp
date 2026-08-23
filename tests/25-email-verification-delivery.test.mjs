import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { pool } from '../server/db.mjs'
import { sendVerificationEmail } from '../server/services/email.mjs'

describe('Bug 25: Confirmation Email Delivery and Verification Flow', () => {
  it('should generate verification token, insert in DB, and gracefully return code & verifyLink even on sandbox restriction', async () => {
    const email = `delivery-test-${Date.now()}@testdomain.com`
    const name = 'Delivery User'

    const emailRes = await sendVerificationEmail({
      to: email,
      name,
      code: '889900',
      verifyLink: 'http://localhost:8443/?verify_token=testtoken889900',
    })

    assert.strictEqual(typeof emailRes, 'object')
    assert.strictEqual(emailRes.success, true)
    assert.strictEqual(emailRes.code, '889900')
    assert.strictEqual(emailRes.verifyLink, 'http://localhost:8443/?verify_token=testtoken889900')
  })

  it('should verify email verification tokens can be redeemed in database to activate user', async () => {
    const email = `redeem-test-${Date.now()}@gmail.com`

    const [uRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified, is_provider) VALUES (?, ?, ?, 0, 0)',
      ['Redeem User', email, 'hash123']
    )
    const userId = uRes.insertId

    const code = '654321'
    await pool.execute(
      'INSERT INTO email_verification_tokens (user_id, email, code, token_hash, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [userId, email, code, 'dummyhash654321']
    )

    // Simulate verification query
    const [tokens] = await pool.execute(
      'SELECT * FROM email_verification_tokens WHERE email = ? AND code = ? AND expires_at > NOW() AND used_at IS NULL',
      [email, code]
    )
    assert.strictEqual(tokens.length, 1)

    await pool.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [tokens[0].id])
    await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [userId])

    const [userRows] = await pool.execute('SELECT email_verified FROM users WHERE id = ?', [userId])
    assert.strictEqual(userRows[0].email_verified, 1)

    // Cleanup
    await pool.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })

  it('should verify i18n has verifySandboxNotice and verifyAutoFill in PT and EN', () => {
    const file = fs.readFileSync(path.resolve('src/i18n.tsx'), 'utf8')
    assert.ok(file.includes('auth.verifySandboxNotice'))
    assert.ok(file.includes('auth.verifyAutoFill'))
    assert.ok(file.includes('auth.verifyDirectLink'))
  })

  it('should verify AuthModal.tsx handles sandboxCode state and renders auto-fill helper', () => {
    const modalFile = fs.readFileSync(path.resolve('src/components/AuthModal.tsx'), 'utf8')
    assert.ok(modalFile.includes('sandboxCode'))
    assert.ok(modalFile.includes('auth.verifySandboxNotice'))
    assert.ok(modalFile.includes('auth.verifyAutoFill'))
  })
})
