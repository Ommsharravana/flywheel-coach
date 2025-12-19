import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Event } from '@/lib/events/types';

// Helper to check if user is superadmin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isSuperAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile as { role: string } | null)?.role === 'superadmin';
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/events/[id] - Get single event
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Using type assertion for events table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get participant count (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('active_event_id', id);

    return NextResponse.json({
      ...(event as Event),
      participant_count: count || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/events/[id] - Update event (superadmin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _ca, created_by: _cb, ...updateData } = body;

    // Add updated_at
    updateData.updated_at = new Date().toISOString();

    // Using type assertion for events table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error } = await (supabase as any)
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An event with this slug already exists' }, { status: 409 });
      }
      console.error('Error updating event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    // Log admin activity (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user?.id,
      action: 'update_event',
      entity_type: 'event',
      entity_id: id,
      details: { updated_fields: Object.keys(updateData) },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error in PATCH /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete event (superadmin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Get event details before deletion for logging (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventData } = await (supabase as any)
      .from('events')
      .select('name, slug')
      .eq('id', id)
      .single();

    const event = eventData as { name: string; slug: string } | null;

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // First, clear active_event_id for any users in this event (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('users')
      .update({ active_event_id: null })
      .eq('active_event_id', id);

    // Delete the event (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    // Log admin activity (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user?.id,
      action: 'delete_event',
      entity_type: 'event',
      entity_id: id,
      details: { name: event.name, slug: event.slug },
    });

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
