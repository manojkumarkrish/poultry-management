import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseAndVerifyToken } from '@/lib/auth/authUtils';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
      return NextResponse.json({
        authenticated: true,
        session,
        role: session.user?.user_metadata?.role || 'manager',
      });
    }

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('kpf_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const verified = await parseAndVerifyToken(sessionCookie.value);
    if (!verified.valid) {
      return NextResponse.json(
        { authenticated: false, error: 'Session token invalid, forged, or expired.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      userId: verified.userId,
      role: verified.role || 'manager',
      token: sessionCookie.value,
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
