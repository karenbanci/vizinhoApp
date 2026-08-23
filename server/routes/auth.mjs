import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { pool } from '../db.mjs'
import { signToken } from '../auth.mjs'
import { cleanUser, mapProviderDetail } from '../users.mjs'
import { sendVerificationEmail } from '../services/email.mjs'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'vizinho-dev-secret'
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
const VERIFY_TOKEN_TTL_MS = 15 * 60 * 1000

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

async function createAndSendEmailVerification(userId, email, name, host) {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)

  try {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (email),
        INDEX (code),
        INDEX (token_hash)
      )`
    )
  } catch {
    // Table already exists
  }

  await pool.execute(
    'INSERT INTO email_verification_tokens (user_id, email, code, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
    [userId, email, code, tokenHash, expiresAt]
  )

  const origin = host?.includes('8443') || host?.includes('localhost') ? 'http://localhost:8443' : `https://${host}`
  const verifyLink = `${origin}/?verify_token=${rawToken}`

  console.log(`\n📧 [Código de verificação para ${email}]: ${code}`)
  console.log(`🔗 Link de confirmação: ${verifyLink}\n`)

  let emailRes = { delivered: false, to: email, code, verifyLink }
  try {
    emailRes = await sendVerificationEmail({ to: email, name, code, verifyLink })
  } catch (mailErr) {
    console.warn('⚠️ [Email Service] Falha ao disparar e-mail:', mailErr?.message || mailErr)
    emailRes = { delivered: false, to: email, code, verifyLink, error: mailErr?.message }
  }

  return { code, rawToken, emailRes }
}

router.post('/register', async (req, res) => {
  const { name, email, password, accountType = 'client' } = req.body ?? {}

  const cleanName = (name || '').trim()
  const cleanEmail = (email || '').trim().toLowerCase()

  if (!cleanName || !cleanEmail || !password) {
    return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' })
  }
  if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
    return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' })
  }

  try {
    try {
      await pool.execute("ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'client'")
    } catch {
      // Column exists
    }

    const [existing] = await pool.execute('SELECT id, email_verified FROM users WHERE email = ?', [cleanEmail])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
    }

    const isProviderAccount = accountType === 'provider'
    const isProvider = isProviderAccount ? 1 : 0
    const resolvedAccountType = isProviderAccount ? 'provider' : 'client'
    const password_hash = await bcrypt.hash(password, 10)

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, email_verified, is_provider, account_type) VALUES (?, ?, ?, 0, ?, ?)',
      [cleanName, cleanEmail, password_hash, isProvider, resolvedAccountType]
    )

    const userId = result.insertId
    const { code, rawToken, emailRes } = await createAndSendEmailVerification(userId, cleanEmail, cleanName, req.get('host'))

    const origin = req.get('host')?.includes('8443') || req.get('host')?.includes('localhost')
      ? 'http://localhost:8443'
      : `https://${req.get('host')}`
    const verifyUrl = `${origin}/?verify_token=${rawToken}`

    const user = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      isProvider: isProviderAccount,
      accountType: resolvedAccountType,
      emailVerified: false,
      providerProfile: null,
    }
    res.status(201).json({
      pendingVerification: true,
      email: cleanEmail,
      user,
      code,
      verifyUrl,
      delivered: emailRes?.delivered ?? false,
      message: 'Código de confirmação enviado para seu e-mail!',
    })
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ error: 'Erro ao cadastrar usuário. Tente novamente.' })
  }
})

router.post('/google', async (req, res) => {
  const { email, name, googleId, picture, accountType } = req.body ?? {}

  if (!email) {
    return res.status(400).json({ error: 'E-mail não fornecido pelo Google.' })
  }

  try {
    try {
      await pool.execute("ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'client'")
    } catch {
      // Column exists
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = (name || cleanEmail.split('@')[0]).trim()

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [cleanEmail])
    let userId

    if (rows.length > 0) {
      userId = rows[0].id
      await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [userId])
    } else {
      const isProviderAccount = accountType === 'provider'
      const isProvider = isProviderAccount ? 1 : 0
      const resolvedAccountType = isProviderAccount ? 'provider' : 'client'
      const randomPassword = crypto.randomBytes(16).toString('hex')
      const passwordHash = await bcrypt.hash(randomPassword, 10)
      const [insertRes] = await pool.execute(
        'INSERT INTO users (name, email, password_hash, email_verified, is_provider, account_type) VALUES (?, ?, ?, 1, ?, ?)',
        [cleanName, cleanEmail, passwordHash, isProvider, resolvedAccountType]
      )
      userId = insertRes.insertId
    }

    const user = await getUserContext(userId)
    const token = signToken(userId)

    res.json({
      user,
      token,
      message: 'Autenticado com Google com sucesso!',
    })
  } catch (err) {
    console.error('google auth error:', err)
    res.status(500).json({ error: 'Erro ao autenticar com o Google.' })
  }
})

router.post('/verify-email', async (req, res) => {
  const { email, code, token } = req.body ?? {}

  try {
    let verificationRecord = null

    if (token) {
      const tHash = hashToken(token)
      const [rows] = await pool.execute(
        'SELECT * FROM email_verification_tokens WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL',
        [tHash]
      )
      if (rows.length > 0) verificationRecord = rows[0]
    } else if (email && code) {
      const [rows] = await pool.execute(
        'SELECT * FROM email_verification_tokens WHERE email = ? AND code = ? AND expires_at > NOW() AND used_at IS NULL ORDER BY id DESC LIMIT 1',
        [email.trim(), code.trim()]
      )
      if (rows.length > 0) verificationRecord = rows[0]
    }

    if (!verificationRecord) {
      return res.status(400).json({ error: 'Código ou link de confirmação inválido ou expirado.' })
    }

    await pool.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [verificationRecord.id])
    await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [verificationRecord.user_id])

    const user = await getUserContext(verificationRecord.user_id)
    const jwtToken = signToken(verificationRecord.user_id)

    res.json({
      ok: true,
      user,
      token: jwtToken,
      message: 'E-mail confirmado com sucesso!',
    })
  } catch (err) {
    console.error('verify-email error:', err)
    res.status(500).json({ error: 'Erro ao verificar e-mail.' })
  }
})

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body ?? {}
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) {
    return res.status(400).json({ error: 'Informe seu e-mail.' })
  }

  try {
    const [rows] = await pool.execute('SELECT id, name, email_verified FROM users WHERE email = ?', [cleanEmail])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    const row = rows[0]
    if (row.email_verified) {
      return res.status(400).json({ error: 'Este e-mail já está confirmado.' })
    }

    const { code, rawToken, emailRes } = await createAndSendEmailVerification(row.id, cleanEmail, row.name, req.get('host'))
    const origin = req.get('host')?.includes('8443') || req.get('host')?.includes('localhost')
      ? 'http://localhost:8443'
      : `https://${req.get('host')}`
    const verifyUrl = `${origin}/?verify_token=${rawToken}`

    res.json({
      ok: true,
      code,
      verifyUrl,
      delivered: emailRes?.delivered ?? false,
      message: 'Novo código de confirmação enviado para seu e-mail!',
    })
  } catch (err) {
    console.error('resend verification error:', err)
    res.status(500).json({ error: 'Erro ao reenviar confirmação.' })
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

    if (!row.email_verified) {
      return res.status(403).json({
        error: 'Por favor, confirme seu e-mail para ativar sua conta antes de fazer login.',
        needsVerification: true,
        email: row.email,
      })
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
