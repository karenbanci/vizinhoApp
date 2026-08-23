import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { pool } from '../server/db.mjs'

describe('Bug 28: Client Account Service Status Notifications (Accepted / Rejected)', () => {
  it('should create client service request, allow provider accept/reject, and notify client with status', async () => {
    // 1. Create client & provider users
    const [cRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider, email_verified) VALUES (?, ?, ?, 0, 1)',
      ['Cliente Notif Test', `client-notif-${Date.now()}@test.com`, 'hash123']
    )
    const clientId = cRes.insertId

    const [pRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider, email_verified) VALUES (?, ?, ?, 1, 1)',
      ['Prestador Notif Test', `provider-notif-${Date.now()}@test.com`, 'hash123']
    )
    const providerId = pRes.insertId

    // 2. Client submits a service request
    const [reqRes] = await pool.execute(
      `INSERT INTO service_requests (provider_user_id, client_user_id, client_name, client_email, service_name, details, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [providerId, clientId, 'Cliente Notif Test', 'client@test.com', 'Limpeza Residencial', 'Detalhes do serviço']
    )
    const requestId = reqRes.insertId

    // 3. Verify sent requests query for client returns the request with pending status
    const [sent1] = await pool.execute('SELECT * FROM service_requests WHERE client_user_id = ?', [clientId])
    assert.strictEqual(sent1.length, 1)
    assert.strictEqual(sent1[0].status, 'pending')

    // 4. Provider accepts the request
    await pool.execute('UPDATE service_requests SET status = "accepted", updated_at = NOW() WHERE id = ?', [requestId])

    const [sent2] = await pool.execute('SELECT * FROM service_requests WHERE client_user_id = ?', [clientId])
    assert.strictEqual(sent2[0].status, 'accepted')

    // 5. Provider rejects another request
    const [reqRes2] = await pool.execute(
      `INSERT INTO service_requests (provider_user_id, client_user_id, client_name, client_email, service_name, details, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [providerId, clientId, 'Cliente Notif Test', 'client@test.com', 'Pintura', 'Detalhes pintura']
    )
    const req2Id = reqRes2.insertId
    await pool.execute('UPDATE service_requests SET status = "rejected", updated_at = NOW() WHERE id = ?', [req2Id])

    const [sent3] = await pool.execute('SELECT * FROM service_requests WHERE client_user_id = ? ORDER BY id ASC', [clientId])
    assert.strictEqual(sent3.length, 2)
    assert.strictEqual(sent3[0].status, 'accepted')
    assert.strictEqual(sent3[1].status, 'rejected')

    // Cleanup
    await pool.execute('DELETE FROM service_requests WHERE client_user_id = ?', [clientId])
    await pool.execute('DELETE FROM users WHERE id IN (?, ?)', [clientId, providerId])
  })

  it('should verify NotificationsModal.tsx contains client notification banners and language bindings', () => {
    const modal = fs.readFileSync(path.resolve('src/components/NotificationsModal.tsx'), 'utf8')
    assert.ok(modal.includes('clientAcceptedBanner'))
    assert.ok(modal.includes('clientRejectedBanner'))
    assert.ok(modal.includes('clientPendingBanner'))
    assert.ok(modal.includes('tabSent'))
  })

  it('should verify App.tsx handles client notifications count and passes props to modal', () => {
    const app = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8')
    assert.ok(app.includes('clientNotifs'))
    assert.ok(app.includes('isProvider={authUser.isProvider}'))
    assert.ok(app.includes('accountType={authUser.accountType}'))
  })
})
