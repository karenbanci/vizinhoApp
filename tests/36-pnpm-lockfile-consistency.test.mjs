import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 36: pnpm Lockfile Consistency and Outdated Lockfile Fix', () => {
  it('should verify pnpm-lock.yaml exists and is not empty', () => {
    const lockfilePath = path.resolve('pnpm-lock.yaml')
    assert.ok(fs.existsSync(lockfilePath), 'pnpm-lock.yaml must exist')
    const stat = fs.statSync(lockfilePath)
    assert.ok(stat.size > 0, 'pnpm-lock.yaml must not be empty')
  })

  it('should verify all dependencies in package.json are present in pnpm-lock.yaml', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
    const lockfileContent = fs.readFileSync(path.resolve('pnpm-lock.yaml'), 'utf8')

    const deps = Object.keys(pkg.dependencies || {})
    const devDeps = Object.keys(pkg.devDependencies || {})

    for (const dep of deps) {
      assert.ok(
        lockfileContent.includes(dep),
        `Dependency "${dep}" from package.json must be present in pnpm-lock.yaml`
      )
    }

    for (const devDep of devDeps) {
      assert.ok(
        lockfileContent.includes(devDep),
        `DevDependency "${devDep}" from package.json must be present in pnpm-lock.yaml`
      )
    }
  })
})
