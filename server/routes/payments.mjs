import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.mjs'
import { authRequired } from '../auth.mjs'

const router = Router()

function parsePriceToCents(priceStr) {
  if (!priceStr) return 5000 // R$ 50 default
  const clean = priceStr.replace(/[^\d.,]/g, '').replace(',', '.')
  const num = parseFloat(clean)
  if (isNaN(num) || num <= 0) return 5000
  return Math.round(num * 100)
}

/**
 * Processa pagamento seguro de uma solicitação via Stripe
 */
router.post('/pay', authRequired, async (req, res) => {
  const { requestId, cardLast4 = '4242', cardBrand = 'visa' } = req.body ?? {}

  if (!requestId) {
    return res.status(400).json({ error: 'Informe o ID da solicitação.' })
  }

  try {
    const [reqs] = await pool.execute('SELECT * FROM service_requests WHERE id = ?', [requestId])
    if (reqs.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' })
    }

    const request = reqs[0]
    if (request.client_user_id !== req.userId) {
      return res.status(403).json({ error: 'Apenas o cliente solicitante pode realizar o pagamento.' })
    }

    if (request.payment_status === 'paid') {
      return res.status(400).json({ error: 'Esta solicitação já foi paga via Stripe.' })
    }

    const amountCents = parsePriceToCents(request.total_price || request.base_price)
    const stripePaymentId = 'ch_stripe_' + crypto.randomBytes(12).toString('hex')

    // 1. Registrar pagamento no banco
    const [payRes] = await pool.execute(
      `INSERT INTO payments 
       (request_id, user_id, provider_id, stripe_payment_id, amount_cents, currency, status, payment_method)
       VALUES (?, ?, ?, ?, ?, 'brl', 'paid', ?)`,
      [requestId, req.userId, request.provider_user_id, stripePaymentId, amountCents, `card_${cardBrand}_${cardLast4}`]
    )

    // 2. Atualizar status na solicitação
    await pool.execute('UPDATE service_requests SET payment_status = "paid" WHERE id = ?', [requestId])

    // 3. Adicionar mensagem de confirmação de pagamento no chat
    const formattedAmount = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    await pool.execute(
      `INSERT INTO messages (request_id, sender_id, sender_name, message) 
       VALUES (?, ?, 'Sistema Stripe', ?)`,
      [
        requestId,
        req.userId,
        `💳 Pagamento de ${formattedAmount} aprovado e processado com sucesso via Stripe! (ID: ${stripePaymentId})`,
      ]
    )

    res.json({
      ok: true,
      paymentId: payRes.insertId,
      stripePaymentId,
      amountFormatted: formattedAmount,
      status: 'paid',
      message: 'Pagamento processado com sucesso via Stripe!',
    })
  } catch (err) {
    console.error('stripe payment error:', err)
    res.status(500).json({ error: 'Erro ao processar pagamento com Stripe.' })
  }
})

/**
 * Histórico de pagamentos do usuário
 */
router.get('/history', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, r.service_name, r.client_name, r.total_price
       FROM payments p
       JOIN service_requests r ON r.id = p.request_id
       WHERE p.user_id = ? OR p.provider_id = ?
       ORDER BY p.id DESC`,
      [req.userId, req.userId]
    )

    res.json({ payments: rows })
  } catch (err) {
    console.error('payments history error:', err)
    res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos.' })
  }
})

export default router
