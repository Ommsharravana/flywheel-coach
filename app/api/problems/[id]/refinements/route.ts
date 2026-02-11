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

// Helper function to generate refinement using intelligent heuristics
interface Problem {
  problem_statement: string;
  title?: string;
  who_affected?: string;
  when_occurs?: string;
  where_occurs?: string;
  theme?: string;
  severity_rating?: number;
  current_workaround?: string;
  frequency?: string;
}

async function generateRefinement(
  problem: Problem,
  type: RefinementType,
  basedOn: RefinementBasedOn
): Promise<{ suggested_statement: string; reason: string; confidence: number }> {
  // Calculate data completeness for confidence adjustment
  const dataCompleteness = calculateDataCompleteness(problem);

  let suggested_statement = problem.problem_statement;
  let reason = '';
  let confidence = 0.7;

  switch (type) {
    case 'clarity': {
      const clarityResult = generateClarityRefinement(problem, dataCompleteness);
      suggested_statement = clarityResult.statement;
      reason = clarityResult.reason;
      confidence = clarityResult.confidence;
      break;
    }

    case 'scope': {
      const scopeResult = generateScopeRefinement(problem, dataCompleteness);
      suggested_statement = scopeResult.statement;
      reason = scopeResult.reason;
      confidence = scopeResult.confidence;
      break;
    }

    case 'feasibility': {
      const feasibilityResult = generateFeasibilityRefinement(problem, dataCompleteness);
      suggested_statement = feasibilityResult.statement;
      reason = feasibilityResult.reason;
      confidence = feasibilityResult.confidence;
      break;
    }

    case 'user_focus': {
      const userFocusResult = generateUserFocusRefinement(problem);
      suggested_statement = userFocusResult.statement;
      reason = userFocusResult.reason;
      confidence = userFocusResult.confidence;
      break;
    }

    case 'validation': {
      const validationResult = generateValidationRefinement(problem);
      suggested_statement = validationResult.statement;
      reason = validationResult.reason;
      confidence = validationResult.confidence;
      break;
    }

    case 'impact': {
      const impactResult = generateImpactRefinement(problem, dataCompleteness);
      suggested_statement = impactResult.statement;
      reason = impactResult.reason;
      confidence = impactResult.confidence;
      break;
    }

    case 'general': {
      const generalResult = generateGeneralRefinement(problem, dataCompleteness);
      suggested_statement = generalResult.statement;
      reason = generalResult.reason;
      confidence = generalResult.confidence;
      break;
    }

    default:
      reason = 'No specific refinement suggested for this type.';
      confidence = 0.5;
  }

  // Adjust confidence based on data source
  if (basedOn === 'similar_successes') {
    confidence *= 1.1; // Higher if based on proven patterns
  } else if (basedOn === 'user_feedback') {
    confidence *= 1.08; // Based on actual user feedback
  } else if (basedOn === 'outcome_patterns') {
    confidence *= 1.05; // Based on observed patterns
  }

  // Cap confidence at 0.95
  confidence = Math.min(confidence, 0.95);

  return { suggested_statement, reason, confidence };
}

// Calculate how complete the problem data is (0-1 scale)
function calculateDataCompleteness(problem: Problem): number {
  const fields = [
    problem.who_affected,
    problem.when_occurs,
    problem.where_occurs,
    problem.theme,
    problem.severity_rating,
    problem.current_workaround,
    problem.frequency,
  ];

  const completedFields = fields.filter(f => f !== undefined && f !== null && f !== '').length;
  return completedFields / fields.length;
}

// Check if statement is too vague
function isVague(statement: string): boolean {
  const vagueTerms = ['problem', 'issue', 'difficulty', 'challenge', 'thing', 'stuff', 'everyone', 'people', 'users'];
  const lowerStatement = statement.toLowerCase();
  const vagueCount = vagueTerms.filter(term => lowerStatement.includes(term)).length;
  return statement.length < 50 || vagueCount >= 2;
}

// Check if statement is too long/complex
function isTooLong(statement: string): boolean {
  return statement.length > 200;
}

// Generate clarity refinement
function generateClarityRefinement(problem: Problem, dataCompleteness: number): { statement: string; reason: string; confidence: number } {
  const statement = problem.problem_statement;

  // If statement is vague, add available context
  if (isVague(statement)) {
    const parts: string[] = [];

    if (problem.who_affected) {
      parts.push(problem.who_affected);
    }

    if (problem.when_occurs || problem.frequency) {
      const timing = problem.when_occurs || `${problem.frequency}`;
      parts.push(`${timing}`);
    }

    if (parts.length > 0) {
      const refinedStatement = `${parts.join(' ')}: ${statement}${problem.where_occurs ? ` in ${problem.where_occurs}` : ''}`;
      return {
        statement: refinedStatement,
        reason: 'Added specific context about who is affected and when the problem occurs to make the statement clearer and more actionable.',
        confidence: 0.75 + (dataCompleteness * 0.15),
      };
    } else {
      return {
        statement: `${statement} - Consider adding: who experiences this problem and how often it occurs.`,
        reason: 'The problem statement lacks specific context. Adding details about affected users and frequency would make it clearer.',
        confidence: 0.55,
      };
    }
  }

  // If statement is too long, suggest a concise version
  if (isTooLong(statement)) {
    const coreIssue = statement.split(/[.,;]/)[0]; // Take first clause
    return {
      statement: `${coreIssue.trim()}${problem.who_affected ? ` (affecting ${problem.who_affected})` : ''}`,
      reason: 'Simplified the problem statement to focus on the core issue. Long statements can obscure the main problem.',
      confidence: 0.70,
    };
  }

  // If we have good data, combine into well-structured statement
  if (problem.who_affected && problem.when_occurs && problem.where_occurs) {
    const refinedStatement = `${problem.who_affected} in ${problem.where_occurs} experience ${statement} ${problem.when_occurs}`;
    return {
      statement: refinedStatement,
      reason: 'Combined all available context (who, where, when) into a comprehensive, clear problem statement.',
      confidence: 0.88,
    };
  }

  return {
    statement: problem.problem_statement,
    reason: 'The problem statement has reasonable clarity. Additional user validation could help refine it further.',
    confidence: 0.50 + (dataCompleteness * 0.1),
  };
}

// Generate scope refinement
function generateScopeRefinement(problem: Problem, dataCompleteness: number): { statement: string; reason: string; confidence: number } {
  const statement = problem.problem_statement;
  const broadTerms = ['everyone', 'all users', 'people', 'all students', 'all staff'];
  const isBroad = broadTerms.some(term => statement.toLowerCase().includes(term));

  if (isBroad) {
    // Suggest narrowing with available data
    if (problem.who_affected && !statement.toLowerCase().includes(problem.who_affected.toLowerCase())) {
      const narrowedStatement = statement.replace(/everyone|all users|people|all students|all staff/gi, problem.who_affected);
      return {
        statement: narrowedStatement + (problem.where_occurs ? ` specifically in ${problem.where_occurs}` : ''),
        reason: 'Narrowed the scope from a broad user group to a specific segment. Starting with a focused user group leads to better validation and solutions.',
        confidence: 0.80,
      };
    } else {
      return {
        statement: `${statement} - Focus on a specific subset: define the exact user group, department, or context where this problem is most severe.`,
        reason: 'The problem scope is too broad. Narrowing to a specific user segment will make validation and solution development more effective.',
        confidence: 0.65,
      };
    }
  }

  // If no location specified but we have one, add it
  if (problem.where_occurs && !statement.toLowerCase().includes(problem.where_occurs.toLowerCase())) {
    return {
      statement: `In ${problem.where_occurs}: ${statement}`,
      reason: 'Added location context to scope the problem to a specific environment, making it more concrete and solvable.',
      confidence: 0.75,
    };
  }

  // If timing context missing, suggest adding it
  if (!problem.when_occurs && !problem.frequency) {
    return {
      statement: `${statement} - Specify timing: Does this happen daily, during peak hours, at month-end, or during specific processes?`,
      reason: 'Adding timing context helps scope the problem and prioritize solution development based on urgency and frequency.',
      confidence: 0.68,
    };
  }

  return {
    statement: problem.problem_statement,
    reason: 'The problem scope appears reasonably defined. Consider validating that this is the right scope by testing with affected users.',
    confidence: 0.55 + (dataCompleteness * 0.15),
  };
}

// Map themes to solution approaches
function getSolutionApproachForTheme(theme: string | undefined): string[] {
  const approaches: Record<string, string[]> = {
    'education': ['digital learning platform', 'automated assessment tool', 'student tracking system', 'interactive learning module'],
    'healthcare': ['patient monitoring system', 'appointment scheduling app', 'health record digitization', 'symptom tracking tool'],
    'agriculture': ['crop monitoring solution', 'weather-based advisory system', 'market price tracker', 'farming schedule app'],
    'environment': ['environmental monitoring system', 'waste tracking solution', 'resource optimization tool', 'sustainability dashboard'],
    'community': ['community engagement platform', 'event coordination system', 'feedback collection tool', 'volunteer management app'],
    'myjkkn': ['campus management feature', 'student services automation', 'institutional data integration', 'mobile-first campus app'],
  };

  return approaches[theme || ''] || ['workflow automation tool', 'data collection system', 'user-friendly mobile app', 'process optimization solution'];
}

// Generate feasibility refinement
function generateFeasibilityRefinement(problem: Problem, dataCompleteness: number): { statement: string; reason: string; confidence: number } {
  const approaches = getSolutionApproachForTheme(problem.theme);
  const suggestedApproach = approaches[0]; // Pick most relevant

  // Check if problem has workaround
  if (problem.current_workaround) {
    return {
      statement: `${problem.problem_statement} - Current workaround: ${problem.current_workaround}. Solution could automate or improve this process.`,
      reason: `Understanding the current workaround helps design a feasible solution. A ${suggestedApproach} could address this by digitizing and streamlining the manual process.`,
      confidence: 0.82,
    };
  }

  // Suggest MVP approach based on theme
  const mvpSuggestion = problem.theme === 'myjkkn'
    ? 'Start with a simple mobile interface integrated with existing MyJKKN data'
    : `Start with a basic ${suggestedApproach} that solves the core issue`;

  return {
    statement: `${problem.problem_statement} - Feasible MVP approach: ${mvpSuggestion}.`,
    reason: `Based on the ${problem.theme || 'general'} domain, a ${suggestedApproach} is a proven approach. Starting with an MVP helps validate the solution quickly with real users.`,
    confidence: 0.72 + (dataCompleteness * 0.1),
  };
}

// Generate user focus refinement (Jobs-to-Be-Done format)
function generateUserFocusRefinement(problem: Problem): { statement: string; reason: string; confidence: number } {
  if (!problem.who_affected) {
    return {
      statement: `${problem.problem_statement} - Define the user: Who exactly experiences this? Students? Faculty? Admin staff? A specific department?`,
      reason: 'Clear user focus is essential. Identify the specific user group to ensure the solution meets their actual needs.',
      confidence: 0.60,
    };
  }

  // Convert to Jobs-to-Be-Done format
  const situation = problem.when_occurs || problem.frequency || 'regularly';
  const user = problem.who_affected;
  const problem_core = problem.problem_statement;

  // Infer desired outcome from problem
  let outcome = 'complete their work efficiently';
  if (problem_core.toLowerCase().includes('time')) outcome = 'save time and work faster';
  if (problem_core.toLowerCase().includes('error') || problem_core.toLowerCase().includes('mistake')) outcome = 'avoid errors and maintain accuracy';
  if (problem_core.toLowerCase().includes('access') || problem_core.toLowerCase().includes('find')) outcome = 'quickly access what they need';
  if (problem_core.toLowerCase().includes('track') || problem_core.toLowerCase().includes('monitor')) outcome = 'have clear visibility and control';

  return {
    statement: `When ${situation}, ${user} want to ${problem_core.toLowerCase().replace(/^(students?|faculty|staff|users?|people)\s+/i, '')}, so they can ${outcome}.`,
    reason: 'Reframed in Jobs-to-Be-Done format to emphasize user motivation and desired outcome. This format helps guide solution design toward user needs.',
    confidence: 0.85,
  };
}

// Generate validation refinement
function generateValidationRefinement(problem: Problem): { statement: string; reason: string; confidence: number } {
  const hasSeverity = problem.severity_rating !== undefined && problem.severity_rating !== null;

  if (hasSeverity && problem.severity_rating! >= 7) {
    // High severity - suggest interview questions
    const interviewQuestions = [
      `Ask affected users: "How often does ${problem.problem_statement}?"`,
      `Ask: "What does this cost you in time/money/frustration?"`,
      `Ask: "How are you working around this now?"`,
      `Ask: "If this was solved, what would change for you?"`,
    ];

    return {
      statement: `${problem.problem_statement} - Validation plan: Interview 5-10 ${problem.who_affected || 'affected users'}. ${interviewQuestions.slice(0, 2).join(' ')}`,
      reason: `Given the high severity rating (${problem.severity_rating}/10), this problem warrants deep user validation. The suggested questions will help confirm if users are "desperate" for a solution.`,
      confidence: 0.88,
    };
  }

  // Suggest metrics to track
  const metrics: string[] = [];
  if (problem.problem_statement.toLowerCase().includes('time')) metrics.push('hours saved per week');
  if (problem.problem_statement.toLowerCase().includes('error')) metrics.push('error reduction percentage');
  if (problem.problem_statement.toLowerCase().includes('cost')) metrics.push('cost savings');
  if (metrics.length === 0) metrics.push('user satisfaction score', 'usage frequency');

  return {
    statement: `${problem.problem_statement} - Validation metrics: Track ${metrics.slice(0, 2).join(' and ')} before and after solution deployment.`,
    reason: `Defining clear validation metrics upfront helps prove the problem exists and measure solution impact. Focus on quantifiable outcomes that matter to ${problem.who_affected || 'users'}.`,
    confidence: 0.72 + (hasSeverity ? 0.1 : 0),
  };
}

// Generate impact refinement
function generateImpactRefinement(problem: Problem, dataCompleteness: number): { statement: string; reason: string; confidence: number } {
  // Try to estimate impact based on available data
  const hasSeverity = problem.severity_rating !== undefined && problem.severity_rating !== null;
  const hasFrequency = problem.frequency !== undefined && problem.frequency !== null;

  if (hasSeverity && hasFrequency) {
    const severityLevel = problem.severity_rating! >= 7 ? 'high' : problem.severity_rating! >= 4 ? 'moderate' : 'low';
    const impactMultiplier = problem.frequency === 'daily' ? 'significant daily' :
                             problem.frequency === 'weekly' ? 'recurring weekly' :
                             problem.frequency === 'monthly' ? 'monthly' : 'occasional';

    return {
      statement: `${problem.problem_statement} - Estimated impact: ${severityLevel} severity problem occurring ${problem.frequency}, affecting ${problem.who_affected || 'multiple users'}.`,
      reason: `With ${severityLevel} severity and ${impactMultiplier} occurrence, this problem has measurable impact. Track time saved, error reduction, or user satisfaction improvements to quantify results.`,
      confidence: 0.85,
    };
  }

  // Suggest impact framework based on theme
  const impactFramework = problem.theme === 'education' ? 'learning outcomes improved, student satisfaction increased' :
                          problem.theme === 'healthcare' ? 'patient care quality improved, staff efficiency increased' :
                          problem.theme === 'agriculture' ? 'crop yield improved, farmer income increased' :
                          'efficiency gained, costs reduced, user satisfaction improved';

  return {
    statement: `${problem.problem_statement} - Measure impact through: ${impactFramework}.`,
    reason: 'Quantifying impact helps prioritize this problem and justify solution development. Define 2-3 key metrics aligned with organizational goals.',
    confidence: 0.68 + (dataCompleteness * 0.12),
  };
}

// Generate general refinement
function generateGeneralRefinement(problem: Problem, dataCompleteness: number): { statement: string; reason: string; confidence: number } {
  // Identify what's missing
  const missing: string[] = [];
  if (!problem.who_affected) missing.push('specific user group');
  if (!problem.when_occurs && !problem.frequency) missing.push('timing/frequency');
  if (!problem.where_occurs) missing.push('location/context');
  if (!problem.severity_rating) missing.push('severity rating');

  if (missing.length > 0) {
    return {
      statement: `${problem.problem_statement} - To strengthen this problem statement, add: ${missing.join(', ')}.`,
      reason: `The problem statement would benefit from additional context. Adding ${missing[0]} would make it more specific and actionable for solution development.`,
      confidence: 0.65,
    };
  }

  // If data is complete, suggest next steps
  return {
    statement: `${problem.problem_statement} - Next step: Validate with 5-10 users to confirm this is a problem worth solving.`,
    reason: 'The problem statement is well-defined. The next step is user validation to confirm demand and refine understanding of the problem context.',
    confidence: 0.78 + (dataCompleteness * 0.1),
  };
}
