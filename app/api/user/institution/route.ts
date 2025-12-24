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

    // Check if user already has an institution set
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (supabase as any)
      .from('users')
      .select('id, institution_id')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle to avoid error when no row exists

    // If user already has an institution, don't allow change via this endpoint
    if (existingProfile?.institution_id) {
      return NextResponse.json(
        { error: 'You already have an institution. Contact admin to change it.' },
        { status: 400 }
      );
    }

    // Use UPSERT to handle both cases:
    // - User profile doesn't exist → Creates it
    // - User profile exists but no institution → Updates it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          institution_id,
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false // We want to update if exists
        }
      );

    if (upsertError) {
      console.error('Error setting institution (upsert):', upsertError);
      return NextResponse.json(
        { error: 'Failed to set institution', message: upsertError.message, code: upsertError.code },
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

    // Get user's institution using maybeSingle to handle non-existent profiles
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
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user institution:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch institution' },
        { status: 500 }
      );
    }

    // Profile might not exist yet for new users
    if (!profileData) {
      return NextResponse.json({
        institution_id: null,
        institution: null,
      });
    }

    return NextResponse.json({
      institution_id: profileData.institution_id,
      institution: profileData.institutions || null,
    });
  } catch (error) {
    console.error('Error in GET /api/user/institution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
