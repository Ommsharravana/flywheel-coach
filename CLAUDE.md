# Flywheel Coach - Project Instructions

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
- Claude API (Anthropic)
- Tailwind CSS + shadcn/ui

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
- ANTHROPIC_API_KEY

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
5. Prompt Generation - Lovable-ready prompt
6. Building - Link to Lovable project
7. Deployment - Live URL
8. Impact Discovery - Measure results
