import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  activateProvider,
  deactivateProvider,
  updateMe,
  updateMyPassword,
  updateProviderProfile,
  type AuthUser,
  type Provider,
  type ProviderProfile,
} from '../api'
import { COUNTRY_CODES, countryName, flagEmoji } from '../countries'

interface Props {
  user: AuthUser
  onUpdateUser: (user: AuthUser) => void
  onBack: () => void
  onViewProvider: (provider: Provider) => void
}

const CATEGORIES = [
  { id: 'manicure', label: 'Manicure', emoji: '💅' },
  { id: 'dogsitter', label: 'Dog Sitter', emoji: '🐕' },
  { id: 'confeitaria', label: 'Bolos & Salgados', emoji: '🎂' },
  { id: 'faxina', label: 'Faxina', emoji: '🧹' },
  { id: 'helper', label: 'Helpers', emoji: '🔧' },
]

const PHOTOS = {
  manicure: [
    'photo-1534528741775-53994a69daeb',
    'photo-1604654894610-df63bc536371',
    'photo-1604719312566-8912e9667d9f',
  ],
  dogsitter: [
    'photo-1548199973-03cce0bbc87b',
    'photo-1548767797-d8c844163c4c',
    'photo-1543466835-00a7907e9de1',
  ],
  confeitaria: [
    'photo-1578985545062-69928b1d9587',
    'photo-1578985545062-69928b1d9587',
    'photo-1606313564200-e75d5e30476c',
  ],
  faxina: [
    'photo-1581578731548-c64695cc6952',
    'photo-1527515637462-cff94eecc1ac',
    'photo-1556911220-bff31c812dba',
  ],
  helper: [
    'photo-1581092918056-0c4c3acd3789',
    'photo-1621905251189-08b45d6a269e',
    'photo-1574359411659-15573a27fd0c',
  ],
}

function makeProviderFromProfile(user: AuthUser, profile: ProviderProfile): Provider {
  return {
    id: user.id + 1000,
    name: user.name,
    category: profile.category,
    categoryLabel: profile.categoryLabel,
    nationality: profile.nationality,
    country: profile.country,
    state: profile.state,
    city: profile.city,
    rating: 0,
    reviews: 0,
    price: profile.price,
    location: profile.location,
    description: profile.description,
    bio: profile.bio,
    photoId: profile.photoId,
    portfolioIds: [],
    reviewsList: [],
    verified: false,
    availability: profile.availability,
    availableNow: profile.availableNow,
    deliveryInfo: '',
    services: profile.services,
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export default function ProfilePage({ user, onUpdateUser, onBack, onViewProvider }: Props) {
  const profile = user.providerProfile

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const [newCat, setNewCat] = useState('')

  const [cat, setCat] = useState(profile?.category ?? '')
  const [nationality, setNationality] = useState(profile?.nationality ?? 'BR')
  const [country, setCountry] = useState(profile?.country ?? 'BR')
  const [state, setState] = useState(profile?.state ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [price, setPrice] = useState(profile?.price ?? '')
export interface ServiceItem {
  name: string
  price: string
}

const DOG_FIXED_SERVICES = ['Walking', 'Drop-in', 'Sitting', 'Boarding', 'Daycare']

function normalizeServices(
  rawServices?: Array<string | { name: string; price?: string }> | null,
  category?: string
): ServiceItem[] {
  const isDog = category === 'dogsitter' || category === 'dogwalk'
  const list: ServiceItem[] = (rawServices ?? []).map((s) => {
    if (typeof s === 'string') return { name: s, price: '' }
    return { name: s.name, price: s.price ?? '' }
  })

  if (isDog) {
    return DOG_FIXED_SERVICES.map((fixedName) => {
      const existing = list.find((item) => item.name.toLowerCase() === fixedName.toLowerCase())
      return {
        name: fixedName,
        price: existing ? existing.price : '',
      }
    })
  }

  return list
}

  const [availability, setAvailability] = useState(profile?.availability ?? 'Disponível hoje')
  const [availableNow, setAvailableNow] = useState(profile?.availableNow ?? true)
  const [photoId, setPhotoId] = useState(profile?.photoId ?? '')
  const [services, setServices] = useState<ServiceItem[]>(() =>
    normalizeServices(profile?.services, profile?.category)
  )
  const [serviceNameInput, setServiceNameInput] = useState('')
  const [servicePriceInput, setServicePriceInput] = useState('')

  // Calendar & Working Hours Schedule
  const [workDays, setWorkDays] = useState<string[]>(['Seg', 'Ter', 'Qua', 'Qui', 'Sex'])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())

  // Portfolio photo management state
  const [portfolioIds, setPortfolioIds] = useState<string[]>(profile?.portfolioIds ?? [])
  const [newPortfolioPhotoInput, setNewPortfolioPhotoInput] = useState('')
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null)
  const [editingPhotoValue, setEditingPhotoValue] = useState('')

  function toggleBlockedDate(dateStr: string) {
    setBlockedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()
    )
  }

  function toggleWorkDay(day: string) {
    setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  function addPortfolioPhoto() {
    let clean = newPortfolioPhotoInput.trim()
    if (!clean) return
    if (clean.includes('unsplash.com/')) {
      const match = clean.match(/(?:photos\/|unsplash\.com\/)(photo-[a-zA-Z0-9-]+)/)
      if (match) clean = match[1]
    }
    setPortfolioIds([...portfolioIds, clean])
    setNewPortfolioPhotoInput('')
  }

  function removePortfolioPhoto(index: number) {
    setPortfolioIds(portfolioIds.filter((_, i) => i !== index))
  }

  function startEditPhoto(index: number) {
    setEditingPhotoIndex(index)
    setEditingPhotoValue(portfolioIds[index])
  }

  function saveEditPhoto() {
    if (editingPhotoIndex === null) return
    let clean = editingPhotoValue.trim()
    if (clean) {
      if (clean.includes('unsplash.com/')) {
        const match = clean.match(/(?:photos\/|unsplash\.com\/)(photo-[a-zA-Z0-9-]+)/)
        if (match) clean = match[1]
      }
      setPortfolioIds((prev) => {
        const next = [...prev]
        next[editingPhotoIndex] = clean
        return next
      })
    }
    setEditingPhotoIndex(null)
    setEditingPhotoValue('')
  }

  useEffect(() => {
    if (!user.providerProfile) return
    setCat(user.providerProfile.category)
    setNationality(user.providerProfile.nationality)
    setCountry(user.providerProfile.country)
    setState(user.providerProfile.state)
    setCity(user.providerProfile.city)
    setDescription(user.providerProfile.description)
    setBio(user.providerProfile.bio)
    setPrice(user.providerProfile.price)
    setAvailability(user.providerProfile.availability)
    setAvailableNow(user.providerProfile.availableNow)
    setPhotoId(user.providerProfile.photoId)
    setServices(normalizeServices(user.providerProfile.services, user.providerProfile.category))
  }, [user.providerProfile])

  // If category changes to dogsitter, switch to fixed services
  useEffect(() => {
    if (cat === 'dogsitter' || cat === 'dogwalk') {
      setServices((prev) => normalizeServices(prev, cat))
    }
  }, [cat])

  const photoOptions = useMemo(() => PHOTOS[cat as keyof typeof PHOTOS] ?? [], [cat])

  function handlePhotoOption(id: string) {
    setPhotoId(id)
  }

  function addCustomService() {
    const nameTrim = serviceNameInput.trim()
    if (!nameTrim) return
    if (services.some((s) => s.name.toLowerCase() === nameTrim.toLowerCase())) return
    setServices([...services, { name: nameTrim, price: servicePriceInput.trim() }])
    setServiceNameInput('')
    setServicePriceInput('')
  }

  function removeService(nameToRemove: string) {
    setServices(services.filter((x) => x.name !== nameToRemove))
  }

  function updateServicePrice(index: number, newPrice: string) {
    setServices((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], price: newPrice }
      return next
    })
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      const { user: updated } = await updateMe({ name, email })
      onUpdateUser(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword.length < 6) {
      setPasswordError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação de senha não confere.')
      return
    }
    setPasswordLoading(true)
    try {
      const res = await updateMyPassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      })
      setPasswordSuccess(res.message || 'Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao alterar a senha.')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleActivate(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!newCat) return
    try {
      const { user: updated } = await activateProvider(newCat)
      onUpdateUser(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar.')
    }
  }

  async function handleSaveProvider(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      const { user: updated } = await updateProviderProfile({
        category: cat,
        nationality,
        country,
        state,
        city,
        description,
        bio,
        price,
        availability,
        availableNow,
        photoId,
        portfolioIds,
        services,
      })
      onUpdateUser(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil de prestador.')
    }
  }

  async function handleDeactivate() {
    if (!window.confirm('Desativar o modo prestador? Seu perfil de serviço será removido do marketplace.')) return
    setError('')
    try {
      const { user: updated } = await deactivateProvider()
      onUpdateUser(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar.')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF6F0', fontFamily: "'Outfit', sans-serif" }}>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex items-center gap-3 h-16">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8553D' }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Fraunces', serif" }}>V</span>
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#1A1511' }}>
              Meu perfil
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
        )}

        {/* ── Cabeçalho do perfil ── */}
        <section className="bg-white rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#E8553D' }}
          >
            {initials(user.name)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
              {user.name}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#2B9D8F1A', color: '#2B9D8F' }}>
                ✓ Cliente
              </span>
              {profile ? (
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#E8553D1A', color: '#E8553D' }}>
                  ★ Prestador
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500">★ Prestador inativo</span>
              )}
            </div>
          </div>
        </section>

        {/* ── Dados da conta & Senha ── */}
        <section className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Dados da conta
            </h2>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
                  style={{ backgroundColor: '#E8553D' }}
                >
                  Salvar dados
                </button>
                {saved && <span className="text-sm text-green-600 font-medium">✓ Salvo!</span>}
              </div>
            </form>
          </div>

          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Segurança & Redefinição de Senha</h3>
                <p className="text-xs text-gray-500">Altere sua senha de acesso a qualquer momento.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {showPasswordForm ? 'Ocultar' : 'Alterar Senha'}
              </button>
            </div>

            {passwordSuccess && (
              <div className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mt-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                {passwordError}
              </div>
            )}

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3 p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Senha Atual (opcional se não lembrar)</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Sua senha atual"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                </div>
                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="text-xs font-semibold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#E8553D' }}
                  >
                    {passwordLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="text-xs font-semibold text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ── Modo prestador ── */}
        {!profile ? (
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
              Vire um prestador
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Você continua podendo contratar serviços e ainda oferece seu trabalho na vizinhança. É gratuito.
            </p>
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Escolha a categoria</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setNewCat(c.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        newCat === c.id
                          ? 'text-white border-transparent'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                      style={newCat === c.id ? { backgroundColor: '#E8553D' } : {}}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={!newCat}
                className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#2B9D8F' }}
              >
                Ativar modo prestador
              </button>
            </form>
          </section>
        ) : (
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                Perfil de prestador
              </h2>
              <button
                onClick={() => onViewProvider(makeProviderFromProfile(user, profile))}
                className="text-sm font-semibold hover:underline"
                style={{ color: '#E8553D' }}
              >
                Ver como aparece no marketplace →
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCat(c.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all ${
                        cat === c.id
                          ? 'text-white border-transparent'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                      style={cat === c.id ? { backgroundColor: '#E8553D' } : {}}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição curta</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: Faxina completa com produtos ecológicos"
                  maxLength={300}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte sua experiência e diferenciais"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nacionalidade</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{flagEmoji(nationality)}</span>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D] appearance-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {countryName(code)}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  O país de origem aparece no marketplace ao lado do tipo de serviço.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D] appearance-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {countryName(code)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Ex.: SP"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex.: Moema"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                A localização aparece no marketplace como "Cidade, Estado" e é usada nos filtros do Explorar.
              </p>

              {/* ── Disponibilidade, Horários & Calendário de Bloqueio ── */}
              <div className="space-y-4 p-5 bg-gray-50/70 rounded-2xl border border-gray-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Disponibilidade & Calendário</h3>
                    <p className="text-xs text-gray-500">Configure seus dias de trabalho e bloqueie datas de folga.</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={availableNow}
                      onChange={(e) => setAvailableNow(e.target.checked)}
                      className="w-4 h-4 accent-[#E8553D]"
                    />
                    <span className="text-xs text-gray-800 font-semibold">🟢 Disponível agora</span>
                  </label>
                </div>

                {/* Dias da semana */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dias da semana que atende</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => {
                      const active = workDays.includes(d)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleWorkDay(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? 'bg-[#E8553D] text-white shadow-2xs'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Horários */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Horário Início</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Horário Término</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Texto no Card</label>
                    <input
                      type="text"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="Ex: Seg a Sex · 8h-18h"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40"
                    />
                  </div>
                </div>

                {/* Calendário de Bloqueio de Datas */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>📅 Bloquear datas (clique no dia para bloquear/desbloquear)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 0) {
                            setCalMonth(11)
                            setCalYear(calYear - 1)
                          } else {
                            setCalMonth(calMonth - 1)
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        ◀
                      </button>
                      <span className="text-xs font-bold text-gray-800 min-w-[100px] text-center">
                        {new Date(calYear, calMonth, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 11) {
                            setCalMonth(0)
                            setCalYear(calYear + 1)
                          } else {
                            setCalMonth(calMonth + 1)
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        ▶
                      </button>
                    </div>
                  </div>

                  {/* Grid do mês */}
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dw) => (
                        <span key={dw} className="text-[10px] font-bold text-gray-400">
                          {dw}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {/* Blank spaces for first day */}
                      {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                        <div key={`blank-${i}`} className="h-8" />
                      ))}
                      {/* Days */}
                      {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                        const dayNum = i + 1
                        const dayStr = String(dayNum).padStart(2, '0')
                        const monthStr = String(calMonth + 1).padStart(2, '0')
                        const fullDateStr = `${calYear}-${monthStr}-${dayStr}`
                        const isBlocked = blockedDates.includes(fullDateStr)

                        return (
                          <button
                            key={fullDateStr}
                            type="button"
                            onClick={() => toggleBlockedDate(fullDateStr)}
                            className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                              isBlocked
                                ? 'bg-rose-500 text-white line-through font-bold shadow-2xs'
                                : 'bg-gray-50 text-gray-800 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                            title={isBlocked ? `Bloqueado em ${fullDateStr} (clique para liberar)` : `Disponível em ${fullDateStr} (clique para bloquear)`}
                          >
                            {dayNum}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Lista de datas bloqueadas */}
                  {blockedDates.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-rose-700">🚫 Datas bloqueadas:</span>
                      {blockedDates.map((bDate) => (
                        <span
                          key={bDate}
                          className="text-[11px] font-medium bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded-lg flex items-center gap-1"
                        >
                          {bDate.split('-').reverse().join('/')}
                          <button
                            type="button"
                            onClick={() => toggleBlockedDate(bDate)}
                            className="text-rose-500 hover:text-rose-900 font-bold ml-0.5"
                            title="Desbloquear data"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Formulário de Serviços & Valores Individuais ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Serviços Oferecidos & Valores Individuais
                </label>

                {cat === 'dogsitter' || cat === 'dogwalk' ? (
                  <div className="space-y-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80">
                    <p className="text-xs text-amber-900 font-medium">
                      🐕 <strong>Serviços fixos para Dog Walking / Pet Care:</strong> defina os valores individuais para cada modalidade oferecida.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((s, idx) => (
                        <div key={s.name} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-gray-200">
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#E8553D]" />
                            {s.name}
                          </span>
                          <div className="w-32">
                            <input
                              type="text"
                              value={s.price}
                              onChange={(e) => updateServicePrice(idx, e.target.value)}
                              placeholder="Ex: R$ 35/h"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#E8553D]/40"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={serviceNameInput}
                        onChange={(e) => setServiceNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCustomService()
                          }
                        }}
                        placeholder="Nome do serviço (Ex: Manicure em Gel)"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                      />
                      <input
                        type="text"
                        value={servicePriceInput}
                        onChange={(e) => setServicePriceInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCustomService()
                          }
                        }}
                        placeholder="Valor (Ex: R$ 80 ou $45)"
                        className="w-full sm:w-44 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                      />
                      <button
                        type="button"
                        onClick={addCustomService}
                        className="text-sm font-semibold px-5 py-2.5 rounded-xl border-2 transition-colors flex-shrink-0"
                        style={{ borderColor: '#E8553D', color: '#E8553D' }}
                      >
                        Adicionar
                      </button>
                    </div>

                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {services.map((s) => (
                          <span
                            key={s.name}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs"
                            style={{ backgroundColor: '#E8553D14', color: '#E8553D' }}
                          >
                            <span>{s.name}</span>
                            {s.price && (
                              <span className="bg-white px-2 py-0.5 rounded-lg text-[11px] font-bold text-gray-800 border border-[#E8553D]/20">
                                {s.price}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeService(s.name)}
                              aria-label={`Remover ${s.name}`}
                              className="text-gray-400 hover:text-red-600 font-bold ml-0.5 text-sm leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto de capa / perfil</label>
                <div className="flex gap-2">
                  {photoOptions.map((id) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => handlePhotoOption(id)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        photoId === id ? 'border-[#E8553D] ring-2 ring-[#E8553D]/30' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={`https://images.unsplash.com/${id}?w=120&h=120&fit=crop&auto=format&q=60`} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Gerenciador de Fotos do Portfólio (Adicionar, Editar, Remover) ── */}
              <div className="space-y-3 p-5 bg-gray-50/70 rounded-2xl border border-gray-200/80">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Fotos de Serviços do Portfólio</h3>
                  <p className="text-xs text-gray-500">Adicione, edite ou remova fotos dos seus trabalhos anteriores.</p>
                </div>

                {/* Input para adicionar nova foto */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPortfolioPhotoInput}
                    onChange={(e) => setNewPortfolioPhotoInput(e.target.value)}
                    placeholder="URL da imagem ou ID Unsplash (ex: photo-1534528741775-53994a69daeb)"
                    className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                  <button
                    type="button"
                    onClick={addPortfolioPhoto}
                    disabled={!newPortfolioPhotoInput.trim()}
                    className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#E8553D' }}
                  >
                    + Adicionar Foto
                  </button>
                </div>

                {/* Modal inline de edição */}
                {editingPhotoIndex !== null && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row gap-2 items-center">
                    <span className="text-xs font-bold text-amber-900 flex-shrink-0">Editar Foto #{editingPhotoIndex + 1}:</span>
                    <input
                      type="text"
                      value={editingPhotoValue}
                      onChange={(e) => setEditingPhotoValue(e.target.value)}
                      placeholder="Novo ID ou URL"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-800 outline-none"
                    />
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={saveEditPhoto}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E8553D] text-white"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingPhotoIndex(null); setEditingPhotoValue('') }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Grade de fotos do portfólio */}
                {portfolioIds.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhuma foto adicionada ao portfólio ainda.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {portfolioIds.map((pId, idx) => {
                      const imgUrl = pId.startsWith('http')
                        ? pId
                        : `https://images.unsplash.com/${pId}?w=240&h=240&fit=crop&auto=format&q=75`

                      return (
                        <div key={`${pId}-${idx}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group">
                          <img src={imgUrl} alt={`Portfólio ${idx + 1}`} className="w-full aspect-square object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                            <button
                              type="button"
                              onClick={() => startEditPhoto(idx)}
                              className="w-full py-1 text-[11px] font-bold text-white bg-white/30 backdrop-blur-xs rounded-lg hover:bg-white/50"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => removePortfolioPhoto(idx)}
                              className="w-full py-1 text-[11px] font-bold text-white bg-rose-600/80 rounded-lg hover:bg-rose-600"
                            >
                              🗑️ Remover
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
                  style={{ backgroundColor: '#E8553D' }}
                >
                  Salvar perfil
                </button>
                {saved && <span className="text-sm text-green-600 font-medium">✓ Salvo!</span>}
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="ml-auto text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
                >
                  Desativar modo prestador
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
