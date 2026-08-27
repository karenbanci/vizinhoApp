import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  PROVIDERS,
  getLocalizedDescription,
  getLocalizedBio,
  getLocalizedServices,
  getLocalizedAvailability,
  getLocalizedDeliveryInfo,
  getLocalizedPrice,
  getLocalizedReviewText,
} from '../src/data.ts'

describe('Bug 38: English Translations for Provider Descriptions, Bios, Services & Reviews', () => {
  it('should verify all providers have valid English descriptions and bios', () => {
    for (const p of PROVIDERS) {
      const descEn = getLocalizedDescription(p, 'en')
      const bioEn = getLocalizedBio(p, 'en')
      const priceEn = getLocalizedPrice(p, 'en')
      const availEn = getLocalizedAvailability(p, 'en')
      const deliveryEn = getLocalizedDeliveryInfo(p, 'en')
      const servicesEn = getLocalizedServices(p, 'en')

      assert.ok(descEn && descEn.length > 5, `Provider ${p.name} must have non-empty descriptionEn`)
      assert.ok(bioEn && bioEn.length > 10, `Provider ${p.name} must have non-empty bioEn`)
      assert.ok(priceEn && priceEn.length > 0, `Provider ${p.name} must have priceEn`)
      assert.ok(availEn && availEn.length > 0, `Provider ${p.name} must have availabilityEn`)
      assert.ok(deliveryEn && deliveryEn.length > 0, `Provider ${p.name} must have deliveryInfoEn`)
      assert.ok(Array.isArray(servicesEn) && servicesEn.length > 0, `Provider ${p.name} must have servicesEn`)
    }
  })

  it('should verify all reviews have English translations', () => {
    for (const p of PROVIDERS) {
      for (const r of p.reviewsList) {
        const textEn = getLocalizedReviewText(r, 'en')
        assert.ok(textEn && textEn.length > 5, `Review from ${r.author} on provider ${p.name} must have English translation`)
      }
    }
  })

  it('should return Portuguese strings when lang is pt', () => {
    const p1 = PROVIDERS[0]
    assert.strictEqual(getLocalizedDescription(p1, 'pt'), p1.description)
    assert.strictEqual(getLocalizedBio(p1, 'pt'), p1.bio)
  })
})
