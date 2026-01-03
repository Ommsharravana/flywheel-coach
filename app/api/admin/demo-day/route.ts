import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getDemoDayState } from '@/lib/admin/demo-day/services';

// GET: Get full demo day state
export async function GET() {
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

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const state = await getDemoDayState(supabase);

    return NextResponse.json({ data: state });
  } catch (error) {
    console.error('Error in demo-day GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
