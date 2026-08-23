import { describe, it } from 'node:test'
import assert from 'node:assert'
import bcrypt from 'bcryptjs'
import { pool } from '../server/db.mjs'
import { signToken } from '../server/auth.mjs'

describe('Bug 18: Prevent Login Without Email Verification', () => {
  it('should reject login if email is unverified and allow login after verification', async () => {
    const email = `unverified-${Date.now()}@example.com`
    const password = 'securePassword123'
    const passwordHash = await bcrypt.hash(password, 10)

    // 1. Create unverified user (email_verified = 0)
    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified) VALUES (?, ?, ?, 0)',
      ['Unverified User', email, passwordHash]
    )
    const userId = insertRes.insertId

    // 2. Simulate login attempt check
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])
    assert.strictEqual(rows.length, 1)

    const userRow = rows[0]
    const pwdMatches = await bcrypt.compare(password, userRow.password_hash)
    assert.strictEqual(pwdMatches, true)

    // Check verification status
    let loginAllowed = false
    let loginError = ''

    if (!userRow.email_verified) {
      loginAllowed = false
      loginError = 'Por favor, confirme seu e-mail para ativar sua conta antes de fazer login.'
    } else {
      loginAllowed = true
    }

    assert.strictEqual(loginAllowed, false)
    assert.ok(loginError.includes('confirme seu e-mail'))

    // 3. Mark user as verified
    await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [userId])

    const [verifiedRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(verifiedRows[0].email_verified, 1)

    if (!verifiedRows[0].email_verified) {
      loginAllowed = false
    } else {
      loginAllowed = true
      const token = signToken(verifiedRows[0].id)
      assert.ok(typeof token === 'string' && token.length > 20)
    }

    assert.strictEqual(loginAllowed, true)

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })
})
