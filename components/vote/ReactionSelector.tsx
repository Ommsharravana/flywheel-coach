'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { REACTIONS, type Reaction } from '@/lib/vote/types';

interface ReactionSelectorProps {
  selected: Reaction | null;
  onChange: (reaction: Reaction | null) => void;
  disabled?: boolean;
}

export function ReactionSelector({ selected, onChange, disabled = false }: ReactionSelectorProps) {
  const handleClick = (reaction: Reaction) => {
    if (disabled) return;
    onChange(selected === reaction ? null : reaction);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {REACTIONS.map((reaction) => {
        const isSelected = selected === reaction.id;

        return (
          <motion.button
            key={reaction.id}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(reaction.id)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl',
              'transition-all duration-200 touch-manipulation',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              isSelected
                ? 'bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-stone-800/50 border-2 border-transparent hover:border-stone-600'
            )}
            whileHover={!disabled ? { scale: 1.05 } : undefined}
            whileTap={!disabled ? { scale: 0.95 } : undefined}
            animate={isSelected ? { scale: [1, 1.1, 1] } : undefined}
            transition={{ duration: 0.2 }}
          >
            <span className="text-2xl sm:text-3xl">{reaction.emoji}</span>
            <span className={cn(
              'text-xs font-medium',
              isSelected ? 'text-amber-300' : 'text-stone-400'
            )}>
              {reaction.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
