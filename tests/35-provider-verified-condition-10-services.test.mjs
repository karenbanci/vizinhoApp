import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { mapProviderRow } from '../server/users.mjs'

describe('Bug 35: Provider Verified Badge Condition (>= 10 completed services)', () => {
  it('should verify mapProviderRow assigns verified = false when completed_services < 10', () => {
    const unverifiedRow = {
      user_id: 1,
      name: 'João Prestador',
      category: 'faxina',
      category_label: 'Faxina',
      completed_services: 9,
    }
    const result = mapProviderRow(unverifiedRow)
    assert.strictEqual(result.verified, false, 'Provider with 9 services must not be verified')
    assert.strictEqual(result.badge, null)
    assert.strictEqual(result.completedServices, 9)
  })

  it('should verify mapProviderRow assigns verified = true and badge = "Verificado" when completed_services >= 10', () => {
    const verifiedRow = {
      user_id: 2,
      name: 'Maria Prestadora',
      category: 'manicure',
      category_label: 'Manicure',
      completed_services: 10,
    }
    const result = mapProviderRow(verifiedRow)
    assert.strictEqual(result.verified, true, 'Provider with 10 services must be verified')
    assert.strictEqual(result.badge, 'Verificado')
    assert.strictEqual(result.completedServices, 10)

    const seniorRow = {
      user_id: 3,
      name: 'Carlos Senior',
      category: 'helper',
      category_label: 'Helper',
      completed_services: 45,
    }
    const seniorResult = mapProviderRow(seniorRow)
    assert.strictEqual(seniorResult.verified, true)
    assert.strictEqual(seniorResult.completedServices, 45)
  })

  it('should verify data.ts contains VERIFIED_MIN_SERVICES = 10 and isProviderVerified helper', () => {
    const dataCode = fs.readFileSync(path.resolve('src/data.ts'), 'utf8')
    assert.ok(dataCode.includes('VERIFIED_MIN_SERVICES = 10'))
    assert.ok(dataCode.includes('function isProviderVerified'))
    assert.ok(dataCode.includes('count >= VERIFIED_MIN_SERVICES'))
  })

  it('should verify ProviderCard, ProfileDrawer, and ProfilePage implement the 10 services verification condition', () => {
    const providerCardCode = fs.readFileSync(path.resolve('src/components/ProviderCard.tsx'), 'utf8')
    assert.ok(providerCardCode.includes('isProviderVerified(provider)'))

    const profileDrawerCode = fs.readFileSync(path.resolve('src/components/ProfileDrawer.tsx'), 'utf8')
    assert.ok(profileDrawerCode.includes('isProviderVerified(provider)'))

    const profilePageCode = fs.readFileSync(path.resolve('src/pages/ProfilePage.tsx'), 'utf8')
    assert.ok(profilePageCode.includes('completedServices >= 10'))
    assert.ok(profilePageCode.includes('completedServicesCount >= 10'))
  })
})
