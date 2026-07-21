import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

function mapCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getCurrentStaff() {
  const cookieStore = await cookies();
  const userSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase()
    .from('staff')
    .select('id, name, email, role')
    .eq('auth_uid', user.id)
    .single();
  return data;
}

// Returns the resolved staff record on success so callers can reuse it (e.g.
// for logAudit) instead of re-resolving the same identity a second time.
async function requireAdmin(): Promise<NextResponse | { id: string; name: string; email: string; role: string }> {
  const requester = await getCurrentStaff();
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (requester.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }
  return requester;
}

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('expense_categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data.map(mapCategory));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { name, description } = await req.json();
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    const { data, error } = await supabase()
      .from('expense_categories')
      .insert([{ name: String(name).trim(), description: description || null }])
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'expense_category_created', { name }, admin);
    return NextResponse.json(mapCategory(data), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
