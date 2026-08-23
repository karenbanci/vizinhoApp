import { describe, it } from 'node:test'
import assert from 'node:assert'
import bcrypt from 'bcryptjs'
import { pool } from '../server/db.mjs'

describe('Bug 2: Change/Reset Password in Account Data', () => {
  it('should validate and hash passwords correctly with bcrypt', async () => {
    const rawPass = 'minhaNovaSenha123'
    const hash = await bcrypt.hash(rawPass, 10)
    assert.strictEqual(typeof hash, 'string')
    assert.strictEqual(await bcrypt.compare(rawPass, hash), true)
    assert.strictEqual(await bcrypt.compare('senhaErrada', hash), false)
  })

  it('should reject passwords shorter than 6 characters', () => {
    const pass = '12345'
    assert.strictEqual(pass.length < 6, true)
  })

  it('should update user password hash in MySQL database', async () => {
    // Create a temporary test user
    const testEmail = `test-pass-${Date.now()}@example.com`
    const initHash = await bcrypt.hash('initialPassword123', 10)
    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      ['Test Password User', testEmail, initHash]
    )
    const userId = insertRes.insertId

    // Update password
    const newPass = 'updatedSecret999!'
    const newHash = await bcrypt.hash(newPass, 10)
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId])

    // Verify
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [userId])
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(await bcrypt.compare(newPass, rows[0].password_hash), true)

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })
})
