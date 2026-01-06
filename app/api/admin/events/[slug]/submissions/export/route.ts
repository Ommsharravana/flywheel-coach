import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';

export const dynamic = 'force-dynamic';

interface TeamMember {
  name?: string;
  email?: string;
  institution?: string;
  department?: string;
  year?: string;
}

interface SeniorLearner {
  name?: string;
  email?: string;
  phone?: string;
}

interface Submission {
  id: string;
  submission_number: string | null;
  participation_type: string | null;
  team_name: string | null;
  team_members: TeamMember[] | null;
  senior_learner: SeniorLearner | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  institution_name: string | null;
  institution_short_name: string | null;
  department: string | null;
  year_of_study: string | null;
  app_name: string | null;
  problem_statement: string | null;
  solution_summary: string | null;
  live_url: string | null;
  lovable_url: string | null;
  github_url: string | null;
  elevator_pitch: string | null;
  demo_video_url: string | null;
  category: string | null;
  status: string;
  score: number | null;
  impact_metrics: Record<string, unknown> | null;
  submitted_at: string | null;
  created_at: string;
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

    // Generate CSV with all important fields
    const headers = [
      'Submission #',
      'Status',
      'Category',
      'Score',
      // Team Info
      'Participation Type',
      'Team Name',
      'Team Members',
      'Senior Learner',
      // Applicant Info
      'Applicant Name',
      'Applicant Email',
      'Applicant Phone',
      'Institution',
      'Department',
      'Year of Study',
      // Project Info
      'App Name',
      'Problem Statement',
      'Solution Summary',
      'Elevator Pitch',
      // URLs
      'Live URL',
      'Lovable URL',
      'GitHub URL',
      'Demo Video URL',
      // Impact
      'Impact Metrics',
      // Dates
      'Submitted At',
      'Created At',
    ];

    const formatTeamMembers = (members: TeamMember[] | null): string => {
      if (!members || members.length === 0) return '';
      return members
        .map((m) => `${m.name || ''}${m.email ? ` (${m.email})` : ''}`)
        .filter(Boolean)
        .join('; ');
    };

    const formatSeniorLearner = (sl: SeniorLearner | null): string => {
      if (!sl) return '';
      const parts = [sl.name, sl.email, sl.phone].filter(Boolean);
      return parts.join(' | ');
    };

    const formatImpactMetrics = (metrics: Record<string, unknown> | null): string => {
      if (!metrics) return '';
      const parts: string[] = [];
      if (metrics.users_reached) parts.push(`Users: ${metrics.users_reached}`);
      if (metrics.time_saved_minutes) parts.push(`Time saved: ${metrics.time_saved_minutes}min`);
      if (metrics.satisfaction_score) parts.push(`Satisfaction: ${metrics.satisfaction_score}`);
      return parts.join('; ');
    };

    const rows = (submissions || []).map((s) => [
      s.submission_number || '',
      s.status || '',
      s.category || '',
      s.score?.toString() || '',
      // Team Info
      s.participation_type || 'individual',
      escapeCSV(s.team_name || ''),
      escapeCSV(formatTeamMembers(s.team_members)),
      escapeCSV(formatSeniorLearner(s.senior_learner)),
      // Applicant Info
      escapeCSV(s.applicant_name || ''),
      s.applicant_email || '',
      s.applicant_phone || '',
      s.institution_short_name || s.institution_name || '',
      escapeCSV(s.department || ''),
      s.year_of_study || '',
      // Project Info
      escapeCSV(s.app_name || ''),
      escapeCSV(s.problem_statement || ''),
      escapeCSV(s.solution_summary || ''),
      escapeCSV(s.elevator_pitch || ''),
      // URLs
      s.live_url || '',
      s.lovable_url || '',
      s.github_url || '',
      s.demo_video_url || '',
      // Impact
      escapeCSV(formatImpactMetrics(s.impact_metrics)),
      // Dates
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
