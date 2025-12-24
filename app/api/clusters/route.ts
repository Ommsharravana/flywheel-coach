import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/clusters - Get all active clusters with their problems
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme');
    const includeProblems = searchParams.get('include_problems') === 'true';

    // Base query for clusters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('problem_clusters')
      .select(`
        id,
        name,
        description,
        slug,
        primary_theme,
        problem_count,
        avg_severity,
        cross_institutional,
        institutions_count,
        ai_summary,
        key_patterns,
        suggested_actions,
        created_at,
        updated_at
      `)
      .eq('status', 'active')
      .order('problem_count', { ascending: false });

    if (theme) {
      query = query.eq('primary_theme', theme);
    }

    const { data: clusters, error: clusterError } = await query;

    if (clusterError) {
      console.error('Error fetching clusters:', clusterError);
      return NextResponse.json(
        { error: 'Failed to fetch clusters', details: clusterError.message },
        { status: 500 }
      );
    }

    // If include_problems is true, fetch problems for each cluster
    if (includeProblems && clusters) {
      for (const cluster of clusters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: members } = await (supabase as any)
          .from('problem_cluster_members')
          .select(`
            membership_score,
            is_centroid,
            problem_bank!inner (
              id,
              title,
              problem_statement,
              theme,
              validation_status,
              severity_rating,
              institution_id,
              institutions!problem_bank_institution_id_fkey (short_name)
            )
          `)
          .eq('cluster_id', cluster.id)
          .order('membership_score', { ascending: false })
          .limit(10);

        cluster.problems = members?.map((m: {
          membership_score: number;
          is_centroid: boolean;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          problem_bank: any;
        }) => ({
          ...m.problem_bank,
          membership_score: m.membership_score,
          is_centroid: m.is_centroid,
          institution_short: m.problem_bank?.institutions?.short_name,
        })) || [];

        // Get unique institutions
        const institutionSet = new Set<string>();
        cluster.problems.forEach((p: { institution_short?: string }) => {
          if (p.institution_short) institutionSet.add(p.institution_short);
        });
        cluster.institutions_list = Array.from(institutionSet);
      }
    }

    return NextResponse.json({
      clusters: clusters || [],
      total: clusters?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/clusters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/clusters - Create a new cluster (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      primary_theme,
      problem_ids = [],
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Cluster name is required' }, { status: 400 });
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create cluster
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cluster, error: insertError } = await (supabase as any)
      .from('problem_clusters')
      .insert({
        name,
        description,
        slug,
        primary_theme,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating cluster:', insertError);
      return NextResponse.json(
        { error: 'Failed to create cluster', details: insertError.message },
        { status: 500 }
      );
    }

    // Add problems to cluster
    if (problem_ids.length > 0) {
      const members = problem_ids.map((pid: string, idx: number) => ({
        cluster_id: cluster.id,
        problem_id: pid,
        membership_score: 1.0,
        is_centroid: idx === 0, // First problem is centroid
        added_by: 'manual',
        added_by_user: user.id,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('problem_cluster_members')
        .insert(members);
    }

    return NextResponse.json({
      success: true,
      cluster_id: cluster.id,
      cluster,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/clusters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
