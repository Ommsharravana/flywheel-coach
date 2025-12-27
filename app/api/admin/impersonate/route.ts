import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const IMPERSONATION_COOKIE = 'flywheel_impersonation';
const MAX_IMPERSONATION_HOURS = 4;

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// POST: Start impersonation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: roleData } = await (supabase as any).rpc('get_user_role', { user_id: user.id });
    const adminRole = (roleData as { role: string }[] | null)?.[0]?.role;

    if (adminRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, reason } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    // Get admin user details using RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adminInfoData } = await (supabase as any).rpc('get_user_for_impersonation', {
      caller_user_id: user.id,
      target_user_id: user.id
    });
    const adminData = (adminInfoData as UserRow[] | null)?.[0] || { id: user.id, email: user.email || '', name: null, role: 'superadmin' };

    // Get target user using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetUserData } = await (supabase as any).rpc('get_user_for_impersonation', {
      caller_user_id: user.id,
      target_user_id: targetUserId
    });

    const targetUser = (targetUserData as UserRow[] | null)?.[0];
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Cannot impersonate other superadmins
    if (targetUser.role === 'superadmin') {
      return NextResponse.json({ error: 'Cannot impersonate other superadmins' }, { status: 403 });
    }

    // Calculate expiration (4 hours max)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + MAX_IMPERSONATION_HOURS);

    // Log impersonation start (using type assertion for new tables)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('impersonation_logs').insert({
      admin_id: user.id,
      target_user_id: targetUserId,
      action: 'start',
      reason: reason || null,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    // Log to activity logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: 'impersonation_started',
      entity_type: 'user',
      entity_id: targetUserId,
      details: {
        target_email: targetUser.email,
        target_name: targetUser.name,
        reason,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Create impersonation session data
    const sessionData = {
      adminId: user.id,
      adminEmail: adminData.email,
      adminName: adminData.name,
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      startedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Set impersonation cookie
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: `Now impersonating ${targetUser.name || targetUser.email}`,
      session: {
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
        },
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 });
  }
}

// DELETE: End impersonation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    // Get impersonation session
    const sessionCookie = cookieStore.get(IMPERSONATION_COOKIE);
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No active impersonation session' }, { status: 400 });
    }

    const session = JSON.parse(sessionCookie.value);

    // Get current user (the admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Log impersonation end (using type assertion for new tables)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('impersonation_logs').insert({
      admin_id: session.adminId,
      target_user_id: session.targetUserId,
      action: 'end',
      reason: 'Session ended by admin',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    // Log to activity logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: session.adminId,
      action: 'impersonation_ended',
      entity_type: 'user',
      entity_id: session.targetUserId,
      details: {
        target_email: session.targetEmail,
        duration_minutes: Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000),
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Clear impersonation cookie
    cookieStore.delete(IMPERSONATION_COOKIE);

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended',
    });
  } catch (error) {
    console.error('End impersonation error:', error);
    return NextResponse.json({ error: 'Failed to end impersonation' }, { status: 500 });
  }
}

// GET: Check impersonation status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(IMPERSONATION_COOKIE);

    if (!sessionCookie) {
      return NextResponse.json({
        isImpersonating: false,
      });
    }

    const session = JSON.parse(sessionCookie.value);

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      cookieStore.delete(IMPERSONATION_COOKIE);
      return NextResponse.json({
        isImpersonating: false,
        expired: true,
      });
    }

    return NextResponse.json({
      isImpersonating: true,
      admin: {
        id: session.adminId,
        email: session.adminEmail,
        name: session.adminName,
      },
      targetUser: {
        id: session.targetUserId,
        email: session.targetEmail,
        name: session.targetName,
      },
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Check impersonation error:', error);
    return NextResponse.json({ isImpersonating: false });
  }
}
