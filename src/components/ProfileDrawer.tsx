import { useState, useEffect, type FormEvent } from 'react'
import { CATEGORIES, CATEGORY_STYLE, type Provider } from '../data'
import { countryName, flagUrl } from '../countries'

interface Props {
  provider: Provider
  canRequest?: boolean
  onRequireAuth?: () => void
  onClose: () => void
}

type Tab = 'portfolio' | 'avaliacoes' | 'solicitar'

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function PortfolioTab({ provider }: { provider: Provider }) {
  if (provider.portfolioIds.length === 0) {
    return (
      <div className="px-5 pb-6 text-center py-10">
        <div className="text-4xl mb-3">📸</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          Portfólio em breve
        </h3>
        <p className="text-sm text-gray-500">O prestador ainda não adicionou fotos dos seus trabalhos.</p>
      </div>
    )
  }

  return (
    <div className="px-5 pb-6">
      <div className="grid grid-cols-3 gap-1.5 mb-6">
        {provider.portfolioIds.map((id, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer">
            <img
              src={`https://images.unsplash.com/${id}?w=300&h=300&fit=crop&auto=format&q=75`}
              alt={`Trabalho ${i + 1} de ${provider.name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
          Serviços oferecidos
        </h3>
        <div className="flex flex-wrap gap-2">
          {provider.services.map((s, idx) => {
            const label = typeof s === 'string' ? s : `${s.name}${s.price ? ` (${s.price})` : ''}`
            const key = typeof s === 'string' ? `${s}-${idx}` : `${s.name}-${idx}`
            return (
              <span key={key} className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AvaliacoesTab({ provider }: { provider: Provider }) {
  const empty = provider.reviewsList.length === 0
  const ratingDist = empty
    ? []
    : [5, 4, 3, 2, 1].map((star) => {
        const count = provider.reviewsList.filter((r) => r.rating === star).length
        const pct = Math.round((count / provider.reviewsList.length) * 100)
        return { star, count, pct }
      })

  if (empty) {
    return (
      <div className="px-5 pb-6 text-center py-10">
        <div className="text-4xl mb-3">⭐</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          Ainda sem avaliações
        </h3>
        <p className="text-sm text-gray-500">Este prestador ainda não recebeu avaliações. Seja o primeiro a contratar!</p>
      </div>
    )
  }

  return (
    <div className="px-5 pb-6">
      {/* Summary */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
            {provider.rating.toFixed(1)}
          </div>
          <StarRating rating={provider.rating} size="md" />
          <div className="text-xs text-gray-500 mt-1">{provider.reviews} avaliações</div>
        </div>
        <div className="flex-1 space-y-1.5">
          {ratingDist.map(({ star, pct }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
              <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-7">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {provider.reviewsList.map((review) => (
          <div key={review.id} className="border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-2">
              <img
                src={`https://images.unsplash.com/${review.avatarId}?w=80&h=80&fit=crop&auto=format&q=80`}
                alt={review.author}
                className="w-10 h-10 rounded-full object-cover bg-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{review.author}</p>
                  <p className="text-xs text-gray-400 flex-shrink-0">{review.date}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type FormState = 'idle' | 'sending' | 'success'

function SolicitarTab({ provider }: { provider: Provider }) {
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')

  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!desc.trim() || !date) return
    setFormState('sending')
    setTimeout(() => setFormState('success'), 1400)
  }

  if (formState === 'success') {
    return (
      <div className="px-5 pb-6 flex flex-col items-center text-center py-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl"
          style={{ backgroundColor: '#2B9D8F20' }}
        >
          ✅
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
          Solicitação enviada!
        </h3>
        <p className="text-gray-600 text-sm max-w-xs">
          <strong>{provider.name}</strong> receberá sua mensagem e entrará em contato em breve para confirmar os detalhes.
        </p>
        <div className="mt-6 p-4 rounded-2xl text-left w-full" style={{ backgroundColor: '#F4B94215', border: '1px solid #F4B94240' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#B8860B' }}>Próximos passos</p>
          <p className="text-sm text-gray-700">Combine prazo, local de entrega e forma de pagamento diretamente pelo chat com o prestador.</p>
        </div>
        <button
          onClick={() => setFormState('idle')}
          className="mt-4 text-sm font-semibold hover:underline"
          style={{ color: '#E8553D' }}
        >
          Enviar outra solicitação
        </button>
      </div>
    )
  }

  return (
    <div className="px-5 pb-6">
      {/* Delivery info banner */}
      <div
        className="rounded-2xl p-4 mb-5 flex gap-3"
        style={{ backgroundColor: '#2B9D8F12', border: '1px solid #2B9D8F30' }}
      >
        <span className="text-xl flex-shrink-0">🤝</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#2B9D8F' }}>
            Entrega combinada
          </p>
          <p className="text-sm text-gray-700">{provider.deliveryInfo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            O que você precisa?
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={`Descreva o serviço que precisa de ${provider.name.split(' ')[0]}...`}
            rows={4}
            className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-gray-400 resize-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Quando você precisa?
          </label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-gray-400 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Local de entrega / atendimento
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Seu endereço ou bairro"
              className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 pl-10 outline-none focus:border-gray-400 transition-colors"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            📍 O local exato será combinado diretamente com o prestador.
          </p>
        </div>

        {/* Price summary */}
        <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Preço base</span>
            <span className="text-sm font-semibold text-gray-900">{provider.price}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Frete / deslocamento</span>
            <span className="text-sm font-medium text-teal-600">A combinar</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-sm font-bold text-gray-900">A combinar</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={formState === 'sending'}
          className="w-full text-white font-semibold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#E8553D' }}
        >
          {formState === 'sending' ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </>
          ) : (
            'Enviar Solicitação'
          )}
        </button>
      </form>
    </div>
  )
}

export default function ProfileDrawer({ provider, canRequest = true, onRequireAuth, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('portfolio')
  const cat = CATEGORIES.find((c) => c.id === provider.category)
  const style = CATEGORY_STYLE[provider.category]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const TABS: { id: Tab; label: string }[] = [
    { id: 'portfolio', label: 'Portfólio' },
    { id: 'avaliacoes', label: 'Avaliações' },
    { id: 'solicitar', label: 'Solicitar' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white shadow-2xl"
        style={{ animation: 'slideIn 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Hero */}
        <div className="relative flex-shrink-0">
          <img
            src={`https://images.unsplash.com/${provider.photoId}?w=800&h=380&fit=crop&auto=format&q=80`}
            alt={provider.name}
            className="w-full h-52 object-cover bg-gray-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-label="Fechar perfil"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Info on image */}
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-end justify-between">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.pill} inline-block mb-2`}>
                  {cat?.emoji} {provider.categoryLabel}
                </span>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  {provider.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-xs text-white/80">{provider.location}</span>
                  {provider.nationality && (
                    <span className="flex items-center gap-1 text-xs text-white/80">
                      · {countryName(provider.nationality)}
                      <img
                        src={flagUrl(provider.nationality)}
                        alt={`Bandeira de ${countryName(provider.nationality)}`}
                        className="w-3.5 h-3.5 rounded-sm object-cover ring-1 ring-black/20"
                        loading="lazy"
                      />
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{provider.price}</div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${provider.availableNow ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className="text-xs text-white/80">{provider.availability}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio + Stats row */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-3">{provider.bio}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({provider.reviews} avaliações)</span>
            </div>
            {provider.verified && (
              <div className="flex items-center gap-1 text-teal-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold">Verificada</span>
              </div>
            )}
            {provider.badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                ★ {provider.badge}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-100 px-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 text-sm font-semibold py-3.5 border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-[#E8553D] text-[#E8553D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pt-5">
          {tab === 'portfolio' && <PortfolioTab provider={provider} />}
          {tab === 'avaliacoes' && <AvaliacoesTab provider={provider} />}
          {tab === 'solicitar' && <SolicitarTab provider={provider} />}
        </div>

        {/* Sticky bottom CTA (visible except on Solicitar tab) */}
        {tab !== 'solicitar' && (
          <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
            <button
              onClick={() => {
                if (canRequest) setTab('solicitar')
                else onRequireAuth?.()
              }}
              className="w-full text-white font-semibold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#E8553D' }}
            >
              {canRequest ? 'Solicitar serviço' : 'Entrar para solicitar'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
