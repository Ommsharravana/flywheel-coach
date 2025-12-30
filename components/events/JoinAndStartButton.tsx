'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, LogIn } from 'lucide-react';

interface JoinAndStartButtonProps {
  eventId: string;
  eventSlug: string;
  isAuthenticated: boolean;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline';
}

export function JoinAndStartButton({
  eventId,
  eventSlug,
  isAuthenticated,
  size = 'lg',
  variant = 'outline',
}: JoinAndStartButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/events/${eventSlug}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/events/join-and-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to join and start:', error);
        // Still redirect to dashboard on error
        router.push('/dashboard');
        return;
      }

      const data = await response.json();

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error joining and starting:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={variant === 'outline' ? 'border-stone-700 text-stone-200 hover:bg-stone-800' : 'bg-amber-500 hover:bg-amber-600 text-stone-900'}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Starting...
        </>
      ) : isAuthenticated ? (
        <>
          <Zap className="h-5 w-5 mr-2" />
          Join & Start Cycle
        </>
      ) : (
        <>
          <LogIn className="h-5 w-5 mr-2" />
          Login to Start
        </>
      )}
    </Button>
  );
}
