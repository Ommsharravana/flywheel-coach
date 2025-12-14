'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ImpersonationSession {
  isImpersonating: boolean;
  admin?: {
    id: string;
    email: string;
    name: string | null;
  };
  targetUser?: {
    id: string;
    email: string;
    name: string | null;
  };
  startedAt?: string;
  expiresAt?: string;
}

export function ImpersonationBanner() {
  const [session, setSession] = useState<ImpersonationSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [ending, setEnding] = useState(false);
  const router = useRouter();

  // Check impersonation status on mount
  useEffect(() => {
    checkImpersonationStatus();
  }, []);

  // Update time remaining every minute
  useEffect(() => {
    if (!session?.expiresAt) return;

    const updateTime = () => {
      const now = new Date();
      const expires = new Date(session.expiresAt!);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        // Auto-end session
        endImpersonation();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  async function checkImpersonationStatus() {
    try {
      const res = await fetch('/api/admin/impersonate');
      const data = await res.json();
      setSession(data);
    } catch (error) {
      console.error('Failed to check impersonation status:', error);
    }
  }

  async function endImpersonation() {
    setEnding(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      });

      if (res.ok) {
        setSession(null);
        router.push('/admin');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to end impersonation:', error);
    } finally {
      setEnding(false);
    }
  }

  if (!session?.isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">
            Impersonating: {session.targetUser?.name || session.targetUser?.email}
          </span>
          <span className="text-amber-800 text-sm">
            (logged in as {session.admin?.name || session.admin?.email})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-amber-800">
            <Clock className="h-4 w-4" />
            <span>{timeRemaining}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white hover:bg-gray-100 text-black border-amber-600"
            onClick={endImpersonation}
            disabled={ending}
          >
            {ending ? (
              'Ending...'
            ) : (
              <>
                <X className="h-4 w-4 mr-1" />
                End Impersonation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
