export interface AuthUser {
  id: number
  name: string
  email: string
  isProvider: boolean
  accountType?: 'client' | 'provider'
  emailVerified?: boolean
  createdAt?: string
  providerProfile?: ProviderProfile | null
}

export interface ProviderService {
  name: string
  price?: string
}

export interface ProviderProfile {
  id: number
  userId: number
  category: string
  categoryLabel: string
  nationality: string
  country: string
  state: string
  city: string
  description: string
  bio: string
  price: string
  location: string
  availability: string
  availableNow: boolean
  photoId: string
  portfolioIds?: string[]
  services: Array<string | ProviderService>
}

export interface Provider {
  id: number
  name: string
  category: string
  categoryLabel: string
  nationality: string
  rating: number
  reviews: number
  price: string
  location: string
  state: string
  city: string
  country: string
  description: string
  bio: string
  photoId: string
  portfolioIds: string[]
  reviewsList: unknown[]
  verified: boolean
  badge?: string
  availability: string
  availableNow: boolean
  deliveryInfo: string
  services: Array<string | ProviderService>
}

const TOKEN_KEY = 'vizinho_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: string }).error)
        : 'Algo deu errado. Tente novamente.'
    throw new Error(message)
  }

  return data as T
}

export async function register(name: string, email: string, password: string, accountType: 'client' | 'provider' = 'client') {
  return request<{ user: AuthUser; token?: string; pendingVerification?: boolean; email?: string; message?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, accountType }),
  })
}

export async function authWithGoogle(payload: { email: string; name?: string; googleId?: string; picture?: string }) {
  return request<{ user: AuthUser; token: string; message: string }>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function verifyEmail(payload: { email?: string; code?: string; token?: string }) {
  return request<{ ok: boolean; user: AuthUser; token: string; message: string }>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function resendVerificationEmail(email: string) {
  return request<{ ok: boolean; message: string }>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function login(email: string, password: string) {
  return request<{ user: AuthUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function forgotPassword(email: string) {
  return request<{ message: string; resetUrl?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token: string, password: string) {
  return request<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function fetchMe() {
  return request<{ user: AuthUser }>('/api/auth/me')
}

export async function updateMe(data: { name?: string; email?: string }) {
  return request<{ user: AuthUser }>('/api/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function updateMyPassword(data: { currentPassword?: string; newPassword: string }) {
  return request<{ ok: boolean; message: string }>('/api/me/password', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function activateProvider(category: string) {
  return request<{ user: AuthUser; providerProfile: ProviderProfile }>('/api/me/provider', {
    method: 'POST',
    body: JSON.stringify({ category }),
  })
}

export async function updateProviderProfile(data: Partial<ProviderProfile>) {
  return request<{ user: AuthUser; providerProfile: ProviderProfile }>('/api/me/provider', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deactivateProvider() {
  return request<{ user: AuthUser }>('/api/me/provider', {
    method: 'DELETE',
  })
}

export async function fetchProviders() {
  return request<{ providers: Provider[] }>('/api/providers')
}

export interface ServiceRequest {
  id: number
  provider_user_id: number
  client_user_id: number
  client_name: string
  client_email: string
  provider_name?: string
  provider_email?: string
  service_name: string
  details: string
  date_time: string
  location: string
  base_price: string
  shipping_price: string
  total_price: string
  status: 'pending' | 'accepted' | 'rejected'
  payment_status?: 'unpaid' | 'paid' | 'refunded'
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  request_id: number
  sender_id: number
  sender_name: string
  message: string
  created_at: string
}

export async function createServiceRequest(data: {
  providerUserId: number
  serviceName: string
  details: string
  dateTime?: string
  location?: string
  basePrice?: string
  shippingPrice?: string
  totalPrice?: string
}) {
  return request<{ ok: boolean; request: ServiceRequest }>('/api/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchServiceRequests() {
  return request<{
    received: ServiceRequest[]
    sent: ServiceRequest[]
    pendingCount: number
  }>('/api/requests')
}

export async function updateServiceRequestStatus(id: number, status: 'accepted' | 'rejected') {
  return request<{ ok: boolean; request: ServiceRequest }>(`/api/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function fetchRequestMessages(requestId: number) {
  return request<{ messages: ChatMessage[] }>(`/api/requests/${requestId}/messages`)
}

export async function sendRequestMessage(requestId: number, message: string) {
  return request<{ ok: boolean; message: ChatMessage }>(`/api/requests/${requestId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function payServiceRequest(requestId: number, cardLast4 = '4242', cardBrand = 'visa') {
  return request<{
    ok: boolean
    paymentId: number
    stripePaymentId: string
    amountFormatted: string
    status: string
    message: string
  }>('/api/payments/pay', {
    method: 'POST',
    body: JSON.stringify({ requestId, cardLast4, cardBrand }),
  })
}

export async function fetchPaymentHistory() {
  return request<{ payments: unknown[] }>('/api/payments/history')
}

export interface AdminUser {
  id: number
  name: string
  email: string
  isProvider: boolean
  createdAt: string
  profile?: {
    category: string
    categoryLabel: string
    location: string
  } | null
  totalResetTokens: number
  lastResetAt: string | null
}

export interface AdminResetToken {
  id: number
  userId: number
  userName: string
  userEmail: string
  expiresAt: string
  usedAt: string | null
  createdAt: string
  status: 'active' | 'used' | 'expired'
}

export interface AdminStats {
  totalUsers: number
  totalProviders: number
  totalClients: number
  activeTokens: number
  totalTokens: number
}

export async function fetchAdminUsers(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<{ users: AdminUser[] }>(`/api/admin/users${q}`)
}

export async function adminResetPassword(userId: number, newPassword: string) {
  return request<{ ok: boolean; message: string; user: { id: number; name: string; email: string } }>(
    '/api/admin/users/reset-password',
    {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    }
  )
}

export async function adminDirectResetByEmail(email: string, newPassword: string) {
  return request<{ ok: boolean; message: string; user: { id: number; name: string; email: string } }>(
    '/api/admin/users/reset-password',
    {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }
  )
}

export async function adminGenerateResetLink(userId: number) {
  return request<{
    ok: boolean
    token: string
    resetUrl: string
    expiresAt: string
    user: { id: number; name: string; email: string }
  }>('/api/admin/users/generate-reset-link', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export async function fetchAdminTokens() {
  return request<{ tokens: AdminResetToken[] }>('/api/admin/tokens')
}

export async function fetchAdminStats() {
  return request<AdminStats>('/api/admin/stats')
}

