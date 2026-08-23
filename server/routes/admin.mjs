import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { pool } from '../db.mjs'

const router = Router()
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora de validade

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// 1. GET /api/admin/users - Lista todos os usuários cadastrados com dados para administração
router.get('/users', async (req, res) => {
  const { search } = req.query
  try {
    let sql = `
      SELECT u.id, u.name, u.email, u.is_provider, u.created_at,
             p.category, p.category_label, p.city, p.state, p.country,
             (SELECT COUNT(*) FROM password_reset_tokens prt WHERE prt.user_id = u.id) AS total_reset_tokens,
             (SELECT MAX(created_at) FROM password_reset_tokens prt WHERE prt.user_id = u.id) AS last_reset_at
      FROM users u
      LEFT JOIN provider_profiles p ON p.user_id = u.id
    `
    const params = []
    if (search && typeof search === 'string' && search.trim()) {
      const q = `%${search.trim()}%`
      sql += ` WHERE u.name LIKE ? OR u.email LIKE ?`
      params.push(q, q)
    }
    sql += ` ORDER BY u.id DESC`

    const [rows] = await pool.execute(sql, params)
    const users = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      isProvider: !!r.is_provider,
      createdAt: r.created_at,
      profile: r.is_provider
        ? {
            category: r.category,
            categoryLabel: r.category_label,
            location: [r.city, r.state, r.country].filter(Boolean).join(', '),
          }
        : null,
      totalResetTokens: Number(r.total_reset_tokens || 0),
      lastResetAt: r.last_reset_at,
    }))

    res.json({ users })
  } catch (err) {
    console.error('admin get users error:', err)
    res.status(500).json({ error: 'Erro ao buscar usuários para o painel admin.' })
  }
})

// 2. POST /api/admin/users/reset-password - Redefinição direta de senha pelo administrador
router.post('/users/reset-password', async (req, res) => {
  const { userId, email, newPassword } = req.body ?? {}
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' })
  }

  try {
    let userRow = null
    if (userId) {
      const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE id = ?', [userId])
      if (rows.length > 0) userRow = rows[0]
    } else if (email) {
      const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE email = ?', [
        email.trim().toLowerCase(),
      ])
      if (rows.length > 0) userRow = rows[0]
    }

    if (!userRow) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userRow.id])

    // Invalida quaisquer tokens pendentes anteriores para este usuário
    await pool.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [userRow.id]
    )

    res.json({
      ok: true,
      message: `Senha de ${userRow.name} (${userRow.email}) redefinida com sucesso!`,
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
      },
    })
  } catch (err) {
    console.error('admin direct reset error:', err)
    res.status(500).json({ error: 'Erro ao redefinir a senha do usuário.' })
  }
})

// 3. POST /api/admin/users/generate-reset-link - Gera link direto de redefinição para o usuário
router.post('/users/generate-reset-link', async (req, res) => {
  const { userId, email } = req.body ?? {}

  try {
    let userRow = null
    if (userId) {
      const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE id = ?', [userId])
      if (rows.length > 0) userRow = rows[0]
    } else if (email) {
      const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE email = ?', [
        email.trim().toLowerCase(),
      ])
      if (rows.length > 0) userRow = rows[0]
    }

    if (!userRow) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userRow.id, tokenHash, expiresAt]
    )

    const resetUrl = `http://localhost:8443/?reset=${token}`

    res.json({
      ok: true,
      token,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
      },
    })
  } catch (err) {
    console.error('admin generate reset link error:', err)
    res.status(500).json({ error: 'Erro ao gerar link de redefinição.' })
  }
})

// 4. GET /api/admin/tokens - Histórico recente de tokens de reset
router.get('/tokens', async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, prt.created_at,
             u.name AS user_name, u.email AS user_email
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      ORDER BY prt.created_at DESC
      LIMIT 50
    `)

    const now = Date.now()
    const tokens = rows.map((r) => {
      const isUsed = !!r.used_at
      const isExpired = !isUsed && new Date(r.expires_at).getTime() < now
      const status = isUsed ? 'used' : isExpired ? 'expired' : 'active'

      return {
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        expiresAt: r.expires_at,
        usedAt: r.used_at,
        createdAt: r.created_at,
        status,
      }
    })

    res.json({ tokens })
  } catch (err) {
    console.error('admin tokens error:', err)
    res.status(500).json({ error: 'Erro ao listar histórico de tokens.' })
  }
})

// 5. GET /api/admin/stats - Estatísticas gerais
router.get('/stats', async (_req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.execute('SELECT COUNT(*) AS totalUsers FROM users')
    const [[{ totalProviders }]] = await pool.execute(
      'SELECT COUNT(*) AS totalProviders FROM users WHERE is_provider = 1'
    )
    const [[{ activeTokens }]] = await pool.execute(
      'SELECT COUNT(*) AS activeTokens FROM password_reset_tokens WHERE used_at IS NULL AND expires_at > NOW()'
    )
    const [[{ totalTokens }]] = await pool.execute(
      'SELECT COUNT(*) AS totalTokens FROM password_reset_tokens'
    )

    res.json({
      totalUsers: Number(totalUsers || 0),
      totalProviders: Number(totalProviders || 0),
      totalClients: Number(totalUsers || 0) - Number(totalProviders || 0),
      activeTokens: Number(activeTokens || 0),
      totalTokens: Number(totalTokens || 0),
    })
  } catch (err) {
    console.error('admin stats error:', err)
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' })
  }
})

export default router
