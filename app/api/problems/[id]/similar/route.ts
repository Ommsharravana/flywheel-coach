import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/problems/[id]/similar - Get similar problems based on content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user (optional for public view)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the source problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sourceProblem, error: sourceError } = await (supabase as any)
      .from('problem_bank')
      .select('id, title, problem_statement, theme, search_content')
      .eq('id', id)
      .single();

    if (sourceError || !sourceProblem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Try using the database function first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: similarFromDb, error: funcError } = await (supabase as any)
      .rpc('find_similar_problems', {
        p_problem_id: id,
        p_limit: 5,
      });

    if (!funcError && similarFromDb && similarFromDb.length > 0) {
      // Database function worked
      return NextResponse.json({
        similar: similarFromDb,
        method: 'full_text_search',
      });
    }

    // Fallback: Simple keyword-based matching using theme
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sameTheme, error: themeError } = await (supabase as any)
      .from('problem_bank')
      .select('id, title, problem_statement, theme')
      .eq('theme', sourceProblem.theme)
      .neq('id', id)
      .limit(5);

    if (themeError) {
      console.error('Error fetching similar by theme:', themeError);
    }

    // Also try matching by simple text overlap (title words)
    const titleWords = sourceProblem.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3)
      .slice(0, 5);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let textMatches: any[] = [];
    if (titleWords.length > 0) {
      // Search for problems containing any of the key words
      const searchPattern = titleWords.join('|');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matches } = await (supabase as any)
        .from('problem_bank')
        .select('id, title, problem_statement, theme')
        .neq('id', id)
        .or(`title.ilike.%${titleWords[0]}%,problem_statement.ilike.%${titleWords[0]}%`)
        .limit(5);

      if (matches) {
        textMatches = matches;
      }
    }

    // Combine and deduplicate results
    const seen = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const combined: any[] = [];

    // Add theme matches first (more relevant)
    for (const p of (sameTheme || [])) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        combined.push({
          id: p.id,
          title: p.title,
          problem_statement: p.problem_statement.substring(0, 200),
          theme: p.theme,
          similarity_score: 0.8, // Same theme = high relevance
        });
      }
    }

    // Add text matches
    for (const p of textMatches) {
      if (!seen.has(p.id) && combined.length < 5) {
        seen.add(p.id);
        combined.push({
          id: p.id,
          title: p.title,
          problem_statement: p.problem_statement.substring(0, 200),
          theme: p.theme,
          similarity_score: 0.5, // Text match = medium relevance
        });
      }
    }

    return NextResponse.json({
      similar: combined.slice(0, 5),
      method: 'keyword_fallback',
    });

  } catch (error) {
    console.error('Error in GET /api/problems/[id]/similar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
