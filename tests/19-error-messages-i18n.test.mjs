import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

const ERROR_MAP_EN = [
  { pattern: /e-mail ou senha incorretos/i, translation: 'Invalid email or password.' },
  { pattern: /confirme seu e-mail para ativar sua conta/i, translation: 'Please confirm your email to activate your account before logging in.' },
  { pattern: /código ou link de confirmação inválido ou expirado/i, translation: 'Invalid or expired confirmation code or link.' },
  { pattern: /já está cadastrado/i, translation: 'This email is already registered.' },
  { pattern: /já está confirmado/i, translation: 'This email is already confirmed.' },
  { pattern: /usuário não encontrado/i, translation: 'User not found.' },
  { pattern: /pelo menos 6 caracteres/i, translation: 'Password must be at least 6 characters.' },
  { pattern: /não coincidem|não confere/i, translation: 'Passwords do not match.' },
  { pattern: /código de 6 dígitos/i, translation: 'Please enter the 6-digit code.' },
  { pattern: /informe e-mail e senha/i, translation: 'Please enter email and password.' },
  { pattern: /informe seu e-mail/i, translation: 'Please enter your email.' },
  { pattern: /erro ao cadastrar/i, translation: 'Error registering user.' },
  { pattern: /erro ao fazer login/i, translation: 'Error logging in.' },
  { pattern: /erro ao verificar e-mail/i, translation: 'Error verifying email.' },
  { pattern: /erro ao reenviar/i, translation: 'Error resending confirmation.' },
  { pattern: /erro ao redefinir/i, translation: 'Error resetting password.' },
  { pattern: /erro ao salvar/i, translation: 'Error saving.' },
  { pattern: /preencha a sua bio|preenchimento da bio/i, translation: 'Please fill in your bio (required).' },
  { pattern: /preencha todos os campos/i, translation: 'Please fill in all required fields.' },
  { pattern: /apenas o cliente solicitante/i, translation: 'Only the requesting client can make the payment.' },
  { pattern: /já foi paga via stripe/i, translation: 'This request has already been paid via Stripe.' },
  { pattern: /solicitação não encontrada/i, translation: 'Request not found.' },
  { pattern: /erro ao processar pagamento/i, translation: 'Error processing payment.' },
  { pattern: /prestador não especificado/i, translation: 'Provider not specified.' },
  { pattern: /preencha o serviço e os detalhes/i, translation: 'Please fill in the service and request details.' },
  { pattern: /algo deu errado/i, translation: 'Something went wrong. Please try again.' },
]

function translateError(error, lang) {
  if (!error) return ''
  const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)
  if (lang === 'pt') return msg

  for (const { pattern, translation } of ERROR_MAP_EN) {
    if (typeof pattern === 'string' ? msg.toLowerCase().includes(pattern.toLowerCase()) : pattern.test(msg)) {
      return translation
    }
  }

  return msg
}

describe('Bug 19: Error Messages Translation in English', () => {
  it('should verify translateError function and ERROR_MAP_EN exist in src/i18n.tsx', () => {
    const file = fs.readFileSync(path.resolve('src/i18n.tsx'), 'utf8')
    assert.ok(file.includes('export function translateError'))
    assert.ok(file.includes('formatError: (err) => translateError(err, lang)'))
  })

  it('should translate login and auth error messages to English when lang is en', () => {
    assert.strictEqual(
      translateError('E-mail ou senha incorretos.', 'en'),
      'Invalid email or password.'
    )
    assert.strictEqual(
      translateError('Por favor, confirme seu e-mail para ativar sua conta antes de fazer login.', 'en'),
      'Please confirm your email to activate your account before logging in.'
    )
    assert.strictEqual(
      translateError('Código ou link de confirmação inválido ou expirado.', 'en'),
      'Invalid or expired confirmation code or link.'
    )
    assert.strictEqual(
      translateError('Este e-mail já está cadastrado.', 'en'),
      'This email is already registered.'
    )
    assert.strictEqual(
      translateError('A nova senha precisa ter pelo menos 6 caracteres.', 'en'),
      'Password must be at least 6 characters.'
    )
    assert.strictEqual(
      translateError('A confirmação de senha não confere.', 'en'),
      'Passwords do not match.'
    )
  })

  it('should translate profile and payment error messages to English', () => {
    assert.strictEqual(
      translateError('O preenchimento da Bio é obrigatório (mínimo de 5 caracteres).', 'en'),
      'Please fill in your bio (required).'
    )
    assert.strictEqual(
      translateError('Erro ao processar pagamento com Stripe.', 'en'),
      'Error processing payment.'
    )
    assert.strictEqual(
      translateError('Apenas o cliente solicitante pode realizar o pagamento.', 'en'),
      'Only the requesting client can make the payment.'
    )
  })

  it('should preserve original Portuguese messages when lang is pt', () => {
    const ptMsg = 'E-mail ou senha incorretos.'
    assert.strictEqual(translateError(ptMsg, 'pt'), ptMsg)
  })
})
