import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createServerSupabaseClient();
        if (supabase) {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?reset=true`,
          });

          if (error) {
            console.warn('Supabase resetPasswordForEmail notice:', error.message);
          }
        }
      } catch (err) {
        // Fall back to farm self-service notice
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset request processed. If your account is registered, instructions have been prepared.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Reset request failed' },
      { status: 500 }
    );
  }
}
