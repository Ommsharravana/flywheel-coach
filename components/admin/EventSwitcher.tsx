'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Users } from 'lucide-react';

interface AdminEvent {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  builder_count: number;
}

interface EventSwitcherProps {
  userId: string;
  userRole: string;
  currentEventId?: string | null;
  onEventChange?: (eventId: string | null) => void;
}

export function EventSwitcher({ userId, userRole, currentEventId, onEventChange }: EventSwitcherProps) {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(currentEventId || null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('get_admin_events', {
        caller_user_id: userId
      });

      if (!error && data) {
        setEvents(data as AdminEvent[]);

        // Auto-select first event if none selected
        if (!selectedEventId && data.length > 0) {
          const firstActiveEvent = data.find((e: AdminEvent) => e.is_active) || data[0];
          setSelectedEventId(firstActiveEvent.id);
          onEventChange?.(firstActiveEvent.id);
        }
      }

      setLoading(false);
    }

    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only refetch when userId changes - supabase is stable, others cause loops

  // Superadmin doesn't need event switcher - they see everything
  if (userRole === 'superadmin') {
    return null;
  }

  // Event admin with no events
  if (!loading && events.length === 0) {
    return (
      <div className="flex items-center gap-2 text-stone-400 text-sm">
        <Calendar className="h-4 w-4" />
        <span>No events assigned</span>
      </div>
    );
  }

  // Event admin with single event
  if (!loading && events.length === 1) {
    const event = events[0];
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-stone-800/50 rounded-lg border border-stone-700">
        <Calendar className="h-4 w-4 text-amber-400" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-stone-100">{event.name}</span>
          <span className="text-xs text-stone-400 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.builder_count} builders
          </span>
        </div>
      </div>
    );
  }

  // Event admin with multiple events - show switcher
  return (
    <Select
      value={selectedEventId || undefined}
      onValueChange={(value) => {
        setSelectedEventId(value);
        onEventChange?.(value);
      }}
    >
      <SelectTrigger className="w-[220px] bg-stone-800/50 border-stone-700 text-stone-100">
        <Calendar className="h-4 w-4 mr-2 text-amber-400" />
        <SelectValue placeholder="Select event..." />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id}>
            <div className="flex items-center justify-between gap-2">
              <span>{event.name}</span>
              <span className="text-xs text-stone-400">
                {event.builder_count} builders
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
