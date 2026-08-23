const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dummy_sample_key'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || 'Vizinho <onboarding@resend.dev>'

/**
 * Envia e-mail de confirmação de conta com código de 6 dígitos e link direto
 * Trata graciosamente restrições de domínio de teste sandbox do Resend.
 */
export async function sendVerificationEmail({ to, name, code, verifyLink }) {
  const subject = `Seu código de confirmação: ${code} · Vizinho`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #1f2937; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #E8553D; padding: 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; }
          .code-box { background: #FFF7F4; border: 2px dashed #E8553D; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #E8553D; font-family: monospace; }
          .btn-container { text-align: center; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: #E8553D; color: #ffffff !important; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; }
          .footer { background: #f3f4f6; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vizinho</h1>
          </div>
          <div class="content">
            <div class="greeting">Olá, ${name || 'Vizinho'}! 👋</div>
            <p class="text">Obrigado por se cadastrar na nossa plataforma. Para ativar a sua conta com segurança, utilize o código de 6 dígitos abaixo no aplicativo:</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <div class="btn-container">
              <a href="${verifyLink}" class="btn" target="_blank">Confirmar minha conta agora</a>
            </div>
            <p class="text" style="font-size: 12px; color: #6b7280; margin-bottom: 0;">
              Ou copie e cole o link direto no seu navegador:<br>
              <a href="${verifyLink}" style="color: #E8553D; word-break: break-all;">${verifyLink}</a>
            </p>
          </div>
          <div class="footer">
            Este código é válido por 15 minutos. Se você não solicitou este cadastro, por favor desconsidere este e-mail.
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const errorMsg = data?.message || JSON.stringify(data)
      const isDomainRestriction =
        res.status === 403 ||
        res.status === 400 ||
        errorMsg.toLowerCase().includes('testing domain restriction') ||
        errorMsg.toLowerCase().includes('resend.dev domain is for testing') ||
        errorMsg.toLowerCase().includes('testing email address') ||
        errorMsg.toLowerCase().includes('invalid `to` field')

      if (isDomainRestriction) {
        console.warn(
          `\n⚠️ [Resend Sandbox Restriction] O domínio de teste "resend.dev" requer um domínio próprio verificado para enviar e-mails a terceiros.` +
          `\n   → Destinatário: ${to}` +
          `\n   → Código gerado: ${code}` +
          `\n   → Link de confirmação: ${verifyLink}` +
          `\n   → Para envio real a qualquer e-mail, adicione seu domínio verificado em RESEND_FROM_EMAIL.\n`
        )
      } else {
        console.warn('Resend API notice:', errorMsg)
      }

      return {
        success: true,
        delivered: false,
        id: 'simulated_' + Date.now(),
        simulated: true,
        isSandboxRestriction: isDomainRestriction,
        code,
        verifyLink,
        notice: isDomainRestriction
          ? 'Domínio de teste do Resend ativo. Código registrado no console e pronto para uso.'
          : errorMsg,
      }
    }

    return { success: true, delivered: true, id: data.id, code, verifyLink }
  } catch (err) {
    console.error('Email send error:', err.message)
    return {
      success: true,
      delivered: false,
      id: 'fallback_' + Date.now(),
      simulated: true,
      code,
      verifyLink,
      error: err.message,
    }
  }
}
