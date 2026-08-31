import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration for GraceGrid frontend.
 * Reads public anonymous credentials from Vite environment variables.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[GraceGrid Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file. Please configure them to connect to your Supabase backend.'
  );
}

// Initialize Supabase Client instance (fallback URL prevents crash if env is unset in dev)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export default supabase;
