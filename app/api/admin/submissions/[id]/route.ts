import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/submissions/[id] - Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get the submission with related data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submission, error } = await (supabase as any)
    .from('appathon_submissions')
    .select(`
      *,
      institution:institutions(name, short_name),
      reviewer:users!appathon_submissions_reviewed_by_fkey(name, email),
      cycle:cycles(name, current_step)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Submission not found or access denied' }, { status: 404 });
    }
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission });
}

// PATCH /api/admin/submissions/[id] - Update submission review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { status, score, review_notes } = body;

  // Validate score if provided
  if (score !== undefined && (score < 0 || score > 5)) {
    return NextResponse.json({ error: 'Score must be between 0 and 5' }, { status: 400 });
  }

  // Validate status if provided
  const validStatuses = ['draft', 'submitted', 'under_review', 'shortlisted', 'winner', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Use RPC to update (handles access check internally)
  // Pass caller_user_id explicitly for Server Component auth compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any).rpc('update_submission_review', {
    submission_id: id,
    new_status: status || null,
    new_score: score !== undefined ? score : null,
    new_review_notes: review_notes || null,
    caller_user_id: user.id
  });

  if (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (result?.error) {
    if (result.error === 'Access denied') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('admin_activity_logs').insert({
    admin_id: user.id,
    action: 'review_submission',
    entity_type: 'submission',
    entity_id: id,
    details: { status, score, review_notes: review_notes ? 'Updated' : undefined },
  }).catch(() => {
    // Ignore logging errors
  });

  return NextResponse.json({ success: true, submission: result?.submission });
}
