import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/institution-change-requests/my-request - Get user's pending request
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's pending change request with institution name
    const { data: requestData, error } = await supabase
      .from('institution_change_requests')
      .select(`
        id,
        status,
        reason,
        created_at,
        to_institution:to_institution_id (name, short_name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected when no pending request
      console.error('Error fetching request:', error);
      return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
    }

    if (!requestData) {
      return NextResponse.json(null);
    }

    const request = requestData as unknown as {
      id: string;
      status: string;
      reason: string | null;
      created_at: string;
      to_institution: { name: string; short_name: string } | null;
    };

    // Transform to include institution name
    const transformed = {
      id: request.id,
      status: request.status,
      reason: request.reason,
      created_at: request.created_at,
      to_institution: request.to_institution?.short_name,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error in GET /api/institution-change-requests/my-request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
