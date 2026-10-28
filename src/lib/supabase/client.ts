import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  // Reject placeholder values commonly copied from .env.example
  try {
    const parsed = new URL(supabaseUrl);
    if (!parsed.protocol.startsWith('http')) return false;
    if (
      parsed.hostname.includes('your-project') ||
      parsed.hostname.includes('example.com') ||
      parsed.hostname.includes('placeholder') ||
      !parsed.hostname.includes('.')
    ) {
      return false;
    }
  } catch {
    return false;
  }

  // A genuine Supabase anon key is a JWT (starts with eyJ, length >= 50, no literal '...')
  if (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.includes('...') || supabaseAnonKey.length < 50) {
    return false;
  }

  return true;
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    // When Supabase environment variables are not yet provided or are placeholders, return null
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
