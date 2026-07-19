import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Check Supabase session first
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (supabaseUser) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: supabaseUser.id,
          name: supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email,
          role: 'USER',
          streak: 1,
        }
      });
    }

    // Fallback to legacy mock auth
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
