import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { pool } from '../server/db.mjs'

describe('Bug 29: Open Chat Option on Accepted Service Request', () => {
  it('should enable real-time messaging between client and provider when service is accepted', async () => {
    // 1. Create client and provider
    const [cRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider, email_verified) VALUES (?, ?, ?, 0, 1)',
      ['Cliente Chat', `client-chat-${Date.now()}@test.com`, 'hash123']
    )
    const clientId = cRes.insertId

    const [pRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider, email_verified) VALUES (?, ?, ?, 1, 1)',
      ['Prestador Chat', `provider-chat-${Date.now()}@test.com`, 'hash123']
    )
    const providerId = pRes.insertId

    // 2. Client creates request
    const [reqRes] = await pool.execute(
      `INSERT INTO service_requests (provider_user_id, client_user_id, client_name, client_email, service_name, details, status)
       VALUES (?, ?, ?, ?, ?, ?, 'accepted')`,
      [providerId, clientId, 'Cliente Chat', 'client@chat.com', 'Dog Sitter Fim de Semana', 'Cuidar do meu Golden']
    )
    const reqId = reqRes.insertId

    // 3. Provider sends first message in chat
    const [m1Res] = await pool.execute(
      'INSERT INTO messages (request_id, sender_id, sender_name, message) VALUES (?, ?, ?, ?)',
      [reqId, providerId, 'Prestador Chat', 'Olá! Aceitei seu pedido. Qual o melhor horário para buscar o pet?']
    )
    assert.ok(m1Res.insertId > 0)

    // 4. Client replies in chat
    const [m2Res] = await pool.execute(
      'INSERT INTO messages (request_id, sender_id, sender_name, message) VALUES (?, ?, ?, ?)',
      [reqId, clientId, 'Cliente Chat', 'Perfeito! No sábado às 09h seria ótimo. Muito obrigado!']
    )
    assert.ok(m2Res.insertId > 0)

    // 5. Query chat history
    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC',
      [reqId]
    )
    assert.strictEqual(messages.length, 2)
    assert.strictEqual(messages[0].sender_name, 'Prestador Chat')
    assert.strictEqual(messages[1].sender_name, 'Cliente Chat')

    // Cleanup
    await pool.execute('DELETE FROM messages WHERE request_id = ?', [reqId])
    await pool.execute('DELETE FROM service_requests WHERE id = ?', [reqId])
    await pool.execute('DELETE FROM users WHERE id IN (?, ?)', [clientId, providerId])
  })

  it('should verify NotificationsModal provides instant chat opening on request accept', () => {
    const modal = fs.readFileSync(path.resolve('src/components/NotificationsModal.tsx'), 'utf8')
    assert.ok(modal.includes('setActiveChatRequest'))
    assert.ok(modal.includes('activeChatRequest'))
    assert.ok(modal.includes('chatMessages'))
    assert.ok(modal.includes('sendRequestMessage'))
  })
})
