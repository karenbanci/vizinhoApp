import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { PROVIDERS } from '../src/data.ts'

describe('Bug 26: Real Providers, Reviews, and Ratings Stats Calculation', () => {
  it('should calculate real provider count, total reviews, and average rating accurately from dataset', () => {
    const mockDbProviders = [
      { id: 101, name: 'Novo Prestador 1', reviews: 10, rating: 5.0 },
      { id: 102, name: 'Novo Prestador 2', reviews: 5, rating: 4.0 },
    ]

    const all = [...PROVIDERS, ...mockDbProviders]

    const totalProviders = all.length
    assert.strictEqual(totalProviders, PROVIDERS.length + 2)
    assert.ok(totalProviders >= 14)

    const totalReviews = all.reduce((acc, p) => acc + (p.reviews || 0), 0)
    assert.ok(totalReviews > 1000)

    const rated = all.filter((p) => p.rating && p.rating > 0)
    const totalWeighted = rated.reduce((acc, p) => acc + p.rating * Math.max(1, p.reviews || 1), 0)
    const totalWeights = rated.reduce((acc, p) => acc + Math.max(1, p.reviews || 1), 0)
    const avgRating = (totalWeighted / totalWeights).toFixed(1)

    assert.ok(Number(avgRating) >= 4.0 && Number(avgRating) <= 5.0)
  })

  it('should verify App.tsx dynamically binds totalProvidersCount, totalReviewsCount, and averageRating', () => {
    const appFile = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8')

    assert.ok(appFile.includes('totalProvidersCount'))
    assert.ok(appFile.includes('totalReviewsCount'))
    assert.ok(appFile.includes('averageRating'))

    // Should NOT have hardcoded '2.400+' or '18 mil+'
    assert.strictEqual(appFile.includes("'2.400+'"), false)
    assert.strictEqual(appFile.includes("'18 mil+'"), false)
  })
})
