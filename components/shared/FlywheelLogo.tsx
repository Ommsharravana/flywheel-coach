'use client'

interface FlywheelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  className?: string
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

export function FlywheelLogo({ size = 'md', animate = false, className = '' }: FlywheelLogoProps) {
  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 opacity-60 blur-md" />

      {/* Main circle */}
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
        <svg
          viewBox="0 0 24 24"
          className={`h-3/5 w-3/5 text-stone-950 ${animate ? 'animate-spin-slow' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {/* Center hub */}
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />

          {/* 8 spokes representing 8 steps */}
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
      </div>
    </div>
  )
}
