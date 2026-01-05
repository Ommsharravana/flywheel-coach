import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventAdminPage({ params }: EventAdminPageProps) {
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

  // Cast to known type
  const event = eventData as { id: string; name: string; slug: string };

  // Check admin access
  const { isAdmin, role } = await checkEventAdminAccess(userId, event.id);
  if (!isAdmin) {
    redirect('/admin/events');
  }

  // ULTRA MINIMAL - just text, no components
  return (
    <div style={{ padding: '40px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>ULTRA MINIMAL TEST v2</h1>
      <p><strong>Event:</strong> {event.name}</p>
      <p><strong>Slug:</strong> {event.slug}</p>
      <p><strong>Event ID:</strong> {event.id}</p>
      <p><strong>User ID:</strong> {userId}</p>
      <p><strong>Role:</strong> {role}</p>
      <p><strong>Is Admin:</strong> {String(isAdmin)}</p>
      <p style={{ marginTop: '20px', color: '#22c55e' }}>If you see this, the ultra minimal page works!</p>
    </div>
  );
}
