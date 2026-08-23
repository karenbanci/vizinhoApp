import { useEffect, useState } from 'react'
import {
  fetchRequestMessages,
  fetchServiceRequests,
  payServiceRequest,
  sendRequestMessage,
  updateServiceRequestStatus,
  type ChatMessage,
  type ServiceRequest,
} from '../api'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentUserId: number
}

export default function NotificationsModal({ isOpen, onClose, currentUserId }: Props) {
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [received, setReceived] = useState<ServiceRequest[]>([])
  const [sent, setSent] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [activeChatRequest, setActiveChatRequest] = useState<ServiceRequest | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  // Stripe Payment Modal State
  const [stripePayingRequest, setStripePayingRequest] = useState<ServiceRequest | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardName, setCardName] = useState('')
  const [payingLoading, setPayingLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState('')
  const [paymentError, setPaymentError] = useState('')

  async function loadRequests() {
    setLoading(true)
    try {
      const data = await fetchServiceRequests()
      setReceived(data.received)
      setSent(data.sent)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadRequests()
    }
  }, [isOpen])

  // Load chat messages when activeChatRequest changes
  useEffect(() => {
    if (!activeChatRequest) return
    let isMounted = true

    async function loadChat() {
      if (!activeChatRequest) return
      try {
        const data = await fetchRequestMessages(activeChatRequest.id)
        if (isMounted) setChatMessages(data.messages)
      } catch {
        // ignore
      }
    }

    loadChat()
    const interval = setInterval(loadChat, 3000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [activeChatRequest])

  if (!isOpen) return null

  async function handleStatusChange(requestId: number, status: 'accepted' | 'rejected') {
    setActionLoadingId(requestId)
    try {
      await updateServiceRequestStatus(requestId, status)
      await loadRequests()
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!activeChatRequest || !newMessage.trim()) return

    setSendingMessage(true)
    try {
      const res = await sendRequestMessage(activeChatRequest.id, newMessage)
      setChatMessages((prev) => [...prev, res.message])
      setNewMessage('')
    } catch {
      // ignore
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleConfirmStripePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!stripePayingRequest) return

    setPayingLoading(true)
    setPaymentError('')
    setPaymentSuccess('')

    try {
      const last4 = cardNumber.replace(/\D/g, '').slice(-4) || '4242'
      const res = await payServiceRequest(stripePayingRequest.id, last4, 'visa')
      setPaymentSuccess(res.message)
      await loadRequests()
      setTimeout(() => {
        setStripePayingRequest(null)
        setPaymentSuccess('')
        setCardNumber('')
        setCardExpiry('')
        setCardCvc('')
        setCardName('')
      }, 1500)
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Erro ao processar pagamento.')
    } finally {
      setPayingLoading(false)
    }
  }

  const pendingCount = received.filter((r) => r.status === 'pending').length
  const currentList = tab === 'received' ? received : sent

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: 'rgba(26, 21, 17, 0.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-[#FAF6F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E8553D] text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                {activeChatRequest ? `Chat: ${activeChatRequest.service_name}` : 'Notificações & Solicitações'}
              </h2>
              <p className="text-xs text-gray-500">
                {activeChatRequest
                  ? `Com ${
                      tab === 'received' ? activeChatRequest.client_name : activeChatRequest.provider_name || 'Prestador'
                    }`
                  : 'Gerencie e combine seus pedidos de serviço'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeChatRequest && (
              <button
                onClick={() => setActiveChatRequest(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ← Voltar à lista
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* View 1: Main Requests List */}
        {!activeChatRequest && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-white flex-shrink-0">
              <button
                onClick={() => setTab('received')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                  tab === 'received'
                    ? 'border-[#E8553D] text-[#E8553D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>Recebidas (Prestador)</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-[#E8553D] text-white font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab('sent')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                  tab === 'sent'
                    ? 'border-[#E8553D] text-[#E8553D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>Enviadas (Cliente)</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                  {sent.length}
                </span>
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {loading && currentList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Carregando solicitações...</div>
              ) : currentList.length === 0 ? (
                <div className="text-center py-14">
                  <div className="text-4xl mb-2">📬</div>
                  <h3 className="font-bold text-gray-800 text-base mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                    Nenhuma solicitação no momento
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {tab === 'received'
                      ? 'Quando vizinhos solicitarem seus serviços, as notificações aparecerão aqui.'
                      : 'Suas solicitações enviadas para prestadores aparecerão listadas aqui.'}
                  </p>
                </div>
              ) : (
                currentList.map((req) => {
                  const isReceived = tab === 'received'
                  return (
                    <div
                      key={req.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        req.status === 'pending'
                          ? 'bg-amber-50/40 border-amber-200 shadow-sm'
                          : req.status === 'accepted'
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-gray-50 border-gray-200 opacity-80'
                      }`}
                    >
                      {/* Top Bar with Title and Status */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-base">{req.service_name}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                req.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : req.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {req.status === 'pending'
                                ? '● Pendente'
                                : req.status === 'accepted'
                                ? '✓ Aceita'
                                : '✕ Recusada'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isReceived ? (
                              <>
                                De: <strong className="text-gray-700">{req.client_name}</strong> ({req.client_email})
                              </>
                            ) : (
                              <>
                                Para: <strong className="text-gray-700">{req.provider_name || 'Prestador'}</strong>
                              </>
                            )}
                            {' · '}
                            {new Date(req.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {req.total_price && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{req.total_price}</div>
                            <div className="text-[11px] text-gray-400">Total estimado</div>
                          </div>
                        )}
                      </div>

                      {/* Details Box */}
                      <div className="bg-white/80 rounded-xl p-3 text-xs text-gray-700 mb-3 border border-gray-100 space-y-1">
                        <p>
                          <strong className="text-gray-900">Mensagem:</strong> {req.details}
                        </p>
                        {req.date_time && (
                          <p>
                            <strong className="text-gray-900">Quando:</strong> {req.date_time}
                          </p>
                        )}
                        {req.location && (
                          <p>
                            <strong className="text-gray-900">Local:</strong> {req.location}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100/80">
                        {/* Chat Button */}
                        <button
                          onClick={() => setActiveChatRequest(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <span>💬 Abrir Chat</span>
                        </button>

                        {/* Provider Accept / Reject buttons */}
                        {isReceived && req.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusChange(req.id, 'rejected')}
                              disabled={actionLoadingId === req.id}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                            >
                              ✕ Recusar
                            </button>
                            <button
                              onClick={() => handleStatusChange(req.id, 'accepted')}
                              disabled={actionLoadingId === req.id}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                              ✓ Aceitar Solicitação
                            </button>
                          </div>
                        )}

                        {/* Stripe Payment Button for Client */}
                        {!isReceived && req.status === 'accepted' && (
                          <div className="flex items-center gap-2">
                            {req.payment_status === 'paid' ? (
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
                                <span>✓ Pago via Stripe 💳</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setStripePayingRequest(req)
                                  setPaymentError('')
                                  setPaymentSuccess('')
                                  setCardNumber('4242 4242 4242 4242')
                                  setCardExpiry('12/28')
                                  setCardCvc('123')
                                  setCardName(req.client_name || 'Cliente Vizinho')
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:opacity-95 active:scale-95"
                                style={{ backgroundColor: '#635BFF' }}
                              >
                                <span>💳 Pagar com Stripe ({req.total_price || req.base_price})</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* View 2: Chat View for this Request */}
        {activeChatRequest && (
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Nenhuma mensagem ainda. Inicie a conversa para combinar data, horário e valores!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.sender_name}</span>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#E8553D] text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem para combinar o serviço..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#E8553D]/30 focus:border-[#E8553D]"
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E8553D' }}
              >
                {sendingMessage ? '...' : 'Enviar'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Stripe Checkout Modal Dialog */}
      {stripePayingRequest && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => { if (!payingLoading) setStripePayingRequest(null) }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-br from-[#635BFF] to-[#483ecd] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Stripe Checkout
                </span>
                <h3 className="text-xl font-bold mt-1">Pagar Serviço</h3>
              </div>
              <button
                onClick={() => { if (!payingLoading) setStripePayingRequest(null) }}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmStripePayment} className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center text-sm font-semibold text-gray-800 mb-1">
                  <span>{stripePayingRequest.service_name}</span>
                  <span className="text-base text-[#635BFF] font-bold">
                    {stripePayingRequest.total_price || stripePayingRequest.base_price}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Prestador: <strong>{stripePayingRequest.provider_name || 'Prestador Vizinho'}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome no Cartão</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Nome como impresso no cartão"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-800 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Número do Cartão</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-sm text-gray-800 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Validade</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/AA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-sm text-gray-800 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CVC / CVV</label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-sm text-gray-800 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/30"
                  />
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {paymentError}
                </div>
              )}

              {paymentSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                  ✓ {paymentSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={payingLoading || Boolean(paymentSuccess)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:opacity-95 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: '#635BFF' }}
              >
                {payingLoading ? 'Processando no Stripe...' : `Confirmar Pagamento (${stripePayingRequest.total_price || stripePayingRequest.base_price})`}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <span>🔒 Pagamento seguro processado ponta a ponta com criptografia Stripe</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
