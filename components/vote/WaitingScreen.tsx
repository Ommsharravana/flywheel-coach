'use client';

import { motion } from 'framer-motion';
import { Clock, Users, MapPin, Radio } from 'lucide-react';
import type { PresentingSubmission, UserTrackInfo } from '@/lib/vote/types';

interface WaitingScreenProps {
  trackInfo: UserTrackInfo;
  queue: PresentingSubmission[];
}

export function WaitingScreen({ trackInfo, queue }: WaitingScreenProps) {
  const pendingInQueue = queue.filter(s => s.status === 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 sm:p-8"
    >
      {/* Track info header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b6d41]/10 border border-[#0b6d41]/30 rounded-full">
          <Radio className="w-4 h-4 text-[#ffde59]" />
          <span className="text-[#ffde59] font-medium">{trackInfo.track_name}</span>
        </div>
        {trackInfo.room_location && (
          <p className="text-stone-500 text-sm flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            {trackInfo.room_location}
          </p>
        )}
      </div>

      {/* Waiting animation */}
      <div className="text-center space-y-6">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full
                     bg-gradient-to-br from-[#0b6d41]/20 to-stone-900
                     border-2 border-[#0b6d41]/40"
        >
          <Clock className="w-10 h-10 text-[#0b6d41]" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-100">
            Waiting for Next Demo
          </h2>
          <p className="text-stone-400 text-sm sm:text-base">
            The next team will start presenting soon
          </p>
        </div>
      </div>

      {/* Queue preview */}
      {pendingInQueue.length > 0 && (
        <div className="mt-8 pt-6 border-t border-stone-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-stone-500" />
            <span className="text-sm text-stone-400">
              {pendingInQueue.length} team{pendingInQueue.length !== 1 ? 's' : ''} in queue
            </span>
          </div>

          <div className="space-y-2">
            {pendingInQueue.slice(0, 3).map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-stone-800/30 rounded-lg"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full
                               bg-stone-700/50 text-stone-400 text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-stone-200 font-medium truncate">
                    {submission.app_name}
                  </p>
                  <p className="text-stone-500 text-xs truncate">
                    by {submission.user_name || 'Anonymous'}
                  </p>
                </div>
              </motion.div>
            ))}

            {pendingInQueue.length > 3 && (
              <p className="text-stone-500 text-xs text-center pt-2">
                +{pendingInQueue.length - 3} more in queue
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-stone-500">
          This page updates automatically when a new team starts presenting
        </p>
      </motion.div>
    </motion.div>
  );
}
