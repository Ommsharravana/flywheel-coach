import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface BYOSConnection {
  provider: string;
  metadata: Record<string, unknown> | null;
  expires_at: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all BYOS connections for this user
    const { data: connections } = await supabase
      .from('byos_connections')
      .select('provider, metadata, expires_at')
      .eq('user_id', user.id) as { data: BYOSConnection[] | null };

    const status: Record<string, { connected: boolean; metadata?: Record<string, unknown> }> = {
      supabase: { connected: false },
      github: { connected: false },
      vercel: { connected: false },
    };

    if (connections) {
      for (const conn of connections) {
        status[conn.provider] = {
          connected: true,
          metadata: conn.metadata as Record<string, unknown>,
        };
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('BYOS status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
