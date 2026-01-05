import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

// Verify event exists
async function getEvent(slug: string) {
  try {
    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from('events')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[EventLayout] getEvent error:', error);
      return null;
    }

    return event;
  } catch (err) {
    console.error('[EventLayout] getEvent exception:', err);
    return null;
  }
}

export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  // Parent admin layout handles sidebar switching based on route
  // This layout just validates the event exists
  return <>{children}</>;
}
