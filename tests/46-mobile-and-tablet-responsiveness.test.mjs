import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 46: Mobile and Tablet Responsiveness Across the App', () => {
  it('should verify global index.css contains responsive root constraints', () => {
    const css = fs.readFileSync(path.resolve('src/index.css'), 'utf8')
    assert.ok(css.includes('overflow-x: hidden'))
    assert.ok(css.includes('max-width: 100vw'))
  })

  it('should verify App.tsx contains responsive mobile navigation and grid breakpoints', () => {
    const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8')
    assert.ok(appCode.includes('mobileMenuOpen'))
    assert.ok(appCode.includes('md:hidden'))
    assert.ok(appCode.includes('sm:grid-cols-2'))
    assert.ok(appCode.includes('lg:grid-cols-3'))
  })

  it('should verify ExplorePage.tsx adapt filters on mobile & tablet', () => {
    const exploreCode = fs.readFileSync(path.resolve('src/pages/ExplorePage.tsx'), 'utf8')
    assert.ok(exploreCode.includes('w-full sm:w-auto'))
  })
})
