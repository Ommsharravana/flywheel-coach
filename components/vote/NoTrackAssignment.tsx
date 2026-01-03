'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NoTrackAssignmentProps {
  reason: 'no-submission' | 'no-track' | 'loading-error';
}

export function NoTrackAssignment({ reason }: NoTrackAssignmentProps) {
  const content = {
    'no-submission': {
      title: 'No Submission Found',
      description: 'You need to submit an app to Appathon 2.0 to participate in audience voting.',
      action: 'Go to Dashboard',
      href: '/dashboard',
    },
    'no-track': {
      title: 'Not Assigned to a Track',
      description: 'Your submission has not been assigned to a judging track yet. Please contact an organizer.',
      action: 'Contact Support',
      href: '/settings',
    },
    'loading-error': {
      title: 'Unable to Load Track Info',
      description: 'There was an error loading your track assignment. Please try again.',
      action: 'Try Again',
      href: '/vote',
    },
  };

  const { title, description, action, href } = content[reason];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 sm:p-8"
    >
      <div className="text-center space-y-6">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full
                     bg-amber-500/20 border-2 border-amber-500/50"
        >
          {reason === 'loading-error' ? (
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          ) : (
            <HelpCircle className="w-8 h-8 text-amber-400" />
          )}
        </motion.div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-100">
            {title}
          </h2>
          <p className="text-stone-400 text-sm sm:text-base max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Action button */}
        <Button asChild size="lg" className="mt-4">
          <Link href={href}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {action}
          </Link>
        </Button>

        {/* Help text */}
        <div className="pt-4 border-t border-stone-700/50">
          <p className="text-xs text-stone-500">
            Need help? Ask an organizer at the registration desk
          </p>
        </div>
      </div>
    </motion.div>
  );
}
