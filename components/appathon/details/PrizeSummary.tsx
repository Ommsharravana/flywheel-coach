'use client';

import { Trophy, Gift, Medal, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRIZE_STRUCTURE_DETAILED, getTotalPrizePoolDetailed } from '@/lib/appathon/launch-content';

interface PrizeSummaryProps {
  showAll?: boolean;
  onViewAll?: () => void;
}

export function PrizeSummary({ showAll = false, onViewAll }: PrizeSummaryProps) {
  const prizes = PRIZE_STRUCTURE_DETAILED;
  const totalPool = getTotalPrizePoolDetailed();

  // Format currency
  const formatINR = (amount: number) =>
    amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  return (
    <div className="space-y-4">
      {/* Total prize pool */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-sm text-stone-400">Total Prize Pool</span>
            <p className="text-2xl font-bold text-amber-400">
              {formatINR(totalPool)}+
            </p>
          </div>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          13 Categories
        </span>
      </motion.div>

      {/* Main prizes */}
      <div>
        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Medal className="w-4 h-4" />
          Main Prizes
        </h4>
        <div className="space-y-2">
          {prizes.main.map((prize, index) => (
            <motion.div
              key={prize.place}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50 border border-stone-700/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-amber-500/20 text-amber-400' :
                  index === 1 ? 'bg-stone-400/20 text-stone-300' :
                  'bg-orange-700/20 text-orange-400'
                }`}>
                  {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                </div>
                <div>
                  <span className="text-sm font-medium text-stone-200">{prize.place}</span>
                  <p className="text-xs text-stone-500">{prize.recognition}</p>
                </div>
              </div>
              <span className={`text-lg font-bold ${
                index === 0 ? 'text-amber-400' :
                index === 1 ? 'text-stone-300' :
                'text-orange-400'
              }`}>
                {formatINR(prize.amount)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Special categories preview */}
      {!showAll && (
        <div>
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Special Categories
          </h4>
          <div className="flex flex-wrap gap-2">
            {prizes.special.slice(0, 4).map((prize, index) => (
              <motion.span
                key={prize.category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-stone-800/50 text-stone-300 border border-stone-700/50"
              >
                {prize.category}
                <span className="ml-1.5 text-emerald-400">{formatINR(prize.amount)}</span>
              </motion.span>
            ))}
            {prizes.special.length > 4 && (
              <span className="px-2.5 py-1.5 text-xs rounded-lg bg-stone-800/50 text-stone-500 border border-stone-700/50">
                +{prizes.special.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* MyJKKN prizes highlight */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-blue-400">MyJKKN Track Prizes</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
            NEW
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {prizes.myjkkn.map((prize) => (
            <span
              key={prize.category}
              className="text-xs text-stone-400"
            >
              {prize.category} <span className="text-blue-400">{formatINR(prize.amount)}</span>
            </span>
          ))}
        </div>
      </div>

      {/* For all participants */}
      <div className="p-3 rounded-lg bg-stone-800/30 border border-stone-700/30">
        <h4 className="text-xs font-semibold text-stone-400 mb-2">For All Participants</h4>
        <ul className="space-y-1">
          {prizes.forAllParticipants.slice(0, 3).map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-xs text-stone-500">
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* View all CTA */}
      {onViewAll && !showAll && (
        <button
          onClick={onViewAll}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm text-stone-400 hover:text-stone-300 transition-colors"
        >
          <span>View all prize categories</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
