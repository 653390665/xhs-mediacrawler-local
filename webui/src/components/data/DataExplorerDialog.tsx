import { useTranslation } from 'react-i18next'
import { Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataExplorer } from './DataExplorer'

export function DataExplorerDialog() {
  const { t } = useTranslation('data')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs text-cyber-text-secondary border-cyber-border-subtle bg-transparent hover:bg-cyber-bg-tertiary hover:text-cyber-neon-cyan hover:border-cyber-neon-cyan/50"
        >
          <Database className="w-3.5 h-3.5" />
          {t('dialog.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[calc(85vh-100px)] pr-2">
          <DataExplorer />
        </div>
      </DialogContent>
    </Dialog>
  )
}
