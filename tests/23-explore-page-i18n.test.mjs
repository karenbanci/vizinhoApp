import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 23: Explore Page English Translation', () => {
  it('should have complete explore keys in i18n dictionary for both Portuguese and English', () => {
    const i18nPath = path.resolve('src/i18n.tsx')
    const content = fs.readFileSync(i18nPath, 'utf8')

    const requiredKeys = [
      'explore.title',
      'explore.subtitle',
      'explore.shareTitle',
      'explore.shareText',
      'explore.shareBtn',
      'explore.notNow',
      'explore.filters',
      'explore.countryAll',
      'explore.stateAll',
      'explore.cityAll',
      'explore.availableNow',
      'explore.relevance',
      'explore.bestRated',
      'explore.mostReviewed',
      'explore.clearFilters',
      'explore.resultsAll',
      'explore.noResultsTitle',
      'explore.noResultsFilters',
    ]

    for (const key of requiredKeys) {
      assert.ok(content.includes(`'${key}'`), `Missing explore translation key: ${key}`)
    }
  })

  it('should verify English explore translations', () => {
    const i18nPath = path.resolve('src/i18n.tsx')
    const content = fs.readFileSync(i18nPath, 'utf8')

    assert.ok(content.includes("'explore.title': 'Explore providers'"))
    assert.ok(content.includes("'explore.subtitle': 'Find all available professionals according to your region.'"))
    assert.ok(content.includes("'explore.filters': 'Filters'"))
    assert.ok(content.includes("'explore.countryAll': 'Nationality: All'"))
    assert.ok(content.includes("'explore.availableNow': 'Available now'"))
    assert.ok(content.includes("'explore.noResultsTitle': 'No providers found'"))
  })

  it('should verify ExplorePage.tsx uses useLanguage and t() for headers and filters', () => {
    const explorePath = path.resolve('src/pages/ExplorePage.tsx')
    const content = fs.readFileSync(explorePath, 'utf8')

    assert.ok(content.includes("const { t } = useLanguage()"))
    assert.ok(content.includes("{t('explore.title')}"))
    assert.ok(content.includes("{t('explore.subtitle')}"))
    assert.ok(content.includes("{t('explore.filters')}"))
  })
})
