import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  Download,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { SubmissionsTableClient } from './SubmissionsTableClient';

// Force dynamic rendering to ensure pagination works correctly
export const dynamic = 'force-dynamic';

interface SubmissionsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; status?: string; category?: string; institution?: string; page?: string }>;
}

interface Submission {
  id: string;
  team_name: string;
  app_name: string;
  category: string | null;
  status: string;
  submission_number: string | null;
  institution_name: string | null;
  institution_short_name: string | null;
  score: number | null;
  submitted_at: string | null;
  created_at: string;
  applicant_name: string | null;
  live_url: string | null;
}

export default async function EventSubmissionsPage({ params, searchParams }: SubmissionsPageProps) {
  const { slug } = await params;
  const { search = '', status = '', category = '', institution = '', page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10);
  const perPage = 20;

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

  // Fetch institutions for the filter dropdown
  const { data: institutions } = await supabase
    .from('institutions')
    .select('id, name, short_name')
    .order('name') as { data: Array<{ id: string; name: string; short_name: string | null }> | null };

  // Fetch submissions using RPC (pass explicit userId for Server Component compatibility)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allSubmissions, error: submissionsError } = await (supabase as any).rpc('get_event_submissions', {
    target_event_id: event.id,
    caller_user_id: userId
  }) as { data: Submission[] | null; error: unknown };

  if (submissionsError) {
    console.error('Error fetching submissions:', submissionsError);
  }

  // Apply client-side filtering
  let submissions = allSubmissions || [];

  if (search) {
    const searchLower = search.toLowerCase();
    submissions = submissions.filter(s =>
      s.team_name?.toLowerCase().includes(searchLower) ||
      s.app_name?.toLowerCase().includes(searchLower) ||
      s.applicant_name?.toLowerCase().includes(searchLower) ||
      s.submission_number?.toLowerCase().includes(searchLower)
    );
  }

  if (status) {
    submissions = submissions.filter(s => s.status === status);
  }

  if (category) {
    submissions = submissions.filter(s => s.category === category);
  }

  if (institution) {
    submissions = submissions.filter(s => s.institution_short_name === institution);
  }

  // Calculate stats from all submissions (before filtering)
  const stats = (allSubmissions || []).reduce(
    (acc, s) => {
      acc.total++;
      if (s.status === 'submitted') acc.submitted++;
      if (s.status === 'under_review') acc.underReview++;
      if (s.status === 'shortlisted') acc.shortlisted++;
      if (s.status === 'winner') acc.winners++;
      if (s.status === 'rejected') acc.rejected++;
      if (s.status === 'draft') acc.drafts++;
      return acc;
    },
    { total: 0, submitted: 0, underReview: 0, shortlisted: 0, winners: 0, rejected: 0, drafts: 0 }
  );

  // Pagination
  const totalCount = submissions.length;
  const totalPages = Math.ceil(totalCount / perPage);
  const from = (currentPage - 1) * perPage;
  const paginatedSubmissions = submissions.slice(from, from + perPage);

  // Build query string for filters
  const buildQueryString = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const values = { search, status, category, institution, page: '1', ...overrides };
    Object.entries(values).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return params.toString() ? `?${params.toString()}` : '';
  };

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
          <h1 className="text-2xl font-bold text-stone-100">Submissions</h1>
          <p className="text-stone-400">
            {stats.total} submissions for {event.name}
          </p>
        </div>
        <Button variant="outline" className="border-stone-700">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3 lg:grid-cols-6">
        <Card className="bg-stone-800 border-stone-700">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-stone-100">{stats.total}</div>
              <p className="text-xs text-stone-400">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-800 border-stone-700">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">{stats.submitted}</div>
              <p className="text-xs text-stone-400">Submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-800 border-stone-700">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400">{stats.underReview}</div>
              <p className="text-xs text-stone-400">Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-800 border-stone-700">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">{stats.shortlisted}</div>
              <p className="text-xs text-stone-400">Shortlisted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-800 border-stone-700">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{stats.winners}</div>
              <p className="text-xs text-stone-400">Winners</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-800 border-stone-700">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-stone-400">{stats.drafts}</div>
              <p className="text-xs text-stone-400">Drafts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <form className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                name="search"
                placeholder="Search by team, app, or submission #..."
                defaultValue={search}
                className="pl-9 bg-stone-800 border-stone-700"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="winner">Winner</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
            <select
              name="category"
              defaultValue={category}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="operations">Operations</option>
              <option value="productivity">Productivity</option>
              <option value="other">Other</option>
            </select>
            <select
              name="institution"
              defaultValue={institution}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Institutions</option>
              {institutions?.map((inst) => (
                <option key={inst.id} value={inst.short_name || inst.name}>
                  {inst.short_name || inst.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="border-stone-700">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            {(search || status || category || institution) && (
              <Link href={`/admin/events/${slug}/submissions`}>
                <Button variant="ghost" className="text-stone-400">
                  Clear
                </Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">All Submissions</CardTitle>
          <CardDescription>
            {totalCount > 0
              ? `Showing ${from + 1}-${Math.min(from + perPage, totalCount)} of ${totalCount}`
              : 'No submissions found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedSubmissions.length > 0 ? (
            <SubmissionsTableClient
              initialSubmissions={paginatedSubmissions}
              eventSlug={slug}
            />
          ) : (
            <div className="text-center py-8 text-stone-500">
              {search || status || category || institution
                ? 'No submissions match your filters'
                : 'No submissions yet'}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-700">
              <p className="text-sm text-stone-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link href={`/admin/events/${slug}/submissions${buildQueryString({ page: String(currentPage - 1) })}`}>
                    <Button variant="outline" size="sm" className="border-stone-700">
                      Previous
                    </Button>
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link href={`/admin/events/${slug}/submissions${buildQueryString({ page: String(currentPage + 1) })}`}>
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
