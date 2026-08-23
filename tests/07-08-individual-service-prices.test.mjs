import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseServices } from '../server/users.mjs'
import { pool } from '../server/db.mjs'

describe('Bug 7 & 8: Individual Service Prices & Fixed Dogwalk Services', () => {
  it('should parse services JSON with name and individual price', () => {
    const raw = JSON.stringify([
      { name: 'Walking', price: 'R$ 35/h' },
      { name: 'Drop-in', price: 'R$ 40' },
      { name: 'Sitting', price: 'R$ 60' },
      { name: 'Boarding', price: 'R$ 90/noite' },
      { name: 'Daycare', price: 'R$ 70/dia' },
    ])
    const parsed = parseServices(raw)
    assert.strictEqual(parsed.length, 5)
    assert.strictEqual(parsed[0].name, 'Walking')
    assert.strictEqual(parsed[0].price, 'R$ 35/h')
  })

  it('should store and retrieve provider services with individual prices in MySQL', async () => {
    // 1. Create test user
    const [uRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider) VALUES (?, ?, ?, 1)',
      ['Dog Walker Pro', `dogwalker-${Date.now()}@test.com`, 'hash']
    )
    const userId = uRes.insertId

    const dogServices = [
      { name: 'Walking', price: '$25/walk' },
      { name: 'Drop-in', price: '$30' },
      { name: 'Sitting', price: '$50' },
      { name: 'Boarding', price: '$75/night' },
      { name: 'Daycare', price: '$45/day' },
    ]

    // 2. Insert provider profile with services JSON
    const [profRes] = await pool.execute(
      `INSERT INTO provider_profiles 
       (user_id, category, category_label, nationality, services)
       VALUES (?, 'dogsitter', 'Dog Sitter', 'BR', ?)`,
      [userId, JSON.stringify(dogServices)]
    )
    const profileId = profRes.insertId

    // 3. Retrieve and assert
    const [rows] = await pool.execute('SELECT services FROM provider_profiles WHERE id = ?', [profileId])
    assert.strictEqual(rows.length, 1)
    const dbServices = parseServices(rows[0].services)
    assert.strictEqual(dbServices.length, 5)
    assert.strictEqual(dbServices[3].name, 'Boarding')
    assert.strictEqual(dbServices[3].price, '$75/night')

    // Cleanup
    await pool.execute('DELETE FROM provider_profiles WHERE id = ?', [profileId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })
})
