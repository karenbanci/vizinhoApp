import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 12: Refined Dependent Location & Nationality Filters in Explore', () => {
  it('should verify ExplorePage calculates stateOptions and cityOptions dependently', () => {
    const file = path.resolve('src/pages/ExplorePage.tsx')
    const content = fs.readFileSync(file, 'utf8')

    assert.match(content, /stateOptions = useMemo/)
    assert.match(content, /cityOptions = useMemo/)
    assert.match(content, /filterCountry !== '' && p\.nationality !== filterCountry/)
    assert.match(content, /filterState !== '' && p\.state !== filterState/)
  })

  it('should ensure Paulo Souza is in Buenos Aires/Palermo and not São Paulo', () => {
    const dataFile = path.resolve('src/data.ts')
    const content = fs.readFileSync(dataFile, 'utf8')

    assert.match(content, /nationality: 'AR'[\s\S]*?location: 'Palermo, Buenos Aires'/)
    assert.match(content, /nationality: 'AR'[\s\S]*?state: 'Buenos Aires'/)
    assert.match(content, /nationality: 'AR'[\s\S]*?city: 'Palermo'/)
  })
})
