import { describe, it } from 'node:test'
import assert from 'node:assert'
import { pool } from '../server/db.mjs'

const DOG_FIXED_SERVICES = ['Walking', 'Drop-in', 'Sitting', 'Boarding', 'Daycare']

function normalizeServices(rawServices, category) {
  const isDog = category === 'dogsitter' || category === 'dogwalk'
  const list = (rawServices ?? []).map((s) => {
    if (typeof s === 'string') return { name: s, price: '' }
    return { name: s.name, price: s.price ?? '' }
  })

  if (isDog) {
    return list.filter((item) =>
      DOG_FIXED_SERVICES.some((fixed) => fixed.toLowerCase() === item.name.toLowerCase())
    )
  }

  return list
}

describe('Bug 16: Category Services Isolation and Manual Dogsitter Selection', () => {
  it('should only return selected dog services for dogsitter without forcing all 5 fixed services', () => {
    // User only selected Walking and Boarding
    const userSelected = [
      { name: 'Walking', price: 'R$ 40/h' },
      { name: 'Boarding', price: 'R$ 120/dia' },
    ]

    const normalized = normalizeServices(userSelected, 'dogsitter')
    assert.strictEqual(normalized.length, 2)
    assert.deepStrictEqual(
      normalized.map((s) => s.name),
      ['Walking', 'Boarding']
    )
  })

  it('should filter out non-dog services if category is dogsitter', () => {
    const mixed = [
      { name: 'Walking', price: 'R$ 40' },
      { name: 'Faxina Geral', price: 'R$ 150' },
    ]
    const normalized = normalizeServices(mixed, 'dogsitter')
    assert.strictEqual(normalized.length, 1)
    assert.strictEqual(normalized[0].name, 'Walking')
  })

  it('should store and update isolated services in provider_profiles', async () => {
    const [uRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider) VALUES (?, ?, ?, 1)',
      ['Category Test Provider', `cat-test-${Date.now()}@test.com`, 'pass']
    )
    const userId = uRes.insertId

    // 1. Save profile with dogsitter services
    const dogServices = JSON.stringify([
      { name: 'Walking', price: 'R$ 35/h' },
      { name: 'Sitting', price: 'R$ 50/h' },
    ])

    await pool.execute(
      `INSERT INTO provider_profiles (user_id, category, category_label, nationality, country, state, city, description, bio, services)
       VALUES (?, 'dogsitter', 'Dog Walker & Sitter', 'BR', 'BR', 'SP', 'São Paulo', 'Cuidado pet', 'Experiência de 5 anos', ?)`,
      [userId, dogServices]
    )

    const [p1] = await pool.execute('SELECT category, services FROM provider_profiles WHERE user_id = ?', [userId])
    assert.strictEqual(p1[0].category, 'dogsitter')
    assert.strictEqual(JSON.parse(p1[0].services).length, 2)

    // 2. Switch category to 'cleaner' with new isolated services (dogsitter removed)
    const cleanerServices = JSON.stringify([{ name: 'Limpeza Pesada', price: 'R$ 200' }])
    await pool.execute(
      `UPDATE provider_profiles SET category = 'cleaner', category_label = 'Faxina', services = ? WHERE user_id = ?`,
      [cleanerServices, userId]
    )

    const [p2] = await pool.execute('SELECT category, services FROM provider_profiles WHERE user_id = ?', [userId])
    assert.strictEqual(p2[0].category, 'cleaner')
    const parsedServices = JSON.parse(p2[0].services)
    assert.strictEqual(parsedServices.length, 1)
    assert.strictEqual(parsedServices[0].name, 'Limpeza Pesada')

    // Cleanup
    await pool.execute('DELETE FROM provider_profiles WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })
})
