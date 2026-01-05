import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventAdminPage({ params }: EventAdminPageProps) {
  // Step 1: Get params
  let slug: string;
  try {
    const resolvedParams = await params;
    slug = resolvedParams.slug;
    console.log('[MINIMAL] Step 1 passed: slug =', slug);
  } catch (err) {
    console.error('[MINIMAL] Step 1 FAILED: params error:', err);
    redirect('/admin/events');
  }

  // Step 2: Create Supabase client
  let supabase;
  try {
    supabase = await createClient();
    console.log('[MINIMAL] Step 2 passed: supabase client created');
  } catch (err) {
    console.error('[MINIMAL] Step 2 FAILED: createClient error:', err);
    redirect('/admin/events');
  }

  // Step 3: Get user ID
  let userId: string | null = null;
  try {
    userId = await getEffectiveUserId();
    console.log('[MINIMAL] Step 3 passed: userId =', userId);
  } catch (err) {
    console.error('[MINIMAL] Step 3 FAILED: getEffectiveUserId error:', err);
    redirect('/login');
  }

  if (!userId) {
    console.log('[MINIMAL] Step 3b: No userId, redirecting to login');
    redirect('/login');
  }

  // Step 4: Get event
  let event: { id: string; name: string; slug: string } | null = null;
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[MINIMAL] Step 4 FAILED: event fetch error:', error);
      redirect('/admin/events');
    }
    event = data as { id: string; name: string; slug: string } | null;
    console.log('[MINIMAL] Step 4 passed: event =', event?.name);
  } catch (err) {
    console.error('[MINIMAL] Step 4 FAILED: event query exception:', err);
    redirect('/admin/events');
  }

  if (!event) {
    console.log('[MINIMAL] Step 4b: No event found, redirecting');
    redirect('/admin/events');
  }

  // Step 5: Check admin access
  let isAdmin = false;
  let role: string | null = null;
  try {
    const accessResult = await checkEventAdminAccess(userId, event.id);
    isAdmin = accessResult.isAdmin;
    role = accessResult.role;
    console.log('[MINIMAL] Step 5 passed: isAdmin =', isAdmin, 'role =', role);
  } catch (err) {
    console.error('[MINIMAL] Step 5 FAILED: checkEventAdminAccess error:', err);
    redirect('/admin/events');
  }

  if (!isAdmin) {
    console.log('[MINIMAL] Step 5b: Not admin, redirecting');
    redirect('/admin/events');
  }

  // Step 6: Render minimal JSX
  console.log('[MINIMAL] Step 6: Starting JSX render');

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-4">
        MINIMAL TEST PAGE
      </h1>
      <div className="space-y-2 text-zinc-300">
        <p><strong>Event:</strong> {String(event.name)}</p>
        <p><strong>Slug:</strong> {String(event.slug)}</p>
        <p><strong>Event ID:</strong> {String(event.id)}</p>
        <p><strong>User ID:</strong> {String(userId)}</p>
        <p><strong>Role:</strong> {String(role)}</p>
        <p><strong>Is Admin:</strong> {String(isAdmin)}</p>
      </div>
      <div className="mt-4 p-4 bg-green-900/30 border border-green-500/30 rounded">
        <p className="text-green-400">If you see this, the minimal page works!</p>
      </div>
    </div>
  );
}
