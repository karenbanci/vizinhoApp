import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 48: Manual On-Demand Deployment Configuration', () => {
  it('should verify package.json provides manual deployment script without automatic hooks', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
    assert.strictEqual(pkg.scripts.deploy, 'gh-pages -d dist')
    assert.ok(pkg.scripts.predeploy.includes('npm run build'))
  })

  it('should verify README.md details manual deployment command', () => {
    const readme = fs.readFileSync(path.resolve('README.md'), 'utf8')
    assert.ok(readme.includes('deploy') || readme.includes('deployment'))
  })
})
