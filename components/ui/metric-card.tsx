"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

const metricCardVariants = cva(
  "rounded-lg border bg-card p-4 transition-all",
  {
    variants: {
      variant: {
        default: "border-border",
        success: "border-green-500/30 bg-green-500/5",
        warning: "border-amber-500/30 bg-amber-500/5",
        error: "border-red-500/30 bg-red-500/5",
        info: "border-blue-500/30 bg-blue-500/5",
        jkkn: "border-[#0b6d41]/30 bg-[#0b6d41]/5",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const iconColorMap = {
  default: "text-muted-foreground",
  success: "text-green-500",
  warning: "text-amber-500",
  error: "text-red-500",
  info: "text-blue-500",
  jkkn: "text-[#0b6d41]",
}

export interface MetricCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricCardVariants> {
  icon?: LucideIcon
  value: string | number
  label: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  loading?: boolean
}

function MetricCard({
  className,
  variant = "default",
  size,
  icon: Icon,
  value,
  label,
  change,
  changeType = "neutral",
  loading = false,
  ...props
}: MetricCardProps) {
  const changeColor = {
    positive: "text-green-500",
    negative: "text-red-500",
    neutral: "text-muted-foreground",
  }

  return (
    <div
      data-slot="metric-card"
      className={cn(metricCardVariants({ variant, size }), className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          {loading ? (
            <div className="h-8 w-20 animate-pulse bg-muted rounded" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
          {change && (
            <p className={cn("text-xs", changeColor[changeType])}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-muted/50", iconColorMap[variant || "default"])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}

export { MetricCard, metricCardVariants }
