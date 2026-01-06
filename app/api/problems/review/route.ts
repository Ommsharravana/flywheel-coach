import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/problems/review - Get pending industry submissions for admin review
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['superadmin', 'event_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get pending industry submissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingSubmissions, error: fetchError } = await (supabase as any)
      .from('problem_bank')
      .select(`
        id,
        title,
        problem_statement,
        theme,
        severity_rating,
        who_affected,
        when_occurs,
        where_occurs,
        current_workaround,
        industry_partner_name,
        industry_partner_email,
        industry_partner_company,
        industry_partner_phone,
        budget_amount,
        budget_currency,
        created_at
      `)
      .eq('source_type', 'industry')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching pending submissions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    return NextResponse.json({
      submissions: pendingSubmissions || [],
      count: pendingSubmissions?.length || 0,
    });

  } catch (error) {
    console.error('Error in GET /api/problems/review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/problems/review - Approve or reject an industry submission
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['superadmin', 'event_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { problem_id, action, notes } = body;

    if (!problem_id || !action) {
      return NextResponse.json(
        { error: 'Problem ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approve or reject' },
        { status: 400 }
      );
    }

    // Update the problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedProblem, error: updateError } = await (supabase as any)
      .from('problem_bank')
      .update({
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        metadata: {
          reviewed_by: user.id,
          reviewed_by_name: userProfile.name,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', problem_id)
      .eq('source_type', 'industry')
      .eq('approval_status', 'pending')
      .select()
      .single();

    if (updateError || !updatedProblem) {
      console.error('Error updating problem:', updateError);
      return NextResponse.json(
        { error: 'Failed to update problem. It may not exist or already be reviewed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      problem_id,
      message: `Problem ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });

  } catch (error) {
    console.error('Error in POST /api/problems/review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
