import { useState, type FormEvent } from 'react'
import {
  login,
  register,
  setToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  type AuthUser,
} from '../api'

interface Props {
  initialMode?: 'login' | 'register' | 'forgot' | 'reset' | 'verify'
  initialResetToken?: string
  initialVerifyToken?: string
  onClose: () => void
  onSuccess: (user: AuthUser) => void
}

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'verify'

const MODE_TITLE: Record<Mode, string> = {
  login: 'Entrar',
  register: 'Criar conta',
  forgot: 'Esqueci a senha',
  reset: 'Redefinir senha',
  verify: 'Confirmar E-mail',
}

const MODE_SUBTITLE: Record<Mode, string> = {
  login: 'Acesse sua conta para contratar vizinhos.',
  register: 'Cadastre-se grátis e comece a contratar vizinhos.',
  forgot: 'Digite seu e-mail e enviaremos um link para redefinir sua senha.',
  reset: 'Escolha uma nova senha para sua conta.',
  verify: 'Digite o código de 6 dígitos enviado para seu e-mail via Resend para ativar sua conta.',
}

export default function AuthModal({
  initialMode = 'login',
  initialResetToken = '',
  initialVerifyToken = '',
  onClose,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setTokenInput] = useState(initialResetToken)
  const [verifyCode, setVerifyCode] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]'

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setInfo('')
  }

  async function handleResend() {
    if (!email) return
    setError('')
    setInfo('')
    setResending(true)
    try {
      const res = await resendVerificationEmail(email)
      setInfo(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar.')
    } finally {
      setResending(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'forgot') {
        const result = await forgotPassword(email)
        setInfo(result.message)
        setResetUrl(result.resetUrl ?? '')
      } else if (mode === 'reset') {
        if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
        if (password !== confirmPassword) throw new Error('As senhas não coincidem.')
        const result = await resetPassword(token, password)
        setInfo(result.message)
        setPassword('')
        setConfirmPassword('')
      } else if (mode === 'register') {
        const result = await register(name, email, password)
        if (result.pendingVerification) {
          setMode('verify')
          setInfo(result.message || 'Código de confirmação enviado para seu e-mail!')
        } else if (result.token) {
          setToken(result.token)
          onSuccess(result.user)
          onClose()
        }
      } else if (mode === 'verify') {
        if (!verifyCode.trim() || verifyCode.trim().length !== 6) {
          throw new Error('Digite o código de 6 dígitos.')
        }
        const result = await verifyEmail({ email, code: verifyCode.trim() })
        setToken(result.token)
        onSuccess(result.user)
        onClose()
      } else {
        const result = await login(email, password)
        setToken(result.token)
        onSuccess(result.user)
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const success = mode === 'forgot' && info && !error
  const resetDone = mode === 'reset' && info && !error

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26, 21, 17, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6" style={{ backgroundColor: '#FAF6F0' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8553D' }}>
                <span className="text-white font-bold text-sm" style={{ fontFamily: "'Fraunces', serif" }}>V</span>
              </div>
              <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#1A1511' }}>
                {MODE_TITLE[mode]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">{MODE_SUBTITLE[mode]}</p>

          {success && (
            <div className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4 space-y-2">
              <div>{info}</div>
              {resetUrl && (
                <a
                  href={resetUrl}
                  className="block font-semibold text-xs break-all underline"
                  style={{ color: '#2B9D8F' }}
                >
                  {resetUrl}
                </a>
              )}
            </div>
          )}

          {resetDone && (
            <div className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
              {info}
            </div>
          )}

          {!success && !resetDone && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {mode === 'reset' && !initialResetToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Link de redefinição</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Cole o link recebido"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                    required
                    minLength={mode === 'register' ? 6 : undefined}
                    className={inputClass}
                  />
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="mt-2 text-xs font-semibold hover:underline"
                      style={{ color: '#E8553D' }}
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
              )}

              {mode === 'reset' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {mode === 'verify' && (
                <>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    📧 Enviamos um código de confirmação para <strong>{email}</strong> via Resend. Verifique também sua caixa de spam se necessário.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                      Código de 6 dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-2xl font-mono font-extrabold text-center tracking-[0.35em] text-gray-900 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                    />
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResend}
                      className="text-xs font-semibold text-[#E8553D] hover:underline disabled:opacity-50"
                    >
                      {resending ? 'Reenviando...' : 'Não recebeu o código? Reenviar e-mail'}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {error}
                </div>
              )}

              {!resetDone && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                  style={{ backgroundColor: '#E8553D' }}
                >
                  {loading
                    ? 'Aguarde...'
                    : mode === 'login'
                      ? 'Entrar'
                      : mode === 'register'
                        ? 'Criar conta'
                        : mode === 'verify'
                          ? 'Confirmar minha conta'
                          : mode === 'forgot'
                            ? 'Enviar link'
                            : 'Redefinir senha'}
                </button>
              )}
            </form>
          )}

          {resetDone && (
            <button
              onClick={() => switchMode('login')}
              className="w-full text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8553D' }}
            >
              Ir para o login
            </button>
          )}
        </div>

        <div className="px-8 py-4 bg-white text-center text-sm text-gray-600 border-t border-gray-100">
          {mode === 'login' && (
            <>
              Não tem conta?{' '}
              <button onClick={() => switchMode('register')} className="font-semibold hover:underline" style={{ color: '#E8553D' }}>
                Cadastre-se grátis
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              Já tem conta?{' '}
              <button onClick={() => switchMode('login')} className="font-semibold hover:underline" style={{ color: '#E8553D' }}>
                Entrar
              </button>
            </>
          )}
          {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
            <button onClick={() => switchMode('login')} className="font-semibold hover:underline" style={{ color: '#E8553D' }}>
              Voltar ao login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}