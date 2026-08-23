import { describe, it } from 'node:test'
import assert from 'node:assert'
import bcrypt from 'bcryptjs'
import { pool } from '../server/db.mjs'
import { cleanUser } from '../server/users.mjs'

describe('Bug 22: Account Type Separation (Client vs Provider)', () => {
  it('should register client account with is_provider = 0 and account_type = "client"', async () => {
    const email = `client-test-${Date.now()}@example.com`
    const passwordHash = await bcrypt.hash('secret123', 10)

    try {
      await pool.execute("ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'client'")
    } catch {
      // ignore
    }

    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified, is_provider, account_type) VALUES (?, ?, ?, 1, 0, ?)',
      ['Test Client', email, passwordHash, 'client']
    )
    const userId = insertRes.insertId

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(rows.length, 1)

    const cleaned = cleanUser(rows[0])
    assert.strictEqual(cleaned.isProvider, false)
    assert.strictEqual(cleaned.accountType, 'client')

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })

  it('should register provider account with is_provider = 1 and account_type = "provider"', async () => {
    const email = `provider-test-${Date.now()}@example.com`
    const passwordHash = await bcrypt.hash('secret123', 10)

    const [insertRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified, is_provider, account_type) VALUES (?, ?, ?, 1, 1, ?)',
      ['Test Provider', email, passwordHash, 'provider']
    )
    const userId = insertRes.insertId

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    assert.strictEqual(rows.length, 1)

    const cleaned = cleanUser(rows[0])
    assert.strictEqual(cleaned.isProvider, true)
    assert.strictEqual(cleaned.accountType, 'provider')

    // Cleanup
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })
})
