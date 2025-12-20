import { NextRequest, NextResponse } from 'next/server';
import { PROMPT_TEMPLATES } from '@/lib/prompts/templates';
import { createClient } from '@/lib/supabase/server';

interface GeneratePromptsRequest {
  workflowType: string;
  problemStatement: string;
  frequency: string;
  painLevel: number;
  currentSolution: string;
  primaryUsers: string;
  when: string;
  valueAssessment?: {
    desperateUserScore: number;
    criteria: {
      activelySearching: boolean;
      triedAlternatives: boolean;
      willingToPay: boolean;
      urgentNeed: boolean;
      frequentProblem: boolean;
    };
    evidence: {
      activelySearching: string;
      triedAlternatives: string;
      willingToPay: string;
      urgentNeed: string;
      frequentProblem: string;
    };
  };
  customWorkflowDescription?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current session with OAuth provider token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in with Google.' },
        { status: 401 }
      );
    }

    // Get Google OAuth access token from session
    const providerToken = session.provider_token;
    if (!providerToken) {
      return NextResponse.json(
        { error: 'Google OAuth token not available. Please sign in with Google to use AI features.' },
        { status: 400 }
      );
    }

    const body: GeneratePromptsRequest = await request.json();

    const template = PROMPT_TEMPLATES[body.workflowType.toUpperCase()] || PROMPT_TEMPLATES.MONITORING;

    // Build validation context
    let validationContext = '';
    if (body.valueAssessment && body.valueAssessment.desperateUserScore > 0) {
      const va = body.valueAssessment;
      const evidencePoints: string[] = [];

      if (va.criteria.activelySearching && va.evidence.activelySearching) {
        evidencePoints.push(`Users have complained: "${va.evidence.activelySearching}"`);
      }
      if (va.criteria.triedAlternatives && va.evidence.triedAlternatives) {
        evidencePoints.push(`Current workarounds: "${va.evidence.triedAlternatives}"`);
      }
      if (va.criteria.willingToPay && va.evidence.willingToPay) {
        evidencePoints.push(`User excitement: "${va.evidence.willingToPay}"`);
      }
      if (va.criteria.urgentNeed && va.evidence.urgentNeed) {
        evidencePoints.push(`Urgency signals: "${va.evidence.urgentNeed}"`);
      }
      if (va.criteria.frequentProblem && va.evidence.frequentProblem) {
        evidencePoints.push(`Multiple users affected: "${va.evidence.frequentProblem}"`);
      }

      if (evidencePoints.length > 0) {
        validationContext = `
User Validation (Desperate User Score: ${va.desperateUserScore}%):
${evidencePoints.join('\n')}
`;
      }
    }

    const systemPrompt = `You are an expert at writing prompts for Lovable.dev, an AI-powered app builder.
Your job is to generate a sequence of 9 incremental prompts that will guide Lovable to build a complete, production-ready application.

The prompts must follow this structure:
- Prompts 1-3: Foundation (project setup, auth, navigation)
- Prompts 4-7: Features (workflow-specific functionality)
- Prompts 8-9: Polish (error handling, mobile optimization)

Each prompt should:
1. Be specific and actionable
2. Reference what was built in previous prompts
3. Include exact user flows and UI requirements
4. Specify what NOT to change from previous prompts
5. Be tailored to the specific problem and users

Return a JSON array with exactly 9 objects, each having:
- number: 1-9
- phase: "foundation" | "features" | "polish"
- title: short title
- description: one sentence description
- prompt: the full prompt text

IMPORTANT: Make prompts highly specific to the user's problem, users, and validation evidence. Don't be generic.`;

    const userPrompt = `Generate 9 personalized Lovable prompts for this project:

PROJECT CONTEXT:
- Problem: "${body.problemStatement}"
- Primary Users: ${body.primaryUsers}
- When they need it: ${body.when}
- Current workaround: ${body.currentSolution}
- Pain level: ${body.painLevel}/10
- Frequency: ${body.frequency}
- Workflow Type: ${template.name} (${body.workflowType})
${body.customWorkflowDescription ? `- Custom workflow: ${body.customWorkflowDescription}` : ''}

${validationContext}

WORKFLOW ACTIONS (from ${template.name} template):
1. ${template.action1}
2. ${template.action2}
3. ${template.action3}

REQUIRED FEATURES:
${template.features.map(f => `- ${f}`).join('\n')}

CONSTRAINTS:
${template.constraints.map(c => `- ${c}`).join('\n')}

Generate the 9 prompts as a JSON array. Make them specific to "${body.problemStatement}" for "${body.primaryUsers}".`;

    // Call Gemini API with OAuth token
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API error: ${geminiResponse.status}`);
    }

    const result = await geminiResponse.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    // Parse the JSON response
    let prompts;
    try {
      prompts = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        prompts = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Gemini response as JSON');
      }
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate prompts' },
      { status: 500 }
    );
  }
}
