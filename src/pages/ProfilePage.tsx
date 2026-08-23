import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  activateProvider,
  deactivateProvider,
  updateMe,
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

  const [newCat, setNewCat] = useState('')

  const [cat, setCat] = useState(profile?.category ?? '')
  const [nationality, setNationality] = useState(profile?.nationality ?? 'BR')
  const [country, setCountry] = useState(profile?.country ?? 'BR')
  const [state, setState] = useState(profile?.state ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [price, setPrice] = useState(profile?.price ?? '')
  const [availability, setAvailability] = useState(profile?.availability ?? 'Disponível hoje')
  const [availableNow, setAvailableNow] = useState(profile?.availableNow ?? true)
  const [photoId, setPhotoId] = useState(profile?.photoId ?? '')
  const [services, setServices] = useState<string[]>(
    (profile?.services ?? []).map((s) => (typeof s === 'string' ? s : s.name))
  )
  const [serviceInput, setServiceInput] = useState('')

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
    setServices((user.providerProfile.services ?? []).map((s) => (typeof s === 'string' ? s : s.name)))
  }, [user.providerProfile])

  const photoOptions = useMemo(() => PHOTOS[cat as keyof typeof PHOTOS] ?? [], [cat])

  function handlePhotoOption(id: string) {
    setPhotoId(id)
  }

  function addService() {
    const s = serviceInput.trim()
    if (!s || services.includes(s)) return
    setServices([...services, s])
    setServiceInput('')
  }

  function removeService(s: string) {
    setServices(services.filter((x) => x !== s))
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

        {/* ── Dados da conta ── */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Disponibilidade</label>
                  <input
                    type="text"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="Ex.: Disponível hoje"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableNow}
                      onChange={(e) => setAvailableNow(e.target.checked)}
                      className="w-4 h-4 accent-[#E8553D]"
                    />
                    <span className="text-sm text-gray-700 font-medium">Disponível agora</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Serviços oferecidos</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addService()
                      }
                    }}
                    placeholder="Ex.: Faxina geral"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E8553D]/40 focus:border-[#E8553D]"
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="text-sm font-semibold px-4 py-2.5 rounded-xl border-2 transition-colors"
                    style={{ borderColor: '#E8553D', color: '#E8553D' }}
                  >
                    Adicionar
                  </button>
                </div>
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {services.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"
                        style={{ backgroundColor: '#E8553D14', color: '#E8553D' }}
                      >
                        {s}
                        <button type="button" onClick={() => removeService(s)} aria-label={`Remover ${s}`} className="hover:text-red-600">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto do perfil</label>
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
