import { useEffect, useState } from 'react'
import {
  adminDirectResetByEmail,
  adminGenerateResetLink,
  adminResetPassword,
  fetchAdminStats,
  fetchAdminTokens,
  fetchAdminUsers,
  type AdminResetToken,
  type AdminStats,
  type AdminUser,
} from '../api'

interface Props {
  onBack: () => void
}

function generateSecurePassword(length = 10): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function AdminPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'quick-reset' | 'tokens'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [tokens, setTokens] = useState<AdminResetToken[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'providers' | 'clients'>('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Reset Modal state
  const [resetModalUser, setResetModalUser] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Link Generated Modal state
  const [generatedLinkData, setGeneratedLinkData] = useState<{
    user: { id: number; name: string; email: string }
    resetUrl: string
    token: string
    expiresAt: string
  } | null>(null)

  // Quick reset direct form state
  const [quickEmail, setQuickEmail] = useState('')
  const [quickPassword, setQuickPassword] = useState('')
  const [quickResult, setQuickResult] = useState<string | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur))
    }, 4000)
  }

  async function loadData() {
    setLoading(true)
    try {
      const [usersRes, statsRes, tokensRes] = await Promise.all([
        fetchAdminUsers(search),
        fetchAdminStats().catch(() => null),
        fetchAdminTokens().catch(() => ({ tokens: [] })),
      ])
      setUsers(usersRes.users)
      if (statsRes) setStats(statsRes)
      setTokens(tokensRes.tokens)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar dados do admin.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminUsers(search)
        .then((res) => setUsers(res.users))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function handleDirectReset(e: React.FormEvent) {
    e.preventDefault()
    if (!resetModalUser) return
    if (!newPassword || newPassword.length < 6) {
      showToast('A senha precisa ter pelo menos 6 caracteres.', 'error')
      return
    }

    setActionLoading(true)
    try {
      const res = await adminResetPassword(resetModalUser.id, newPassword)
      showToast(res.message)
      setResetModalUser(null)
      setNewPassword('')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao resetar senha.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleGenerateLink(user: AdminUser) {
    setActionLoading(true)
    try {
      const res = await adminGenerateResetLink(user.id)
      setGeneratedLinkData({
        user: res.user,
        resetUrl: res.resetUrl,
        token: res.token,
        expiresAt: res.expiresAt,
      })
      showToast(`Link de redefinição criado para ${user.name}!`)
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao gerar link de redefinição.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleQuickResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quickEmail || !quickPassword) {
      showToast('Preencha o e-mail e a nova senha.', 'error')
      return
    }
    if (quickPassword.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres.', 'error')
      return
    }

    setActionLoading(true)
    try {
      const res = await adminDirectResetByEmail(quickEmail, quickPassword)
      setQuickResult(`✅ Senha alterada com sucesso para ${res.user.name} (${res.user.email})!`)
      showToast(res.message)
      setQuickPassword('')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao resetar senha.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (filterType === 'providers') return u.isProvider
    if (filterType === 'clients') return !u.isProvider
    return true
  })

  function copyToClipboard(text: string, label = 'Texto copiado!') {
    navigator.clipboard.writeText(text)
    showToast(label)
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#FAF6F0', fontFamily: "'Outfit', sans-serif" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Voltar ao App"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                    Painel Administrativo
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300">
                    Interno
                  </span>
                </div>
                <p className="text-xs text-gray-500 hidden sm:block">Gerenciamento de usuários e redefinição de senhas</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={onBack}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl text-white transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#E8553D' }}
            >
              Voltar ao App
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* KPI Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total de Usuários</div>
              <div className="text-3xl font-extrabold text-gray-900">{stats.totalUsers}</div>
              <div className="text-xs text-gray-500 mt-1">Registrados no banco MySQL</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Prestadores</div>
              <div className="text-3xl font-extrabold text-[#E8553D]">{stats.totalProviders}</div>
              <div className="text-xs text-gray-500 mt-1">Com perfil de serviço ativo</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Clientes</div>
              <div className="text-3xl font-extrabold text-[#2B9D8F]">{stats.totalClients}</div>
              <div className="text-xs text-gray-500 mt-1">Contratantes na plataforma</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Links de Reset</div>
              <div className="text-3xl font-extrabold text-amber-600">{stats.activeTokens}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalTokens} tokens gerados no total
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-[#E8553D] text-[#E8553D]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Usuários & Redefinição</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{users.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('quick-reset')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'quick-reset'
                ? 'border-[#E8553D] text-[#E8553D]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Reset Rápido por E-mail</span>
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tokens'
                ? 'border-[#E8553D] text-[#E8553D]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>Histórico de Links ({tokens.length})</span>
          </button>
        </div>

        {/* TAB 1: USERS LIST & ACTIONS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-10 pr-8 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    filterType === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  onClick={() => setFilterType('providers')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    filterType === 'providers'
                      ? 'bg-[#E8553D] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Prestadores ({users.filter((u) => u.isProvider).length})
                </button>
                <button
                  onClick={() => setFilterType('clients')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    filterType === 'clients'
                      ? 'bg-[#2B9D8F] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Clientes ({users.filter((u) => !u.isProvider).length})
                </button>
              </div>
            </div>

            {/* Users Table / Cards */}
            {loading && users.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-gray-200 border-t-[#E8553D] rounded-full mb-3" />
                <p className="text-sm">Carregando usuários do banco de dados...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-800">Nenhum usuário encontrado</p>
                <p className="text-xs text-gray-500 mt-1">Tente ajustar o termo da busca ou os filtros.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6">Usuário</th>
                        <th className="py-3.5 px-4">Tipo</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">Cadastro</th>
                        <th className="py-3.5 px-4 hidden lg:table-cell">Resets Solicitados</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Ações de Senha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* User Info */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                                style={{ backgroundColor: u.isProvider ? '#E8553D' : '#2B9D8F' }}
                              >
                                {u.name.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  <span>{u.name}</span>
                                  <span className="text-xs text-gray-400 font-normal">#ID {u.id}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <span>{u.email}</span>
                                  <button
                                    onClick={() => copyToClipboard(u.email, 'E-mail copiado!')}
                                    className="text-gray-400 hover:text-gray-700"
                                    title="Copiar e-mail"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tipo */}
                          <td className="py-4 px-4">
                            {u.isProvider ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#E8553D] border border-rose-200">
                                  ⭐ Prestador
                                </span>
                                {u.profile?.categoryLabel && (
                                  <div className="text-[11px] text-gray-500 font-medium truncate max-w-[140px]">
                                    {u.profile.categoryLabel}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#2B9D8F] border border-teal-200">
                                👤 Cliente
                              </span>
                            )}
                          </td>

                          {/* Cadastro */}
                          <td className="py-4 px-4 hidden md:table-cell text-xs text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Resets Count */}
                          <td className="py-4 px-4 hidden lg:table-cell text-xs text-gray-600">
                            {u.totalResetTokens > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-gray-800">{u.totalResetTokens} link(s)</span>
                                {u.lastResetAt && (
                                  <div className="text-[11px] text-gray-400">
                                    Último: {new Date(u.lastResetAt).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Nenhum</span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Direct Reset */}
                              <button
                                onClick={() => {
                                  setResetModalUser(u)
                                  setNewPassword(generateSecurePassword())
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: '#E8553D' }}
                                title="Redefinir a senha deste usuário agora"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                  />
                                </svg>
                                <span>Resetar Senha</span>
                              </button>

                              {/* Generate Link */}
                              <button
                                onClick={() => handleGenerateLink(u)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Gerar link de redefinição para enviar por WhatsApp ou E-mail"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                  />
                                </svg>
                                <span className="hidden sm:inline">Gerar Link</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUICK RESET DIRECT FORM */}
        {activeTab === 'quick-reset' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#E8553D] flex items-center justify-center text-xs font-bold">
                  ⚡
                </span>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                  Reset Direto de Senha
                </h2>
              </div>
              <p className="text-xs text-gray-600">
                Altere imediatamente a senha de qualquer usuário informando o e-mail cadastrado.
              </p>
            </div>

            {quickResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium">
                {quickResult}
              </div>
            )}

            <form onSubmit={handleQuickResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  E-mail do Usuário
                </label>
                <input
                  type="email"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  placeholder="ex: usuario@email.com"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Nova Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickPassword(generateSecurePassword())}
                    className="text-xs font-semibold text-[#E8553D] hover:underline flex items-center gap-1"
                  >
                    <span>🎲 Gerar Senha Segura</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={quickPassword}
                    onChange={(e) => setQuickPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/30 pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {quickPassword && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(quickPassword, 'Senha copiada!')}
                        className="text-xs text-gray-500 hover:text-gray-800 p-1 font-medium"
                        title="Copiar senha"
                      >
                        Copiar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-gray-500 hover:text-gray-800 p-1"
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#E8553D' }}
                >
                  {actionLoading ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Atualizar Senha Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: TOKENS HISTORY */}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                  Histórico de Solicitações de Reset
                </h3>
                <p className="text-xs text-gray-500">
                  Acompanhe links gerados e status de utilização.
                </p>
              </div>
            </div>

            {tokens.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
                <p className="text-base font-semibold text-gray-800">Nenhum link de redefinição gerado ainda</p>
                <p className="text-xs text-gray-400 mt-1">Os links gerados aparecerão listados aqui.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6">Usuário</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Criado em</th>
                        <th className="py-3.5 px-4">Expiração</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {tokens.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-semibold text-gray-900">{t.userName}</div>
                            <div className="text-xs text-gray-500">{t.userEmail}</div>
                          </td>
                          <td className="py-4 px-4">
                            {t.status === 'active' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ● Válido / Ativo
                              </span>
                            )}
                            {t.status === 'used' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                ✓ Já Utilizado
                              </span>
                            )}
                            {t.status === 'expired' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                ✕ Expirado
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-500">
                            {new Date(t.createdAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-500">
                            {new Date(t.expiresAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <button
                              onClick={() => {
                                const targetUser = users.find((u) => u.id === t.userId)
                                if (targetUser) handleGenerateLink(targetUser)
                              }}
                              className="text-xs font-semibold text-[#E8553D] hover:underline"
                            >
                              Gerar Novo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: RESET PASSWORD DIRECTLY */}
      {resetModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26, 21, 17, 0.6)' }}
          onClick={() => setResetModalUser(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 sm:px-8 pt-8 pb-6" style={{ backgroundColor: '#FAF6F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E8553D] text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                    Redefinir Senha
                  </h3>
                </div>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* User summary card */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8553D] text-white font-bold flex items-center justify-center flex-shrink-0">
                  {resetModalUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-sm text-gray-900 truncate">{resetModalUser.name}</div>
                  <div className="text-xs text-gray-500 truncate">{resetModalUser.email}</div>
                </div>
              </div>

              <form onSubmit={handleDirectReset} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                      Nova Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateSecurePassword())}
                      className="text-xs font-semibold text-[#E8553D] hover:underline"
                    >
                      🎲 Gerar Aleatória
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/30 pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {newPassword && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(newPassword, 'Senha copiada!')}
                          className="text-xs text-gray-500 hover:text-gray-800 p-1 font-medium"
                          title="Copiar senha"
                        >
                          Copiar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-xs text-gray-500 hover:text-gray-800 p-1"
                      >
                        {showPassword ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm disabled:opacity-60"
                    style={{ backgroundColor: '#E8553D' }}
                  >
                    {actionLoading ? 'Salvando...' : 'Salvar Senha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET LINK GENERATED */}
      {generatedLinkData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26, 21, 17, 0.6)' }}
          onClick={() => setGeneratedLinkData(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 sm:px-8 pt-8 pb-6" style={{ backgroundColor: '#FAF6F0' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-600 text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                    Link de Redefinição Gerado
                  </h3>
                </div>
                <button
                  onClick={() => setGeneratedLinkData(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 text-emerald-900 text-xs">
                Link criado para <strong>{generatedLinkData.user.name}</strong> ({generatedLinkData.user.email}). Válido por 1 hora.
              </div>

              {/* Link Input Box */}
              <div className="space-y-2 mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Link Direto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLinkData.resetUrl}
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-gray-200 rounded-xl select-all outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedLinkData.resetUrl, 'Link de redefinição copiado!')}
                    className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors flex-shrink-0"
                  >
                    Copiar Link
                  </button>
                </div>
              </div>

              {/* Pre-written message box */}
              <div className="space-y-2 mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Mensagem Pronta para WhatsApp / E-mail
                </label>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-xs text-gray-700 leading-relaxed font-sans">
                  Olá {generatedLinkData.user.name}, aqui está seu link para redefinir sua senha no Vizinho App:
                  <br />
                  <span className="font-semibold text-[#E8553D]">{generatedLinkData.resetUrl}</span>
                  <br />
                  <span className="text-[11px] text-gray-500">(Este link é válido por 1 hora)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const message = `Olá ${generatedLinkData.user.name}, aqui está seu link para redefinir sua senha no Vizinho App: ${generatedLinkData.resetUrl} (Válido por 1 hora)`
                    copyToClipboard(message, 'Mensagem completa copiada para a área de transferência!')
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: '#2B9D8F' }}
                >
                  📋 Copiar Mensagem Completa
                </button>
                <button
                  onClick={() => setGeneratedLinkData(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
