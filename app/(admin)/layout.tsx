import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminCoachWrapper } from '@/components/admin/coach';
import { EventSidebar } from './admin/events/[slug]/_components/EventSidebar';

interface ProfileRow {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'builder' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';
  institution_id: string | null;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use RPC function (SECURITY DEFINER) to check role - same as middleware
  // This bypasses RLS to ensure consistent behavior
  let userRole: { role: string; institution_id: string } | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: roleData, error } = await (supabase as any).rpc('get_user_role', { user_id: user.id });
    if (error) {
      console.error('[AdminLayout] get_user_role RPC error:', error);
    } else {
      userRole = (roleData as { role: string; institution_id: string }[] | null)?.[0];
    }
  } catch (err) {
    console.error('[AdminLayout] get_user_role RPC exception:', err);
  }

  // Check admin role using RPC (bypasses RLS)
  // Simplified model: role='event_admin' grants global admin access
  const allowedRoles = ['superadmin', 'institution_admin', 'event_admin'];
  const hasAdminRole = userRole && allowedRoles.includes(userRole.role);

  if (!hasAdminRole) {
    redirect('/dashboard');
  }

  // Now fetch full profile for display purposes
  // If this fails due to RLS, we still have the role from RPC
  let profileData: ProfileRow | null = null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, email, avatar_url, role, institution_id')
      .eq('id', user.id)
      .single();
    if (error) {
      console.error('[AdminLayout] profile query error:', error);
    } else {
      profileData = data as unknown as ProfileRow;
    }
  } catch (err) {
    console.error('[AdminLayout] profile query exception:', err);
  }

  // Use profile data if available, otherwise construct from RPC + auth user
  const profile: ProfileRow = profileData ? (profileData as unknown as ProfileRow) : {
    name: user.user_metadata?.name || null,
    email: user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    role: (userRole?.role as ProfileRow['role']) || 'learner',
    institution_id: userRole?.institution_id || null,
  };

  // Check if we're on an event-specific route (e.g., /admin/events/appathon-2)
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Match pattern: /admin/events/[slug] where slug is NOT empty
  // /admin/events should show AdminSidebar
  // /admin/events/appathon-2 should show EventSidebar
  const eventRouteMatch = pathname.match(/^\/admin\/events\/([^/]+)/);
  const isEventRoute = eventRouteMatch && eventRouteMatch[1] !== '';
  const eventSlug = eventRouteMatch?.[1] || '';

  // Get event name and type if on event route
  let eventName = 'Event';
  let eventType = 'appathon';
  if (isEventRoute && eventSlug) {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('name, config')
        .eq('slug', eventSlug)
        .single();
      if (error) {
        console.error('[AdminLayout] event query error:', error);
      } else if (event) {
        eventName = (event as { name: string; config: { type?: string } | null }).name || 'Event';
        eventType = (event as { name: string; config: { type?: string } | null }).config?.type || 'appathon';
      }
    } catch (err) {
      console.error('[AdminLayout] event query exception:', err);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {isEventRoute ? (
        <EventSidebar slug={eventSlug} eventName={eventName} eventType={eventType} />
      ) : (
        <AdminSidebar />
      )}
      <div className="flex-1 flex flex-col">
        <AdminHeader
          user={user}
          profile={{
            name: profile.name,
            email: profile.email || user.email || '',
            avatarUrl: profile.avatar_url,
          }}
          userRole={profile.role}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      {/* Admin AI Coach - positioned above bug reporter button */}
      <AdminCoachWrapper />
    </div>
  );
}
