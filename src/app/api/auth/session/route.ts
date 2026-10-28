import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { parseAndVerifyToken } from '@/lib/auth/authUtils';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('kpf_session');

    // 1. Check authoritative signed session cookie first
    if (sessionCookie && sessionCookie.value) {
      const verified = await parseAndVerifyToken(sessionCookie.value);
      if (verified.valid) {
        return NextResponse.json({
          authenticated: true,
          userId: verified.userId,
          role: verified.role || 'manager',
          token: sessionCookie.value,
        });
      }
    }

    // 2. Check Supabase session safely if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createServerSupabaseClient();
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session) {
            return NextResponse.json({
              authenticated: true,
              session,
              role: session.user?.user_metadata?.role || 'manager',
            });
          }
        }
      } catch (err) {
        // Fall through to 401 unauthenticated
      }
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error?.message || 'Authentication check failed' },
      { status: 500 }
    );
  }
}
