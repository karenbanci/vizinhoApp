import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.mjs'
import { authRequired } from '../auth.mjs'
import { mapProviderDetail } from '../users.mjs'
import { getUserContext } from './auth.mjs'

const router = Router()

router.post('/password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {}
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' })
  }

  try {
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.userId])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    if (currentPassword) {
      const ok = await bcrypt.compare(currentPassword, rows[0].password_hash)
      if (!ok) {
        return res.status(400).json({ error: 'A senha atual está incorreta.' })
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.userId])

    res.json({ ok: true, message: 'Senha atualizada com sucesso!' })
  } catch (err) {
    console.error('change password error:', err)
    res.status(500).json({ error: 'Erro ao alterar a senha.' })
  }
})

const CATEGORIES = [
  { id: 'manicure', label: 'Manicure' },
  { id: 'dogsitter', label: 'Dog Sitter' },
  { id: 'confeitaria', label: 'Bolos & Salgados' },
  { id: 'faxina', label: 'Faxina' },
  { id: 'helper', label: 'Helpers' },
]

const SAMPLE_PHOTOS = {
  manicure: 'photo-1534528741775-53994a69daeb',
  dogsitter: 'photo-1548199973-03cce0bbc87b',
  confeitaria: 'photo-1578985545062-69928b1d9587',
  faxina: 'photo-1581578731548-c64695cc6952',
  helper: 'photo-1581092918056-0c4c3acd3789',
}

router.patch('/', authRequired, async (req, res) => {
  const { name, email } = req.body ?? {}

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({ error: 'Informe um nome válido.' })
  }
  if (email !== undefined && typeof email !== 'string') {
    return res.status(400).json({ error: 'Informe um e-mail válido.' })
  }

  try {
    if (email !== undefined) {
      const [dup] = await pool.execute('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.userId])
      if (dup.length > 0) {
        return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
      }
    }

    await pool.execute('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?', [
      name?.trim() ?? null,
      email ?? null,
      req.userId,
    ])
    const user = await getUserContext(req.userId)
    res.json({ user })
  } catch (err) {
    console.error('patch me:', err)
    res.status(500).json({ error: 'Erro ao atualizar perfil.' })
  }
})

router.post('/provider', authRequired, async (req, res) => {
  const { category, nationality } = req.body ?? {}
  const cat = CATEGORIES.find((c) => c.id === category)
  if (!cat) {
    return res.status(400).json({ error: 'Selecione uma categoria de serviço.' })
  }

  const nat = typeof nationality === 'string' && /^[A-Za-z]{2}$/.test(nationality)
    ? nationality.toUpperCase()
    : 'BR'

  try {
    const [existing] = await pool.execute('SELECT id FROM provider_profiles WHERE user_id = ?', [req.userId])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Modo prestador já está ativo.' })
    }

    const photoId = SAMPLE_PHOTOS[cat.id]
    const [result] = await pool.execute(
      `INSERT INTO provider_profiles (user_id, category, category_label, nationality, photo_id, availability, available_now)
       VALUES (?, ?, ?, ?, ?, 'Disponível hoje', 1)`,
      [req.userId, cat.id, cat.label, nat, photoId]
    )
    await pool.execute('UPDATE users SET is_provider = 1 WHERE id = ?', [req.userId])

    const [profiles] = await pool.execute('SELECT * FROM provider_profiles WHERE id = ?', [result.insertId])
    const user = await getUserContext(req.userId)
    res.status(201).json({ user, providerProfile: mapProviderDetail(profiles[0]) })
  } catch (err) {
    console.error('activate provider:', err)
    res.status(500).json({ error: 'Erro ao ativar modo prestador.' })
  }
})

router.patch('/provider', authRequired, async (req, res) => {
  const {
    category,
    nationality,
    country,
    state,
    city,
    description,
    bio,
    price,
    location,
    availability,
    availableNow,
    photoId,
    portfolioIds,
    services,
  } = req.body ?? {}

  try {
    const [existing] = await pool.execute('SELECT id, state, city FROM provider_profiles WHERE user_id = ?', [req.userId])
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Modo prestador não está ativo.' })
    }

    let cat = null
    if (category !== undefined) {
      cat = CATEGORIES.find((c) => c.id === category)
      if (!cat) return res.status(400).json({ error: 'Categoria inválida.' })
    }

    let nat = null
    if (nationality !== undefined) {
      if (typeof nationality !== 'string' || !/^[A-Za-z]{2}$/.test(nationality)) {
        return res.status(400).json({ error: 'Nacionalidade inválida.' })
      }
      nat = nationality.toUpperCase()
    }

    let ctr = null
    if (country !== undefined) {
      if (typeof country !== 'string' || !/^[A-Za-z]{2}$/.test(country)) {
        return res.status(400).json({ error: 'País inválido.' })
      }
      ctr = country.toUpperCase()
    }

    let loc = null
    if (state !== undefined || city !== undefined) {
      const nextState = state ?? existing[0].state ?? ''
      const nextCity = city ?? existing[0].city ?? ''
      loc = [nextCity, nextState].filter(Boolean).join(', ')
    }

    if (bio !== undefined && (typeof bio !== 'string' || bio.trim().length < 5)) {
      return res.status(400).json({ error: 'O preenchimento da Bio é obrigatório (mínimo de 5 caracteres).' })
    }

    const validService = (s) =>
      typeof s === 'string' ||
      (s !== null &&
        typeof s === 'object' &&
        typeof s.name === 'string' &&
        (s.price === undefined || typeof s.price === 'string'))

    if (services !== undefined && (!Array.isArray(services) || services.some((s) => !validService(s)))) {
      return res.status(400).json({ error: 'Serviços inválidos.' })
    }

    const normalizedServices = services
      ? services.map((s) => (typeof s === 'string' ? { name: s } : { name: s.name, price: s.price || undefined }))
      : null

    await pool.execute(
      `UPDATE provider_profiles SET
        category = COALESCE(?, category),
        category_label = COALESCE(?, category_label),
        nationality = COALESCE(?, nationality),
        country = COALESCE(?, country),
        state = COALESCE(?, state),
        city = COALESCE(?, city),
        location = COALESCE(?, location),
        description = COALESCE(?, description),
        bio = COALESCE(?, bio),
        price = COALESCE(?, price),
        availability = COALESCE(?, availability),
        available_now = COALESCE(?, available_now),
        photo_id = COALESCE(?, photo_id),
        portfolio_ids = COALESCE(?, portfolio_ids),
        services = COALESCE(?, services)
       WHERE user_id = ?`,
      [
        cat?.id ?? null,
        cat?.label ?? null,
        nat,
        ctr,
        state ?? null,
        city ?? null,
        loc,
        description ?? null,
        bio ?? null,
        price ?? null,
        availability ?? null,
        availableNow === undefined ? null : availableNow ? 1 : 0,
        photoId ?? null,
        portfolioIds !== undefined ? JSON.stringify(portfolioIds) : null,
        services ? JSON.stringify(normalizedServices) : null,
        req.userId,
      ]
    )

    const [profiles] = await pool.execute('SELECT * FROM provider_profiles WHERE user_id = ?', [req.userId])
    const user = await getUserContext(req.userId)
    res.json({ user, providerProfile: mapProviderDetail(profiles[0]) })
  } catch (err) {
    console.error('patch provider:', err)
    res.status(500).json({ error: 'Erro ao atualizar perfil de prestador.' })
  }
})

router.delete('/provider', authRequired, async (req, res) => {
  try {
    await pool.execute('DELETE FROM provider_profiles WHERE user_id = ?', [req.userId])
    await pool.execute('UPDATE users SET is_provider = 0 WHERE id = ?', [req.userId])
    const user = await getUserContext(req.userId)
    res.json({ user })
  } catch (err) {
    console.error('deactivate provider:', err)
    res.status(500).json({ error: 'Erro ao desativar modo prestador.' })
  }
})

export default router
