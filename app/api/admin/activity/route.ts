import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// GET: Fetch activity logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const adminId = searchParams.get('admin_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const offset = (page - 1) * limit;

    // Build query (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('admin_activity_logs')
      .select(`
        *,
        admin:users!admin_activity_logs_admin_id_fkey (id, name, email)
      `, { count: 'exact' });

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (adminId) {
      query = query.eq('admin_id', adminId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Order by created_at descending and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }

    // Get distinct actions for filter dropdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actionsData } = await (supabase as any)
      .from('admin_activity_logs')
      .select('action')
      .limit(100);

    const distinctActions = [...new Set((actionsData || []).map((a: { action: string }) => a.action))];

    return NextResponse.json({
      logs: logs as unknown as ActivityLog[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: {
        availableActions: distinctActions,
        entityTypes: ['user', 'cycle', 'system'],
      },
    });
  } catch (error) {
    console.error('Error in activity logs GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
