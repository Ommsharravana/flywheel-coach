import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, institution, source, goals, challengeSlug } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert interest record (table created by migration, not in generated types yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('challenge_interest')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone,
        institution,
        source,
        goals,
        challenge_slug: challengeSlug || 'february-2026',
      });

    if (error) {
      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already registered your interest for this challenge!' },
          { status: 409 }
        );
      }
      console.error('Error submitting interest:', error);
      return NextResponse.json(
        { error: 'Failed to submit interest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Interest registered successfully! We\'ll notify you when registration opens.',
    });
  } catch (error) {
    console.error('Challenge interest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get interest stats (admin only)
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (!userData || !['super_admin', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get stats (function created by migration, not in generated types yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stats, error } = await (supabase as any)
      .rpc('get_challenge_interest_stats', { p_challenge_slug: 'february-2026' });

    if (error) {
      console.error('Error fetching stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats?.[0] || { total_interested: 0, by_institution: [], sources: [] });
  } catch (error) {
    console.error('Challenge interest stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
