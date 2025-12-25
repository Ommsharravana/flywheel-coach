import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/user/institution - Set user's institution (first-time setup)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { institution_id } = body;

    if (!institution_id) {
      return NextResponse.json(
        { error: 'institution_id is required' },
        { status: 400 }
      );
    }

    // Verify the institution exists and is active
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: institution, error: instError } = await (supabase as any)
      .from('institutions')
      .select('id, name, short_name')
      .eq('id', institution_id)
      .eq('is_active', true)
      .single();

    if (instError || !institution) {
      return NextResponse.json(
        { error: 'Institution not found or inactive' },
        { status: 404 }
      );
    }

    // Use RPC function to set institution (bypasses RLS to avoid infinite recursion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: success, error: rpcError } = await (supabase as any)
      .rpc('set_user_institution', {
        p_user_id: user.id,
        p_institution_id: institution_id,
        p_email: user.email,
        p_name: user.user_metadata?.name || user.user_metadata?.full_name || null,
      });

    if (rpcError) {
      console.error('Error setting institution (RPC):', rpcError);

      // Check if it's the "already has institution" error
      if (rpcError.message?.includes('already has an institution')) {
        return NextResponse.json(
          { error: 'You already have an institution. Contact admin to change it.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to set institution', message: rpcError.message, code: rpcError.code },
        { status: 500 }
      );
    }

    console.log(`Institution ${institution.short_name} set for user ${user.id}`);

    return NextResponse.json({
      success: true,
      institution: {
        id: institution.id,
        name: institution.name,
        short_name: institution.short_name,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/user/institution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/user/institution - Get user's current institution
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's institution using RPC function (bypasses RLS to avoid infinite recursion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: institutionData, error: rpcError } = await (supabase as any)
      .rpc('get_user_institution', { p_user_id: user.id });

    if (rpcError) {
      console.error('Error fetching user institution:', rpcError);
      return NextResponse.json(
        { error: 'Failed to fetch institution' },
        { status: 500 }
      );
    }

    // RPC returns array, get first result
    const result = institutionData?.[0];

    // Profile might not exist yet for new users
    if (!result || !result.institution_id) {
      return NextResponse.json({
        institution_id: null,
        institution: null,
      });
    }

    return NextResponse.json({
      institution_id: result.institution_id,
      institution: {
        id: result.institution_id,
        slug: result.institution_slug,
        name: result.institution_name,
        short_name: result.institution_short_name,
        type: result.institution_type,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/institution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
