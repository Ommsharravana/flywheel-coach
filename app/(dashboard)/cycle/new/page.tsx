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
  // Use RPC function to bypass RLS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .rpc('get_user_role', { user_id: effectiveUserId });

  const profile = (roleData as { role: string; institution_id: string | null }[] | null)?.[0] || null;
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
  });

  if (error) {
    console.error('Error creating cycle:', error);
    // Still redirect but log the error
  }

  // Redirect to step 1 of the new cycle
  redirect(`/cycle/${cycleId}/step/1`);
}
