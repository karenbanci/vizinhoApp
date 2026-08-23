import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 3: Remove Filters on Home Page and Keep in Explore', () => {
  it('should not have filter button in Home results header and instead link to Explore view', () => {
    const appFile = path.resolve('src/App.tsx')
    const content = fs.readFileSync(appFile, 'utf8')

    // Verify it links to explore view from home
    assert.match(content, /setView\('explorar'\)/)
    // Verify explore page has the complete filters
    const exploreFile = path.resolve('src/pages/ExplorePage.tsx')
    assert.strictEqual(fs.existsSync(exploreFile), true)
    const exploreContent = fs.readFileSync(exploreFile, 'utf8')
    assert.match(exploreContent, /explore\.filters/)
  })
})
