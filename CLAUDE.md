# JKKN Solution Studio - Project Instructions

## Framework Reference
**CRITICAL:** The complete Problem-to-Impact Flywheel framework is at:
`/Users/omm/Vaults/JKKNKB/Initiatives/Vibe-Coding/02-Guides/Problem-to-Impact-Flywheel.md`

**PRD for this app:** `/Users/omm/Vaults/JKKNKB/Initiatives/Vibe-Coding/07-Flywheel-Coach/PRD.md`

**MANDATORY CHECK:** Before marking any feature complete, verify against PRD for:
- All sub-features implemented
- UI text matches PRD exactly
- Edge cases handled as specified
- User flows match PRD sequences
- Business rules implemented as IF-THEN logic

## Quick Start
```bash
cd ~/PROJECTS/flywheel-coach
npm run dev
```
Open http://localhost:3000

## Testing
```bash
npm run build    # Check for build errors
npm run lint     # Check for linting issues
```

## What This App Does
An AI-guided practice platform for the Problem-to-Impact Flywheel - teaching users to find problems worth solving and validate solutions through 8 structured steps.

## Tech Stack
- Next.js 14 (App Router)
- Supabase (PostgreSQL, Auth, Edge Functions)
- Gemini API (Google) - BYOS pattern (users bring their own subscription)
- Tailwind CSS + shadcn/ui

## AI Architecture: BYOS (Bring Your Own Subscription)
Users must connect their Google account to enable AI features. The app uses their Gemini subscription - no platform API keys needed.

**How it works:**
1. User clicks "Sign in with Google" in Settings
2. Google OAuth flow grants Gemini API access
3. Credentials are encrypted and stored in Supabase
4. All AI features use user's Google subscription

**No fallback:** AI features are blocked until user connects Google account.

## Key Files
- `/app/` - Next.js app router pages
- `/components/flywheel/` - Core flywheel components
- `/components/steps/` - Step-specific modules
- `/lib/supabase/` - Database client and types
- `/lib/prompts/` - AI system prompts
- `/supabase/functions/` - Edge functions

## Database
Schema in `/supabase/migrations/001_initial_schema.sql`

## Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- CREDENTIAL_ENCRYPTION_KEY (32 bytes hex for AES-256 encryption)
- GOOGLE_GEMINI_CLIENT_ID (for Google OAuth)
- GOOGLE_GEMINI_CLIENT_SECRET (for Google OAuth)
- NEXT_PUBLIC_APP_URL (your app URL, e.g., http://localhost:3000)

**Note:** No ANTHROPIC_API_KEY or GEMINI_API_KEY needed - users bring their own via OAuth.

### Local Development (Docker)
```bash
supabase start           # Start local Supabase
# Use credentials from supabase status output
```

### Production Deployment

**1. Supabase Cloud Setup:**
- Create project at https://supabase.com/dashboard
- Run migration: Copy `supabase/migrations/001_initial_schema.sql` to SQL Editor
- Get credentials from Settings > API

**2. Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - CREDENTIAL_ENCRYPTION_KEY
# - GOOGLE_GEMINI_CLIENT_ID
# - GOOGLE_GEMINI_CLIENT_SECRET
# - NEXT_PUBLIC_APP_URL (your Vercel domain)
```

**3. Configure Auth:**
- In Supabase Dashboard > Authentication > URL Configuration
- Set Site URL to your Vercel domain
- Add Vercel URLs to Redirect URLs

## Project Rules
1. Use JKKN terminology (Learners, Senior Learners)
2. Mobile-first design
3. Works on slow internet (2G compatible)
4. AI Coach guides, doesn't do work for user
5. Save progress at every step

## The 8 Flywheel Steps
1. Problem Discovery - 5 questions + problem statement
2. Context Discovery - Who, When, How painful
3. Value Discovery - Desperate User Test
4. Workflow Classification - 10 workflow types
5. Prompt Generation - Lovable-ready prompt (see Prompt Methodology below)
6. Building - Link to Lovable project
7. Deployment - Live URL
8. Impact Discovery - Measure results

## Step 5: Prompt Methodology (Key Concepts)

### The Prompt Pipeline
Complex apps require 20-50+ prompts, not one. The pipeline is:
1. **Project Knowledge** → What context does AI need?
2. **Prompt Architecture** → How many prompts? What order?
3. **Iterative Building** → Prompts 1-N with recovery

### Three Phases of Building
| Phase | Prompts | Focus |
|-------|---------|-------|
| Foundation | 1-5 | Data model, structure, auth, navigation, core layout |
| Features | 6-N | One user flow per prompt |
| Polish | Final | Errors, edge cases, UI refinement |

### Project Knowledge Document
Before ANY prompts, gather:
- Problem Statement
- Domain/Industry terminology
- User Personas (who, needs, tech comfort)
- Data Model Sketch (entities, relationships)
- User Flows (priority order)
- Technical Requirements (auth, integrations, mobile)
- Design Preferences
- Constraints & Rules

### Foundation Prompts (Prompts 1-5)
1. **Project Setup + Data Model** - Basic structure
2. **Authentication** - Roles, protected routes
3. **Navigation & Layout** - Pages, placeholders

### Incremental Feature Prompts
**Pattern:** One user flow per prompt
```
We have built: [list what exists]

Now add: [SPECIFIC FEATURE]

User flow:
1. User [action 1]
2. System [response]
...

Include: [UI elements, validation, errors]
Keep existing [components] unchanged.
```

### Context Preservation Patterns
Context degrades after 20+ prompts. Use these:
- **Context Summary** (every 5-10 prompts)
- **Reference Existing Components** by name
- **Copy-Paste Current State** when context is lost
- **Start Fresh Thread** with summary if degraded

### Recovery Patterns
1. **Undo Last Change** - Restore to working state
2. **Partial Rebuild** - Rebuild one component from scratch
3. **Diagnose Before Fixing** - Ask what might be causing it
4. **Full Component Restart** - DELETE and build fresh
5. **Rollback via Git** - Use Lovable's History feature

### Workflow-Specific Prompt Sequences
Each of the 10 workflow types has an optimal prompt sequence:

| Workflow | Prompt Sequence |
|----------|-----------------|
| Audit | Foundation → Input → Criteria → Scoring → History → Export → Polish |
| Orchestration | Foundation → Workflow def → Trigger → Tracking → Transitions → Notifications → Exceptions → Polish |
| Extraction | Foundation → Upload → Extraction → Verification → Export → History → Polish |
| Recommendation | Foundation → Input → Matching → Display → Comparison → Action → History → Polish |

### Prompt Quality Checklist
Before sending ANY prompt, verify:
- [ ] One clear request (not multiple)?
- [ ] What already exists mentioned?
- [ ] Which page/component to modify?
- [ ] Exact user flow (steps)?
- [ ] UI elements needed?
- [ ] Validation rules?
- [ ] Error handling?
- [ ] What NOT to change?

## The 10 Workflow Types
| Type | Purpose | Example |
|------|---------|---------|
| Audit | Evaluate quality | Grading consistency check |
| Generation | Create content | Question paper generator |
| Transformation | Convert format | Transcript to notes |
| Classification | Categorize/route | Query auto-routing |
| Extraction | Pull structured from unstructured | Resume parser |
| Synthesis | Combine sources | Feedback themes |
| Prediction | Forecast outcomes | Dropout risk |
| Recommendation | Suggest actions | Next best action |
| Monitoring | Continuous observation | Attendance anomaly |
| Orchestration | Coordinate steps | Onboarding workflow |

## Hybrid Workflow Patterns
Common powerful combinations:
- **Extraction + Recommendation** - Process data, suggest actions
- **Monitoring + Orchestration** - Detect conditions, trigger workflows
- **Classification + Orchestration** - Auto-route, manage workflow
- **Prediction + Monitoring** - Predict risks, monitor for confirmation
- **Generation + Audit** - Create content, quality-check it
