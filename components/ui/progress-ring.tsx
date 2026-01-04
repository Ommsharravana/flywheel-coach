"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
  label?: string
  color?: "default" | "success" | "warning" | "error" | "jkkn"
}

const colorMap = {
  default: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-amber-500",
  error: "stroke-red-500",
  jkkn: "stroke-[#0b6d41]",
}

const trackColorMap = {
  default: "stroke-primary/20",
  success: "stroke-green-500/20",
  warning: "stroke-amber-500/20",
  error: "stroke-red-500/20",
  jkkn: "stroke-[#0b6d41]/20",
}

function ProgressRing({
  className,
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  showValue = true,
  label,
  color = "default",
  ...props
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div
      data-slot="progress-ring"
      className={cn("relative inline-flex items-center justify-center", className)}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackColorMap[color]}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(colorMap[color], "transition-all duration-500 ease-out")}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{Math.round(percentage)}%</span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  )
}

export { ProgressRing }
