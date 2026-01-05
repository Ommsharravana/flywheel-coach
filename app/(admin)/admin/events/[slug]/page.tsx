import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import Link from 'next/link';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventAdminPage({ params }: EventAdminPageProps) {
  // DIAGNOSTIC: Minimal version to isolate error source
  // Step 1: Just auth checks + static content

  // Get params
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Create Supabase client
  const supabase = await createClient();

  // Get user ID
  const userId = await getEffectiveUserId();
  if (!userId) {
    redirect('/login');
  }

  // Get event
  const { data: eventData, error } = await supabase
    .from('events')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (error || !eventData) {
    redirect('/admin/events');
  }

  // Cast to expected type after validation
  const event = eventData as { id: string; name: string; slug: string };

  // Check admin access
  const { isAdmin, role } = await checkEventAdminAccess(userId, event.id);
  if (!isAdmin) {
    redirect('/admin/events');
  }

  // MINIMAL RENDER - no components, no complex logic
  return (
    <div style={{ padding: '24px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fafafa' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        {event.name} - Admin Dashboard
      </h1>
      <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>
        Role: {role || 'unknown'} | Event ID: {event.id}
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link
          href={`/admin/events/${slug}/submissions`}
          style={{ padding: '12px 24px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', textDecoration: 'none' }}
        >
          Submissions
        </Link>
        <Link
          href={`/admin/events/${slug}/builders`}
          style={{ padding: '12px 24px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', textDecoration: 'none' }}
        >
          Builders
        </Link>
        <Link
          href={`/admin/events/${slug}/demo-day`}
          style={{ padding: '12px 24px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', textDecoration: 'none' }}
        >
          Demo Day
        </Link>
        <Link
          href={`/admin/events/${slug}/settings`}
          style={{ padding: '12px 24px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', textDecoration: 'none' }}
        >
          Settings
        </Link>
      </div>
      <p style={{ marginTop: '24px', color: '#52525b', fontSize: '12px' }}>
        Diagnostic: Minimal page rendering test
      </p>
    </div>
  );
}
