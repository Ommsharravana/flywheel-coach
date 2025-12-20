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

// GET /api/institutions/[id] - Get institution details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: institution, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    return NextResponse.json(institution as Institution);
  } catch (error) {
    console.error('Error in GET /api/institutions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/institutions/[id] - Update institution (superadmin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is superadmin
    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, short_name, slug, type, is_active } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (short_name !== undefined) updates.short_name = short_name;
    if (slug !== undefined) updates.slug = slug;
    if (type !== undefined) {
      if (!['college', 'school', 'external'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be college, school, or external' },
          { status: 400 }
        );
      }
      updates.type = type;
    }
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: institution, error } = await (supabase as any)
      .from('institutions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An institution with this slug already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating institution:', error);
      return NextResponse.json({ error: 'Failed to update institution' }, { status: 500 });
    }

    // Log admin activity
    const { data: { user } } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user?.id,
      action: 'update_institution',
      entity_type: 'institution',
      entity_id: id,
      details: updates,
    });

    return NextResponse.json(institution);
  } catch (error) {
    console.error('Error in PATCH /api/institutions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/institutions/[id] - Soft delete institution (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is superadmin
    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if there are users in this institution
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete institution with ${count} users. Reassign or remove users first.` },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: institution, error } = await (supabase as any)
      .from('institutions')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting institution:', error);
      return NextResponse.json({ error: 'Failed to delete institution' }, { status: 500 });
    }

    // Log admin activity
    const { data: { user } } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user?.id,
      action: 'delete_institution',
      entity_type: 'institution',
      entity_id: id,
      details: { soft_delete: true },
    });

    return NextResponse.json({ success: true, institution });
  } catch (error) {
    console.error('Error in DELETE /api/institutions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
