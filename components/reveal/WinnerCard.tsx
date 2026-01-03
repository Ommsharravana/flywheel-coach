'use client';

import { motion } from 'framer-motion';
import { Trophy, Users, Star } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/admin/demo-day/types';

interface WinnerCardProps {
  winner: LeaderboardEntry;
  place: 1 | 2 | 3;
  revealed: boolean;
  onRevealComplete?: () => void;
}

const PLACE_CONFIG = {
  1: {
    label: '1st Place',
    icon: Trophy,
    bgGradient: 'from-yellow-500/20 via-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-500',
    scale: 1.1,
  },
  2: {
    label: '2nd Place',
    icon: Star,
    bgGradient: 'from-slate-400/20 via-gray-400/20 to-slate-400/20',
    borderColor: 'border-slate-400',
    textColor: 'text-slate-300',
    iconColor: 'text-slate-400',
    scale: 1.0,
  },
  3: {
    label: '3rd Place',
    icon: Users,
    bgGradient: 'from-orange-700/20 via-amber-700/20 to-orange-700/20',
    borderColor: 'border-orange-600',
    textColor: 'text-orange-400',
    iconColor: 'text-orange-500',
    scale: 0.95,
  },
};

export function WinnerCard({ winner, place, revealed, onRevealComplete }: WinnerCardProps) {
  const config = PLACE_CONFIG[place];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      animate={
        revealed
          ? { opacity: 1, scale: config.scale, rotateY: 0 }
          : { opacity: 0, scale: 0.8, rotateY: 90 }
      }
      transition={{
        duration: 0.8,
        ease: [0.43, 0.13, 0.23, 0.96],
        delay: 0.2,
      }}
      onAnimationComplete={() => {
        if (revealed && onRevealComplete) {
          onRevealComplete();
        }
      }}
      className="relative"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        className={`
          relative p-8 rounded-2xl
          bg-gradient-to-br ${config.bgGradient}
          border-4 ${config.borderColor}
          backdrop-blur-sm
          shadow-2xl
        `}
      >
        {/* Place Badge */}
        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-stone-950 border-2 ${config.borderColor}`}>
          <div className={`flex items-center gap-2 ${config.textColor} font-bold text-lg`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
            {config.label}
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 text-center space-y-4">
          {/* Submission Number */}
          <div className="text-stone-500 text-sm font-mono">
            #{winner.submission_number}
          </div>

          {/* App Name */}
          <h2 className="text-3xl font-bold text-white">
            {winner.app_name}
          </h2>

          {/* Category */}
          <div className="text-stone-400 text-sm">
            {winner.category}
          </div>

          {/* Score Display */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {winner.avg_judge_score.toFixed(1)}
              </div>
              <div className="text-xs text-stone-500">Judge Score</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {winner.audience_score.toFixed(1)}
              </div>
              <div className="text-xs text-stone-500">Audience</div>
            </div>
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${config.textColor}`}>
                {winner.final_score.toFixed(1)}
              </div>
              <div className="text-xs text-stone-500">Final</div>
            </div>
          </div>

          {/* Bonus Indicator */}
          {winner.avg_bonus > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Star className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">
                +{winner.avg_bonus.toFixed(0)}% Bonus
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
