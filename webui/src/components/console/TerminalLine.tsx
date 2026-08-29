import { cn } from '@/lib/utils'
import type { LogEntry } from '@/types/crawler'

interface TerminalLineProps {
  log: LogEntry
}

const levelConfig: Record<string, { text: string; bg: string; glow: string }> = {
  info: {
    text: 'text-cyber-neon-cyan',
    bg: 'bg-cyber-neon-cyan/10',
    glow: ''
  },
  success: {
    text: 'text-cyber-neon-green',
    bg: 'bg-cyber-neon-green/10',
    glow: ''
  },
  warning: {
    text: 'text-cyber-neon-orange',
    bg: 'bg-cyber-neon-orange/10',
    glow: ''
  },
  error: {
    text: 'text-cyber-neon-pink',
    bg: 'bg-cyber-neon-pink/10',
    glow: ''
  },
  debug: {
    text: 'text-cyber-text-secondary',
    bg: 'bg-cyber-bg-tertiary',
    glow: ''
  },
}

const levelIcons: Record<string, string> = {
  info: 'DATA',
  success: 'OK',
  warning: 'WARN',
  error: 'ERR',
  debug: 'DBG',
}

export function TerminalLine({ log }: TerminalLineProps) {
  const config = levelConfig[log.level] || levelConfig.info

  return (
    <div className="flex gap-2 text-xs leading-relaxed font-mono group hover:bg-cyber-bg-tertiary/50 px-1 -mx-1 rounded transition-colors">
      {/* Timestamp */}
      <span className="text-cyber-text-secondary flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        [{log.timestamp}]
      </span>

      {/* Level badge */}
      <span className={cn(
        'flex-shrink-0 w-14 px-1 rounded text-center',
        config.bg,
        config.text,
        config.glow
      )}>
        [{levelIcons[log.level]}]
      </span>

      {/* Message */}
      <span className={cn('break-all', config.text)}>
        {log.message}
      </span>
    </div>
  )
}
