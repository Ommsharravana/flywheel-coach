'use client';

import { Smartphone, Database, ExternalLink, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { MYJKKN_TRACK } from '@/lib/appathon/launch-content';

interface MyJKKNTrackHighlightProps {
  expanded?: boolean;
  onLearnMore?: () => void;
}

export function MyJKKNTrackHighlight({ expanded = false, onLearnMore }: MyJKKNTrackHighlightProps) {
  const track = MYJKKN_TRACK;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/30"
    >
      {/* NEW badge - prominent */}
      <div className="absolute top-0 right-0">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          NEW TRACK
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Smartphone className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1 pr-16">
            <h3 className="text-lg font-bold text-stone-100">
              MyJKKN Data Apps
            </h3>
            <p className="text-sm text-stone-400">
              {track.tagline}
            </p>
          </div>
        </div>

        {/* Extra prizes callout */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-stone-300">
            Extra <strong className="text-amber-400">
              {track.extraPrizes.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </strong> in prizes just for this track!
          </span>
        </div>

        {/* Data endpoints preview */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Available Data
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {track.dataEndpoints.slice(0, 6).map((endpoint, index) => (
              <motion.span
                key={endpoint.endpoint}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-2 py-1 text-xs rounded-lg bg-stone-800/50 text-stone-300 border border-stone-700/50"
              >
                {endpoint.data.replace(' (with auth)', '')}
              </motion.span>
            ))}
            {track.dataEndpoints.length > 6 && (
              <span className="px-2 py-1 text-xs rounded-lg bg-stone-800/50 text-stone-500 border border-stone-700/50">
                +{track.dataEndpoints.length - 6} more
              </span>
            )}
          </div>
        </div>

        {/* What you can build */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4"
          >
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              App Ideas
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {track.categories.map((category, index) => (
                <div
                  key={category.id}
                  className="p-2 rounded-lg bg-stone-800/30 border border-stone-700/30"
                >
                  <span className="text-xs font-medium text-blue-400">{category.name}</span>
                  <p className="text-xs text-stone-500 mt-0.5">{category.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comparison: Without vs With MyJKKN */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2 rounded-lg bg-stone-800/30">
            <span className="text-xs text-stone-500 block mb-1">Without MyJKKN</span>
            <span className="text-xs text-stone-400">{track.comparison.without[0]}</span>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs text-blue-400 block mb-1">With MyJKKN</span>
            <span className="text-xs text-stone-300">{track.comparison.with[0]}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between">
          <a
            href={track.contextUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>Get MyJKKN Context</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onLearnMore && (
            <button
              onClick={onLearnMore}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-300 transition-colors"
            >
              <span>Learn more</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
