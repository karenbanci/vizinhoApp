import { describe, it } from 'node:test'
import assert from 'node:assert'
import { pool } from '../server/db.mjs'

describe('Bug 5 & 6: Notifications, Service Requests & Chat', () => {
  it('should create and retrieve service requests with status pending', async () => {
    // 1. Create test provider and test client
    const [pRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider) VALUES (?, ?, ?, 1)',
      ['Test Provider', `provider-${Date.now()}@test.com`, 'hash']
    )
    const providerId = pRes.insertId

    const [cRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      ['Test Client', `client-${Date.now()}@test.com`, 'hash']
    )
    const clientId = cRes.insertId

    // 2. Create service request
    const [reqRes] = await pool.execute(
      `INSERT INTO service_requests 
       (provider_user_id, client_user_id, client_name, client_email, service_name, details, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [providerId, clientId, 'Test Client', 'client@test.com', 'Dog Walking', 'Preciso de passeio amanhã às 10h']
    )
    const requestId = reqRes.insertId

    // 3. Verify request exists and has status pending
    const [rows] = await pool.execute('SELECT * FROM service_requests WHERE id = ?', [requestId])
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(rows[0].status, 'pending')
    assert.strictEqual(rows[0].service_name, 'Dog Walking')

    // 4. Update status to accepted
    await pool.execute('UPDATE service_requests SET status = "accepted" WHERE id = ?', [requestId])
    const [updatedRows] = await pool.execute('SELECT status FROM service_requests WHERE id = ?', [requestId])
    assert.strictEqual(updatedRows[0].status, 'accepted')

    // 5. Send chat message between provider and client
    const [msgRes] = await pool.execute(
      'INSERT INTO messages (request_id, sender_id, sender_name, message) VALUES (?, ?, ?, ?)',
      [requestId, clientId, 'Test Client', 'Olá, tudo bem? Podemos combinar para as 10h?']
    )
    assert.ok(msgRes.insertId > 0)

    const [msgRows] = await pool.execute('SELECT * FROM messages WHERE request_id = ?', [requestId])
    assert.strictEqual(msgRows.length, 1)
    assert.strictEqual(msgRows[0].message, 'Olá, tudo bem? Podemos combinar para as 10h?')

    // Cleanup
    await pool.execute('DELETE FROM service_requests WHERE id = ?', [requestId])
    await pool.execute('DELETE FROM users WHERE id IN (?, ?)', [providerId, clientId])
  })
})
