import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy names are retained for component compatibility; values are semantic and muted.
        cyber: {
          // Background colors
          bg: {
            primary: 'rgb(var(--cyber-bg-primary) / <alpha-value>)',
            secondary: 'rgb(var(--cyber-bg-secondary) / <alpha-value>)',
            tertiary: 'rgb(var(--cyber-bg-tertiary) / <alpha-value>)',
            panel: 'rgb(var(--cyber-bg-panel) / <alpha-value>)',
            elevated: 'rgb(var(--cyber-bg-elevated) / <alpha-value>)',
            glass: 'rgb(var(--glass-bg))',
            glassDark: 'rgb(var(--glass-dark-bg))',
          },
          // Status and action colors
          neon: {
            cyan: 'rgb(var(--cyber-neon-cyan) / <alpha-value>)',
            cyanDim: 'rgb(var(--cyber-neon-cyan-dim) / <alpha-value>)',
            pink: 'rgb(var(--cyber-neon-pink) / <alpha-value>)',
            pinkDim: 'rgb(var(--cyber-neon-pink-dim) / <alpha-value>)',
            green: 'rgb(var(--cyber-neon-green) / <alpha-value>)',
            greenDim: 'rgb(var(--cyber-neon-green-dim) / <alpha-value>)',
            orange: 'rgb(var(--cyber-neon-orange) / <alpha-value>)',
            yellow: 'rgb(var(--cyber-neon-yellow) / <alpha-value>)',
            purple: 'rgb(var(--cyber-neon-purple) / <alpha-value>)',
          },
          // Text colors
          text: {
            primary: 'rgb(var(--cyber-text-primary) / <alpha-value>)',
            secondary: 'rgb(var(--cyber-text-secondary) / <alpha-value>)',
            muted: 'rgb(var(--cyber-text-muted) / <alpha-value>)',
          },
          // Border colors
          border: {
            DEFAULT: 'rgb(var(--cyber-border-default) / <alpha-value>)',
            glow: 'rgb(var(--cyber-border-glow) / <alpha-value>)',
            subtle: 'rgb(var(--cyber-border-subtle) / <alpha-value>)',
          },
        },
        // Keep semantic colors for compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 1px 3px rgb(20 40 50 / 0.08)',
        'glow-cyan-sm': '0 1px 2px rgb(20 40 50 / 0.08)',
        'glow-pink': '0 1px 3px rgb(20 40 50 / 0.08)',
        'glow-pink-sm': '0 1px 2px rgb(20 40 50 / 0.08)',
        'glow-green': '0 1px 3px rgb(20 40 50 / 0.08)',
        'glow-green-sm': '0 1px 2px rgb(20 40 50 / 0.08)',
        'glow-orange': '0 1px 3px rgb(20 40 50 / 0.08)',
        'cyber-card': '0 1px 3px rgb(20 40 50 / 0.08)',
        'cyber-inset': 'inset 0 1px 2px rgb(20 40 50 / 0.06)',
        'cyber-soft': '0 1px 3px rgb(20 40 50 / 0.08)',
        'cyber-float': '0 2px 6px rgb(20 40 50 / 0.1)',
        'cyber-elevated': '0 4px 12px rgb(20 40 50 / 0.12)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse 2s ease-in-out infinite',
        'scanline': 'none',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
        'border-glow': 'none',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
