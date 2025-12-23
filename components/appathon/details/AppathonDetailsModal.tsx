'use client';

import { motion } from 'framer-motion';
import { X, Zap, ExternalLink, Calendar, Users } from 'lucide-react';
import type { EventWithParticipantCount } from '@/lib/events/types';
import { getBannerColorClasses, isEventLive, getDaysRemaining, getDaysUntilStart } from '@/lib/events/types';
import { APPATHON_THEMES } from '@/lib/appathon/content';
import { TWO_PHASE_FORMAT } from '@/lib/appathon/launch-content';

import { SuccessStoryBanner } from './SuccessStoryBanner';
import { TwoPhaseVisual } from './TwoPhaseVisual';
import { MyJKKNTrackHighlight } from './MyJKKNTrackHighlight';
import { PrizeSummary } from './PrizeSummary';

interface AppathonDetailsModalProps {
  event: EventWithParticipantCount;
  isActive: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onClose: () => void;
  isJoining: boolean;
}

export function AppathonDetailsModal({
  event,
  isActive,
  onJoin,
  onLeave,
  onClose,
  isJoining
}: AppathonDetailsModalProps) {
  const colorClasses = getBannerColorClasses(event.banner_color);
  const isLive = isEventLive(event);
  const daysRemaining = isLive ? getDaysRemaining(event) : getDaysUntilStart(event);
  const { buildPhase, demoDay } = TWO_PHASE_FORMAT;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-stone-700/50 bg-stone-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${colorClasses.gradient} overflow-hidden`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 text-white/80 hover:bg-black/50 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 pb-4">
            {/* Event title and badge */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-white drop-shadow-lg">
                  {event.name}
                </h2>
                <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {buildPhase.dates} (Build) | {demoDay.date} (Demo)
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{event.participant_count} participants</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                {isLive ? `${daysRemaining} days left` : `Starts in ${daysRemaining} days`}
              </div>
              {isActive && (
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  JOINED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem-5rem)] space-y-5">
          {/* Success Story - Motivational Hook */}
          <SuccessStoryBanner compact={false} />

          {/* Two-Phase Visual */}
          <TwoPhaseVisual showExplanation={true} />

          {/* MyJKKN Track Highlight */}
          <MyJKKNTrackHighlight expanded={false} />

          {/* Theme Categories */}
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Challenge Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {APPATHON_THEMES.slice(0, 6).map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-stone-600/50 transition-colors"
                >
                  <span className="text-xl">{theme.icon}</span>
                  <span className="text-sm text-stone-300">{theme.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prize Summary */}
          <PrizeSummary showAll={false} />

          {/* View Full Guide Link */}
          <a
            href="/appathon"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">View Complete Appathon Guide</span>
          </a>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-800 bg-stone-900/80">
          <div className="flex gap-3">
            {isActive ? (
              <>
                <button
                  onClick={onClose}
                  className={`flex-1 px-6 py-3 rounded-xl bg-gradient-to-r ${colorClasses.gradient} text-white font-semibold transition-all hover:shadow-lg ${colorClasses.glow}`}
                >
                  Continue Building
                </button>
                <button
                  onClick={() => { onLeave(); onClose(); }}
                  disabled={isJoining}
                  className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400 font-medium transition-all hover:border-rose-500/50 hover:text-rose-400 disabled:opacity-50"
                >
                  Leave Event
                </button>
              </>
            ) : (
              <button
                onClick={() => { onJoin(); onClose(); }}
                disabled={isJoining}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${colorClasses.gradient} text-white font-semibold transition-all hover:shadow-lg ${colorClasses.glow} disabled:opacity-50`}
              >
                {isJoining ? (
                  <>
                    <motion.div
                      className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Enter the Arena</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Helper function to detect if an event is an appathon event
 * Based on event name or type field
 */
export function isAppathonEvent(event: EventWithParticipantCount): boolean {
  const name = event.name.toLowerCase();
  return name.includes('appathon') || name.includes('app-a-thon');
}
