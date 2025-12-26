/**
 * Methodology Helpers
 *
 * Server-side utilities for working with methodologies and events.
 */

import { createClient } from '@/lib/supabase/server';
import { getMethodologyForEvent, FLYWHEEL_8 } from './index';
import type { Methodology } from './types';

/**
 * Get methodology for a user based on their active event
 */
export async function getMethodologyForUser(userId: string): Promise<{
  methodology: Methodology;
  eventId: string | null;
  eventSlug: string | null;
  eventName: string | null;
}> {
  const supabase = await createClient();

  // Get user's active event
  const { data: userData } = await supabase
    .from('users')
    .select('active_event_id')
    .eq('id', userId)
    .single() as { data: { active_event_id: string | null } | null };

  if (!userData?.active_event_id) {
    return {
      methodology: FLYWHEEL_8,
      eventId: null,
      eventSlug: null,
      eventName: null,
    };
  }

  // Get event config
  const { data: eventData } = await supabase
    .from('events')
    .select('id, slug, name, config')
    .eq('id', userData.active_event_id)
    .single() as { data: { id: string; slug: string; name: string; config: Record<string, unknown> } | null };

  if (!eventData) {
    return {
      methodology: FLYWHEEL_8,
      eventId: null,
      eventSlug: null,
      eventName: null,
    };
  }

  const methodology = getMethodologyForEvent(eventData.config);

  return {
    methodology,
    eventId: eventData.id,
    eventSlug: eventData.slug,
    eventName: eventData.name,
  };
}

/**
 * Get methodology for a specific cycle
 */
export async function getMethodologyForCycle(cycleId: string): Promise<{
  methodology: Methodology;
  eventId: string | null;
  eventSlug: string | null;
  eventName: string | null;
}> {
  const supabase = await createClient();

  // Get cycle with event info
  const { data: cycleData } = await supabase
    .from('cycles')
    .select(`
      id,
      event_id,
      user_id,
      users!cycles_user_id_fkey (
        active_event_id
      )
    `)
    .eq('id', cycleId)
    .single() as { data: { id: string; event_id: string | null; user_id: string; users: { active_event_id: string | null } | null } | null };

  if (!cycleData) {
    return {
      methodology: FLYWHEEL_8,
      eventId: null,
      eventSlug: null,
      eventName: null,
    };
  }

  // Prefer cycle's event_id, fallback to user's active_event_id
  const eventId = cycleData.event_id || cycleData.users?.active_event_id;

  if (!eventId) {
    return {
      methodology: FLYWHEEL_8,
      eventId: null,
      eventSlug: null,
      eventName: null,
    };
  }

  // Get event config
  const { data: eventData } = await supabase
    .from('events')
    .select('id, slug, name, config')
    .eq('id', eventId)
    .single() as { data: { id: string; slug: string; name: string; config: Record<string, unknown> } | null };

  if (!eventData) {
    return {
      methodology: FLYWHEEL_8,
      eventId: null,
      eventSlug: null,
      eventName: null,
    };
  }

  const methodology = getMethodologyForEvent(eventData.config);

  return {
    methodology,
    eventId: eventData.id,
    eventSlug: eventData.slug,
    eventName: eventData.name,
  };
}

/**
 * Check if user is admin of a specific event
 */
export async function checkEventAdminAccess(
  userId: string,
  eventId: string
): Promise<{ isAdmin: boolean; role: string | null }> {
  const supabase = await createClient();

  // Check if superadmin first using RPC (bypasses RLS, same as middleware)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any).rpc('get_user_role', { user_id: userId });
  const userRole = (roleData as { role: string }[] | null)?.[0]?.role;

  if (userRole === 'superadmin') {
    return { isAdmin: true, role: 'superadmin' };
  }

  // Check event_admins table
  const { data: adminData } = await supabase
    .from('event_admins')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single() as { data: { role: string } | null };

  if (adminData) {
    // All event admin roles (admin, reviewer, viewer) can access settings
    return { isAdmin: true, role: adminData.role };
  }

  return { isAdmin: false, role: null };
}

/**
 * Get all events user can admin
 */
export async function getAdminEvents(userId: string): Promise<
  Array<{
    id: string;
    slug: string;
    name: string;
    role: string;
  }>
> {
  const supabase = await createClient();

  // Check if superadmin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single() as { data: { role: string } | null };

  if (userData?.role === 'superadmin') {
    // Return all active events
    const { data: events } = await supabase
      .from('events')
      .select('id, slug, name')
      .eq('is_active', true) as { data: Array<{ id: string; slug: string; name: string }> | null };

    return (events || []).map((e) => ({
      id: e.id,
      slug: e.slug,
      name: e.name,
      role: 'superadmin',
    }));
  }

  // Get events from event_admins
  type EventAdminWithEvent = {
    role: string;
    events: { id: string; slug: string; name: string } | null;
  };

  const { data: adminEvents } = await supabase
    .from('event_admins')
    .select(`
      role,
      events (id, slug, name)
    `)
    .eq('user_id', userId) as { data: EventAdminWithEvent[] | null };

  return (adminEvents || [])
    .filter((ea) => ea.events)
    .map((ea) => ({
      id: ea.events!.id,
      slug: ea.events!.slug,
      name: ea.events!.name,
      role: ea.role,
    }));
}
