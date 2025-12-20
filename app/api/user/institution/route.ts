import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/user/institution - Set user's institution (first-time or change)
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

    // Check if user already has an institution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileData } = await (supabase as any)
      .from('users')
      .select('institution_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as { institution_id: string | null } | null;

    // If user already has an institution, they need to use the change request flow
    if (profile?.institution_id) {
      return NextResponse.json(
        { error: 'You already have an institution. Use the change request flow to switch.' },
        { status: 400 }
      );
    }

    // Set the user's institution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ institution_id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error setting institution:', updateError);
      return NextResponse.json(
        { error: 'Failed to set institution' },
        { status: 500 }
      );
    }

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

    // Get user's institution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileData, error: profileError } = await (supabase as any)
      .from('users')
      .select(`
        institution_id,
        institutions:institution_id (
          id,
          slug,
          name,
          short_name,
          type
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user institution:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch institution' },
        { status: 500 }
      );
    }

    const profile = profileData as { institution_id: string | null; institutions: unknown } | null;

    return NextResponse.json({
      institution_id: profile?.institution_id,
      institution: profile?.institutions || null,
    });
  } catch (error) {
    console.error('Error in GET /api/user/institution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
