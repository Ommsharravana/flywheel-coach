import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface UnifiedNIFItem {
  source: 'application' | 'problem_bank';
  id: string;
  source_id: string;
  project_name: string;
  applicant_name: string | null;
  applicant_email: string | null;
  user_id: string | null;
  institution_short: string | null;
  stage: string;
  original_status: string;
  mentor_id: string | null;
  mentor_name: string | null;
  problem_statement: string | null;
  motivation: string | null;
  project_url: string | null;
  total_users: number | null;
  impact_score: number | null;
  jobs_created: number;
  revenue_generated: number;
  composite_score: number | null;
  created_at: string;
  activated_at: string | null;
  graduated_at: string | null;
  updated_at: string;
}

export interface UnifiedNIFStats {
  total: number;
  by_stage: Record<string, number>;
  by_source: Record<string, number>;
  startups: number;
  with_mentor: number;
  without_mentor: number;
  total_jobs: number;
  total_revenue: number;
}

// GET /api/nif-hub - Get unified NIF items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if superadmin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (userProfile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const source = searchParams.get('source');
    const mentorStatus = searchParams.get('mentor_status'); // 'all' | 'assigned' | 'unassigned'
    const search = searchParams.get('search');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Build query
    let query = supabase
      .from('unified_nif_items')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (stage && stage !== 'all') {
      query = query.eq('stage', stage);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    if (mentorStatus === 'assigned') {
      query = query.not('mentor_id', 'is', null);
    } else if (mentorStatus === 'unassigned') {
      query = query.is('mentor_id', null);
    }

    if (search) {
      query = query.or(`project_name.ilike.%${search}%,applicant_name.ilike.%${search}%,problem_statement.ilike.%${search}%`);
    }

    const { data: items, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching unified NIF items:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch items', details: fetchError.message },
        { status: 500 }
      );
    }

    let stats: UnifiedNIFStats | null = null;
    if (includeStats) {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_unified_nif_stats');

      if (!statsError && statsData) {
        stats = statsData as UnifiedNIFStats;
      }
    }

    return NextResponse.json({
      items: items || [],
      total: items?.length || 0,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/nif-hub:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/nif-hub - Update stage or assign mentor
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if superadmin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (userProfile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { item_id, source, action, stage, mentor_id } = body;

    if (!item_id || !source) {
      return NextResponse.json(
        { error: 'item_id and source are required' },
        { status: 400 }
      );
    }

    if (action === 'update_stage') {
      if (!stage) {
        return NextResponse.json(
          { error: 'stage is required for update_stage action' },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('update_unified_nif_stage', {
        p_item_id: item_id,
        p_source: source,
        p_new_stage: stage,
      });

      if (error) {
        console.error('Error updating stage:', error);
        return NextResponse.json(
          { error: 'Failed to update stage', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Stage updated' });
    }

    if (action === 'assign_mentor') {
      if (!mentor_id) {
        return NextResponse.json(
          { error: 'mentor_id is required for assign_mentor action' },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('assign_mentor_to_unified_item', {
        p_item_id: item_id,
        p_source: source,
        p_mentor_id: mentor_id,
      });

      if (error) {
        console.error('Error assigning mentor:', error);
        return NextResponse.json(
          { error: 'Failed to assign mentor', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Mentor assigned' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in PATCH /api/nif-hub:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/nif-hub - Soft delete an item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if superadmin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (userProfile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');
    const source = searchParams.get('source');

    if (!itemId || !source) {
      return NextResponse.json(
        { error: 'item_id and source are required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('soft_delete_unified_item', {
      p_item_id: itemId,
      p_source: source,
    });

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json(
        { error: 'Failed to delete item', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Item removed' });
  } catch (error) {
    console.error('Error in DELETE /api/nif-hub:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
