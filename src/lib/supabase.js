import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration for GraceGrid frontend.
 * Reads public anonymous credentials from Vite environment variables.
 */
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Clean URL (strip trailing slashes or accidental /rest/v1 paths)
const cleanedUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const isSupabaseConfigured = Boolean(
  cleanedUrl &&
  rawAnonKey &&
  cleanedUrl !== 'https://your-project-ref.supabase.co' &&
  rawAnonKey !== 'your-anon-key-here'
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[GraceGrid Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local file. Please configure them to connect to your Supabase backend.'
  );
}

// Initialize Supabase Client instance (fallback URL prevents crash if env is unset in dev)
export const supabase = createClient(
  cleanedUrl || 'https://placeholder.supabase.co',
  rawAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
