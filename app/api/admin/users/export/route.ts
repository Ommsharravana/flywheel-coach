import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface UserExportRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  department: string | null;
  year: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRoleRow {
  role: string;
}

// GET: Export users to CSV
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role
    const { data: adminDataRaw } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminData = adminDataRaw as unknown as UserRoleRow | null;
    if (!adminData || adminData.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Build query
    let query = supabase
      .from('users')
      .select('id, email, name, role, department, year, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Export error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const usersData = (users || []) as unknown as UserExportRow[];

    // Generate CSV
    const headers = [
      'ID',
      'Email',
      'Name',
      'Role',
      'Department',
      'Year',
      'Created At',
      'Updated At',
    ];

    const rows = usersData.map((u) => [
      u.id,
      u.email,
      u.name || '',
      u.role,
      u.department || '',
      u.year || '',
      new Date(u.created_at).toISOString(),
      new Date(u.updated_at).toISOString(),
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Log activity (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: 'users_exported',
      entity_type: 'user',
      entity_id: null,
      details: {
        count: usersData.length,
        filter_role: role,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Return CSV file
    const filename = `flywheel-users-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 });
  }
}
