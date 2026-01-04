'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, disabled = false, size = 'lg' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  const containerClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3 sm:gap-4',
  };

  const displayValue = hoverValue ?? value;

  const handleClick = (rating: number) => {
    if (disabled) return;
    onChange(rating);
  };

  return (
    <div className={cn('flex items-center justify-center', containerClasses[size])}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        const isActive = star === displayValue;

        return (
          <motion.button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            onTouchStart={() => !disabled && setHoverValue(star)}
            onTouchEnd={() => {
              setHoverValue(null);
              handleClick(star);
            }}
            className={cn(
              'relative p-2 rounded-full transition-all duration-200 touch-manipulation',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffde59]',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-stone-800/50',
              isActive && !disabled && 'scale-110 bg-[#ffde59]/10'
            )}
            whileTap={!disabled ? { scale: 0.9 } : undefined}
            animate={isActive && !disabled ? { scale: [1, 1.15, 1] } : undefined}
            transition={{ duration: 0.2 }}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-all duration-200',
                isFilled
                  ? 'fill-[#ffde59] text-[#ffde59] drop-shadow-[0_0_12px_rgba(255,222,89,0.6)]'
                  : 'fill-stone-700 text-stone-600'
              )}
            />
            <AnimatePresence>
              {isActive && !disabled && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 rounded-full bg-[#ffde59]/30"
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

// Read-only star display
export function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= rating
              ? 'fill-[#ffde59] text-[#ffde59]'
              : 'fill-stone-700 text-stone-600'
          )}
        />
      ))}
    </div>
  );
}
