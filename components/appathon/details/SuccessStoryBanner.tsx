'use client';

import { Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { APPATHON_SUCCESS_STORY } from '@/lib/appathon/launch-content';

interface SuccessStoryBannerProps {
  compact?: boolean;
  onViewHallOfFame?: () => void;
}

export function SuccessStoryBanner({ compact = false, onViewHallOfFame }: SuccessStoryBannerProps) {
  const story = APPATHON_SUCCESS_STORY;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="text-stone-300">
          <strong className="text-amber-400">{story.department}</strong> won last year. Zero coding.
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
    >
      {/* Decorative sparkles */}
      <div className="absolute top-2 right-2 opacity-20">
        <Sparkles className="w-20 h-20 text-amber-400" />
      </div>

      <div className="relative p-4">
        {/* Winner badge */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">APPATHON 1.0 WINNER</span>
        </div>

        {/* Headlines */}
        <h3 className="text-xl font-bold text-stone-100 mb-1">
          {story.headline}
        </h3>
        <p className="text-lg text-stone-300 mb-3">
          {story.subheadline}
        </p>

        {/* Winner details */}
        <div className="flex items-center gap-4 text-sm text-stone-400 mb-3">
          <div>
            <span className="text-stone-500">Team:</span>{' '}
            <span className="text-stone-300">{story.teamLead} & {story.teamMember}</span>
          </div>
          <div className="w-px h-4 bg-stone-700" />
          <div>
            <span className="text-stone-500">Dept:</span>{' '}
            <span className="text-amber-400 font-medium">{story.department}</span>
          </div>
        </div>

        {/* Project highlight */}
        <div className="text-sm text-stone-400 mb-4">
          <span className="text-stone-500">Project:</span>{' '}
          <span className="text-stone-300">{story.project}</span>
        </div>

        {/* What made it special */}
        <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700/50">
          <p className="text-sm text-stone-300 italic">
            "Non-coders from Dental built an AI-powered analyzer that won First Prize.
            Ideas mattered more than programming skills."
          </p>
        </div>

        {/* CTA */}
        {onViewHallOfFame && (
          <button
            onClick={onViewHallOfFame}
            className="mt-3 flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>See all Appathon 1.0 finalists</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
