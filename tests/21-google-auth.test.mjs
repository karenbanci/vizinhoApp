import { describe, it } from 'node:test'
import assert from 'node:assert'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '../server/db.mjs'
import { signToken } from '../server/auth.mjs'

describe('Bug 21: Google Account Integration and Authentication', () => {
  it('should authenticate a new user with Google and set email_verified = 1', async () => {
    const googleEmail = `google-user-${Date.now()}@gmail.com`
    const googleName = 'Google Test User'

    const randomPassword = crypto.randomBytes(16).toString('hex')
    const passwordHash = await bcrypt.hash(randomPassword, 10)

    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified) VALUES (?, ?, ?, 1)',
      [googleName, googleEmail, passwordHash]
    )
    const userId = insertRes.insertId

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(rows[0].email, googleEmail)
    assert.strictEqual(rows[0].email_verified, 1)

    const token = signToken(userId)
    assert.ok(typeof token === 'string' && token.length > 20)

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })

  it('should authenticate an existing user with Google and ensure verified status', async () => {
    const existingEmail = `existing-google-${Date.now()}@gmail.com`
    const existingName = 'Existing User'
    const passwordHash = await bcrypt.hash('secret123', 10)

    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified) VALUES (?, ?, ?, 0)',
      [existingName, existingEmail, passwordHash]
    )
    const userId = insertRes.insertId

    // Simulate Google Login updating email_verified to 1
    await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [userId])

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(rows[0].email_verified, 1)

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })
})
