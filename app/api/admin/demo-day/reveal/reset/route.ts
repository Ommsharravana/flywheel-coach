import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resetReveal } from '@/lib/admin/demo-day/reveal-state';

// POST: Reset reveal state (emergency)
export async function POST() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc(
      'get_current_user_role'
    );

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin only' },
        { status: 403 }
      );
    }

    const newState = await resetReveal(supabase);

    return NextResponse.json({ success: true, state: newState });
  } catch (error) {
    console.error('Error in reveal reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
