import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper to check if user is admin (superadmin or institution_admin)
async function isAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never): Promise<{
  isAdmin: boolean;
  role: string | null;
  institutionId: string | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, role: null, institutionId: null };

  const { data: profile } = await supabase
    .from('users')
    .select('role, institution_id')
    .eq('id', user.id)
    .single();

  const role = (profile as { role: string; institution_id: string | null } | null)?.role || null;
  const institutionId = (profile as { role: string; institution_id: string | null } | null)?.institution_id || null;

  return {
    isAdmin: role === 'superadmin' || role === 'institution_admin',
    role,
    institutionId,
  };
}

// GET /api/institution-change-requests - List change requests
export async function GET() {
  try {
    const supabase = await createClient();
    const adminCheck = await isAdmin(supabase);

    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build query based on role
    const query = supabase
      .from('admin_pending_change_requests')
      .select('*');

    // Institution admins can only see requests for their institution
    if (adminCheck.role === 'institution_admin' && adminCheck.institutionId) {
      // Filter by to_institution matching admin's institution
      // Note: This requires joining with the actual table since the view has to_institution name, not id
      const { data: requests, error } = await supabase
        .from('institution_change_requests')
        .select(`
          id,
          user_id,
          from_institution_id,
          to_institution_id,
          status,
          reason,
          created_at,
          users:user_id (email, name),
          from_institution:from_institution_id (name),
          to_institution:to_institution_id (name)
        `)
        .eq('status', 'pending')
        .eq('to_institution_id', adminCheck.institutionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching change requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
      }

      // Transform to match view format
      const transformed = (requests || []).map((r: Record<string, unknown>) => ({
        id: r.id,
        user_id: r.user_id,
        user_email: (r.users as { email: string } | null)?.email,
        user_name: (r.users as { name: string } | null)?.name,
        from_institution: (r.from_institution as { name: string } | null)?.name,
        to_institution: (r.to_institution as { name: string } | null)?.name,
        reason: r.reason,
        created_at: r.created_at,
      }));

      return NextResponse.json(transformed);
    }

    // Superadmins see all pending requests
    const { data: requests, error } = await supabase
      .from('admin_pending_change_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching change requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json(requests || []);
  } catch (error) {
    console.error('Error in GET /api/institution-change-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/institution-change-requests - Create a change request (user)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to_institution_id, reason } = body;

    if (!to_institution_id) {
      return NextResponse.json(
        { error: 'to_institution_id is required' },
        { status: 400 }
      );
    }

    // Get user's current institution
    const { data: profile } = await supabase
      .from('users')
      .select('institution_id')
      .eq('id', user.id)
      .single();

    const fromInstitutionId = (profile as { institution_id: string | null } | null)?.institution_id;

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from('institution_change_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending change request' },
        { status: 400 }
      );
    }

    // Create the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: changeRequest, error } = await (supabase as any)
      .from('institution_change_requests')
      .insert({
        user_id: user.id,
        from_institution_id: fromInstitutionId,
        to_institution_id,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating change request:', error);
      return NextResponse.json(
        { error: 'Failed to create change request' },
        { status: 500 }
      );
    }

    return NextResponse.json(changeRequest, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/institution-change-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/institution-change-requests - Approve/reject a request (admin)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminCheck = await isAdmin(supabase);

    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { request_id, action } = body;

    if (!request_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'request_id and action (approve/reject) are required' },
        { status: 400 }
      );
    }

    // Get the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: changeRequestData, error: fetchError } = await (supabase as any)
      .from('institution_change_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !changeRequestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const changeRequest = changeRequestData as {
      id: string;
      user_id: string;
      from_institution_id: string | null;
      to_institution_id: string;
      status: string;
      reason: string | null;
    };

    // Institution admins can only process requests for their institution
    if (adminCheck.role === 'institution_admin') {
      if (changeRequest.to_institution_id !== adminCheck.institutionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    // Update the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('institution_change_requests')
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    // If approved, update the user's institution
    if (action === 'approve') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: userUpdateError } = await (supabase as any)
        .from('users')
        .update({ institution_id: changeRequest.to_institution_id })
        .eq('id', changeRequest.user_id);

      if (userUpdateError) {
        console.error('Error updating user institution:', userUpdateError);
        // Note: Request is already marked approved, so we log but don't fail
      }
    }

    // Log admin activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user?.id,
      action: `${action}_institution_change`,
      entity_type: 'institution_change_request',
      entity_id: request_id,
      details: {
        user_id: changeRequest.user_id,
        from_institution_id: changeRequest.from_institution_id,
        to_institution_id: changeRequest.to_institution_id,
      },
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error in PATCH /api/institution-change-requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
