import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 41: Responsive Layout Across All Devices (Mobile, Tablet, Desktop)', () => {
  it('should verify index.html contains proper viewport meta tag', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8')
    assert.ok(html.includes('name="viewport"'))
    assert.ok(html.includes('width=device-width, initial-scale=1.0'))
  })

  it('should verify App.tsx contains responsive mobile navigation and menu drawer', () => {
    const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8')
    assert.ok(appCode.includes('mobileMenuOpen'))
    assert.ok(appCode.includes('md:hidden'))
    assert.ok(appCode.includes('md:flex'))
    assert.ok(appCode.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'))
  })

  it('should verify ExplorePage.tsx and ProfileDrawer.tsx have responsive layouts', () => {
    const exploreCode = fs.readFileSync(path.resolve('src/pages/ExplorePage.tsx'), 'utf8')
    const drawerCode = fs.readFileSync(path.resolve('src/components/ProfileDrawer.tsx'), 'utf8')
    assert.ok(exploreCode.includes('w-full sm:w-auto'))
    assert.ok(drawerCode.includes('max-w-2xl'))
    assert.ok(drawerCode.includes('overflow-y-auto'))
  })
})
