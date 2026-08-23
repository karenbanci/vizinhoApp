import { useState, type FormEvent } from 'react'
import {
  authWithGoogle,
  login,
  register,
  setToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  type AuthUser,
} from '../api'
import { useLanguage } from '../i18n'

interface Props {
  initialMode?: 'login' | 'register' | 'forgot' | 'reset' | 'verify'
  initialResetToken?: string
  initialVerifyToken?: string
  onClose: () => void
  onSuccess: (user: AuthUser) => void
}

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'verify'

export default function AuthModal({
  initialMode = 'login',
  initialResetToken = '',
  initialVerifyToken = '',
  onClose,
  onSuccess,
}: Props) {
  const { t, formatError } = useLanguage()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'client' | 'provider'>('client')
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

  async function handleGoogleLogin() {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      let googleEmail = email.trim()
      let googleName = name.trim()
      if (!googleEmail) {
        googleEmail = window.prompt(t('auth.email') + ' (Google):') || ''
      }
      if (!googleEmail || !googleEmail.includes('@')) {
        setLoading(false)
        return
      }
      if (!googleName) {
        googleName = googleEmail.split('@')[0]
      }
      const result = await authWithGoogle({
        email: googleEmail,
        name: googleName,
      })
      setToken(result.token)
      onSuccess(result.user)
      onClose()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
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
      setError(formatError(err))
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
        const result = await register(name, email, password, accountType)
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
        try {
          const result = await login(email, password)
          setToken(result.token)
          onSuccess(result.user)
          onClose()
        } catch (loginErr) {
          const msg = loginErr instanceof Error ? loginErr.message : ''
          if (msg.includes('confirme seu e-mail') || msg.includes('verificado') || msg.includes('confirm your email')) {
            setMode('verify')
            setError(formatError(msg))
            return
          }
          throw loginErr
        }
      }
    } catch (err) {
      setError(formatError(err))
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
                {mode === 'login'
                  ? t('auth.loginTitle')
                  : mode === 'register'
                    ? t('auth.registerTitle')
                    : mode === 'forgot'
                      ? t('auth.forgotTitle')
                      : mode === 'reset'
                        ? t('auth.resetTitle')
                        : t('auth.verifyTitle')}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
              aria-label={t('auth.close')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            {mode === 'login'
              ? t('auth.loginSub')
              : mode === 'register'
                ? t('auth.registerSub')
                : mode === 'forgot'
                  ? t('auth.forgotSub')
                  : mode === 'reset'
                    ? t('auth.resetSub')
                    : t('auth.verifySub')}
          </p>

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
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.accountTypeLabel')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('client')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          accountType === 'client'
                            ? 'border-[#E8553D] bg-[#E8553D]/5 text-gray-900 shadow-sm ring-1 ring-[#E8553D]/30'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 mb-0.5">
                          <span>👤</span>
                          <span>{t('auth.roleClient')}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">{t('auth.roleClientDesc')}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('provider')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          accountType === 'provider'
                            ? 'border-[#E8553D] bg-[#E8553D]/5 text-gray-900 shadow-sm ring-1 ring-[#E8553D]/30'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 mb-0.5">
                          <span>⭐</span>
                          <span>{t('auth.roleProvider')}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">{t('auth.roleProviderDesc')}</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.name')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.namePlaceholder')}
                      required
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {mode === 'reset' && !initialResetToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.resetLinkLabel')}</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder={t('auth.resetLinkPlaceholder')}
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? t('auth.passRegPlaceholder') : t('auth.passLoginPlaceholder')}
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
                      {t('auth.forgotPasswordLink')}
                    </button>
                  )}
                </div>
              )}

              {mode === 'reset' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.newPassword')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passRegPlaceholder')}
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.confirmNewPassword')}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.repeatNewPassword')}
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
                    📧 {t('auth.verifyAlert', { email })}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                      {t('auth.verifyCodeLabel')}
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
                      {resending ? t('auth.resending') : t('auth.resendCode')}
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
                    ? t('auth.waiting')
                    : mode === 'login'
                      ? t('auth.loginBtn')
                      : mode === 'register'
                        ? t('auth.registerBtn')
                        : mode === 'verify'
                          ? t('auth.verifyBtn')
                          : mode === 'forgot'
                            ? t('auth.forgotBtn')
                            : t('auth.resetBtn')}
                </button>
              )}

              {(mode === 'login' || mode === 'register') && (
                <>
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 uppercase">{t('auth.or')}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{t('auth.googleBtn')}</span>
                  </button>
                </>
              )}
            </form>
          )}

          {resetDone && (
            <button
              onClick={() => switchMode('login')}
              className="w-full text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8553D' }}
            >
              {t('auth.goToLogin')}
            </button>
          )}
        </div>

        <div className="px-8 py-4 bg-white text-center text-sm text-gray-600 border-t border-gray-100">
          {mode === 'login' && (
            <>
              {t('auth.noAccount')}{' '}
              <button onClick={() => switchMode('register')} className="font-semibold hover:underline" style={{ color: '#E8553D' }}>
                {t('auth.signupFree')}
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              {t('auth.haveAccount')}{' '}
              <button onClick={() => switchMode('login')} className="font-semibold hover:underline" style={{ color: '#E8553D' }}>
                {t('auth.loginLink')}
              </button>
            </>
          )}
          {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
            <button onClick={() => switchMode('login')} className="font-semibold hover:underline" style={{ color: '#E8553D' }}>
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}