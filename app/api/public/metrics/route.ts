import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface PublicMetrics {
  startupsIncubated: number;
  learnerEarnings: number;
  activeBuilders: number;
  problemsSolved: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Active builders (users who have started at least one cycle)
    const { count: buildersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Startups incubated (NIF applications with status 'active')
    const { count: startupsCount } = await supabase
      .from('nif_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Problems solved (completed cycles)
    const { count: completedCount } = await supabase
      .from('cycles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Learner earnings (future: sum from industry projects)
    // For now, this is 0 since P08 Industry Projects isn't implemented yet
    // Once implemented, this will sum from completed industry project payments
    const learnerEarnings = 0;

    const metrics: PublicMetrics = {
      startupsIncubated: startupsCount || 0,
      learnerEarnings,
      activeBuilders: buildersCount || 0,
      problemsSolved: completedCount || 0,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching public metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
