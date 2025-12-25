'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Clock, Zap, ChevronRight, Trophy, Sparkles, X, Loader2 } from 'lucide-react';
import { useActiveEvent } from '@/lib/context/EventContext';
import type { EventWithParticipantCount } from '@/lib/events/types';
import { getBannerColorClasses, isEventLive, isEventUpcoming, getDaysRemaining, getDaysUntilStart } from '@/lib/events/types';
import { AppathonDetailsModal, isAppathonEvent } from '@/components/appathon/details/AppathonDetailsModal';

export function EventSelector() {
  const { activeEvent, joinEvent, leaveEvent, isJoining } = useActiveEvent();
  const [events, setEvents] = useState<EventWithParticipantCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithParticipantCount | null>(null);

  // Fetch events on mount
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Filter to show only active/upcoming events
  const availableEvents = events.filter(e => isEventLive(e) || isEventUpcoming(e));

  // Show loading state
  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-6 w-6 text-stone-600" />
          <div className="h-6 w-40 bg-stone-800 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-stone-800/50 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (availableEvents.length === 0 && !activeEvent) {
    return null; // No events to show
  }

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 blur-lg opacity-50" />
          <Trophy className="relative h-6 w-6 text-amber-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-stone-100">
          Active Competitions
        </h2>
        {availableEvents.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {availableEvents.length} Live
          </span>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {availableEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              isActive={activeEvent?.id === event.id}
              onJoin={() => joinEvent(event.id, event)}
              onLeave={leaveEvent}
              onViewDetails={() => setSelectedEvent(event)}
              isJoining={isJoining}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          isAppathonEvent(selectedEvent) ? (
            <AppathonDetailsModal
              event={selectedEvent}
              isActive={activeEvent?.id === selectedEvent.id}
              onJoin={() => joinEvent(selectedEvent.id, selectedEvent)}
              onLeave={leaveEvent}
              onClose={() => setSelectedEvent(null)}
              isJoining={isJoining}
            />
          ) : (
            <EventDetailsModal
              event={selectedEvent}
              isActive={activeEvent?.id === selectedEvent.id}
              onJoin={() => joinEvent(selectedEvent.id, selectedEvent)}
              onLeave={leaveEvent}
              onClose={() => setSelectedEvent(null)}
              isJoining={isJoining}
            />
          )
        )}
      </AnimatePresence>
    </section>
  );
}

interface EventCardProps {
  event: EventWithParticipantCount;
  isActive: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onViewDetails: () => void;
  isJoining: boolean;
  index: number;
}

function EventCard({ event, isActive, onJoin, onLeave, onViewDetails, isJoining, index }: EventCardProps) {
  const colorClasses = getBannerColorClasses(event.banner_color);
  const isLive = isEventLive(event);
  const isUpcoming = isEventUpcoming(event);
  const daysRemaining = isLive ? getDaysRemaining(event) : getDaysUntilStart(event);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="group relative"
    >
      {/* Static border glow for active events */}
      {isActive && (
        <div
          className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${colorClasses.gradient} opacity-60 blur-sm`}
        />
      )}

      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
          isActive
            ? `${colorClasses.border} bg-stone-900/90`
            : 'border-stone-700/50 bg-stone-900/70 hover:border-stone-600/50 hover:bg-stone-900/80'
        }`}
      >
        {/* Header with gradient */}
        <div className={`relative h-24 bg-gradient-to-br ${colorClasses.gradient} overflow-hidden`}>
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {isLive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="text-xs font-semibold text-white">LIVE</span>
              </div>
            ) : isUpcoming ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                <Clock className="h-3 w-3 text-white/80" />
                <span className="text-xs font-semibold text-white">COMING SOON</span>
              </div>
            ) : null}
          </div>

          {/* Active badge */}
          {isActive && (
            <div className="absolute top-3 right-3">
              <motion.div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Sparkles className="h-3 w-3 text-white" />
                <span className="text-xs font-semibold text-white">JOINED</span>
              </motion.div>
            </div>
          )}

          {/* Event icon */}
          <div className="absolute bottom-3 right-3">
            <div className="h-10 w-10 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display text-lg font-bold text-stone-100 mb-1">
            {event.name}
          </h3>
          <p className="text-sm text-stone-400 line-clamp-2 mb-4">
            {event.description}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-stone-400">
              <Users className="h-4 w-4" />
              <span className="text-sm">{event.participant_count} joined</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-400">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {isLive ? `${daysRemaining}d left` : `Starts in ${daysRemaining}d`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isActive ? (
              <>
                <button
                  onClick={onViewDetails}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${colorClasses.gradient} text-white font-semibold text-sm transition-all hover:shadow-lg ${colorClasses.glow} hover:shadow-xl`}
                >
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onLeave}
                  disabled={isJoining}
                  className="px-4 py-2.5 rounded-xl border border-stone-700 text-stone-400 font-medium text-sm transition-all hover:border-rose-500/50 hover:text-rose-400 disabled:opacity-50"
                >
                  Leave
                </button>
              </>
            ) : (
              <button
                onClick={onJoin}
                disabled={isJoining}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r ${colorClasses.gradient} text-white hover:shadow-lg ${colorClasses.glow} disabled:opacity-50`}
              >
                {isJoining ? (
                  <>
                    <motion.div
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Joining...</span>
                  </>
                ) : isLive ? (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Enter Arena</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Join Early</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface EventDetailsModalProps {
  event: EventWithParticipantCount;
  isActive: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onClose: () => void;
  isJoining: boolean;
}

function EventDetailsModal({ event, isActive, onJoin, onLeave, onClose, isJoining }: EventDetailsModalProps) {
  const colorClasses = getBannerColorClasses(event.banner_color);
  const config = event.config;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-stone-700/50 bg-stone-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative h-32 bg-gradient-to-br ${colorClasses.gradient}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white/80 hover:bg-black/50 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-6">
            <h2 className="font-display text-2xl font-bold text-white drop-shadow-lg">
              {event.name}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-8rem-5rem)]">
          <p className="text-stone-300 mb-6">{event.description}</p>

          {/* Themes */}
          {config?.themes && config.themes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {config.themes.map((theme) => (
                  <span
                    key={theme}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${colorClasses.border} ${colorClasses.text} bg-stone-800/50`}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Judging Criteria */}
          {config?.judgingCriteria && config.judgingCriteria.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Judging Criteria
              </h3>
              <div className="grid gap-2">
                {config.judgingCriteria.map((criterion) => (
                  <div
                    key={criterion.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-800/50"
                  >
                    <span className="text-stone-200">{criterion.name}</span>
                    <span className={`font-semibold ${colorClasses.text}`}>
                      {criterion.weight}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonus Criteria */}
          {config?.bonusCriteria && config.bonusCriteria.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Bonus Points
              </h3>
              <div className="flex flex-wrap gap-2">
                {config.bonusCriteria.map((criterion) => (
                  <span
                    key={criterion.name}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  >
                    {criterion.name} (+{criterion.bonus}%)
                  </span>
                ))}
              </div>
            </div>
          )}
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
