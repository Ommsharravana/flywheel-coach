import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/problems/from-cycle - Extract problem from cycle and save to problem bank (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin and get institution_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role, institution_id')
      .eq('id', user.id)
      .single();

    if ((userProfile as { role: string } | null)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - superadmin only' }, { status: 403 });
    }

    const body = await request.json();
    const { cycle_id, source_event } = body;

    if (!cycle_id) {
      return NextResponse.json(
        { error: 'Missing required field: cycle_id' },
        { status: 400 }
      );
    }

    // Check if problem already exists for this cycle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('problem_bank')
      .select('id')
      .eq('original_cycle_id', cycle_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Problem already exists in bank', problem_id: existing.id },
        { status: 409 }
      );
    }

    // Fetch the cycle with all related data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cycle, error: cycleError } = await (supabase as any)
      .from('cycles')
      .select('*')
      .eq('id', cycle_id)
      .single();

    if (cycleError || !cycle) {
      return NextResponse.json(
        { error: 'Cycle not found' },
        { status: 404 }
      );
    }

    // Fetch the cycle creator's institution_id (not the superadmin's)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cycleCreator } = await (supabase as any)
      .from('users')
      .select('institution_id')
      .eq('id', cycle.user_id)
      .single();

    const creatorInstitutionId = (cycleCreator as { institution_id: string | null } | null)?.institution_id || null;

    // Fetch problem data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem } = await (supabase as any)
      .from('problems')
      .select('*')
      .eq('cycle_id', cycle_id)
      .single();

    // Fetch context data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: context } = await (supabase as any)
      .from('contexts')
      .select('*')
      .eq('cycle_id', cycle_id)
      .single();

    // Fetch value assessment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: valueAssessment } = await (supabase as any)
      .from('value_assessments')
      .select('*')
      .eq('cycle_id', cycle_id)
      .single();

    // Fetch impact assessment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: impactAssessment } = await (supabase as any)
      .from('impact_assessments')
      .select('*')
      .eq('cycle_id', cycle_id)
      .single();

    // Build the problem title from available problem data
    const title = getProblemTitle(problem, cycle);

    // Build problem statement from all available data
    const problemStatement = buildProblemStatement(problem, context);

    // Determine validation status based on value assessment
    const validationStatus = determineValidationStatus(valueAssessment, impactAssessment);

    // Calculate desperate user metrics
    const desperateUserScore = calculateDesperateUserScore(valueAssessment);

    // Insert into problem_bank
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newProblem, error: insertError } = await (supabase as any)
      .from('problem_bank')
      .insert({
        original_cycle_id: cycle_id,
        source_type: 'cycle',
        source_year: new Date().getFullYear(),
        source_event: source_event || null,

        title: title.substring(0, 200),
        problem_statement: problemStatement,
        theme: detectTheme(problem, context),

        who_affected: context?.who_affected || null,
        when_occurs: context?.when_occurs || null,
        where_occurs: context?.where_occurs || null,
        frequency: context?.frequency || null,
        severity_rating: context?.severity_rating || null,
        current_workaround: context?.current_workaround || null,

        validation_status: validationStatus,
        users_interviewed: valueAssessment?.interviews_completed || 0,
        desperate_user_count: valueAssessment?.desperate_user_count || 0,
        desperate_user_score: desperateUserScore,

        institution_id: creatorInstitutionId,
        submitted_by: user.id,

        status: impactAssessment?.completed ? 'solved' : 'open',
        is_open_for_attempts: !impactAssessment?.completed,

        best_solution_cycle_id: impactAssessment?.completed ? cycle_id : null,

        metadata: {
          original_cycle_name: cycle.name,
          build_url: cycle.build?.project_url || null,
          impact_score: impactAssessment?.impact_score || null,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting problem:', insertError);
      return NextResponse.json(
        { error: 'Failed to save problem to bank', details: insertError.message },
        { status: 500 }
      );
    }

    // Add evidence from interviews if available
    if (context?.interviews && Array.isArray(context.interviews)) {
      for (const interview of context.interviews) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('problem_evidence').insert({
          problem_id: newProblem.id,
          evidence_type: 'interview',
          content: interview.notes || interview.quote || 'Interview conducted',
          source_name: interview.name || 'Anonymous',
          source_role: interview.role || null,
          pain_level: interview.pain_level || null,
          collected_at: interview.date || null,
          collected_by: user.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      problem_id: newProblem.id,
      message: 'Problem saved to bank successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/problems/from-cycle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

// Get the best available problem title from various sources
function getProblemTitle(
  problem: Record<string, unknown> | null,
  cycle: Record<string, unknown>
): string {
  // Priority: refined_statement > selected_question > individual questions > cycle name
  if (problem?.refined_statement) {
    const statement = String(problem.refined_statement);
    return statement.length > 200 ? statement.substring(0, 197) + '...' : statement;
  }

  if (problem?.selected_question) {
    const question = String(problem.selected_question);
    return question.length > 200 ? question.substring(0, 197) + '...' : question;
  }

  // Check individual questions
  const questionFields = [
    'q_takes_too_long',
    'q_repetitive',
    'q_lookup_repeatedly',
    'q_complaints',
    'q_would_pay',
  ];

  for (const field of questionFields) {
    if (problem?.[field]) {
      const answer = String(problem[field]);
      return answer.length > 200 ? answer.substring(0, 197) + '...' : answer;
    }
  }

  return String(cycle.name || 'Untitled Problem');
}

function buildProblemStatement(
  problem: Record<string, unknown> | null,
  context: Record<string, unknown> | null
): string {
  const parts: string[] = [];

  // Add refined statement if available
  if (problem?.refined_statement) {
    parts.push(String(problem.refined_statement));
  }

  // Add selected question if different from refined
  if (problem?.selected_question && problem.selected_question !== problem?.refined_statement) {
    parts.push(String(problem.selected_question));
  }

  // Add individual question answers (the 5 discovery questions)
  const questionMap: Record<string, string> = {
    q_takes_too_long: 'Takes too long',
    q_repetitive: 'Repetitive task',
    q_lookup_repeatedly: 'Need to look up repeatedly',
    q_complaints: 'Common complaints',
    q_would_pay: 'Would pay to solve',
  };

  for (const [field, label] of Object.entries(questionMap)) {
    if (problem?.[field] && !parts.includes(String(problem[field]))) {
      parts.push(`**${label}:** ${problem[field]}`);
    }
  }

  if (context?.problem_description) {
    parts.push(String(context.problem_description));
  }

  if (context?.who_affected && context?.when_occurs) {
    parts.push(`Affects ${context.who_affected} ${context.when_occurs}.`);
  }

  return parts.join('\n\n') || 'Problem statement not provided';
}

function determineValidationStatus(
  valueAssessment: Record<string, unknown> | null,
  impactAssessment: Record<string, unknown> | null
): string {
  if (impactAssessment?.completed && (impactAssessment?.total_users as number) > 0) {
    return 'market_validated';
  }

  if (valueAssessment?.desperate_user_confirmed) {
    return 'desperate_user_confirmed';
  }

  if ((valueAssessment?.interviews_completed as number) > 0) {
    return 'user_tested';
  }

  return 'unvalidated';
}

function calculateDesperateUserScore(valueAssessment: Record<string, unknown> | null): number | null {
  if (!valueAssessment) return null;

  let score = 0;

  // Each criterion met adds 1 point (max 5)
  if (valueAssessment.has_tried_existing) score++;
  if (valueAssessment.willing_to_pay) score++;
  if (valueAssessment.urgent_need) score++;
  if (valueAssessment.would_refer) score++;
  if (valueAssessment.active_search) score++;

  return score > 0 ? score : null;
}

function detectTheme(
  problem: Record<string, unknown> | null,
  context: Record<string, unknown> | null
): string | null {
  const text = [
    problem?.selected_question,
    context?.problem_description,
    context?.who_affected,
    context?.where_occurs,
  ].filter(Boolean).join(' ').toLowerCase();

  // Keyword-based theme detection (aligned with Appathon 2.0 Bioconvergence Themes)
  // Healthcare + AI
  if (/health|patient|hospital|clinic|medical|doctor|nurse|pharma|drug|medicine|dental|tooth|teeth|prescription|opd|ward|diagnosis|treatment|therapy/i.test(text)) {
    return 'healthcare';
  }
  // Education + AI
  if (/education|student|learner|teacher|school|college|course|exam|study|class|syllabus|grade|marks|attendance|learning|curriculum/i.test(text)) {
    return 'education';
  }
  // Agriculture + AI
  if (/farm|crop|agriculture|soil|harvest|irrigation|farmer|plant|seed|pesticide|livestock|cattle|poultry|fishery/i.test(text)) {
    return 'agriculture';
  }
  // Environment + AI
  if (/environment|waste|pollution|water|air|climate|sustainability|recycle|plastic|green|carbon|ecology|conservation/i.test(text)) {
    return 'environment';
  }
  // Community + AI
  if (/community|social|village|society|public|welfare|volunteer|ngo|help|civic|neighborhood|local/i.test(text)) {
    return 'community';
  }
  // MyJKKN Data Apps (special track)
  if (/myjkkn|jkkn|institution|campus|college management|admin|erp|portal/i.test(text)) {
    return 'myjkkn';
  }

  return 'other';
}
