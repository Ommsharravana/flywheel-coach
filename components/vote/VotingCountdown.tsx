'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Timer, Lock, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VotingCountdownProps {
  secondsLeft: number | null;
  urgencyLevel: 'calm' | 'warning' | 'urgent' | 'critical';
  percentageRemaining: number | null;
  isPending?: boolean;
  isExpired?: boolean;
  reason?: string;
  className?: string;
}

export function VotingCountdown({
  secondsLeft,
  urgencyLevel,
  percentageRemaining,
  isPending = false,
  isExpired = false,
  reason,
  className,
}: VotingCountdownProps) {
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Waiting for demo to start
  if (isPending) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6',
          'bg-gradient-to-br from-stone-800/80 to-stone-900/80',
          'border border-stone-700/50',
          className
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <motion.div
            animate={{
              rotate: [0, 180, 360],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Hourglass className="w-8 h-8 text-stone-400" />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-medium text-stone-300">
              Waiting for Demo to Start
            </p>
            <p className="text-sm text-stone-500 mt-1">
              Voting opens when the judge begins scoring
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Voting window closed/expired
  if (isExpired || secondsLeft === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6',
          'bg-gradient-to-br from-stone-800/80 to-stone-900/80',
          'border border-stone-600/50',
          className
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <Lock className="w-8 h-8 text-stone-500" />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-medium text-stone-400">
              Voting Window Closed
            </p>
            {reason && (
              <p className="text-sm text-stone-500 mt-1">{reason}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (secondsLeft === null) return null;

  // Color schemes based on urgency
  const urgencyStyles = {
    calm: {
      bg: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
      icon: Clock,
      pulse: false,
    },
    warning: {
      bg: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20',
      icon: Timer,
      pulse: false,
    },
    urgent: {
      bg: 'from-orange-500/30 to-red-500/20',
      border: 'border-orange-500/40',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/30',
      icon: AlertTriangle,
      pulse: true,
    },
    critical: {
      bg: 'from-red-500/40 to-rose-600/30',
      border: 'border-red-500/50',
      text: 'text-red-400',
      glow: 'shadow-red-500/40',
      icon: AlertTriangle,
      pulse: true,
    },
  };

  const style = urgencyStyles[urgencyLevel];
  const Icon = style.icon;

  // Get urgency message
  const getUrgencyMessage = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'LAST CHANCE! Vote NOW!';
      case 'urgent':
        return 'Hurry! Time is running out!';
      case 'warning':
        return 'Vote before time expires';
      default:
        return 'Time remaining to vote';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br',
        style.bg,
        'border',
        style.border,
        'shadow-lg',
        style.glow,
        className
      )}
    >
      {/* Animated background pulse for urgent/critical */}
      <AnimatePresence>
        {style.pulse && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </AnimatePresence>

      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-900/50">
        <motion.div
          className={cn(
            'h-full',
            urgencyLevel === 'critical' ? 'bg-red-500' :
            urgencyLevel === 'urgent' ? 'bg-orange-500' :
            urgencyLevel === 'warning' ? 'bg-amber-500' :
            'bg-emerald-500'
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${percentageRemaining || 0}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="relative p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Animated icon */}
          <motion.div
            animate={style.pulse ? {
              scale: [1, 1.1, 1],
              rotate: urgencyLevel === 'critical' ? [-5, 5, -5] : 0,
            } : {}}
            transition={{
              duration: urgencyLevel === 'critical' ? 0.5 : 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Icon className={cn('w-8 h-8', style.text)} />
          </motion.div>

          {/* Timer display */}
          <div className="text-center">
            <motion.div
              key={secondsLeft}
              initial={{ scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-4xl sm:text-5xl font-bold font-mono tracking-wider',
                style.text,
                urgencyLevel === 'critical' && 'animate-pulse'
              )}
            >
              {formatTime(secondsLeft)}
            </motion.div>
            <motion.p
              className={cn(
                'text-sm mt-1',
                urgencyLevel === 'critical' ? 'text-red-300 font-semibold' :
                urgencyLevel === 'urgent' ? 'text-orange-300' :
                'text-stone-400'
              )}
              animate={urgencyLevel === 'critical' ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {getUrgencyMessage()}
            </motion.p>
          </div>
        </div>

        {/* Additional urgency indicators */}
        {urgencyLevel === 'critical' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <motion.span
              className="inline-block px-4 py-2 bg-red-500/30 text-red-300 text-sm font-medium rounded-full border border-red-500/50"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                  '0 0 0 8px rgba(239, 68, 68, 0)',
                ],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Submit your vote before time runs out!
            </motion.span>
          </motion.div>
        )}

        {urgencyLevel === 'urgent' && secondsLeft <= 90 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-center text-xs text-orange-300/80"
          >
            Less than {Math.ceil(secondsLeft / 60)} minute{secondsLeft > 60 ? 's' : ''} left
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

// Compact version for inline use
export function VotingCountdownCompact({
  secondsLeft,
  urgencyLevel,
}: Pick<VotingCountdownProps, 'secondsLeft' | 'urgencyLevel'>) {
  if (secondsLeft === null) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const textColor = {
    calm: 'text-emerald-400',
    warning: 'text-amber-400',
    urgent: 'text-orange-400',
    critical: 'text-red-400',
  }[urgencyLevel];

  return (
    <motion.span
      key={secondsLeft}
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-bold',
        textColor,
        urgencyLevel === 'critical' && 'animate-pulse'
      )}
    >
      <Clock className="w-4 h-4" />
      {formatTime(secondsLeft)}
    </motion.span>
  );
}
