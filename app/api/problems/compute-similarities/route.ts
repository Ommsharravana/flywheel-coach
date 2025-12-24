import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface ProblemData {
  id: string;
  title: string;
  problem_statement: string;
  theme: string | null;
  who_affected: string | null;
  search_content: string | null;
}

// POST /api/problems/compute-similarities - Compute similarities for all problems
// Admin only - batch computation of problem similarities
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

    const body = await request.json().catch(() => ({}));
    const { problem_id, threshold = 0.3, recompute_all = false } = body;

    // Fetch all open problems
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problems, error: fetchError } = await (supabase as any)
      .from('problem_bank')
      .select('id, title, problem_statement, theme, who_affected, search_content')
      .eq('status', 'open');

    if (fetchError) {
      console.error('Error fetching problems:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch problems', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!problems || problems.length < 2) {
      return NextResponse.json({
        message: 'Not enough problems to compute similarities',
        problem_count: problems?.length || 0,
        similarities_computed: 0,
      });
    }

    // If specific problem_id provided, only compute for that one
    const targetProblems = problem_id
      ? problems.filter((p: ProblemData) => p.id === problem_id)
      : problems;

    let similaritiesComputed = 0;
    let clustersUpdated = 0;

    // Compute similarities for each target problem
    for (const sourceProblem of targetProblems as ProblemData[]) {
      for (const targetProblem of problems as ProblemData[]) {
        // Skip self and ensure canonical ordering (smaller UUID first)
        if (sourceProblem.id >= targetProblem.id) continue;

        const similarity = computeSimilarity(sourceProblem, targetProblem);

        if (similarity >= threshold) {
          // Upsert similarity
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: upsertError } = await (supabase as any)
            .from('problem_similarities')
            .upsert(
              {
                problem_id_a: sourceProblem.id,
                problem_id_b: targetProblem.id,
                similarity_score: similarity,
                similarity_type: 'keyword',
                computed_at: new Date().toISOString(),
                algorithm_version: 'v1-keyword',
              },
              { onConflict: 'problem_id_a,problem_id_b' }
            );

          if (!upsertError) {
            similaritiesComputed++;
          }
        }
      }
    }

    // Auto-generate theme-based clusters if recompute_all
    if (recompute_all) {
      const allThemes = problems.map((p: ProblemData) => p.theme).filter(Boolean) as string[];
      const themes = [...new Set(allThemes)];

      for (const theme of themes) {
        const themeProblems = problems.filter((p: ProblemData) => p.theme === theme);
        if (themeProblems.length >= 2) {
          const clusterName = getThemeClusterName(theme);
          const slug = theme.toLowerCase().replace(/\s+/g, '-');

          // Upsert cluster
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: cluster, error: clusterError } = await (supabase as any)
            .from('problem_clusters')
            .upsert(
              {
                name: clusterName,
                slug: slug,
                description: `Auto-generated cluster for ${clusterName} problems`,
                primary_theme: theme,
                status: 'active',
              },
              { onConflict: 'slug' }
            )
            .select('id')
            .single();

          if (!clusterError && cluster) {
            // Add problems to cluster
            for (const problem of themeProblems) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any)
                .from('problem_cluster_members')
                .upsert(
                  {
                    cluster_id: cluster.id,
                    problem_id: problem.id,
                    membership_score: 0.8,
                    added_by: 'auto',
                  },
                  { onConflict: 'cluster_id,problem_id' }
                );
            }
            clustersUpdated++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      problem_count: problems.length,
      similarities_computed: similaritiesComputed,
      clusters_updated: clustersUpdated,
      threshold,
    });
  } catch (error) {
    console.error('Error in POST /api/problems/compute-similarities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Compute keyword-based similarity between two problems
function computeSimilarity(a: ProblemData, b: ProblemData): number {
  // Same theme = base similarity of 0.5
  const themeSimilarity = a.theme === b.theme && a.theme !== null ? 0.5 : 0;

  // Text similarity using keyword overlap
  const textA = normalizeText(a.search_content || `${a.title} ${a.problem_statement}`);
  const textB = normalizeText(b.search_content || `${b.title} ${b.problem_statement}`);

  const wordsA = new Set(textA.split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(textB.split(/\s+/).filter(w => w.length > 3));

  if (wordsA.size === 0 || wordsB.size === 0) {
    return themeSimilarity;
  }

  // Jaccard similarity
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  const jaccardSimilarity = intersection / union;

  // Weighted combination
  const textWeight = 0.5;
  const themeWeight = 0.5;

  const combined = (jaccardSimilarity * textWeight) + (themeSimilarity * themeWeight);

  return Math.min(combined, 1);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getThemeClusterName(theme: string): string {
  const themeNames: Record<string, string> = {
    healthcare: 'Healthcare + AI Problems',
    education: 'Education + AI Problems',
    agriculture: 'Agriculture + AI Problems',
    environment: 'Environment + AI Problems',
    community: 'Community + AI Problems',
    myjkkn: 'MyJKKN Data Apps',
    other: 'Other Problems',
  };
  return themeNames[theme] || `${theme} Problems`;
}

// GET - Return current similarity stats
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get similarity stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: similarities, error: simError } = await (supabase as any)
      .from('problem_similarities')
      .select('similarity_score, similarity_type');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clusters, error: clusterError } = await (supabase as any)
      .from('problem_clusters')
      .select('id, name, problem_count, primary_theme')
      .eq('status', 'active');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: problemCount } = await (supabase as any)
      .from('problem_bank')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open');

    if (simError || clusterError) {
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    const avgSimilarity = similarities?.length > 0
      ? similarities.reduce((sum: number, s: { similarity_score: number }) => sum + s.similarity_score, 0) / similarities.length
      : 0;

    return NextResponse.json({
      total_problems: problemCount || 0,
      total_similarities: similarities?.length || 0,
      avg_similarity_score: avgSimilarity,
      total_clusters: clusters?.length || 0,
      clusters: clusters || [],
      last_computed: similarities?.[0]?.computed_at || null,
    });
  } catch (error) {
    console.error('Error in GET /api/problems/compute-similarities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
