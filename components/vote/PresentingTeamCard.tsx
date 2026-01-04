'use client';

import { ExternalLink, User, Tag, Monitor, Radio } from 'lucide-react';
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
      className="glass-card rounded-2xl overflow-hidden border border-[#0b6d41]/30"
    >
      {/* Live indicator - JKKN green */}
      <div className="bg-gradient-to-r from-[#0b6d41] to-[#0b5d38] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffde59] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ffde59]"></span>
          </span>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#ffde59]" />
            <span className="font-display font-semibold text-white uppercase tracking-wide text-sm">
              Now Presenting
            </span>
          </div>
        </div>
        {submission.demo_slot && (
          <Badge className="bg-[#ffde59]/20 text-[#ffde59] border-[#ffde59]/50 font-mono">
            #{submission.demo_slot}
          </Badge>
        )}
      </div>

      {/* Main content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* App name and badge */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
            className="w-fit bg-[#ffde59]/15 text-[#ffde59] border border-[#ffde59]/30"
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-800/50 rounded-xl
                       text-stone-300 hover:text-[#ffde59] hover:bg-stone-800 hover:border-[#ffde59]/30
                       border border-stone-700/50 transition-all duration-200"
          >
            <Monitor className="w-4 h-4" />
            <span className="text-sm font-medium">View App</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Own submission warning */}
        {isOwnSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#ffde59]/10 border border-[#ffde59]/30 rounded-xl px-4 py-3"
          >
            <p className="text-[#ffde59] text-sm font-medium">
              This is your submission — you cannot vote for it
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
