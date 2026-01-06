import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/problems/industry-submit - Submit a problem as an industry partner
// This endpoint is public - no authentication required
// Submissions go to 'pending' approval status
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const {
      title,
      problem_statement,
      theme,
      who_affected,
      when_occurs,
      where_occurs,
      current_workaround,
      severity_rating,
      // Industry partner info
      partner_name,
      partner_email,
      partner_company,
      partner_phone,
      // Optional budget
      budget_amount,
      budget_currency = 'INR',
    } = body;

    // Validate required fields
    if (!title || !problem_statement) {
      return NextResponse.json(
        { error: 'Title and problem statement are required' },
        { status: 400 }
      );
    }

    if (!partner_name || !partner_email || !partner_company) {
      return NextResponse.json(
        { error: 'Partner name, email, and company are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partner_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Insert into problem_bank with 'pending' approval status
    // Using service role for unauthenticated insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newProblem, error: insertError } = await (supabase as any)
      .from('problem_bank')
      .insert({
        source_type: 'industry',
        source_year: new Date().getFullYear(),
        approval_status: 'pending',

        title: title.substring(0, 200),
        problem_statement: problem_statement,
        theme: theme || 'other',

        who_affected: who_affected || null,
        when_occurs: when_occurs || null,
        where_occurs: where_occurs || null,
        current_workaround: current_workaround || null,
        severity_rating: severity_rating || null,

        // Industry partner info
        industry_partner_name: partner_name,
        industry_partner_email: partner_email,
        industry_partner_company: partner_company,
        industry_partner_phone: partner_phone || null,

        // Budget info
        budget_amount: budget_amount || null,
        budget_currency: budget_currency,

        validation_status: 'unvalidated',
        users_interviewed: 0,
        desperate_user_count: 0,

        // No user reference for industry submissions
        submitted_by: null,
        institution_id: null,

        status: 'open',
        is_open_for_attempts: true,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting industry problem:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit problem', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      problem_id: newProblem.id,
      message: 'Problem submitted successfully! Our team will review it and get back to you.',
      status: 'pending_review',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/problems/industry-submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
