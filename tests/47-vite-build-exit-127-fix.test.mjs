import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 47: Fix Vite Build Exited with 127 in Production / CI', () => {
  it('should verify vite and build toolchain are declared in dependencies for production installs', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
    assert.ok(pkg.dependencies.vite, 'vite must be in dependencies to avoid 127 in production omitted builds')
    assert.ok(pkg.dependencies['@vitejs/plugin-react'])
    assert.ok(pkg.dependencies['@tailwindcss/vite'])
    assert.ok(pkg.scripts.build.includes('vite build'))
  })

  it('should verify lockfiles are populated with vite dependencies', () => {
    const pnpmLock = fs.readFileSync(path.resolve('pnpm-lock.yaml'), 'utf8')
    const yarnLock = fs.readFileSync(path.resolve('yarn.lock'), 'utf8')
    assert.ok(pnpmLock.includes('vite:'))
    assert.ok(yarnLock.includes('vite@npm:'))
  })
})
