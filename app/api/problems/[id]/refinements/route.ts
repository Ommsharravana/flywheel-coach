import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { RefinementType, RefinementBasedOn } from '@/lib/types/problem-bank';

// GET /api/problems/[id]/refinements - Get all refinements for a problem
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

    // Fetch refinements for this problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: refinements, error: queryError } = await (supabase as any)
      .from('ai_refinements')
      .select('*')
      .eq('problem_id', id)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Error fetching refinements:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch refinements', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(refinements || []);

  } catch (error) {
    console.error('Error in GET /api/problems/[id]/refinements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/problems/[id]/refinements - Generate AI refinement suggestions
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

    // Fetch the problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem, error: problemError } = await (supabase as any)
      .from('problem_bank')
      .select('*')
      .eq('id', id)
      .single();

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const body = await request.json();
    const refinementType: RefinementType = body.refinement_type || 'clarity';
    const basedOn: RefinementBasedOn = body.based_on || 'patterns';

    // Generate refinement using AI
    const refinement = await generateRefinement(problem, refinementType, basedOn);

    // Save the refinement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: saved, error: insertError } = await (supabase as any)
      .from('ai_refinements')
      .insert({
        problem_id: id,
        refinement_type: refinementType,
        original_statement: problem.problem_statement,
        suggested_statement: refinement.suggested_statement,
        refinement_reason: refinement.reason,
        based_on: basedOn,
        confidence_score: refinement.confidence,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving refinement:', insertError);
      return NextResponse.json(
        { error: 'Failed to save refinement', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(saved, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/problems/[id]/refinements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate refinement using AI
// This is a placeholder that can be replaced with actual LLM integration
interface Problem {
  problem_statement: string;
  title?: string;
  who_affected?: string;
  when_occurs?: string;
  where_occurs?: string;
  theme?: string;
}

async function generateRefinement(
  problem: Problem,
  type: RefinementType,
  basedOn: RefinementBasedOn
): Promise<{ suggested_statement: string; reason: string; confidence: number }> {
  // Build context for the refinement
  const context = {
    original: problem.problem_statement,
    title: problem.title,
    who: problem.who_affected,
    when: problem.when_occurs,
    where: problem.where_occurs,
    theme: problem.theme,
  };

  // For now, return a heuristic-based refinement
  // TODO: Replace with actual LLM call when OpenAI/Anthropic SDK is added

  let suggested_statement = problem.problem_statement;
  let reason = '';
  let confidence = 0.7;

  switch (type) {
    case 'clarity':
      // Add specificity if missing context
      if (!problem.who_affected && !problem.when_occurs) {
        suggested_statement = `[Who is affected] experiences ${problem.problem_statement} [when/how often]`;
        reason = 'Added placeholders for specificity - the problem statement lacks information about who is affected and when the problem occurs.';
        confidence = 0.6;
      } else if (problem.who_affected && problem.when_occurs) {
        suggested_statement = `${problem.who_affected} experiences ${problem.problem_statement} ${problem.when_occurs}`;
        reason = 'Incorporated context about who and when into a clearer statement.';
        confidence = 0.8;
      } else {
        reason = 'The problem statement appears reasonably clear. Consider adding more specific context about affected users.';
        confidence = 0.5;
      }
      break;

    case 'scope':
      if (problem.where_occurs) {
        suggested_statement = `In ${problem.where_occurs}, ${problem.problem_statement}`;
        reason = 'Added location context to make the problem more specific.';
        confidence = 0.75;
      } else {
        suggested_statement = `${problem.problem_statement} - specifically in [context/location]`;
        reason = 'Suggested adding location or context specificity.';
        confidence = 0.6;
      }
      break;

    case 'feasibility':
      suggested_statement = `${problem.problem_statement} - This could be addressed by [potential solution approach]`;
      reason = 'Suggested adding actionable direction to help focus solution development.';
      confidence = 0.65;
      break;

    case 'user_focus':
      if (problem.who_affected) {
        suggested_statement = `For ${problem.who_affected}: ${problem.problem_statement}`;
        reason = 'Reframed to emphasize the user perspective.';
        confidence = 0.75;
      } else {
        suggested_statement = `[Target users] need ${problem.problem_statement} because [reason]`;
        reason = 'Suggested adding clear user focus and motivation.';
        confidence = 0.6;
      }
      break;

    case 'general':
      reason = 'The problem statement is reasonable. Consider refining based on user feedback.';
      confidence = 0.5;
      break;

    case 'validation':
      suggested_statement = `[X users] report that ${problem.problem_statement}, causing [specific impact]`;
      reason = 'Suggested adding validation evidence and impact measurement.';
      confidence = 0.7;
      break;

    case 'impact':
      suggested_statement = `${problem.problem_statement} - affecting [N users/hour/cost] per [time period]`;
      reason = 'Suggested quantifying the impact to prioritize this problem.';
      confidence = 0.65;
      break;

    default:
      reason = 'No specific refinement suggested for this type.';
      confidence = 0.5;
  }

  // Adjust confidence based on what information is available
  if (basedOn === 'similar_successes') {
    confidence *= 1.1; // Slightly higher if based on proven patterns
  } else if (basedOn === 'user_feedback') {
    confidence *= 1.05; // Based on actual user feedback
  }

  // Cap confidence at 0.95
  confidence = Math.min(confidence, 0.95);

  return { suggested_statement, reason, confidence };
}
