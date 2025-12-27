import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  Target,
  Database,
  ArrowRight,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { InstitutionLeaderboard } from '@/components/problem-bank/InstitutionLeaderboard';
import { getMethodologyForEvent } from '@/lib/methodologies';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get event by slug
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as { data: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      start_date: string | null;
      end_date: string | null;
      config: Record<string, unknown>;
      is_active: boolean;
    } | null; error: unknown };

  if (error || !event) {
    redirect('/');
  }

  // Get methodology for this event
  const methodology = getMethodologyForEvent(event.config);

  // Get event statistics using RPC (bypasses RLS for public pages)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: statsData } = await (supabase as any)
    .rpc('get_event_stats', { target_event_slug: slug });

  const stats = (statsData as {
    total_participants: number;
    total_cycles: number;
    total_problems: number;
  }[])?.[0];

  const participantCount = stats?.total_participants || 0;
  const cycleCount = stats?.total_cycles || 0;
  const problemCount = stats?.total_problems || 0;

  // Calculate event status
  const now = new Date();
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  let eventStatus: 'upcoming' | 'active' | 'ended' = 'active';
  if (startDate && now < startDate) {
    eventStatus = 'upcoming';
  } else if (endDate && now > endDate) {
    eventStatus = 'ended';
  }

  const statusConfig = {
    upcoming: { label: 'Upcoming', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    active: { label: 'Active Now', color: 'text-green-400 bg-green-500/20 border-green-500/30' },
    ended: { label: 'Completed', color: 'text-stone-400 bg-stone-500/20 border-stone-500/30' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className={`mb-4 ${statusConfig[eventStatus].color}`}>
            {eventStatus === 'active' && <Play className="h-3 w-3 mr-1 fill-current" />}
            {eventStatus === 'upcoming' && <Clock className="h-3 w-3 mr-1" />}
            {eventStatus === 'ended' && <CheckCircle className="h-3 w-3 mr-1" />}
            {statusConfig[eventStatus].label}
          </Badge>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-10 w-10 text-amber-400" />
            <h1 className="text-5xl font-display font-bold text-stone-100">{event.name}</h1>
          </div>

          {event.description && (
            <p className="text-stone-400 text-lg max-w-3xl mx-auto mb-6">{event.description}</p>
          )}

          {/* Event Dates */}
          {(startDate || endDate) && (
            <div className="flex items-center justify-center gap-4 text-stone-500 mb-8">
              <Calendar className="h-4 w-4" />
              <span>
                {startDate && startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {startDate && endDate && ' - '}
                {endDate && endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link href={`/events/${slug}/problems`}>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900">
                <Database className="h-5 w-5 mr-2" />
                Browse Problem Bank
              </Button>
            </Link>
            {eventStatus !== 'ended' && (
              <Link href="/cycle/new">
                <Button size="lg" variant="outline" className="border-stone-700 text-stone-200">
                  Start New Cycle
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-500/20">
                  <Users className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-stone-100">{participantCount || 0}</div>
                  <p className="text-sm text-stone-500">Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Target className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-stone-100">{cycleCount || 0}</div>
                  <p className="text-sm text-stone-500">Cycles Started</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <Database className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-stone-100">{problemCount || 0}</div>
                  <p className="text-sm text-stone-500">Problems Banked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-stone-100">{methodology.steps.length}</div>
                  <p className="text-sm text-stone-500">Step Methodology</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Methodology & Leaderboard */}
        <div className="grid gap-6 lg:grid-cols-3 mb-12">
          {/* Methodology Steps */}
          <div className="lg:col-span-2">
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-xl text-stone-100">
                  {methodology.name}
                </CardTitle>
                <p className="text-stone-400">{methodology.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {methodology.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-stone-800/50 border border-stone-700/50"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${step.color}20` }}
                      >
                        {step.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-stone-100">
                          Step {index + 1}: {step.shortName}
                        </div>
                        <div className="text-xs text-stone-500">{step.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <InstitutionLeaderboard eventSlug={slug} />
          </div>
        </div>

        {/* Features */}
        {methodology.features && (
          <Card className="bg-stone-900/50 border-stone-800 mb-12">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Event Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {methodology.features.problemBank && (
                  <Badge variant="outline" className="text-green-400 border-green-500/30">
                    <Database className="h-3 w-3 mr-1" />
                    Problem Bank
                  </Badge>
                )}
                {methodology.features.teamMode && (
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                    <Users className="h-3 w-3 mr-1" />
                    Team Mode
                  </Badge>
                )}
                {methodology.features.submission && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                    <Target className="h-3 w-3 mr-1" />
                    Submissions
                  </Badge>
                )}
                {methodology.features.impactTracking && (
                  <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Impact Tracking
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/30">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold text-stone-100 mb-2">Ready to make an impact?</h2>
            <p className="text-stone-400 mb-6">
              Join {participantCount || 0}+ participants solving real problems
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900">
                  Join Now
                </Button>
              </Link>
              <Link href={`/events/${slug}/problems`}>
                <Button size="lg" variant="outline" className="border-amber-500/30 text-amber-400">
                  Explore Problems
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
