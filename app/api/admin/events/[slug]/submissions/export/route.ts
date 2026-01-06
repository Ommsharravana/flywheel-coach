import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';

export const dynamic = 'force-dynamic';

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
  problem_statement?: string | null;
  demo_video_url?: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const userId = await getEffectiveUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, slug')
      .eq('slug', slug)
      .single() as { data: { id: string; name: string; slug: string } | null; error: unknown };

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check admin access
    const { isAdmin } = await checkEventAdminAccess(userId, event.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all submissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: submissions, error: submissionsError } = await (supabase as any).rpc('get_event_submissions', {
      target_event_id: event.id,
      caller_user_id: userId
    }) as { data: Submission[] | null; error: unknown };

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Generate CSV
    const headers = [
      'Submission #',
      'Team Name',
      'App Name',
      'Category',
      'Status',
      'Institution',
      'Applicant',
      'Score',
      'Live URL',
      'Demo Video',
      'Submitted At',
      'Created At',
    ];

    const rows = (submissions || []).map((s) => [
      s.submission_number || '',
      escapeCSV(s.team_name || ''),
      escapeCSV(s.app_name || ''),
      s.category || '',
      s.status || '',
      s.institution_short_name || s.institution_name || '',
      escapeCSV(s.applicant_name || ''),
      s.score?.toString() || '',
      s.live_url || '',
      s.demo_video_url || '',
      s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '',
      s.created_at ? new Date(s.created_at).toLocaleString() : '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Return CSV file
    const filename = `${event.slug}-submissions-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function escapeCSV(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
