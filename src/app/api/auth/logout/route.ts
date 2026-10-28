import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST() {
  try {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createServerSupabaseClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        // Ignore supabase signout errors during session clearance
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Invalidate session cookies
    response.cookies.set('kpf_session', '', {
      path: '/',
      maxAge: 0,
    });
    response.cookies.set('kpf_role', '', {
      path: '/',
      maxAge: 0,
    });
    response.cookies.set('kpf_user_id', '', {
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
