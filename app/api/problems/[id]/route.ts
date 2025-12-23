import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/problems/[id] - Get single problem (superadmin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((userProfile as { role: string } | null)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - superadmin only' }, { status: 403 });
    }

    // Fetch the problem with related data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem, error: queryError } = await (supabase as any)
      .from('problem_bank')
      .select(`
        *,
        institutions!problem_bank_institution_id_fkey (id, name, short_name),
        submitter:users!problem_bank_submitted_by_fkey (id, name, email)
      `)
      .eq('id', id)
      .single();

    if (queryError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Fetch evidence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: evidence } = await (supabase as any)
      .from('problem_evidence')
      .select('*')
      .eq('problem_id', id)
      .order('created_at', { ascending: false });

    // Fetch attempts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attempts } = await (supabase as any)
      .from('problem_attempts')
      .select('*')
      .eq('problem_id', id)
      .order('started_at', { ascending: false });

    // Fetch tags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tags } = await (supabase as any)
      .from('problem_tags')
      .select('*')
      .eq('problem_id', id);

    // Build response
    const response = {
      ...problem,
      institution: problem.institutions || null,
      evidence: evidence || [],
      attempts: attempts || [],
      tags: tags || [],
      attempt_count: attempts?.length || 0,
      successful_attempts: (attempts || []).filter(
        (a: { outcome: string }) => a.outcome === 'success' || a.outcome === 'deployed'
      ).length,
    };

    // Clean up nested data
    delete response.institutions;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/problems/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/problems/[id] - Update problem (superadmin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((userProfile as { role: string } | null)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - superadmin only' }, { status: 403 });
    }

    const body = await request.json();

    // Update the problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .from('problem_bank')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating problem:', updateError);
      return NextResponse.json(
        { error: 'Failed to update problem', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);

  } catch (error) {
    console.error('Error in PATCH /api/problems/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/problems/[id] - Delete problem (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((userProfile as { role: string } | null)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - superadmin only' }, { status: 403 });
    }

    // Delete the problem (cascades to evidence, attempts, tags)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('problem_bank')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting problem:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete problem', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/problems/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
