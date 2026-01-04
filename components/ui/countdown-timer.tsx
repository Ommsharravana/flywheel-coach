"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CountdownTimerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Target date/time to count down to */
  targetDate?: Date
  /** Seconds remaining (alternative to targetDate) */
  secondsRemaining?: number
  /** Callback when countdown reaches zero */
  onComplete?: () => void
  /** Show days in countdown */
  showDays?: boolean
  /** Show hours in countdown */
  showHours?: boolean
  /** Show seconds in countdown */
  showSeconds?: boolean
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Urgency level for styling */
  urgency?: "calm" | "warning" | "urgent" | "critical"
  /** Label to display */
  label?: string
}

const sizeClasses = {
  sm: "text-lg font-mono",
  md: "text-2xl font-mono",
  lg: "text-4xl font-mono font-bold",
}

const urgencyClasses = {
  calm: "text-foreground",
  warning: "text-amber-500",
  urgent: "text-orange-500",
  critical: "text-red-500 animate-pulse",
}

function CountdownTimer({
  className,
  targetDate,
  secondsRemaining: initialSeconds,
  onComplete,
  showDays = true,
  showHours = true,
  showSeconds = true,
  size = "md",
  urgency = "calm",
  label,
  ...props
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState(() => {
    if (initialSeconds !== undefined) return initialSeconds
    if (targetDate) {
      return Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000))
    }
    return 0
  })

  React.useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1
        if (newTime <= 0) {
          clearInterval(timer)
          onComplete?.()
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  // Update when targetDate changes
  React.useEffect(() => {
    if (targetDate) {
      setTimeLeft(Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000)))
    }
  }, [targetDate])

  // Update when initialSeconds changes
  React.useEffect(() => {
    if (initialSeconds !== undefined) {
      setTimeLeft(initialSeconds)
    }
  }, [initialSeconds])

  const days = Math.floor(timeLeft / 86400)
  const hours = Math.floor((timeLeft % 86400) / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const formatNumber = (n: number) => n.toString().padStart(2, "0")

  const parts: string[] = []
  if (showDays && days > 0) parts.push(`${days}d`)
  if (showHours && (hours > 0 || days > 0)) parts.push(formatNumber(hours))
  parts.push(formatNumber(minutes))
  if (showSeconds) parts.push(formatNumber(seconds))

  // Determine display format
  const displayTime = showDays && days > 0
    ? `${days}d ${formatNumber(hours)}:${formatNumber(minutes)}${showSeconds ? `:${formatNumber(seconds)}` : ""}`
    : showHours && (hours > 0 || !showSeconds)
      ? `${formatNumber(hours)}:${formatNumber(minutes)}${showSeconds ? `:${formatNumber(seconds)}` : ""}`
      : `${formatNumber(minutes)}:${formatNumber(seconds)}`

  return (
    <div
      data-slot="countdown-timer"
      className={cn("flex flex-col items-center gap-1", className)}
      role="timer"
      aria-live="polite"
      {...props}
    >
      {label && (
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <span className={cn(sizeClasses[size], urgencyClasses[urgency])}>
        {displayTime}
      </span>
    </div>
  )
}

export { CountdownTimer }
