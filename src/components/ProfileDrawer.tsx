import { useState, useEffect, type FormEvent } from 'react'
import {
  CATEGORIES,
  CATEGORY_STYLE,
  DEFAULT_PHOTO_URL,
  getPhotoUrl,
  isProviderVerified,
  getLocalizedBio,
  getLocalizedServices,
  getLocalizedAvailability,
  getLocalizedDeliveryInfo,
  getLocalizedPrice,
  getLocalizedBadge,
  getLocalizedReviewText,
  type Provider,
} from '../data'
import { countryName, flagUrl } from '../countries'
import { useLanguage } from '../i18n'
import { createServiceRequest } from '../api'
import ShareProfileModal from './ShareProfileModal'

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
  const { t, lang } = useLanguage()
  const services = getLocalizedServices(provider, lang)

  if (provider.portfolioIds.length === 0) {
    return (
      <div className="px-5 pb-6 text-center py-10">
        <div className="text-4xl mb-3">📸</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          {t('drawer.portfolioEmptyTitle')}
        </h3>
        <p className="text-sm text-gray-500">{t('drawer.portfolioEmptyText')}</p>
      </div>
    )
  }

  return (
    <div className="px-5 pb-6">
      <div className="grid grid-cols-3 gap-1.5 mb-6">
        {provider.portfolioIds.map((id, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer">
            <img
              src={getPhotoUrl(id, 300, 300)}
              alt={`Trabalho ${i + 1} de ${provider.name}`}
              onError={(e) => {
                if (e.currentTarget.src !== DEFAULT_PHOTO_URL) {
                  e.currentTarget.src = DEFAULT_PHOTO_URL
                }
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
          {t('drawer.servicesTitle')}
        </h3>
        {services.length === 0 ? (
          <p className="text-xs text-gray-400">{t('drawer.noIndividualServices')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.map((s, idx) => {
              const name = typeof s === 'string' ? s : s.name
              const price = typeof s === 'string' ? '' : s.price
              const key = typeof s === 'string' ? `${s}-${idx}` : `${s.name}-${idx}`
              return (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-semibold text-gray-800">{name}</span>
                  {price && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-900">
                      {price}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function AvaliacoesTab({ provider }: { provider: Provider }) {
  const { t, lang } = useLanguage()
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
          {t('drawer.noReviewsTitle')}
        </h3>
        <p className="text-sm text-gray-500">{t('drawer.noReviewsText')}</p>
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
          <div className="text-xs text-gray-500 mt-1">{provider.reviews} {t('drawer.reviewsCount')}</div>
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
                src={getPhotoUrl(review.avatarId, 80, 80)}
                alt={review.author}
                onError={(e) => {
                  if (e.currentTarget.src !== DEFAULT_PHOTO_URL) {
                    e.currentTarget.src = DEFAULT_PHOTO_URL
                  }
                }}
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
            <p className="text-sm text-gray-700 leading-relaxed">{getLocalizedReviewText(review, lang)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type FormState = 'idle' | 'sending' | 'success'

function SolicitarTab({ provider }: { provider: Provider }) {
  const { t, lang } = useLanguage()
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')

  const today = new Date().toISOString().split('T')[0]
  const deliveryInfo = getLocalizedDeliveryInfo(provider, lang)
  const price = getLocalizedPrice(provider, lang)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!desc.trim() || !date) return
    setFormState('sending')
    try {
      await createServiceRequest({
        providerUserId: provider.id > 1000 ? provider.id - 1000 : provider.id,
        serviceName: (lang === 'en' && provider.categoryLabelEn ? provider.categoryLabelEn : provider.categoryLabel) || 'Serviço',
        details: desc,
        dateTime: date,
        location: provider.location || '',
        basePrice: price || '',
        shippingPrice: t('drawer.toCombine'),
        totalPrice: price || t('drawer.toCombine'),
      })
      setFormState('success')
    } catch {
      setFormState('success')
    }
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
          {t('drawer.sentTitle')}
        </h3>
        <p className="text-gray-600 text-sm max-w-xs">
          {t('drawer.sentText', { name: provider.name })}
        </p>
        <div className="mt-6 p-4 rounded-2xl text-left w-full" style={{ backgroundColor: '#F4B94215', border: '1px solid #F4B94240' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#B8860B' }}>
            {t('drawer.nextSteps')}
          </p>
          <p className="text-sm text-gray-700">
            {t('drawer.nextStepsText')}
          </p>
        </div>
        <button
          onClick={() => setFormState('idle')}
          className="mt-4 text-sm font-semibold hover:underline"
          style={{ color: '#E8553D' }}
        >
          {t('drawer.sendAnother')}
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
            {t('drawer.deliveryCombinada')}
          </p>
          <p className="text-sm text-gray-700">{deliveryInfo || t('drawer.toCombine')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t('drawer.whatYouNeed')}
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={t('drawer.describePlaceholder', { name: provider.name.split(' ')[0] })}
            rows={4}
            className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-gray-400 resize-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t('drawer.whenYouNeed')}
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
            {t('drawer.deliveryLocation')}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={t('drawer.addressPlaceholder')}
              className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 pl-10 outline-none focus:border-gray-400 transition-colors"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {t('drawer.exactLocation')}
          </p>
        </div>

        {/* Price summary */}
        <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t('drawer.basePrice')}</span>
            <span className="text-sm font-semibold text-gray-900">{price}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t('drawer.shipping')}</span>
            <span className="text-sm font-medium text-teal-600">{t('drawer.toCombine')}</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">{t('drawer.total')}</span>
            <span className="text-sm font-bold text-gray-900">{t('drawer.toCombine')}</span>
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('drawer.sending')}</span>
            </>
          ) : (
            t('drawer.sendBtn')
          )}
        </button>
      </form>
    </div>
  )
}

export default function ProfileDrawer({ provider, canRequest = true, onRequireAuth, onClose }: Props) {
  const { t, lang } = useLanguage()
  const [tab, setTab] = useState<Tab>('portfolio')
  const [shareOpen, setShareOpen] = useState(false)
  const cat = CATEGORIES.find((c) => c.id === provider.category)
  const style = CATEGORY_STYLE[provider.category]
  const badge = getLocalizedBadge(provider, lang)
  const bio = getLocalizedBio(provider, lang)
  const price = getLocalizedPrice(provider, lang)
  const availability = getLocalizedAvailability(provider, lang)
  const categoryLabel = lang === 'en' && provider.categoryLabelEn ? provider.categoryLabelEn : provider.categoryLabel

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
    { id: 'portfolio', label: t('drawer.portfolio') },
    { id: 'avaliacoes', label: t('drawer.reviews') },
    { id: 'solicitar', label: t('drawer.request') },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: 'rgba(26, 21, 17, 0.65)' }}
      onClick={onClose}
    >
      {/* Centered Modal Container */}
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative flex-shrink-0">
          <img
            src={getPhotoUrl(provider.photoId, 800, 380)}
            alt={provider.name}
            onError={(e) => {
              if (e.currentTarget.src !== DEFAULT_PHOTO_URL) {
                e.currentTarget.src = DEFAULT_PHOTO_URL
              }
            }}
            className="w-full h-48 sm:h-56 object-cover bg-gray-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

          {/* Top Actions: Share & Close */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-xs font-semibold text-white hover:bg-black/60 transition-colors cursor-pointer"
              aria-label={t('share.button')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{t('share.button')}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label={t('drawer.close')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info on image */}
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-end justify-between">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.pill} inline-block mb-2`}>
                  {cat?.emoji} {categoryLabel}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  {provider.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-xs text-white/80">{provider.location}</span>
                  {provider.nationality && (
                    <span className="flex items-center gap-1 text-xs text-white/80">
                      · {countryName(provider.nationality, lang as 'pt' | 'en')}
                      <img
                        src={flagUrl(provider.nationality)}
                        alt={`Bandeira de ${countryName(provider.nationality, lang as 'pt' | 'en')}`}
                        className="w-3.5 h-3.5 rounded-sm object-cover ring-1 ring-black/20"
                        loading="lazy"
                      />
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-bold text-white">{price}</div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${provider.availableNow ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className="text-xs text-white/80">{availability}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio + Stats row */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-600 mb-2 leading-relaxed">{bio}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({provider.reviews} {t('drawer.reviewsCount')})</span>
            </div>
            {isProviderVerified(provider) && (
              <div className="flex items-center gap-1 text-teal-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold">{t('card.verified')}</span>
              </div>
            )}
            {badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                ★ {badge}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-100 px-5 sm:px-6 bg-white">
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === 'portfolio' && <PortfolioTab provider={provider} />}
          {tab === 'avaliacoes' && <AvaliacoesTab provider={provider} />}
          {tab === 'solicitar' && <SolicitarTab provider={provider} />}
        </div>

        {/* Sticky bottom CTA (visible except on Solicitar tab) */}
        {tab !== 'solicitar' && (
          <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white flex justify-end">
            <button
              onClick={() => {
                if (canRequest) setTab('solicitar')
                else onRequireAuth?.()
              }}
              className="w-full sm:w-auto px-8 text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
              style={{ backgroundColor: '#E8553D' }}
            >
              {canRequest ? t('drawer.requestBtn') : t('drawer.loginToRequest')}
            </button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareProfileModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        provider={provider}
      />
    </div>
  )
}
