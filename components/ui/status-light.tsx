"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusLightVariants = cva(
  "rounded-full shrink-0",
  {
    variants: {
      status: {
        success: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
        warning: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
        error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
        info: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
        inactive: "bg-zinc-500",
      },
      size: {
        sm: "h-2 w-2",
        md: "h-3 w-3",
        lg: "h-4 w-4",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      status: "inactive",
      size: "md",
      pulse: false,
    },
  }
)

export interface StatusLightProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusLightVariants> {
  label?: string
}

function StatusLight({
  className,
  status,
  size,
  pulse,
  label,
  ...props
}: StatusLightProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <div
        data-slot="status-light"
        className={cn(statusLightVariants({ status, size, pulse }), className)}
        role="status"
        aria-label={label || `Status: ${status}`}
        {...props}
      />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

export { StatusLight, statusLightVariants }
