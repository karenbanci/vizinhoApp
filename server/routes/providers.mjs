import { Router } from 'express'
import { pool } from '../db.mjs'
import { mapProviderRow } from '../users.mjs'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id AS user_id, u.name, p.category, p.category_label, p.nationality,
              p.country, p.state, p.city, p.description, p.bio,
              p.price, p.location, p.availability, p.available_now, p.photo_id, p.services
       FROM provider_profiles p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.id`
    )
    res.json({ providers: rows.map(mapProviderRow) })
  } catch (err) {
    console.error('list providers:', err)
    res.status(500).json({ error: 'Erro ao listar prestadores.' })
  }
})

export default router
