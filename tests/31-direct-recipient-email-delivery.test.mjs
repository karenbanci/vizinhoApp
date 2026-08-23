import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { sendVerificationEmail } from '../server/services/email.mjs'

describe('Bug 31: Confirmation Email Sent Directly to User Registered Email', () => {
  it('should guarantee sendVerificationEmail sends to the exact recipient email filled in the form', async () => {
    const userSubmittedEmail = 'cliente.novo.vizinho@gmail.com'
    const userName = 'Cliente Novo'
    const code = '123456'
    const verifyLink = 'http://localhost:8443/?verify_token=token123456'

    const result = await sendVerificationEmail({
      to: userSubmittedEmail,
      name: userName,
      code,
      verifyLink,
    })

    assert.ok(typeof result === 'object')
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.to, userSubmittedEmail.toLowerCase())
    assert.strictEqual(result.code, code)
    assert.strictEqual(result.verifyLink, verifyLink)
  })

  it('should throw error if recipient email is empty or missing', async () => {
    await assert.rejects(
      async () => {
        await sendVerificationEmail({
          to: '',
          name: 'Sem Email',
          code: '111222',
          verifyLink: 'http://localhost:8443/?verify_token=test',
        })
      },
      {
        name: 'Error',
        message: 'E-mail do destinatário não informado.',
      }
    )
  })

  it('should verify auth.mjs passes req.body.email to createAndSendEmailVerification and sendVerificationEmail', () => {
    const authCode = fs.readFileSync(path.resolve('server/routes/auth.mjs'), 'utf8')
    assert.ok(authCode.includes('sendVerificationEmail({ to: email, name, code, verifyLink })'))
    assert.ok(authCode.includes('createAndSendEmailVerification(userId, email, name, req.get(\'host\'))'))
  })
})
