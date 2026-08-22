import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-cyber-border-DEFAULT bg-cyber-bg-elevated px-3 py-2 text-sm font-mono text-cyber-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-cyber-text-muted focus-visible:outline-none focus-visible:border-cyber-neon-cyan focus-visible:ring-2 focus-visible:ring-cyber-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
