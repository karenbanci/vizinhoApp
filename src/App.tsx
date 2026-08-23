import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, PROVIDERS, type CategoryId, type Provider } from './data'
import ProviderCard from './components/ProviderCard'
import ProfileDrawer from './components/ProfileDrawer'
import AuthModal from './components/AuthModal'
import ProfilePage from './pages/ProfilePage'
import ExplorePage from './pages/ExplorePage'
import AdminPage from './pages/AdminPage'
import { clearToken, fetchMe, fetchProviders, getToken, type AuthUser } from './api'

export default function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Provider | null>(null)
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'reset' | null>(null)
  const [resetToken, setResetToken] = useState('')
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [view, setView] = useState<'home' | 'explorar' | 'profile' | 'admin'>('home')
  const [dbProviders, setDbProviders] = useState<Provider[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reset = params.get('reset')
    if (reset) {
      setResetToken(reset)
      setAuthModal('reset')
      window.history.replaceState({}, '', window.location.pathname)
    }

    const admin = params.get('admin')
    if (admin) {
      setView('admin')
    }
  }, [])

  useEffect(() => {
    if (!getToken()) return
    fetchMe()
      .then(({ user }) => setAuthUser(user))
      .catch(() => clearToken())
  }, [])

  useEffect(() => {
    fetchProviders()
      .then(({ providers }) => setDbProviders(providers as Provider[]))
      .catch(() => {})
  }, [])

  const allProviders = useMemo(() => [...PROVIDERS, ...dbProviders], [dbProviders])

  const filtered = allProviders.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory)

  const goToHowItWorks = () => {
    setView('home')
    window.setTimeout(() => {
      document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF6F0', fontFamily: "'Outfit', sans-serif" }}>
      {view === 'admin' ? (
        <AdminPage onBack={() => setView('home')} />
      ) : view === 'profile' && authUser ? (
        <ProfilePage
          user={authUser}
          onUpdateUser={setAuthUser}
          onBack={() => setView('home')}
          onViewProvider={(p) => setSelected(p as Provider)}
        />
      ) : (
        <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <button onClick={() => setView('home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8553D' }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Fraunces', serif" }}>V</span>
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: '#1A1511' }}>
              Vizinho
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#" onClick={(e) => { e.preventDefault(); setView('explorar') }} className="hover:text-gray-900 transition-colors font-medium">Explorar</a>
            <a href="#" onClick={(e) => { e.preventDefault(); goToHowItWorks() }} className="hover:text-gray-900 transition-colors font-medium">Como funciona</a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (authUser) setView('profile')
                else setAuthModal('register')
              }}
              className="hover:text-gray-900 transition-colors font-medium"
            >
              Seja prestador
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setView('admin')
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              title="Acessar Painel Administrativo de Senhas"
            >
              <span>🛡️ Admin</span>
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {authUser ? (
              <>
                <button
                  onClick={() => setView('profile')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#E8553D' }}>
                    {authUser.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:block">Olá, {authUser.name.split(' ')[0]}</span>
                </button>
                <button
                  onClick={() => { clearToken(); setAuthUser(null); setView('home') }}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthModal('login')}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setAuthModal('register')}
                  className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
                  style={{ backgroundColor: '#E8553D' }}
                >
                  Cadastrar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {view === 'explorar' ? (
        <ExplorePage providers={allProviders} onViewProvider={setSelected} />
      ) : (
        <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6" style={{ backgroundColor: '#E8553D' }}>
        <div className="absolute rounded-full opacity-25 pointer-events-none" style={{ width: 320, height: 320, backgroundColor: '#F4B942', top: '-80px', right: '-60px' }} />
        <div className="absolute rounded-full opacity-20 pointer-events-none" style={{ width: 200, height: 200, backgroundColor: '#2B9D8F', bottom: '-60px', left: '-40px' }} />
        <div className="absolute rounded-full opacity-10 pointer-events-none" style={{ width: 100, height: 100, backgroundColor: '#FAF6F0', top: '40%', left: '20%' }} />
        <div className="absolute opacity-10 pointer-events-none" style={{ width: 60, height: 60, border: '6px solid #FAF6F0', borderRadius: 4, top: '20%', right: '25%', transform: 'rotate(20deg)' }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-red-200 mb-3">Serviços perto de você</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            O vizinho certo<br />para o serviço certo
          </h1>
          <p className="text-red-100 text-lg mb-8">
            Manicures, dog sitters, confeiteiros, faxineiras e muito mais — todos verificados e avaliados.
          </p>

          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-xl max-w-xl mx-auto">
            <div className="flex-1 flex items-center gap-2 px-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar serviço ou profissional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-gray-800 placeholder-gray-400 text-sm outline-none bg-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Limpar busca">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 flex-shrink-0" style={{ backgroundColor: '#E8553D' }}>
              Buscar
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-10 text-white/90">
            {[
              { value: '2.400+', label: 'Prestadores' },
              { value: '18 mil+', label: 'Avaliações' },
              { value: '4.9 ★', label: 'Nota média' },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-red-200 text-xs mt-0.5">{stat.label}</div>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-white/20" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-8">
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

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
            {activeCategory === 'all' ? 'Todos os prestadores' : activeCat?.label}
            <span className="text-base font-normal text-gray-400 ml-2">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
              Melhor avaliados
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProviderCard key={p.id} provider={p} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum prestador encontrado</h3>
            <p className="text-gray-500 mb-5">Tente buscar por outro termo ou categoria.</p>
            <button onClick={() => { setSearch(''); setActiveCategory('all') }} className="text-sm font-semibold hover:underline" style={{ color: '#E8553D' }}>
              Limpar filtros
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="text-center mt-10">
            <button
              className="px-8 py-3 rounded-xl border-2 font-semibold transition-all hover:text-white hover:bg-[#E8553D]"
              style={{ borderColor: '#E8553D', color: '#E8553D' }}
            >
              Ver mais prestadores
            </button>
          </div>
        )}
      </main>

      {/* ── CTA Banner ── */}
      <section className="mx-4 sm:mx-6 mb-10 rounded-3xl overflow-hidden relative" style={{ backgroundColor: '#F4B942' }}>
        <div className="absolute rounded-full opacity-25 pointer-events-none" style={{ width: 200, height: 200, backgroundColor: '#E8553D', top: '-50px', right: '10%' }} />
        <div className="absolute rounded-full opacity-20 pointer-events-none" style={{ width: 140, height: 140, backgroundColor: '#2B9D8F', bottom: '-40px', left: '30%' }} />
        <div className="absolute opacity-15 pointer-events-none" style={{ width: 50, height: 50, border: '5px solid #1A1511', borderRadius: 4, top: '30%', left: '8%', transform: 'rotate(-15deg)' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Você tem um talento?
            </h3>
            <p className="text-gray-700 max-w-md">Cadastre-se como prestador e comece a ganhar dinheiro na sua vizinhança. É gratuito.</p>
          </div>
          <button
            onClick={() => {
              if (authUser) setView('profile')
              else setAuthModal('register')
            }}
            className="flex-shrink-0 bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            Quero ser prestador →
          </button>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
            Como funciona
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            O Vizinho conecta você às pessoas talentosas que moram na sua região. Precisa de uma manicure,
            de alguém para cuidar do seu pet ou de uma faxina? Encontre um vizinho avaliado, combine direto
            com ele e fortaleça a economia do seu bairro — sem taxas surpresa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '🔍', title: 'Encontre', text: 'Busque pelo serviço que precisa e filtre por categoria, localização e avaliação.', color: '#E8553D' },
            { step: '02', icon: '💬', title: 'Combine', text: 'Fale direto com o prestador, tire dúvidas e agende no melhor horário para você.', color: '#F4B942' },
            { step: '03', icon: '⭐', title: 'Avalie', text: 'Após o serviço, deixe sua avaliação e ajude outros vizinhos a escolher bem.', color: '#2B9D8F' },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl" style={{ backgroundColor: item.color + '18' }}>
                {item.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: item.color }}>{item.step}</p>
              <h3 className="font-bold text-gray-900 text-lg mb-2" style={{ fontFamily: "'Fraunces', serif" }}>{item.title}</h3>
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Missão, Visão e Valores ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
            Quem somos
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Nosso objetivo é simples: tornar a vizinhança um lugar onde ninguém precise procurar ajuda longe
            de casa. Por trás disso, temos uma missão, uma visão e valores que guiam cada decisão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4" style={{ borderTopColor: '#E8553D' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl" style={{ backgroundColor: '#E8553D18' }}>🎯</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Nossa missão</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Conectar vizinhos por meio de serviços de confiança, transformando talentos próximos em soluções
              do dia a dia e fortalecendo a economia do bairro.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4" style={{ borderTopColor: '#2B9D8F' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl" style={{ backgroundColor: '#2B9D8F18' }}>🔭</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Nossa visão</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ser a maior e mais confiável comunidade de serviços locais do Brasil, onde cada vizinho encontra
              ou oferece ajuda com segurança, justiça e valorização do seu trabalho.
            </p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
            Nossos valores
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🤝', title: 'Comunidade em primeiro lugar', text: 'Acreditamos que um bom vizinho faz a diferença. Cada contratação fortalece os laços do bairro.', color: '#E8553D' },
            { icon: '🛡️', title: 'Confiança e transparência', text: 'Perfis verificados, avaliações reais e acordos claros entre quem contrata e quem presta.', color: '#2B9D8F' },
            { icon: '⭐', title: 'Qualidade com responsabilidade', text: 'Cada serviço é uma chance de superar expectativas. Prestadores se dedicam ao seu melhor.', color: '#F4B942' },
            { icon: '💰', title: 'Economia local', text: 'O dinheiro fica no seu bairro: apoiamos pequenos negócios e talentos da vizinhança.', color: '#E8553D' },
            { icon: '🌱', title: 'Crescimento', text: 'Oferecemos aos prestadores uma vitrine gratuita para transformar habilidade em renda.', color: '#2B9D8F' },
            { icon: '❤️', title: 'Respeito e gentileza', text: 'Tratamos todas as pessoas com respeito, empatia e bom trato em cada interação.', color: '#F4B942' },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl" style={{ backgroundColor: v.color + '18' }}>
                {v.icon}
              </div>
              <h4 className="font-bold text-gray-900 mb-2" style={{ fontFamily: "'Fraunces', serif" }}>{v.title}</h4>
              <p className="text-sm text-gray-600">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
        </>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6" style={{ backgroundColor: '#FAF6F0' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#E8553D' }}>
              <span className="text-white font-bold text-xs" style={{ fontFamily: "'Fraunces', serif" }}>V</span>
            </div>
            <span className="font-semibold text-gray-700" style={{ fontFamily: "'Fraunces', serif" }}>Vizinho</span>
            <span className="text-gray-300">·</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            {['Privacidade', 'Termos', 'Ajuda', 'Blog'].map((link) => (
              <a key={link} href="#" className="hover:text-gray-700 transition-colors">{link}</a>
            ))}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setView('admin')
              }}
              className="text-[#E8553D] font-semibold hover:underline"
            >
              Painel Admin
            </a>
          </div>
        </div>
      </footer>
        </>
      )}

      {/* ── Profile Drawer ── */}
      {selected && (
        <ProfileDrawer
          provider={selected}
          canRequest={!!authUser}
          onRequireAuth={() => setAuthModal('login')}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Auth Modal ── */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          initialResetToken={resetToken}
          onClose={() => { setAuthModal(null); setResetToken('') }}
          onSuccess={setAuthUser}
        />
      )}
    </div>
  )
}
