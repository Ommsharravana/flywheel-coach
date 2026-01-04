"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liveBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        live: "bg-red-500/10 text-red-500 border border-red-500/30",
        recording: "bg-red-500/10 text-red-500 border border-red-500/30",
        active: "bg-green-500/10 text-green-500 border border-green-500/30",
        paused: "bg-amber-500/10 text-amber-500 border border-amber-500/30",
        offline: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/30",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "live",
      size: "md",
    },
  }
)

const pulseColorMap = {
  live: "bg-red-500",
  recording: "bg-red-500",
  active: "bg-green-500",
  paused: "bg-amber-500",
  offline: "bg-zinc-500",
}

export interface LiveBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof liveBadgeVariants> {
  showPulse?: boolean
  label?: string
}

function LiveBadge({
  className,
  variant = "live",
  size,
  showPulse = true,
  label,
  ...props
}: LiveBadgeProps) {
  const defaultLabels = {
    live: "LIVE",
    recording: "REC",
    active: "ACTIVE",
    paused: "PAUSED",
    offline: "OFFLINE",
  }

  const displayLabel = label || defaultLabels[variant || "live"]
  const isAnimating = variant === "live" || variant === "recording" || variant === "active"

  return (
    <div
      data-slot="live-badge"
      className={cn(liveBadgeVariants({ variant, size }), className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          {isAnimating && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                pulseColorMap[variant || "live"]
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              pulseColorMap[variant || "live"]
            )}
          />
        </span>
      )}
      {displayLabel}
    </div>
  )
}

export { LiveBadge, liveBadgeVariants }
