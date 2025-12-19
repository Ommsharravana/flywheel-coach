'use client';

import { createContext, useContext, ReactNode, useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Event, EventConfig } from '@/lib/events/types';

interface EventContextType {
  // Current active event
  activeEvent: Event | null;
  // Parsed config from active event
  eventConfig: EventConfig | null;
  // Backward compatibility: true if any event is active
  isAppathonMode: boolean;
  // Actions
  joinEvent: (eventId: string) => Promise<void>;
  leaveEvent: () => Promise<void>;
  // Loading state
  isJoining: boolean;
}

const EventContext = createContext<EventContextType>({
  activeEvent: null,
  eventConfig: null,
  isAppathonMode: false,
  joinEvent: async () => {},
  leaveEvent: async () => {},
  isJoining: false,
});

interface EventProviderProps {
  children: ReactNode;
  activeEvent: Event | null;
}

export function EventProvider({ children, activeEvent }: EventProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isJoining, setIsJoining] = useState(false);

  // Parse config from active event
  const eventConfig = activeEvent?.config ?? null;

  // Backward compatibility
  const isAppathonMode = activeEvent !== null;

  const joinEvent = useCallback(async (eventId: string) => {
    setIsJoining(true);
    try {
      const response = await fetch('/api/events/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join event');
      }

      // Refresh the page to get new event context
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsJoining(false);
    }
  }, [router]);

  const leaveEvent = useCallback(async () => {
    setIsJoining(true);
    try {
      const response = await fetch('/api/events/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave event');
      }

      // Refresh the page to clear event context
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsJoining(false);
    }
  }, [router]);

  return (
    <EventContext.Provider
      value={{
        activeEvent,
        eventConfig,
        isAppathonMode,
        joinEvent,
        leaveEvent,
        isJoining: isJoining || isPending,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useActiveEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useActiveEvent must be used within an EventProvider');
  }
  return context;
}

// Backward compatibility alias
export function useAppathonMode() {
  const { isAppathonMode, activeEvent, eventConfig } = useActiveEvent();
  return { isAppathonMode, activeEvent, eventConfig };
}

// Export the context for testing purposes
export { EventContext };
