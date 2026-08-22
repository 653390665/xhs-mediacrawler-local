/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

const LICENSE_KEY = 'mediacrawler_license_accepted'

// 检查是否已经接受协议
export function isLicenseAccepted(): boolean {
  return localStorage.getItem(LICENSE_KEY) === 'true'
}

// 清除协议接受状态
export function clearLicenseAccepted(): void {
  localStorage.removeItem(LICENSE_KEY)
}

interface LicenseDisclaimerProps {
  onAccept: () => void
}

export function LicenseDisclaimer({ onAccept }: LicenseDisclaimerProps) {
  const { t } = useTranslation('license')
  const [declined, setDeclined] = useState(false)

  const handleConfirm = () => {
    localStorage.setItem(LICENSE_KEY, 'true')
    onAccept()
  }

  const handleDecline = () => {
    // 尝试关闭当前标签页（不会关闭整个浏览器，只关闭当前tab）
    setDeclined(true)
    try { window.close() } catch { /* browser may deny close */ }
  }

  if (declined) return <div role="alert" className="fixed inset-0 z-[100] flex items-center justify-center bg-cyber-bg-primary p-6 text-center font-mono text-cyber-neon-pink"><div><div className="text-4xl mb-4">⛔</div><div className="text-xl font-bold mb-2">{t('declinedTitle')}</div><div className="text-sm text-cyber-text-muted">{t('declinedMessage')}</div></div></div>

  return (
    <Dialog open modal onOpenChange={() => undefined}>
      <DialogContent showClose={false} className="max-w-2xl border-cyber-neon-pink/60">

        {/* Header with warning icon */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <ShieldAlert className="w-8 h-8 text-cyber-neon-pink" />
          <DialogTitle className="text-xl font-mono font-bold text-cyber-neon-pink">
            {t('title')}
          </DialogTitle>
        </div>

        {/* Warning subtitle */}
        <DialogDescription className="text-center mb-4">
          <span className="text-base font-mono text-cyber-neon-orange">
            {t('warning')}
          </span>
        </DialogDescription>

        {/* Content box */}
        <div className="bg-cyber-bg-secondary border border-cyber-neon-pink/30 rounded-md p-4 mb-4">
          <ul className="space-y-2 text-sm font-mono">
            <li className="flex items-start gap-2">
              <span className="text-cyber-neon-pink font-bold">1.</span>
              <span className="text-cyber-text-primary">{t('content.line1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-neon-pink font-bold">2.</span>
              <span className="text-cyber-text-primary">{t('content.line2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-neon-pink font-bold">3.</span>
              <span className="text-cyber-text-primary">{t('content.line3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-neon-pink font-bold">4.</span>
              <span className="text-cyber-text-primary">{t('content.line4')}</span>
            </li>
          </ul>
        </div>

        {/* License Link */}
        <div className="flex justify-center mb-6">
          <a
            href="https://github.com/NanmiCoder/MediaCrawler/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-cyber-neon-cyan hover:underline text-sm font-mono"
          >
            <ExternalLink className="w-4 h-4" />
            {t('license')}
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1 font-mono border-cyber-neon-pink/50 text-cyber-neon-pink hover:bg-cyber-neon-pink/10"
          >
            {t('decline')}
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 font-mono bg-cyber-neon-green text-cyber-bg-primary font-bold hover:bg-cyber-neon-green/90"
          >
            {t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
