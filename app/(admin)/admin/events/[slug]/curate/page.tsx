import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Check, Plus } from 'lucide-react';
import Link from 'next/link';
import { ProblemCurationClient } from '@/components/admin/ProblemCurationClient';

interface CurateProblemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CurateProblemPage({ params }: CurateProblemPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const userId = await getEffectiveUserId();

  if (!userId) {
    redirect('/login');
  }

  // Get event by slug
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single() as { data: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    } | null; error: unknown };

  if (error || !event) {
    redirect('/admin/events');
  }

  // Check if user has admin access to this event
  const { isAdmin } = await checkEventAdminAccess(userId, event.id);

  if (!isAdmin) {
    redirect('/admin/events');
  }

  // Get count of curated problems
  const { count: curatedCount } = await supabase
    .from('event_problems')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id);

  // Get count of recommended problems
  const { count: recommendedCount } = await supabase
    .from('event_problems')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('is_recommended', true);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/events/${slug}`}>
            <Button variant="ghost" size="sm" className="text-stone-400">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Event
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-100">Curate Problems</h1>
            <p className="text-stone-400">
              Select problems from the global bank for {event.name}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-stone-100">{curatedCount || 0}</div>
                <p className="text-sm text-stone-500">Curated Problems</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-stone-100">{recommendedCount || 0}</div>
                <p className="text-sm text-stone-500">Recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 h-full flex items-center">
            <p className="text-sm text-stone-400">
              <span className="text-amber-400 font-medium">Recommended</span> problems are highlighted
              for participants, but they can choose any curated problem.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Problem Curation Table */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Global Problem Bank</CardTitle>
          <CardDescription>
            Browse approved problems and add them to your event. Toggle &quot;Recommended&quot; for problems you want to highlight.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProblemCurationClient eventId={event.id} userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
