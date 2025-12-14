import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export default async function NewCyclePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Create a new cycle
  const cycleId = uuidv4();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('cycles') as any).insert({
    id: cycleId,
    user_id: user.id,
    name: 'New Flywheel Cycle',
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
