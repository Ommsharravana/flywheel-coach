import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/supabase/effective-user';
import { redirect } from 'next/navigation';
import { VoteClient } from './VoteClient';

export const metadata = {
  title: 'Audience Voting | JKKN Solution Studio',
  description: 'Vote for your favorite demos at Appathon 2.0 Demo Day',
};

export default async function VotePage() {
  const supabase = await createClient();

  // Get effective user (respects impersonation)
  const effectiveUser = await getEffectiveUser();

  if (!effectiveUser) {
    redirect('/login');
  }

  // Get user name from profile using RPC (bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .rpc('get_user_profile', { p_user_id: effectiveUser.id });

  const userName = (profileData as { name: string }[] | null)?.[0]?.name || effectiveUser.name || null;

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      <VoteClient
        userId={effectiveUser.id}
        userName={userName}
      />
    </div>
  );
}
