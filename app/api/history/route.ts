import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get active user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch analysis logs ordered by created_at DESC
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      if (error.code === 'PGRST205') {
        return NextResponse.json({ 
          error: "Supabase table 'analysis_history' is missing. Please run the SQL migration script in your Supabase SQL editor.",
          code: 'TABLE_MISSING'
        }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, history: data || [] });
  } catch (error: any) {
    console.error('History GET endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get active user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { problem_name, code_snippet, bug_type, diagnostic_summary } = body;

    if (!problem_name || !code_snippet || !bug_type || !diagnostic_summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save history log
    const { data, error } = await supabase
      .from('analysis_history')
      .insert([
        {
          user_id: user.id,
          problem_name,
          code_snippet,
          bug_type,
          diagnostic_summary
        }
      ])
      .select();

    if (error) {
      console.error('Error saving history:', error);
      if (error.code === 'PGRST205') {
        return NextResponse.json({ 
          error: "Supabase table 'analysis_history' is missing. Please run the SQL migration script in your Supabase SQL editor.",
          code: 'TABLE_MISSING'
        }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: any) {
    console.error('History POST endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get active user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing log ID' }, { status: 400 });
    }

    // Delete history log matching id and user_id (security check)
    const { data, error } = await supabase
      .from('analysis_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error deleting history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: data?.[0] });
  } catch (error: any) {
    console.error('History DELETE endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
