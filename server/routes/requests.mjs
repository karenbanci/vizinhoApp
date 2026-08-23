import { Router } from 'express'
import { pool } from '../db.mjs'
import { authRequired } from '../auth.mjs'

const router = Router()

// 1. POST /api/requests - Criar nova solicitação de serviço
router.post('/', authRequired, async (req, res) => {
  const {
    providerUserId,
    serviceName,
    details,
    dateTime = '',
    location = '',
    basePrice = '',
    shippingPrice = '',
    totalPrice = '',
  } = req.body ?? {}

  if (!providerUserId) {
    return res.status(400).json({ error: 'Prestador não especificado.' })
  }
  if (!serviceName || !details) {
    return res.status(400).json({ error: 'Preencha o serviço e os detalhes da solicitação.' })
  }

  try {
    const [clientRows] = await pool.execute('SELECT id, name, email FROM users WHERE id = ?', [req.userId])
    if (clientRows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado.' })
    }
    const client = clientRows[0]

    const [insertResult] = await pool.execute(
      `INSERT INTO service_requests 
       (provider_user_id, client_user_id, client_name, client_email, service_name, details, date_time, location, base_price, shipping_price, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        providerUserId,
        client.id,
        client.name,
        client.email,
        serviceName,
        details,
        dateTime,
        location,
        basePrice,
        shippingPrice,
        totalPrice,
      ]
    )

    const [rows] = await pool.execute('SELECT * FROM service_requests WHERE id = ?', [insertResult.insertId])

    res.status(201).json({ ok: true, request: rows[0] })
  } catch (err) {
    console.error('create request error:', err)
    res.status(500).json({ error: 'Erro ao enviar solicitação de serviço.' })
  }
})

// 2. GET /api/requests - Listar solicitações (recebidas como prestador e enviadas como cliente)
router.get('/', authRequired, async (req, res) => {
  try {
    const [received] = await pool.execute(
      `SELECT sr.*, u.name AS provider_name, u.email AS provider_email
       FROM service_requests sr
       JOIN users u ON u.id = sr.provider_user_id
       WHERE sr.provider_user_id = ?
       ORDER BY sr.created_at DESC`,
      [req.userId]
    )

    const [sent] = await pool.execute(
      `SELECT sr.*, u.name AS provider_name, u.email AS provider_email
       FROM service_requests sr
       JOIN users u ON u.id = sr.provider_user_id
       WHERE sr.client_user_id = ?
       ORDER BY sr.created_at DESC`,
      [req.userId]
    )

    const pendingCount = received.filter((r) => r.status === 'pending').length

    res.json({
      received,
      sent,
      pendingCount,
    })
  } catch (err) {
    console.error('get requests error:', err)
    res.status(500).json({ error: 'Erro ao carregar solicitações.' })
  }
})

// 3. PATCH /api/requests/:id/status - Aceitar ou recusar solicitação
router.patch('/:id/status', authRequired, async (req, res) => {
  const { status } = req.body ?? {}
  const { id } = req.params

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use "accepted" ou "rejected".' })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM service_requests WHERE id = ? AND provider_user_id = ?',
      [id, req.userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada ou você não tem permissão.' })
    }

    await pool.execute('UPDATE service_requests SET status = ?, updated_at = NOW() WHERE id = ?', [
      status,
      id,
    ])

    const [updated] = await pool.execute('SELECT * FROM service_requests WHERE id = ?', [id])
    res.json({ ok: true, request: updated[0] })
  } catch (err) {
    console.error('update request status error:', err)
    res.status(500).json({ error: 'Erro ao atualizar status da solicitação.' })
  }
})

// 4. GET /api/requests/:id/messages - Mensagens de um chat de solicitação
router.get('/:id/messages', authRequired, async (req, res) => {
  const { id } = req.params

  try {
    const [reqRows] = await pool.execute(
      'SELECT * FROM service_requests WHERE id = ? AND (provider_user_id = ? OR client_user_id = ?)',
      [id, req.userId, req.userId]
    )
    if (reqRows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado a este chat.' })
    }

    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC',
      [id]
    )

    res.json({ messages })
  } catch (err) {
    console.error('get messages error:', err)
    res.status(500).json({ error: 'Erro ao carregar mensagens.' })
  }
})

// 5. POST /api/requests/:id/messages - Enviar mensagem no chat
router.post('/:id/messages', authRequired, async (req, res) => {
  const { id } = req.params
  const { message } = req.body ?? {}

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'A mensagem não pode ser vazia.' })
  }

  try {
    const [reqRows] = await pool.execute(
      'SELECT * FROM service_requests WHERE id = ? AND (provider_user_id = ? OR client_user_id = ?)',
      [id, req.userId, req.userId]
    )
    if (reqRows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado a este chat.' })
    }

    const [userRows] = await pool.execute('SELECT name FROM users WHERE id = ?', [req.userId])
    const senderName = userRows[0]?.name || 'Usuário'

    const [insertResult] = await pool.execute(
      'INSERT INTO messages (request_id, sender_id, sender_name, message) VALUES (?, ?, ?, ?)',
      [id, req.userId, senderName, message.trim()]
    )

    const [newMsg] = await pool.execute('SELECT * FROM messages WHERE id = ?', [insertResult.insertId])
    res.status(201).json({ ok: true, message: newMsg[0] })
  } catch (err) {
    console.error('send message error:', err)
    res.status(500).json({ error: 'Erro ao enviar mensagem.' })
  }
})

export default router
