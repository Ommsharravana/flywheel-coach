import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getDemoDayState, getTrackSubmissions } from '@/lib/admin/demo-day/services';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Event details for context
const EVENT_CONTEXT = {
  name: 'Appathon 2.0 Demo Day',
  date: 'January 7, 2026',
  time: '9:30 AM - 4:00 PM IST',
  venue: 'JKKN Campus',
  prizePool: 'Rs. 63,000',
  organization: 'JKKN Institutions',
  tagline: 'India\'s First Human-AI AGI Collab Campus',
  principle: 'Humans are Principals, AI are Agents',
};

// Judging criteria with weights (for judge briefings)
const JUDGING_CRITERIA = [
  { name: 'Problem Impact', weight: 20, description: 'How significant is the problem being solved?' },
  { name: 'Solution Innovation', weight: 20, description: 'Is the solution creative and novel?' },
  { name: 'Working Prototype', weight: 25, description: 'Does the app actually work and demonstrate core functionality?' },
  { name: 'User Validation', weight: 15, description: 'Has the team validated with real users?' },
  { name: 'Presentation Quality', weight: 10, description: 'Clear communication and demo delivery' },
  { name: 'Bioconvergence Alignment', weight: 10, description: 'Connection to JKKN\'s bioconvergence mission' },
];

// Bonus criteria
const BONUS_CRITERIA = [
  { name: 'Cross-Disciplinary Team', bonus: '+5%', description: 'Team members from different disciplines (e.g., Engineering + Pharmacy)' },
  { name: 'Cross-Institutional Collab', bonus: '+5%', description: 'Collaboration across JKKN institutions' },
  { name: 'First-Year Participants', bonus: '+3%', description: 'Team includes first-year learners' },
  { name: 'User Testimonials', bonus: '+2%', description: 'Real user testimonials presented during demo' },
];

// Content type definitions
type ContentType =
  | 'judge-briefing'
  | 'participant-email-slot-confirmed'
  | 'participant-email-reminder'
  | 'participant-email-results'
  | 'track-summary';

interface GenerateContentRequest {
  content_type: ContentType;
  context?: {
    trackId?: string;
    participantName?: string;
    demoTime?: string;
    trackName?: string;
  };
}

// Build system prompt based on content type
function buildSystemPrompt(contentType: ContentType): string {
  const basePrompt = `You are a communications specialist for JKKN Institutions, writing content for Appathon 2.0 Demo Day.

BRAND VOICE GUIDELINES:
- Progressive, innovative, learner-centric
- Use "Learners" not "Students"
- Use "Senior Learners" for faculty/teachers
- Emphasize bioconvergence and interdisciplinary collaboration
- Mention JKKN's principle: "Humans are Principals, AI are Agents"

EVENT DETAILS:
- Event: ${EVENT_CONTEXT.name}
- Date: ${EVENT_CONTEXT.date}
- Time: ${EVENT_CONTEXT.time}
- Venue: ${EVENT_CONTEXT.venue}
- Prize Pool: ${EVENT_CONTEXT.prizePool}
- Organization: ${EVENT_CONTEXT.organization}

Write in a professional yet warm tone. Content should be immediately usable with minimal editing.
Do NOT use markdown formatting - write in plain text suitable for emails/documents.`;

  return basePrompt;
}

// Build user prompt based on content type and context
function buildUserPrompt(
  contentType: ContentType,
  context: GenerateContentRequest['context'],
  stateData?: { trackCount?: number; appCount?: number; trackApps?: Array<{ app_name: string; category: string }> }
): string {
  switch (contentType) {
    case 'judge-briefing':
      return `Write a comprehensive Judge Briefing document for Appathon 2.0 Demo Day.

Include these sections:
1. Welcome and Overview - Brief intro to the event and its significance
2. Event Schedule - Demo Day timeline
3. Your Role as Judge - What we expect from judges
4. Judging Criteria with Weights:
${JUDGING_CRITERIA.map(c => `   - ${c.name} (${c.weight}%): ${c.description}`).join('\n')}

5. Scoring Guidelines - Explain what scores 1-10 mean:
   - 1-3: Does not meet expectations
   - 4-5: Partially meets expectations
   - 6-7: Meets expectations
   - 8-9: Exceeds expectations
   - 10: Exceptional, outstanding

6. Bonus Points:
${BONUS_CRITERIA.map(b => `   - ${b.name} (${b.bonus}): ${b.description}`).join('\n')}

7. How to Use the Judging App - Brief instructions
8. Important Reminders - Be fair, ask questions, provide constructive feedback

Make it about 1 page, professional but encouraging.`;

    case 'participant-email-slot-confirmed':
      return `Write an email to a participant confirming their demo slot.

Details to include:
- Participant/Team: ${context?.participantName || '[Team Name]'}
- Demo Time: ${context?.demoTime || '[Time]'}
- Track: ${context?.trackName || '[Track Name]'}
- Venue: ${EVENT_CONTEXT.venue}

Email should:
1. Congratulate them on making it to Demo Day
2. Confirm their slot details clearly
3. List what to prepare (working demo, brief presentation, be ready 10 min early)
4. Mention technical requirements (bring laptop, have backup plan)
5. End with encouragement

Keep it concise - about 200 words.`;

    case 'participant-email-reminder':
      return `Write a reminder email for participants - Demo Day is tomorrow!

Email should:
1. Build excitement - "Tomorrow is the big day!"
2. Remind them of their slot time (${context?.demoTime || 'check the schedule'})
3. Quick checklist:
   - Charge laptop
   - Test your demo one more time
   - Prepare 3-minute pitch
   - Arrive 15 minutes early
4. Venue reminder: ${EVENT_CONTEXT.venue}
5. Mention prize pool: ${EVENT_CONTEXT.prizePool}
6. Encouraging closing - you've built something amazing!

Keep it energetic but concise - about 150 words.`;

    case 'participant-email-results':
      return `Write an email announcing that Demo Day results are now live!

Email should:
1. Thank everyone for participating
2. Celebrate what was achieved (apps built, problems solved)
3. Announce that results are now live on the app
4. Mention that all participants receive certificates
5. Tease upcoming opportunities (NIF incubation, more events)
6. Remind them this is just the beginning of their builder journey
7. Link to results: [Results Page Link]

Tone: Celebratory but inclusive - everyone who participated is a winner.
About 200 words.`;

    case 'track-summary':
      const apps = stateData?.trackApps || [];
      const appList = apps.length > 0
        ? apps.map(a => `- ${a.app_name} (${a.category})`).join('\n')
        : '- No apps assigned yet';

      return `Generate a Track Summary for: ${context?.trackName || '[Track Name]'}

Apps in this track:
${appList}

Write a brief summary (about 150 words) that:
1. States the track name and theme
2. Mentions how many apps are in this track (${apps.length})
3. Identifies common problem themes across the apps
4. Highlights 1-2 interesting approaches or standout apps
5. Notes any patterns (e.g., health apps, productivity tools)

This will be used by judges to get a quick overview before judging begins.`;

    default:
      return 'Generate helpful content for Demo Day.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body: GenerateContentRequest = await request.json();
    const { content_type, context } = body;

    if (!content_type) {
      return NextResponse.json({ error: 'content_type is required' }, { status: 400 });
    }

    // Fetch additional data for track summary
    const stateData: { trackCount?: number; appCount?: number; trackApps?: Array<{ app_name: string; category: string }> } = {};

    if (content_type === 'track-summary' && context?.trackId) {
      try {
        const trackSubmissions = await getTrackSubmissions(supabase, context.trackId);
        stateData.trackApps = trackSubmissions.map(s => ({
          app_name: s.app_name,
          category: s.category,
        }));
      } catch (error) {
        console.error('Error fetching track data:', error);
      }
    }

    // Generate content using Claude
    const systemPrompt = buildSystemPrompt(content_type);
    const userPrompt = buildUserPrompt(content_type, context, stateData);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Extract text from response
    const generatedContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return NextResponse.json({
      success: true,
      data: {
        content: generatedContent,
        content_type,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
