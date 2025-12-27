import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface CycleNote {
  id: string;
  cycle_id: string;
  admin_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  admin?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// GET: Fetch all notes for a cycle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cycleId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    // Fetch notes with admin info (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notes, error } = await (supabase as any)
      .from('admin_cycle_notes')
      .select(`
        *,
        admin:users!admin_cycle_notes_admin_id_fkey (id, name, email)
      `)
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cycle notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({ notes: notes as unknown as CycleNote[] });
  } catch (error) {
    console.error('Error in cycle notes GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new note for a cycle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cycleId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    // Verify cycle exists
    const { data: cycle, error: cycleError } = await supabase
      .from('cycles')
      .select('id')
      .eq('id', cycleId)
      .single();

    if (cycleError || !cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Insert the note (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: note, error: insertError } = await (supabase as any)
      .from('admin_cycle_notes')
      .insert({
        cycle_id: cycleId,
        admin_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        admin:users!admin_cycle_notes_admin_id_fkey (id, name, email)
      `)
      .single();

    if (insertError) {
      console.error('Error inserting cycle note:', insertError);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    // Log the activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: 'cycle_note_added',
      entity_type: 'cycle',
      entity_id: cycleId,
      details: {
        note_id: note?.id,
        content_preview: content.trim().slice(0, 100),
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    return NextResponse.json({ note: note as unknown as CycleNote }, { status: 201 });
  } catch (error) {
    console.error('Error in cycle notes POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a specific note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cycleId } = await params;
    const supabase = await createClient();

    // Get note_id from query params
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    // Delete the note (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('admin_cycle_notes')
      .delete()
      .eq('id', noteId)
      .eq('cycle_id', cycleId);

    if (deleteError) {
      console.error('Error deleting cycle note:', deleteError);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    // Log the activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: 'cycle_note_deleted',
      entity_type: 'cycle',
      entity_id: cycleId,
      details: { note_id: noteId },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cycle notes DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
