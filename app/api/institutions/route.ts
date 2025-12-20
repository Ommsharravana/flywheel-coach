import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Institution } from '@/lib/institutions/types';

// Helper to check if user is superadmin
async function isSuperAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile as { role: string } | null)?.role === 'superadmin';
}

// GET /api/institutions - List all active institutions (public)
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch active institutions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: institutions, error } = await (supabase as any)
      .from('institutions')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching institutions:', error);
      return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 });
    }

    return NextResponse.json(institutions as Institution[]);
  } catch (error) {
    console.error('Error in GET /api/institutions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/institutions - Create a new institution (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is superadmin
    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { slug, name, short_name, type } = body;

    // Validate required fields
    if (!slug || !name || !short_name) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, short_name' },
        { status: 400 }
      );
    }

    // Validate type
    if (type && !['college', 'school', 'external'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be college, school, or external' },
        { status: 400 }
      );
    }

    // Create the institution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: institution, error } = await (supabase as any)
      .from('institutions')
      .insert({
        slug,
        name,
        short_name,
        type: type || 'college',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An institution with this slug already exists' }, { status: 409 });
      }
      console.error('Error creating institution:', error);
      return NextResponse.json({ error: 'Failed to create institution' }, { status: 500 });
    }

    // Log admin activity
    const { data: { user } } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user?.id,
      action: 'create_institution',
      entity_type: 'institution',
      entity_id: (institution as Institution).id,
      details: { slug, name, short_name, type },
    });

    return NextResponse.json(institution, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/institutions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
