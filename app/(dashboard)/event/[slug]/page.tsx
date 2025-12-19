import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/supabase/effective-user';
import { redirect, notFound } from 'next/navigation';
import { Event } from '@/lib/events/types';

interface EventJoinPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventJoinPage({ params }: EventJoinPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const effectiveUser = await getEffectiveUser();

  if (!effectiveUser) {
    // Store the intended destination and redirect to login
    redirect(`/login?redirect=/event/${slug}`);
  }

  // Fetch the event by slug (using type assertion for events table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event, error } = await (supabase as any)
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !event) {
    notFound();
  }

  const typedEvent = event as unknown as Event;

  // Check if event is currently joinable (live or upcoming)
  const now = new Date();
  const endDate = new Date(typedEvent.end_date);

  if (now > endDate) {
    // Event has ended - redirect to dashboard with a message
    redirect('/dashboard?event_ended=true');
  }

  // Auto-join the user to this event (using type assertion)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('users')
    .update({
      active_event_id: typedEvent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', effectiveUser.id);

  if (updateError) {
    console.error('Failed to join event:', updateError);
    redirect('/dashboard?join_failed=true');
  }

  // Redirect to dashboard with success
  redirect('/dashboard?event_joined=' + typedEvent.slug);
}
