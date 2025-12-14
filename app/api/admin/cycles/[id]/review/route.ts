import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface UserRoleRow {
  role: string;
}

interface CycleReview {
  id: string;
  cycle_id: string;
  status: 'pending' | 'in_review' | 'approved' | 'needs_revision' | 'flagged';
  reviewed_by: string | null;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// GET: Get review status for a cycle
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

    // Verify superadmin role
    const { data: adminDataRaw } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminData = adminDataRaw as unknown as UserRoleRow | null;
    if (!adminData || adminData.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    // Fetch review status (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: review, error } = await (supabase as any)
      .from('cycle_reviews')
      .select(`
        *,
        reviewer:users!cycle_reviews_reviewed_by_fkey (id, name, email)
      `)
      .eq('cycle_id', cycleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found", which is ok
      console.error('Error fetching cycle review:', error);
      return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
    }

    // Return null if no review exists
    return NextResponse.json({ review: review as unknown as CycleReview | null });
  } catch (error) {
    console.error('Error in cycle review GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update or create review status
export async function PUT(
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

    // Verify superadmin role
    const { data: adminDataRaw } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminData = adminDataRaw as unknown as UserRoleRow | null;
    if (!adminData || adminData.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { status, notes } = body;

    const validStatuses = ['pending', 'in_review', 'approved', 'needs_revision', 'flagged'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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

    // Check if review already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingReview } = await (supabase as any)
      .from('cycle_reviews')
      .select('id')
      .eq('cycle_id', cycleId)
      .single();

    let review;
    let isNew = false;

    if (existingReview) {
      // Update existing review
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error: updateError } = await (supabase as any)
        .from('cycle_reviews')
        .update({
          status,
          notes: notes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('cycle_id', cycleId)
        .select(`
          *,
          reviewer:users!cycle_reviews_reviewed_by_fkey (id, name, email)
        `)
        .single();

      if (updateError) {
        console.error('Error updating cycle review:', updateError);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
      }
      review = updated;
    } else {
      // Insert new review
      isNew = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: insertError } = await (supabase as any)
        .from('cycle_reviews')
        .insert({
          cycle_id: cycleId,
          status,
          notes: notes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .select(`
          *,
          reviewer:users!cycle_reviews_reviewed_by_fkey (id, name, email)
        `)
        .single();

      if (insertError) {
        console.error('Error inserting cycle review:', insertError);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
      }
      review = inserted;
    }

    // Log the activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: isNew ? 'cycle_review_created' : 'cycle_review_updated',
      entity_type: 'cycle',
      entity_id: cycleId,
      details: {
        status,
        notes: notes?.slice(0, 100),
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    return NextResponse.json({ review: review as unknown as CycleReview }, { status: isNew ? 201 : 200 });
  } catch (error) {
    console.error('Error in cycle review PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
