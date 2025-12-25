'use client';

import { createContext, useContext, ReactNode, useCallback, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Event, EventConfig } from '@/lib/events/types';

interface EventContextType {
  // Current active event
  activeEvent: Event | null;
  // Parsed config from active event
  eventConfig: EventConfig | null;
  // Backward compatibility: true if any event is active
  isAppathonMode: boolean;
  // Actions - joinEvent accepts optional event for optimistic updates
  joinEvent: (eventId: string, eventData?: Event) => Promise<void>;
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

export function EventProvider({ children, activeEvent: serverActiveEvent }: EventProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isJoining, setIsJoining] = useState(false);

  // Local state for optimistic updates - initialized from server prop
  const [localActiveEvent, setLocalActiveEvent] = useState<Event | null>(serverActiveEvent);

  // Sync with server prop when it changes (e.g., after router.refresh completes)
  useEffect(() => {
    setLocalActiveEvent(serverActiveEvent);
  }, [serverActiveEvent]);

  // Use local state for rendering (enables optimistic updates)
  const activeEvent = localActiveEvent;

  // Parse config from active event
  const eventConfig = activeEvent?.config ?? null;

  // Backward compatibility
  const isAppathonMode = activeEvent !== null;

  const joinEvent = useCallback(async (eventId: string, eventData?: Event) => {
    setIsJoining(true);

    // OPTIMISTIC UPDATE: Set event immediately if provided
    if (eventData) {
      setLocalActiveEvent(eventData);
    }

    try {
      const response = await fetch('/api/events/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Revert optimistic update on error
        setLocalActiveEvent(serverActiveEvent);
        throw new Error(error.error || 'Failed to join event');
      }

      // Refresh server state in background (won't cause flicker due to optimistic update)
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Revert optimistic update on any error
      setLocalActiveEvent(serverActiveEvent);
      throw err;
    } finally {
      setIsJoining(false);
    }
  }, [router, serverActiveEvent]);

  const leaveEvent = useCallback(async () => {
    setIsJoining(true);

    // OPTIMISTIC UPDATE: Clear event immediately
    const previousEvent = localActiveEvent;
    setLocalActiveEvent(null);

    try {
      const response = await fetch('/api/events/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        // Revert optimistic update on error
        setLocalActiveEvent(previousEvent);
        throw new Error(error.error || 'Failed to leave event');
      }

      // Refresh server state in background
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Revert optimistic update on any error
      setLocalActiveEvent(previousEvent);
      throw err;
    } finally {
      setIsJoining(false);
    }
  }, [router, localActiveEvent]);

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
