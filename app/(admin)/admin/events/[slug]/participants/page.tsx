import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Search,
  Users,
  Mail,
  Building2,
  Target,
  Download,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ParticipantsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function EventParticipantsPage({ params, searchParams }: ParticipantsPageProps) {
  const { slug } = await params;
  const { search = '', page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10);
  const perPage = 25;

  const supabase = await createClient();
  const userId = await getEffectiveUserId();

  if (!userId) {
    redirect('/login');
  }

  // Get event by slug
  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, slug')
    .eq('slug', slug)
    .single() as { data: { id: string; name: string; slug: string } | null; error: unknown };

  if (error || !event) {
    redirect('/admin/events');
  }

  // Check admin access
  const { isAdmin } = await checkEventAdminAccess(userId, event.id);
  if (!isAdmin) {
    redirect('/admin/events');
  }

  // Build query for participants
  let query = supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      role,
      created_at,
      institutions (id, name, short_name),
      cycles!cycles_user_id_fkey (id, current_step, status, event_id)
    `, { count: 'exact' })
    .eq('active_event_id', event.id)
    .order('created_at', { ascending: false });

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Pagination
  const from = (currentPage - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data: participants, count, error: participantsError } = await query as {
    data: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: string;
      institutions: { id: string; name: string; short_name: string } | null;
      cycles: Array<{ id: string; current_step: number; status: string; event_id: string | null }>;
    }> | null;
    count: number | null;
    error: unknown;
  };

  const totalPages = count ? Math.ceil(count / perPage) : 1;

  // Calculate stats
  const participantStats = (participants || []).reduce(
    (acc, p) => {
      const eventCycles = p.cycles.filter(c => c.event_id === event.id);
      acc.totalCycles += eventCycles.length;
      acc.completedCycles += eventCycles.filter(c => c.current_step >= 7).length;
      return acc;
    },
    { totalCycles: 0, completedCycles: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/admin/events/${slug}`}
            className="inline-flex items-center text-stone-400 hover:text-stone-200 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {event.name}
          </Link>
          <h1 className="text-2xl font-bold text-stone-100">Participants</h1>
          <p className="text-stone-400">
            {count || 0} participants registered for {event.name}
          </p>
        </div>
        <Button variant="outline" className="border-stone-700">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-stone-100">{count || 0}</div>
                <p className="text-sm text-stone-500">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-amber-400" />
              <div>
                <div className="text-2xl font-bold text-stone-100">{participantStats.totalCycles}</div>
                <p className="text-sm text-stone-500">Total Cycles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-stone-100">{participantStats.completedCycles}</div>
                <p className="text-sm text-stone-500">Completed Cycles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                name="search"
                placeholder="Search by name or email..."
                defaultValue={search}
                className="pl-9 bg-stone-800 border-stone-700"
              />
            </div>
            <Button type="submit" variant="outline" className="border-stone-700">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">All Participants</CardTitle>
          <CardDescription>Showing page {currentPage} of {totalPages}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-stone-700">
                <TableHead className="text-stone-400">Name</TableHead>
                <TableHead className="text-stone-400">Institution</TableHead>
                <TableHead className="text-stone-400">Cycles</TableHead>
                <TableHead className="text-stone-400">Joined</TableHead>
                <TableHead className="text-stone-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants && participants.length > 0 ? (
                participants.map((participant) => {
                  const eventCycles = participant.cycles.filter(c => c.event_id === event.id);
                  const completedCount = eventCycles.filter(c => c.current_step >= 7).length;

                  return (
                    <TableRow key={participant.id} className="border-stone-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-stone-100">{participant.name}</div>
                          <div className="text-xs text-stone-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {participant.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {participant.institutions ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-stone-500" />
                            <span className="text-stone-300">{participant.institutions.short_name}</span>
                          </div>
                        ) : (
                          <span className="text-stone-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                            {eventCycles.length} total
                          </Badge>
                          {completedCount > 0 && (
                            <Badge variant="outline" className="text-green-400 border-green-500/30">
                              {completedCount} completed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-stone-400">
                        {new Date(participant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/users/${participant.id}`}>
                          <Button variant="ghost" size="sm" className="text-stone-400">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-stone-500">
                    {search ? 'No participants match your search' : 'No participants yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-700">
              <p className="text-sm text-stone-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link href={`/admin/events/${slug}/participants?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}>
                    <Button variant="outline" size="sm" className="border-stone-700">
                      Previous
                    </Button>
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link href={`/admin/events/${slug}/participants?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}>
                    <Button variant="outline" size="sm" className="border-stone-700">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
