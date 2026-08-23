import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useLanguage } from '../i18n'
import type { Provider } from '../data'

interface Props {
  isOpen: boolean
  onClose: () => void
  provider: Provider | { id: number; name: string; categoryLabel?: string; category?: string }
}

export default function ShareProfileModal({ isOpen, onClose, provider }: Props) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?provider=${provider.id}`
    : `https://vizinho.app/?provider=${provider.id}`

  const serviceName = provider.categoryLabel || provider.category || 'Serviços'
  const shareMessage = t('share.shareText', { name: provider.name, service: serviceName })

  useEffect(() => {
    if (!isOpen) return
    setCopied(false)

    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1F2937',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err))
  }, [isOpen, shareUrl])

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const input = document.createElement('input')
        input.value = shareUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vizinho - ${provider.name}`,
          text: shareMessage,
          url: shareUrl,
        })
      } catch {
        // ignore cancel
      }
    }
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `vizinho-qrcode-${provider.name.toLowerCase().replace(/\s+/g, '-')}.png`
    link.click()
  }

  // Social Share URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: 'rgba(26, 21, 17, 0.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-[#FAF6F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E8553D] text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
                {t('share.title')}
              </h2>
              <p className="text-xs text-gray-500">{provider.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              {t('share.copyLink')}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-mono outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#E8553D] text-white hover:opacity-90 active:scale-95'
                }`}
              >
                {copied ? `✓ ${t('share.linkCopied')}` : t('share.copyLink')}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              {t('share.socialTitle')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 text-xs font-bold transition-colors"
              >
                <span className="text-base">💬</span>
                <span>{t('share.whatsapp')}</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-xs font-bold transition-colors"
              >
                <span className="text-base">✈️</span>
                <span>{t('share.telegram')}</span>
              </a>

              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-xs font-bold transition-colors"
              >
                <span className="text-base">👥</span>
                <span>{t('share.facebook')}</span>
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-900/5 text-gray-900 hover:bg-gray-900/10 border border-gray-300 text-xs font-bold transition-colors"
              >
                <span className="text-base">𝕏</span>
                <span>{t('share.twitter')}</span>
              </a>

              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-xs font-bold transition-colors"
              >
                <span className="text-base">💼</span>
                <span>{t('share.linkedin')}</span>
              </a>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#E8553D]/10 text-[#E8553D] hover:bg-[#E8553D]/20 border border-[#E8553D]/30 text-xs font-bold transition-colors"
                >
                  <span className="text-base">📱</span>
                  <span>{t('share.native')}</span>
                </button>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                {t('share.qrCodeTitle')}
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">{t('share.qrCodeSubtitle')}</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code de ${provider.name}`}
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-gray-200 rounded-2xl flex items-center justify-center text-xs text-gray-400">
                  Gerando QR Code...
                </div>
              )}
            </div>

            {qrDataUrl && (
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-2xs"
              >
                <span>⬇️</span>
                <span>{t('share.downloadQr')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
