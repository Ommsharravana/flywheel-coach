import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { v4 as uuidv4 } from 'uuid';

export default async function NewCyclePage() {
  const supabase = await createClient();

  // Get effective user ID (respects impersonation)
  const effectiveUserId = await getEffectiveUserId();

  if (!effectiveUserId) {
    redirect('/login');
  }

  // Check if user has an institution (required for cycle creation, except superadmins)
  // Also get active_event_id for linking cycles to events
  // Use RPC function to bypass RLS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .rpc('get_user_profile', { p_user_id: effectiveUserId });

  const profile = (profileData as { role: string; institution_id: string | null; active_event_id: string | null }[] | null)?.[0] || null;

  // REQUIRED: Must have an active event to create a cycle
  // Users should join an event from the event page first
  if (!profile?.active_event_id) {
    redirect('/dashboard?no_event=true');
  }

  const needsInstitution = !profile?.institution_id && profile?.role !== 'superadmin';

  if (needsInstitution) {
    // Redirect to institution selection with a message
    redirect('/select-institution?reason=cycle_creation');
  }

  // Create a new cycle for the effective user
  const cycleId = uuidv4();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cycles') as any).insert({
    id: cycleId,
    user_id: effectiveUserId,
    name: 'New Cycle',
    status: 'active',
    current_step: 1,
    event_id: profile.active_event_id, // Required - validated above
  });

  if (error) {
    console.error('Error creating cycle:', error);
    // Still redirect but log the error
  }

  // Redirect to step 1 of the new cycle
  redirect(`/cycle/${cycleId}/step/1`);
}
