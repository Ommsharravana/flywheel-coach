import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { RespondToRefinementInput } from '@/lib/types/problem-bank';

// PATCH /api/problems/[id]/refinements/[refinementId] - Respond to a refinement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; refinementId: string }> }
) {
  try {
    const { id, refinementId } = await params;
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

    const body: RespondToRefinementInput = await request.json();

    // Validate action
    const validActions = ['accept', 'reject', 'modify'];
    if (!body.action || !validActions.includes(body.action)) {
      return NextResponse.json({ error: 'Invalid action. Must be accept, reject, or modify' }, { status: 400 });
    }

    // Fetch the refinement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: refinement, error: fetchError } = await (supabase as any)
      .from('ai_refinements')
      .select('*')
      .eq('id', refinementId)
      .eq('problem_id', id)
      .single();

    if (fetchError || !refinement) {
      return NextResponse.json({ error: 'Refinement not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: body.action === 'accept' ? 'accepted' : body.action === 'reject' ? 'rejected' : 'modified',
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If modified, use the modified statement
    if (body.action === 'modify') {
      if (!body.modified_statement) {
        return NextResponse.json({ error: 'modified_statement is required for modify action' }, { status: 400 });
      }
      updateData.suggested_statement = body.modified_statement;
    }

    // Update the refinement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedRefinement, error: updateError } = await (supabase as any)
      .from('ai_refinements')
      .update(updateData)
      .eq('id', refinementId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating refinement:', updateError);
      return NextResponse.json(
        { error: 'Failed to update refinement', details: updateError.message },
        { status: 500 }
      );
    }

    // If accepted or modified, update the problem statement
    if (body.action === 'accept' || body.action === 'modify') {
      const newStatement = body.action === 'modify'
        ? body.modified_statement
        : refinement.suggested_statement;

      // First, record the evolution
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingEvolutions } = await (supabase as any)
        .from('problem_evolution')
        .select('version')
        .eq('problem_id', id)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingEvolutions && existingEvolutions.length > 0
        ? existingEvolutions[0].version + 1
        : 1;

      // Record in problem_evolution table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('problem_evolution')
        .insert({
          problem_id: id,
          version: nextVersion,
          previous_statement: refinement.original_statement,
          new_statement: newStatement,
          change_reason: `ai_refinement_${body.action}`,
          changed_by: user.id,
        });

      // Update the problem's problem_statement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('problem_bank')
        .update({
          problem_statement: newStatement,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({
      refinement: updatedRefinement,
      message: body.action === 'accept'
        ? 'Refinement accepted and problem statement updated'
        : body.action === 'modify'
        ? 'Refinement modified and problem statement updated'
        : 'Refinement rejected',
    });

  } catch (error) {
    console.error('Error in PATCH /api/problems/[id]/refinements/[refinementId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/problems/[id]/refinements/[refinementId] - Delete a refinement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; refinementId: string }> }
) {
  try {
    const { id, refinementId } = await params;
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

    // Delete the refinement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('ai_refinements')
      .delete()
      .eq('id', refinementId)
      .eq('problem_id', id);

    if (deleteError) {
      console.error('Error deleting refinement:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete refinement', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/problems/[id]/refinements/[refinementId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
