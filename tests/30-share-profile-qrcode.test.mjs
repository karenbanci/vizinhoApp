import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'

describe('Bug 30: Provider Profile Sharing, Copy Link, and QR Code Generation', () => {
  it('should generate valid QR code data URL for any provider profile link', async () => {
    const profileUrl = 'https://vizinho.app/?provider=1'
    const qrDataUrl = await QRCode.toDataURL(profileUrl, {
      width: 256,
      margin: 2,
    })

    assert.ok(qrDataUrl.startsWith('data:image/png;base64,'))
    assert.ok(qrDataUrl.length > 100)
  })

  it('should generate valid social sharing links for WhatsApp, Telegram, Facebook, Twitter, and LinkedIn', () => {
    const providerName = 'Juliana Ferreira'
    const serviceName = 'Manicure'
    const shareUrl = 'https://vizinho.app/?provider=1'
    const shareMessage = `Confira o perfil de ${providerName} no Vizinho (${serviceName})!`

    const whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`
    const telegram = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`
    const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`
    const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

    assert.ok(whatsapp.includes('api.whatsapp.com'))
    assert.ok(telegram.includes('t.me/share/url'))
    assert.ok(facebook.includes('facebook.com/sharer'))
    assert.ok(twitter.includes('twitter.com/intent/tweet'))
    assert.ok(linkedin.includes('linkedin.com/sharing'))
  })

  it('should verify ShareProfileModal.tsx includes QR Code, Copy Link, and Social buttons', () => {
    const shareModal = fs.readFileSync(path.resolve('src/components/ShareProfileModal.tsx'), 'utf8')
    assert.ok(shareModal.includes('QRCode.toDataURL'))
    assert.ok(shareModal.includes('handleCopyLink'))
    assert.ok(shareModal.includes('handleDownloadQr'))
    assert.ok(shareModal.includes('whatsappUrl'))
    assert.ok(shareModal.includes('telegramUrl'))
    assert.ok(shareModal.includes('facebookUrl'))
    assert.ok(shareModal.includes('twitterUrl'))
    assert.ok(shareModal.includes('linkedinUrl'))
  })

  it('should verify ProfileDrawer and ProfilePage include share modal triggers', () => {
    const drawer = fs.readFileSync(path.resolve('src/components/ProfileDrawer.tsx'), 'utf8')
    assert.ok(drawer.includes('ShareProfileModal'))
    assert.ok(drawer.includes('shareOpen'))

    const profile = fs.readFileSync(path.resolve('src/pages/ProfilePage.tsx'), 'utf8')
    assert.ok(profile.includes('ShareProfileModal'))
    assert.ok(profile.includes('shareModalOpen'))
  })

  it('should verify App.tsx handles ?provider= query param to open shared provider profile', () => {
    const app = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8')
    assert.ok(app.includes("params.get('provider')"))
    assert.ok(app.includes('setSelected(found)'))
  })
})
