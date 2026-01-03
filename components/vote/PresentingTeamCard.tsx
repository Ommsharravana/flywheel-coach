'use client';

import { ExternalLink, User, Tag, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PresentingSubmission } from '@/lib/vote/types';
import { Badge } from '@/components/ui/badge';

interface PresentingTeamCardProps {
  submission: PresentingSubmission;
  isOwnSubmission: boolean;
}

export function PresentingTeamCard({ submission, isOwnSubmission }: PresentingTeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Live indicator */}
      <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="font-display font-semibold text-white uppercase tracking-wide text-sm">
            Now Presenting
          </span>
        </div>
        {submission.demo_slot && (
          <span className="text-white/80 text-sm">
            Demo #{submission.demo_slot}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* App name and badge */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-100">
              {submission.app_name}
            </h2>
            <p className="text-stone-400 text-sm flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              {submission.user_name || 'Anonymous Builder'}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="w-fit bg-amber-500/20 text-amber-300 border border-amber-500/30"
          >
            <Tag className="w-3 h-3 mr-1" />
            {submission.category}
          </Badge>
        </div>

        {/* Description */}
        {submission.description && (
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            {submission.description}
          </p>
        )}

        {/* App URL */}
        {submission.app_url && (
          <a
            href={submission.app_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800/50 rounded-lg
                       text-stone-300 hover:text-amber-400 hover:bg-stone-800
                       transition-colors duration-200"
          >
            <Monitor className="w-4 h-4" />
            <span className="text-sm">View App</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Own submission warning */}
        {isOwnSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3"
          >
            <p className="text-amber-300 text-sm font-medium">
              This is your submission - you cannot vote for it
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
