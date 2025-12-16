# JKKN Solution Studio

An AI-guided practice platform for the **Problem-to-Impact Flywheel** - teaching users to find problems worth solving and validate solutions through 8 structured steps.

## The 8 Flywheel Steps

1. **Problem Discovery** - Find a problem worth solving through 5 key questions
2. **Context Discovery** - Understand who, when, and how painful the problem is
3. **Value Discovery** - Apply the Desperate User Test to validate demand
4. **Workflow Classification** - Identify which of 10 workflow types fits best
5. **Prompt Generation** - Generate a Lovable-ready prompt for building
6. **Building** - Build the solution with Lovable AI
7. **Deployment** - Deploy and get the solution live
8. **Impact Discovery** - Measure results and discover new problems

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL, Auth)
- **AI:** Claude API (Anthropic)
- **Styling:** Tailwind CSS + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Anthropic API key

### Local Development

```bash
# Clone and install
git clone <repo>
cd flywheel-coach
npm install

# Start local Supabase
supabase start

# Copy env and add your API keys
cp .env.local.example .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Claude API key (server-side only) |

## Deployment

### Vercel + Supabase Cloud

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration from `supabase/migrations/001_initial_schema.sql`
3. Deploy to Vercel: `vercel`
4. Set environment variables in Vercel Dashboard
5. Configure auth redirect URLs in Supabase

## Project Structure

```
app/
  (auth)/          # Login/Signup pages
  api/coach/       # AI Coach API endpoint
  cycle/           # Cycle pages (view, step navigation)
  dashboard/       # Main dashboard
  portfolio/       # Completed cycles showcase

components/
  flywheel/        # FlywheelNavigator, FlywheelCard
  shared/          # Header, Logo
  steps/           # All 8 step components
  ui/              # shadcn/ui components

lib/
  supabase/        # Database client helpers
  types/           # TypeScript types
```

## Features

- Complete 8-step flywheel methodology
- AI Coach with step-specific guidance
- Progress tracking and persistence
- Portfolio of completed cycles
- Impact measurement and analytics
