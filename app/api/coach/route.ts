import { NextRequest, NextResponse } from 'next/server';
import { Cycle, FLYWHEEL_STEPS } from '@/lib/types/cycle';
import {
  APPATHON_COACH_CONTEXT,
  getAppathonStepGuidance,
  getContextualAppathonTips,
} from '@/lib/appathon/coach-context';
import { createClient } from '@/lib/supabase/server';
import { decrypt, GeminiProvider, parseGeminiCredentials } from '@/lib/byos';
import type { GeminiOAuthCredentials } from '@/lib/byos';

// Helper to get user's Gemini credentials
async function getUserGeminiCredentials(userId: string): Promise<GeminiOAuthCredentials | null> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('provider_credentials')
      .select('credentials_encrypted, credential_type, is_valid')
      .eq('user_id', userId)
      .eq('provider', 'gemini')
      .single();

    if (error || !data || !data.is_valid) {
      return null;
    }

    const decrypted = decrypt(data.credentials_encrypted);
    return parseGeminiCredentials(decrypted);
  } catch (error) {
    console.error('Error getting Gemini credentials:', error);
    return null;
  }
}

interface CoachRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  cycle: Cycle;
  currentStep: number;
  isAppathonMode?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // User must be logged in
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to use AI features' },
        { status: 401 }
      );
    }

    // Get user's Gemini credentials
    const geminiCredentials = await getUserGeminiCredentials(user.id);

    // BYOS: User must have Gemini connected
    if (!geminiCredentials) {
      return NextResponse.json(
        {
          error: 'Gemini not connected',
          message: 'Please connect your Google account in Settings to enable AI features.',
          requiresSetup: true
        },
        { status: 401 }
      );
    }

    const body: CoachRequest = await request.json();
    const { messages, cycle, currentStep, isAppathonMode } = body;

    const stepInfo = FLYWHEEL_STEPS[currentStep - 1];

    // Build context about current state
    let contextInfo = `
Current Flywheel Step: ${currentStep} - ${stepInfo.name}
Step Description: ${stepInfo.description}

Cycle Data:
- Status: ${cycle.status}
- Current Step: ${cycle.currentStep}
`;

    if (cycle.problem) {
      contextInfo += `
Problem:
- Statement: ${cycle.problem.statement || 'Not yet defined'}
- Refined Statement: ${cycle.problem.refinedStatement || 'Not yet refined'}
- Pain Level: ${cycle.problem.painLevel || 'Not rated'}/10
- Frequency: ${cycle.problem.frequency || 'Not specified'}
`;
    }

    if (cycle.context) {
      contextInfo += `
Context:
- Who: ${cycle.context.who || 'Not specified'}
- When: ${cycle.context.when || 'Not specified'}
- How Painful: ${cycle.context.howPainful || 'Not rated'}/10
- Current Solution: ${cycle.context.currentSolution || 'None specified'}
`;
    }

    if (cycle.valueAssessment) {
      contextInfo += `
Value Assessment:
- Desperate User Score: ${cycle.valueAssessment.desperateUserScore}/100
- Decision: ${cycle.valueAssessment.decision}
`;
    }

    if (cycle.workflowClassification) {
      contextInfo += `
Workflow Classification:
- Type: ${cycle.workflowClassification.selectedType}
- Reasoning: ${cycle.workflowClassification.reasoning}
`;
    }

    if (cycle.build) {
      contextInfo += `
Build:
- Lovable URL: ${cycle.build.lovableUrl || 'Not linked'}
- Project URL: ${cycle.build.projectUrl || 'Not deployed'}
`;
    }

    // Build Appathon-specific context if enabled
    let appathonContext = '';
    if (isAppathonMode) {
      const stepGuidance = getAppathonStepGuidance(currentStep);
      const contextualTips = getContextualAppathonTips();
      appathonContext = `

${APPATHON_COACH_CONTEXT}

## Current Step Guidance for Appathon
${stepGuidance}

## Today's Tips
${contextualTips.map((tip) => `- ${tip}`).join('\n')}
`;
    }

    const systemPrompt = `You are an AI Coach for the JKKN Solution Studio application. Your role is to guide users through the 8-step Problem-to-Impact Flywheel methodology.

Your persona:
- Friendly, encouraging, and practical
- Ask clarifying questions to help users think deeper
- Give actionable advice, not generic platitudes
- Keep responses concise (2-4 paragraphs max)
- Use the Socratic method - ask questions that lead to insights
- Celebrate small wins and progress

The 8 Flywheel Steps:
1. Problem Discovery - Find a problem worth solving through 5 key questions
2. Context Discovery - Understand who, when, and how painful the problem is
3. Value Discovery - Apply the Desperate User Test to validate demand
4. Workflow Classification - Identify which of 10 workflow types fits best
5. Prompt Generation - Generate a Lovable-ready prompt for building
6. Building - Build the solution with Lovable AI
7. Deployment - Deploy and get the solution live
8. Impact Discovery - Measure results and discover new problems (completing the flywheel)

Key principles to reinforce:
- Problems are the currency of innovation
- Build for desperate users, not merely interested ones
- Ship fast, iterate faster
- Every solution reveals new problems (the flywheel effect)
- Validate before building
- Use JKKN terminology: "Learners" not "students", "Learning Facilitators" not "teachers"
${appathonContext}
Current user context:
${contextInfo}

Help the user succeed at their current step. If they're stuck, help them move forward. If they're confused, clarify. If they need encouragement, provide it. Always relate your advice back to the flywheel methodology.${isAppathonMode ? ' Remember: The user is in Appathon 2.0 competition mode. Prioritize advice that helps them win: focus on judging criteria, time constraints, and demo-ready deliverables.' : ''}`;

    // Use Gemini with user's credentials
    const geminiProvider = new GeminiProvider(geminiCredentials);

    // Combine conversation history for Gemini
    const conversationHistory = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = `${conversationHistory}`;

    const response = await geminiProvider.query(fullPrompt, {
      systemPrompt,
      model: 'gemini-2.0-flash',
      maxTokens: 1024,
      temperature: 0.7,
    });

    return NextResponse.json({
      message: response.content,
      provider: 'gemini'
    });
  } catch (error) {
    console.error('Coach API error:', error);

    // Check if it's a credential error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Invalid')) {
      return NextResponse.json(
        {
          error: 'Gemini credentials expired or invalid',
          message: 'Please reconnect your Google account in Settings.',
          requiresSetup: true
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
