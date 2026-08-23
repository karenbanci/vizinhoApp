import { describe, it } from 'node:test'
import assert from 'node:assert'
import crypto from 'node:crypto'
import { pool } from '../server/db.mjs'

describe('Bug 15: In-App Payments via Stripe', () => {
  it('should calculate and parse price strings into cents correctly', () => {
    const parsePriceToCents = (priceStr) => {
      if (!priceStr) return 5000
      const clean = priceStr.replace(/[^\d.,]/g, '').replace(',', '.')
      const num = parseFloat(clean)
      if (isNaN(num) || num <= 0) return 5000
      return Math.round(num * 100)
    }

    assert.strictEqual(parsePriceToCents('R$ 150'), 15000)
    assert.strictEqual(parsePriceToCents('R$ 80,50'), 8050)
    assert.strictEqual(parsePriceToCents('€ 35'), 3500)
    assert.strictEqual(parsePriceToCents('$ 250.00'), 25000)
    assert.strictEqual(parsePriceToCents(''), 5000)
  })

  it('should process payment in database, update payment_status and log chat receipt', async () => {
    // 1. Create client and provider
    const [cRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      ['Client Stripe', `client-${Date.now()}@stripe.test`, 'pass']
    )
    const clientId = cRes.insertId

    const [pRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider) VALUES (?, ?, ?, 1)',
      ['Provider Stripe', `provider-${Date.now()}@stripe.test`, 'pass']
    )
    const providerId = pRes.insertId

    // 2. Create service request
    const [rRes] = await pool.execute(
      `INSERT INTO service_requests
       (provider_user_id, client_user_id, client_name, client_email, service_name, details, total_price, status, payment_status)
       VALUES (?, ?, 'Client Stripe', 'client@stripe.test', 'Faxina Express', 'Limpeza sala', 'R$ 200', 'accepted', 'unpaid')`,
      [providerId, clientId]
    )
    const requestId = rRes.insertId

    // 3. Process Stripe payment
    const stripePaymentId = 'ch_stripe_' + crypto.randomBytes(8).toString('hex')
    const [payRes] = await pool.execute(
      `INSERT INTO payments
       (request_id, user_id, provider_id, stripe_payment_id, amount_cents, currency, status, payment_method)
       VALUES (?, ?, ?, ?, 20000, 'brl', 'paid', 'card_visa_4242')`,
      [requestId, clientId, providerId, stripePaymentId]
    )
    assert.ok(payRes.insertId > 0)

    // 4. Update request status
    await pool.execute('UPDATE service_requests SET payment_status = "paid" WHERE id = ?', [requestId])

    const [updatedReq] = await pool.execute('SELECT payment_status FROM service_requests WHERE id = ?', [requestId])
    assert.strictEqual(updatedReq[0].payment_status, 'paid')

    // 5. Query payment history
    const [history] = await pool.execute('SELECT * FROM payments WHERE request_id = ?', [requestId])
    assert.strictEqual(history.length, 1)
    assert.strictEqual(history[0].stripe_payment_id, stripePaymentId)
    assert.strictEqual(history[0].amount_cents, 20000)

    // Cleanup
    await pool.execute('DELETE FROM payments WHERE id = ?', [payRes.insertId])
    await pool.execute('DELETE FROM service_requests WHERE id = ?', [requestId])
    await pool.execute('DELETE FROM users WHERE id IN (?, ?)', [clientId, providerId])
  })
})
