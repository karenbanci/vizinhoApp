import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseServices } from '../server/users.mjs'
import { pool } from '../server/db.mjs'

describe('Bug 10: Portfolio Photo Management (Add, Edit, Remove)', () => {
  it('should manipulate portfolio photo list with add, edit and remove operations', () => {
    let portfolio = ['photo-1', 'photo-2']

    // Add
    portfolio = [...portfolio, 'photo-3']
    assert.deepStrictEqual(portfolio, ['photo-1', 'photo-2', 'photo-3'])

    // Edit index 1
    portfolio[1] = 'photo-2-edited'
    assert.deepStrictEqual(portfolio, ['photo-1', 'photo-2-edited', 'photo-3'])

    // Remove index 0
    portfolio = portfolio.filter((_, i) => i !== 0)
    assert.deepStrictEqual(portfolio, ['photo-2-edited', 'photo-3'])
  })

  it('should store and read portfolio_ids JSON in database', async () => {
    const [uRes] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, is_provider) VALUES (?, ?, ?, 1)',
      ['Portfolio Pro', `portfolio-${Date.now()}@test.com`, 'hash']
    )
    const userId = uRes.insertId

    const photos = ['photo-101', 'photo-102', 'photo-103']

    const [profRes] = await pool.execute(
      `INSERT INTO provider_profiles 
       (user_id, category, category_label, nationality, portfolio_ids)
       VALUES (?, 'manicure', 'Manicure', 'BR', ?)`,
      [userId, JSON.stringify(photos)]
    )
    const profileId = profRes.insertId

    const [rows] = await pool.execute('SELECT portfolio_ids FROM provider_profiles WHERE id = ?', [profileId])
    assert.strictEqual(rows.length, 1)
    const parsed = parseServices(rows[0].portfolio_ids)
    assert.deepStrictEqual(parsed, photos)

    // Cleanup
    await pool.execute('DELETE FROM provider_profiles WHERE id = ?', [profileId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
  })
})
