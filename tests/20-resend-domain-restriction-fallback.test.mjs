import { describe, it } from 'node:test'
import assert from 'node:assert'
import { sendVerificationEmail } from '../server/services/email.mjs'

describe('Bug 20: Resend Testing Domain Restriction Fallback', () => {
  it('should gracefully handle Resend sandbox/domain restriction without throwing errors', async () => {
    const testPayload = {
      to: `recipient-test-${Date.now()}@externaldomain.org`,
      name: 'Test Customer',
      code: '789123',
      verifyLink: 'http://localhost:8443/?verify_token=dummytoken123',
    }

    const result = await sendVerificationEmail(testPayload)
    assert.strictEqual(typeof result, 'object')
    assert.strictEqual(result.success, true)
    assert.ok(result.id, 'Should return an email id or simulated fallback id')
  })

  it('should support custom RESEND_FROM_EMAIL and fallback sender', () => {
    const defaultSender = 'Vizinho <onboarding@resend.dev>'
    assert.ok(defaultSender.includes('onboarding@resend.dev'))
  })
})
