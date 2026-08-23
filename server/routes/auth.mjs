import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { pool } from '../db.mjs'
import { signToken } from '../auth.mjs'
import { cleanUser, mapProviderDetail } from '../users.mjs'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'vizinho-dev-secret'
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function getUserContext(userId) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
  if (rows.length === 0) return null
  const user = cleanUser(rows[0])
  const [profiles] = await pool.execute('SELECT * FROM provider_profiles WHERE user_id = ?', [userId])
  user.providerProfile = profiles.length > 0 ? mapProviderDetail(profiles[0]) : null
  return user
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {}

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' })
  }

  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
    }

    const password_hash = await bcrypt.hash(password, 10)
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    )

    const user = { id: result.insertId, name, email, isProvider: false, providerProfile: null }
    res.status(201).json({ user, token: signToken(result.insertId) })
  } catch (err) {
    console.error('register:', err)
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' })
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
    }

    const row = rows[0]
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
    }

    const user = await getUserContext(row.id)
    res.json({ user, token: signToken(row.id) })
  } catch (err) {
    console.error('login:', err)
    res.status(500).json({ error: 'Erro ao fazer login.' })
  }
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body ?? {}
  if (!email) {
    return res.status(400).json({ error: 'Informe seu e-mail.' })
  }

  try {
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
    if (rows.length > 0) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashToken(token)
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
      await pool.execute(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [rows[0].id, tokenHash, expiresAt]
      )
      const resetUrl = `http://localhost:8443/?reset=${token}`
      console.log(`\n🔑 Redefinição de senha para ${email}:\n${resetUrl}\n`)
      res.json({
        message: 'Se o e-mail existir, você receberá um link para redefinir sua senha.',
        resetUrl,
      })
    } else {
      res.json({ message: 'Se o e-mail existir, você receberá um link para redefinir sua senha.' })
    }
  } catch (err) {
    console.error('forgot-password:', err)
    res.status(500).json({ error: 'Erro ao solicitar redefinição de senha.' })
  }
})

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body ?? {}

  if (!token || !password) {
    return res.status(400).json({ error: 'Informe o token e a nova senha.' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' })
  }

  try {
    const tokenHash = hashToken(token)
    const [rows] = await pool.execute(
      'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?',
      [tokenHash]
    )
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Link de redefinição inválido ou já utilizado.' })
    }

    const record = rows[0]
    if (record.used_at) {
      return res.status(400).json({ error: 'Link de redefinição inválido ou já utilizado.' })
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Este link expirou. Solicite um novo.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, record.user_id])
    await pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [record.id])

    res.json({ message: 'Senha redefinida com sucesso. Faça login com a nova senha.' })
  } catch (err) {
    console.error('reset-password:', err)
    res.status(500).json({ error: 'Erro ao redefinir a senha.' })
  }
})

router.get('/me', async (req, res) => {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Não autenticado.' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await getUserContext(payload.sub)
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' })
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' })
  }
})

export default router
