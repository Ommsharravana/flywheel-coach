'use client';

import { Hammer, Presentation, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { TWO_PHASE_FORMAT, isLovableStillFree, getDaysUntilBuildPhase, isBuildPhaseActive } from '@/lib/appathon/launch-content';

interface TwoPhaseVisualProps {
  showExplanation?: boolean;
}

export function TwoPhaseVisual({ showExplanation = true }: TwoPhaseVisualProps) {
  const { buildPhase, demoDay, whyTwoPhases, advantages } = TWO_PHASE_FORMAT;
  const lovableFree = isLovableStillFree();
  const daysUntilBuild = getDaysUntilBuildPhase();
  const buildActive = isBuildPhaseActive();

  return (
    <div className="space-y-4">
      {/* Two-phase timeline */}
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          {/* Build Phase */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex-1 p-4 rounded-xl border ${
              buildActive
                ? 'bg-emerald-500/10 border-emerald-500/50'
                : 'bg-stone-800/50 border-stone-700/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${buildActive ? 'bg-emerald-500/20' : 'bg-stone-700/50'}`}>
                <Hammer className={`w-5 h-5 ${buildActive ? 'text-emerald-400' : 'text-stone-400'}`} />
              </div>
              <div>
                <h4 className="font-semibold text-stone-100">{buildPhase.name}</h4>
                <p className="text-xs text-stone-400">{buildPhase.dates}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {buildPhase.days} days
              </span>
              {lovableFree && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  FREE Lovable
                </span>
              )}
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <ArrowRight className="w-6 h-6 text-stone-500" />
          </div>

          {/* Demo Day */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 p-4 rounded-xl bg-stone-800/50 border border-stone-700/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Presentation className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-100">{demoDay.name}</h4>
                <p className="text-xs text-stone-400">{demoDay.date}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {demoDay.format}
            </span>
          </motion.div>
        </div>

        {/* Status indicator */}
        {daysUntilBuild > 0 && !buildActive && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-stone-400">
            <Clock className="w-4 h-4" />
            <span>Build phase starts in <strong className="text-stone-200">{daysUntilBuild} days</strong></span>
          </div>
        )}
        {buildActive && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Build phase is <strong>LIVE</strong> — start building now!</span>
          </div>
        )}
      </div>

      {/* Why two phases explanation */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <h5 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Why Two Phases?
          </h5>
          <p className="text-sm text-stone-300 mb-2">
            <strong className="text-amber-400">The Opportunity:</strong> {whyTwoPhases.opportunity}
          </p>
          <p className="text-sm text-stone-400">
            {whyTwoPhases.solution}
          </p>
        </motion.div>
      )}

      {/* Advantages (optional - can show on hover or expand) */}
      {showExplanation && advantages.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {advantages.map((advantage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-start gap-2 p-2 rounded-lg bg-stone-800/30"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span className="text-xs text-stone-400">{advantage}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
