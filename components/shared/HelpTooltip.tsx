'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: string;
  title?: string;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * HelpTooltip Component
 *
 * Usage:
 * <HelpTooltip
 *   title="Problem Impact"
 *   content="How significant is the problem being solved?"
 * />
 *
 * Accessibility:
 * - Keyboard navigable
 * - Screen reader friendly
 * - ARIA labels included
 */
export function HelpTooltip({
  content,
  title,
  className,
  side = 'top',
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(
            'inline-flex items-center justify-center ml-1 text-stone-500 hover:text-amber-400 transition-colors',
            className
          )}
          aria-label={title ? `Help: ${title}` : 'Help'}
        >
          <HelpCircle className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs bg-stone-900 border-stone-700 text-stone-100 p-3"
        >
          {title && (
            <p className="font-semibold text-amber-400 mb-1 text-sm">{title}</p>
          )}
          <p className="text-xs leading-relaxed text-stone-300">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline HelpTooltip for form labels
 *
 * Usage:
 * <Label>
 *   Problem Impact <InlineHelpTooltip content="..." />
 * </Label>
 */
export function InlineHelpTooltip({ content, title }: Omit<HelpTooltipProps, 'className' | 'side'>) {
  return (
    <HelpTooltip
      content={content}
      title={title}
      className="inline-flex align-middle"
      side="right"
    />
  );
}
