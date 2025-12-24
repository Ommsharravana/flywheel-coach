import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/problems/stats - Get problem bank statistics (superadmin only)
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((userProfile as { role: string } | null)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - superadmin only' }, { status: 403 });
    }

    // Fetch all problems with institution info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problems, error: queryError } = await (supabase as any)
      .from('problem_bank')
      .select(`
        id,
        theme,
        status,
        validation_status,
        severity_rating,
        institution_id,
        institutions!problem_bank_institution_id_fkey (id, name, short_name)
      `);

    if (queryError) {
      console.error('Error fetching problems for stats:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch stats', details: queryError.message },
        { status: 500 }
      );
    }

    // Calculate theme distribution
    const themeDistribution: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (problems || []).forEach((p: any) => {
      const theme = p.theme || 'other';
      themeDistribution[theme] = (themeDistribution[theme] || 0) + 1;
    });

    // Calculate institution distribution
    const institutionDistribution: Record<string, { count: number; name: string; short_name: string }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (problems || []).forEach((p: any) => {
      if (p.institutions) {
        const instId = p.institution_id;
        if (!institutionDistribution[instId]) {
          institutionDistribution[instId] = {
            count: 0,
            name: p.institutions.name,
            short_name: p.institutions.short_name,
          };
        }
        institutionDistribution[instId].count++;
      }
    });

    // Calculate status distribution
    const statusDistribution: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (problems || []).forEach((p: any) => {
      const status = p.status || 'open';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // Calculate validation distribution
    const validationDistribution: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (problems || []).forEach((p: any) => {
      const validation = p.validation_status || 'unvalidated';
      validationDistribution[validation] = (validationDistribution[validation] || 0) + 1;
    });

    // Calculate average severity
    const severityRatings = (problems || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.severity_rating)
      .filter((r: number | null) => r !== null) as number[];
    const avgSeverity = severityRatings.length > 0
      ? severityRatings.reduce((a, b) => a + b, 0) / severityRatings.length
      : null;

    return NextResponse.json({
      total: problems?.length || 0,
      themeDistribution: Object.entries(themeDistribution)
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count),
      institutionDistribution: Object.entries(institutionDistribution)
        .map(([id, data]) => ({
          id,
          name: data.name,
          short_name: data.short_name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count),
      statusDistribution: Object.entries(statusDistribution)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      validationDistribution: Object.entries(validationDistribution)
        .map(([validation, count]) => ({ validation, count }))
        .sort((a, b) => b.count - a.count),
      avgSeverity,
    });

  } catch (error) {
    console.error('Error in GET /api/problems/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
