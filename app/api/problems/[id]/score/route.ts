import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/problems/[id]/score - Get scores for a problem
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all scores for this problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scores, error: fetchError } = await (supabase as any)
      .from('problem_scores')
      .select('*')
      .eq('problem_id', id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching scores:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch scores', details: fetchError.message },
        { status: 500 }
      );
    }

    // Calculate average if multiple scores
    let averageScore = null;
    if (scores && scores.length > 0) {
      const validScores = scores.filter((s: { composite_score: number | null }) => s.composite_score !== null);
      if (validScores.length > 0) {
        const sum = validScores.reduce((acc: number, s: { composite_score: number }) => acc + s.composite_score, 0);
        averageScore = sum / validScores.length;
      }
    }

    return NextResponse.json({
      scores: scores || [],
      average_score: averageScore,
    });
  } catch (error) {
    console.error('Error in GET /api/problems/[id]/score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/problems/[id]/score - Add or update score
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      severity_score,
      validation_score,
      uniqueness_score,
      feasibility_score,
      impact_potential_score,
      notes,
      scored_by = 'manual',
    } = body;

    // Validate scores are in range
    const validateScore = (score: number | undefined) => {
      if (score === undefined || score === null) return true;
      return score >= 1 && score <= 10;
    };

    if (!validateScore(severity_score) || !validateScore(validation_score) ||
        !validateScore(uniqueness_score) || !validateScore(feasibility_score) ||
        !validateScore(impact_potential_score)) {
      return NextResponse.json(
        { error: 'Scores must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Upsert score
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: score, error: upsertError } = await (supabase as any)
      .from('problem_scores')
      .upsert({
        problem_id: id,
        severity_score,
        validation_score,
        uniqueness_score,
        feasibility_score,
        impact_potential_score,
        notes,
        scored_by,
        scored_by_user: user.id,
      }, {
        onConflict: 'problem_id,scored_by,scored_by_user',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error saving score:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save score', details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      score,
    });
  } catch (error) {
    console.error('Error in POST /api/problems/[id]/score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
