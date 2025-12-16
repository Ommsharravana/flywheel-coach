import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Cycle, FLYWHEEL_STEPS } from '@/lib/types/cycle';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CoachRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  cycle: Cycle;
  currentStep: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CoachRequest = await request.json();
    const { messages, cycle, currentStep } = body;

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

Current user context:
${contextInfo}

Help the user succeed at their current step. If they're stuck, help them move forward. If they're confused, clarify. If they need encouragement, provide it. Always relate your advice back to the flywheel methodology.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');
    const message = textContent?.text || 'I apologize, but I could not generate a response.';

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
