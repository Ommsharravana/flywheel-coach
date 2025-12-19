'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Clock, Calendar, Users, ExternalLink } from 'lucide-react';
import { useActiveEvent } from '@/lib/context/EventContext';
import { getBannerColorClasses, isEventLive, getDaysRemaining } from '@/lib/events/types';

export function EventBanner() {
  const { activeEvent, leaveEvent, isJoining } = useActiveEvent();
  const [dismissed, setDismissed] = useState(false);

  if (!activeEvent || dismissed) return null;

  const colorClasses = getBannerColorClasses(activeEvent.banner_color);
  const isLive = isEventLive(activeEvent);
  const daysRemaining = getDaysRemaining(activeEvent);
  const config = activeEvent.config;

  // Build status text based on event state
  let statusText = '';
  if (isLive) {
    if (daysRemaining === 0) {
      statusText = 'Final Day!';
    } else if (daysRemaining === 1) {
      statusText = '1 day left';
    } else {
      statusText = `${daysRemaining} days left`;
    }
  } else {
    const startDate = new Date(activeEvent.start_date);
    const endDate = new Date(activeEvent.end_date);
    statusText = `${startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed top-16 left-0 right-0 z-40 border-b bg-gradient-to-r ${
        activeEvent.banner_color === 'amber'
          ? 'from-amber-500/15 via-orange-500/10 to-rose-500/15 border-amber-500/30'
          : activeEvent.banner_color === 'emerald'
          ? 'from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border-emerald-500/30'
          : activeEvent.banner_color === 'violet'
          ? 'from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 border-violet-500/30'
          : activeEvent.banner_color === 'rose'
          ? 'from-rose-500/15 via-pink-500/10 to-fuchsia-500/15 border-rose-500/30'
          : 'from-sky-500/15 via-blue-500/10 to-indigo-500/15 border-sky-500/30'
      } backdrop-blur-sm`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Event info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated icon */}
            <motion.div
              className="relative flex-shrink-0"
              animate={isLive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className={`w-4 h-4 ${colorClasses.text}`} />
              {isLive && (
                <motion.div
                  className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400`}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Event name */}
            <span className="text-sm font-semibold text-stone-200 truncate">
              {activeEvent.name}
            </span>

            {/* Divider */}
            <span className="hidden sm:block text-stone-600">|</span>

            {/* Status */}
            <div className="hidden sm:flex items-center gap-1.5 text-stone-400">
              {isLive ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              <span className="text-sm">{statusText}</span>
            </div>

            {/* Themes badge (collapsed on mobile) */}
            {config?.themes && config.themes.length > 0 && (
              <span
                className={`hidden md:inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${colorClasses.border} ${colorClasses.text} bg-stone-900/50`}
              >
                {config.themes.length} themes
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile status */}
            <span className="sm:hidden text-xs text-stone-400">
              {statusText}
            </span>

            {/* Leave button */}
            <button
              onClick={() => leaveEvent()}
              disabled={isJoining}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors disabled:opacity-50"
            >
              Leave
            </button>

            {/* Dismiss button */}
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-md text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Backward compatible export for existing code
export { EventBanner as AppathonBanner };
