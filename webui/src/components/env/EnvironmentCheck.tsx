/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { envApi, EnvCheckResult } from '@/lib/api'

const ENV_CHECK_KEY = 'mediacrawler_env_checked'

interface EnvironmentCheckProps {
  onCheckComplete: (success: boolean) => void
}

// 检查是否已经通过环境检测
export function isEnvChecked(): boolean {
  return localStorage.getItem(ENV_CHECK_KEY) === 'true'
}

// 清除环境检测状态
export function clearEnvCheck(): void {
  localStorage.removeItem(ENV_CHECK_KEY)
}

export function EnvironmentCheck({ onCheckComplete }: EnvironmentCheckProps) {
  const { t } = useTranslation('env')
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [result, setResult] = useState<EnvCheckResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const timerRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  const checkEnvironment = useCallback(async () => {
    setStatus('checking')
    setResult(null)
    try {
      const response = await envApi.check()
      if (!mountedRef.current) return
      setResult(response.data)
      if (response.data.success) {
        setStatus('success')
        // 存储到 localStorage
        localStorage.setItem(ENV_CHECK_KEY, 'true')
        // 成功后延迟关闭
        if (timerRef.current) window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => { if (mountedRef.current) onCheckComplete(true) }, 1500)
      } else {
        setStatus('error')
      }
    } catch (_error) {
      if (!mountedRef.current) return
      setResult({
        success: false,
        message: t('defaultError'),
        error: t('defaultErrorHint')
      })
      setStatus('error')
    }
  }, [onCheckComplete, t])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => { if (mountedRef.current) void checkEnvironment() })
    return () => {
      mountedRef.current = false
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [checkEnvironment])

  const handleSkip = () => {
    localStorage.setItem(ENV_CHECK_KEY, 'true')
    onCheckComplete(false)
  }

  const handleRetry = () => {
    checkEnvironment()
  }

  return (
    <Dialog open modal onOpenChange={() => undefined}>
      <DialogContent showClose={false}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-cyber-neon-orange" />
          <DialogTitle className="text-lg font-mono font-semibold text-cyber-neon-cyan glow-text-cyan">
            {t('title')}
          </DialogTitle>
        </div>

        {/* Status Display */}
        <DialogDescription asChild><div className="bg-cyber-bg-tertiary border border-cyber-border-DEFAULT rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            {status === 'checking' && (
              <>
                <Loader2 className="w-5 h-5 text-cyber-neon-cyan animate-spin" />
                <span className="text-cyber-text-primary font-mono text-sm">
                  {t('scanning')}
                </span>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="w-5 h-5 text-cyber-neon-green" />
                <span className="text-cyber-neon-green font-mono text-sm">
                  {t('success', { message: result?.message })}
                </span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-5 h-5 text-cyber-neon-pink" />
                <span className="text-cyber-neon-pink font-mono text-sm">
                  {t('error', { message: result?.message })}
                </span>
              </>
            )}
          </div>

          {/* Error Details */}
          {status === 'error' && result?.error && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-cyber-neon-cyan hover:underline font-mono"
              >
                {showDetails ? t('hideDetails') : t('showDetails')}
              </button>
              {showDetails && (
                <pre className="mt-2 p-3 bg-cyber-bg-secondary text-cyber-neon-green rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-cyber-border-DEFAULT">
                  {result.error}
                </pre>
              )}
            </div>
          )}
        </div></DialogDescription>

        {/* Help Text */}
        {status === 'error' && (
          <div className="text-sm text-cyber-text-secondary mb-4 space-y-2 font-mono">
            <p className="text-cyber-neon-orange">{t('requirements')}</p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-cyber-text-muted">
              <li>{t('requirementsList.1')}</li>
              <li>{t('requirementsList.2')}</li>
              <li>{t('requirementsList.3')}</li>
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {status === 'error' && (
            <>
              <Button
                variant="outline"
                className="flex-1 font-mono"
                onClick={handleSkip}
              >
                {t('skipCheck')}
              </Button>
              <Button
                variant="glow"
                className="flex-1 font-mono"
                onClick={handleRetry}
              >
                <RefreshCw className="w-4 h-4" />
                {t('retryCheck')}
              </Button>
            </>
          )}
          {status === 'checking' && (
            <Button
              variant="outline"
              className="w-full font-mono"
              onClick={handleSkip}
            >
              {t('skipCheck')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
