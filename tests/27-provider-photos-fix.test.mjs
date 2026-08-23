import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { PROVIDERS, getPhotoUrl, DEFAULT_PHOTO_URL } from '../src/data.ts'

describe('Bug 27: Provider Photos Loading and Fallback Fix', () => {
  it('should verify no provider in data.ts contains known broken photo IDs', () => {
    const brokenIds = [
      'photo-1604719312566-8912e9667d9f',
      'photo-1570169139493-3cb9dc6be4c3',
      'photo-1558618047-3c8c76ca7d13',
    ]

    for (const provider of PROVIDERS) {
      assert.ok(!brokenIds.includes(provider.photoId), `Provider ${provider.name} has broken photoId: ${provider.photoId}`)
      if (provider.portfolioIds) {
        for (const portId of provider.portfolioIds) {
          assert.ok(!brokenIds.includes(portId), `Provider ${provider.name} has broken portfolioId: ${portId}`)
        }
      }
    }
  })

  it('should properly format photo URLs using getPhotoUrl utility with fallbacks', () => {
    // 1. Unsplash ID
    const url1 = getPhotoUrl('photo-1534528741775-53994a69daeb', 400, 300)
    assert.strictEqual(url1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop&auto=format&q=80')

    // 2. Full HTTP URL (should be preserved as-is)
    const fullUrl = 'https://example.com/custom-photo.jpg'
    assert.strictEqual(getPhotoUrl(fullUrl), fullUrl)

    // 3. Empty / undefined / whitespace (should return DEFAULT_PHOTO_URL format)
    const fallback = getPhotoUrl('')
    assert.ok(fallback.includes('photo-1534528741775-53994a69daeb'))
    assert.strictEqual(getPhotoUrl(undefined), fallback)
  })

  it('should verify ProviderCard, ProfileDrawer, and ProfilePage handle image fallbacks', () => {
    const card = fs.readFileSync(path.resolve('src/components/ProviderCard.tsx'), 'utf8')
    assert.ok(card.includes('getPhotoUrl'))
    assert.ok(card.includes('DEFAULT_PHOTO_URL'))
    assert.ok(card.includes('onError='))

    const drawer = fs.readFileSync(path.resolve('src/components/ProfileDrawer.tsx'), 'utf8')
    assert.ok(drawer.includes('getPhotoUrl'))
    assert.ok(drawer.includes('DEFAULT_PHOTO_URL'))
    assert.ok(drawer.includes('onError='))

    const profile = fs.readFileSync(path.resolve('src/pages/ProfilePage.tsx'), 'utf8')
    assert.ok(profile.includes('getPhotoUrl'))
    assert.ok(profile.includes('DEFAULT_PHOTO_URL'))
    assert.ok(profile.includes('onError='))
  })
})
