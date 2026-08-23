import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, type CategoryId, type Provider } from '../data'
import ProviderCard from '../components/ProviderCard'
import { countryName, flagEmoji } from '../countries'
import { useLanguage } from '../i18n'

interface Region {
  label: string
  keywords: Set<string>
}

interface Props {
  providers: Provider[]
  onViewProvider: (p: Provider) => void
  canRequest?: boolean
  onRequireAuth?: () => void
}

type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'error'

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function useLocationRegion(): [Status, Region | null, () => void, () => void] {
  const [status, setStatus] = useState<Status>('idle')
  const [region, setRegion] = useState<Region | null>(null)

  const share = () => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
          )
          const data = await res.json()
          const a = data?.address ?? {}
          const parts = [
            a.suburb, a.borough, a.neighbourhood, a.city_district,
            a.town, a.village, a.city, a.state,
          ].filter((x: string | undefined): x is string => Boolean(x))

          const keywords = new Set(parts.map(norm))
          const city = a.city || a.town || a.village || a.county || ''
          const label = [city, a.state].filter(Boolean).join(', ')
          setRegion({ label: label || 'sua região', keywords })
          setStatus('granted')
        } catch {
          setStatus('error')
        }
      },
      () => setStatus('denied'),
      { timeout: 10000 }
    )
  }

  const skip = () => setStatus('denied')

  return [status, region, share, skip]
}

export default function ExplorePage({ providers, onViewProvider }: Props) {
  const { t } = useLanguage()
  const [status, region, share, skip] = useLocationRegion()
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'reviews'>('relevance')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setShowAll(false)
  }, [providers])

  const localProviders = useMemo(() => {
    if (status !== 'granted' || !region || region.keywords.size === 0) return null
    return providers.filter((p) =>
      p.location.split(',').some((part) => region.keywords.has(norm(part.trim())))
    )
  }, [providers, status, region])

  // 1. Nationalities available
  const countryOptions = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of providers) {
      if (activeCategory !== 'all' && p.category !== activeCategory) continue
      if (p.nationality) {
        map.set(p.nationality, (map.get(p.nationality) ?? 0) + 1)
      }
    }
    return [...map.entries()].map(([code, count]) => ({ code, count }))
  }, [providers, activeCategory])

  // 2. States available for selected nationality & category
  const stateOptions = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of providers) {
      if (activeCategory !== 'all' && p.category !== activeCategory) continue
      if (filterCountry !== '' && p.nationality !== filterCountry) continue
      if (p.state) {
        map.set(p.state, (map.get(p.state) ?? 0) + 1)
      }
    }
    return [...map.entries()].map(([state, count]) => ({ state, count }))
  }, [providers, activeCategory, filterCountry])

  // 3. Cities available for selected nationality, state & category
  const cityOptions = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of providers) {
      if (activeCategory !== 'all' && p.category !== activeCategory) continue
      if (filterCountry !== '' && p.nationality !== filterCountry) continue
      if (filterState !== '' && p.state !== filterState) continue
      if (p.city) {
        map.set(p.city, (map.get(p.city) ?? 0) + 1)
      }
    }
    return [...map.entries()].map(([city, count]) => ({ city, count }))
  }, [providers, activeCategory, filterCountry, filterState])

  // Auto-reset stale state / city filter when parent filter changes
  useEffect(() => {
    if (filterState && !stateOptions.some((s) => s.state === filterState)) {
      setFilterState('')
    }
  }, [stateOptions, filterState])

  useEffect(() => {
    if (filterCity && !cityOptions.some((c) => c.city === filterCity)) {
      setFilterCity('')
    }
  }, [cityOptions, filterCity])

  const visible = useMemo(() => {
    const base =
      status === 'granted' && region && !showAll && localProviders
        ? localProviders.length > 0
          ? localProviders
          : []
        : providers
    let list = base.filter(
      (p) =>
        (activeCategory === 'all' || p.category === activeCategory) &&
        (filterCountry === '' || p.nationality === filterCountry) &&
        (filterState === '' || p.state === filterState) &&
        (filterCity === '' || p.city === filterCity) &&
        (!onlyAvailableNow || p.availableNow)
    )
    if (sortBy === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'reviews') list = [...list].sort((a, b) => b.reviews - a.reviews)
    return list
  }, [
    providers, status, region, localProviders, showAll,
    activeCategory, filterCountry, filterState, filterCity, onlyAvailableNow, sortBy,
  ])

  const hasActiveFilters =
    activeCategory !== 'all' ||
    filterCountry !== '' ||
    filterState !== '' ||
    filterCity !== '' ||
    onlyAvailableNow

  const clearFilters = () => {
    setActiveCategory('all')
    setFilterCountry('')
    setFilterState('')
    setFilterCity('')
    setOnlyAvailableNow(false)
    setSortBy('relevance')
  }

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory)
  const showingLocalOnly =
    status === 'granted' && region && !showAll && localProviders !== null && localProviders.length > 0

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
          {t('explore.title')}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('explore.subtitle')}
        </p>
      </div>

      {/* Location prompt */}
      {status === 'idle' && (
        <div className="rounded-2xl border-2 p-6 mb-8 flex flex-col sm:flex-row items-center gap-4" style={{ borderColor: '#E8553D33', backgroundColor: '#FFF7F4' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: '#E8553D18' }}>
            📍
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
              {t('explore.shareTitle')}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {t('explore.shareText')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button
              onClick={share}
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8553D' }}
            >
              {t('explore.shareBtn')}
            </button>
            <button
              onClick={skip}
              className="text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('explore.notNow')}
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="rounded-2xl border-2 p-6 mb-8 flex items-center gap-4" style={{ borderColor: '#2B9D8F33', backgroundColor: '#F2FBFA' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: '#2B9D8F18' }}>
            📡
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
              {t('explore.locatingTitle')}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">{t('explore.locatingText')}</p>
          </div>
        </div>
      )}

      {(status === 'denied' || status === 'error') && (
        <div className="rounded-2xl border-2 p-6 mb-8 flex flex-col sm:flex-row items-center gap-4" style={{ borderColor: '#F4B94266', backgroundColor: '#FFFDF5' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: '#F4B94226' }}>
            🌍
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
              {t('explore.allBannerTitle')}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {status === 'error'
                ? t('explore.allBannerError')
                : t('explore.allBannerDenied')}
            </p>
          </div>
          <button
            onClick={share}
            className="flex-shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: '#E8553D', color: '#fff' }}
          >
            {t('explore.shareAgainBtn')}
          </button>
        </div>
      )}

      {status === 'granted' && region && (
        <div className="rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-4" style={{ backgroundColor: '#2B9D8F' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-white/15">
            📍
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>
              {t('explore.regionTitle', { region: region.label })}
            </h3>
            <p className="text-sm text-teal-50 mt-0.5">
              {showingLocalOnly
                ? t('explore.foundLocal', { n: localProviders!.length })
                : localProviders !== null && localProviders.length === 0
                  ? t('explore.noneLocal')
                  : t('explore.chooseRegion')}
            </p>
          </div>
          {showingLocalOnly && (
            <button
              onClick={() => setShowAll(true)}
              className="flex-shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl bg-white text-teal-700 hover:bg-teal-50 transition-colors"
            >
              {t('explore.seeAll')}
            </button>
          )}
          {showAll && (
            <button
              onClick={() => setShowAll(false)}
              className="flex-shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl bg-white text-teal-700 hover:bg-teal-50 transition-colors"
            >
              {t('explore.onlyMyRegion')}
            </button>
          )}
        </div>
      )}

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                isActive ? 'text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
              style={isActive ? { backgroundColor: '#E8553D' } : {}}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('explore.filters')}
          </span>

          <select
            value={filterCountry}
            onChange={(e) => { setFilterCountry(e.target.value); setFilterState(''); setFilterCity('') }}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#E8553D]/40 cursor-pointer"
          >
            <option value="">{t('explore.countryAll')}</option>
            {countryOptions.map(({ code, count }) => (
              <option key={code} value={code}>
                {flagEmoji(code)} {countryName(code)} ({count})
              </option>
            ))}
          </select>

          <select
            value={filterState}
            onChange={(e) => { setFilterState(e.target.value); setFilterCity('') }}
            disabled={stateOptions.length === 0}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#E8553D]/40 cursor-pointer disabled:opacity-50"
          >
            <option value="">{t('explore.stateAll')}</option>
            {stateOptions.map(({ state, count }) => (
              <option key={state} value={state}>
                {state} ({count})
              </option>
            ))}
          </select>

          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            disabled={cityOptions.length === 0}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#E8553D]/40 cursor-pointer disabled:opacity-50"
          >
            <option value="">{t('explore.cityAll')}</option>
            {cityOptions.map(({ city, count }) => (
              <option key={city} value={city}>
                {city} ({count})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer px-2 py-2">
            <input
              type="checkbox"
              checked={onlyAvailableNow}
              onChange={(e) => setOnlyAvailableNow(e.target.checked)}
              className="w-4 h-4 accent-[#E8553D]"
            />
            {t('explore.availableNow')}
          </label>

          <div className="flex-1" />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#E8553D]/40 cursor-pointer"
          >
            <option value="relevance">{t('explore.relevance')}</option>
            <option value="rating">{t('explore.bestRated')}</option>
            <option value="reviews">{t('explore.mostReviewed')}</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold px-3 py-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              {t('explore.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
          {showingLocalOnly ? `${t('explore.resultsRegion')} · ${activeCategory === 'all' ? t('explore.resultsAll') : activeCat?.label}` : activeCategory === 'all' ? t('explore.resultsAll') : activeCat?.label}
          <span className="text-base font-normal text-gray-400 ml-2">({visible.length})</span>
        </h2>
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((p) => (
            <ProviderCard key={p.id} provider={p} onOpen={onViewProvider} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {showingLocalOnly && !hasActiveFilters ? t('explore.noneLocal') : t('explore.noResultsTitle')}
          </h3>
          <p className="text-gray-500 mb-5">
            {hasActiveFilters
              ? t('explore.noResultsFilters')
              : showingLocalOnly
                ? t('explore.noResultsRegion')
                : t('explore.noResultsOther')}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8553D' }}
            >
              {t('explore.clearFiltersBtn')}
            </button>
          )}
          {showingLocalOnly && !hasActiveFilters && (
            <button
              onClick={() => setShowAll(true)}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8553D' }}
            >
              {t('explore.seeAllBtn')}
            </button>
          )}
        </div>
      )}
    </main>
  )
}
