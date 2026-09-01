import { supabase, isSupabaseConfigured } from '../lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TARGET_WAITLIST_USERS = 50;
export const DEFAULT_INITIAL_COUNT = 0;

/**
 * Service function to submit a user to the GraceGrid waitlist.
 * Invokes the Supabase Edge Function `super-task` which securely handles
 * DB insertion into PostgreSQL and transactional welcome email dispatch via Brevo.
 *
 * @param {Object} payload
 * @param {string} payload.fullName
 * @param {string} payload.email
 * @param {string} [payload.role='believer']
 * @returns {Promise<{ success: boolean, message: string, data: any }>}
 */
export async function joinWaitlist({ fullName, email, role = 'believer' }) {
  const trimmedName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const trimmedRole = String(role || 'believer').trim();

  // 1. Client-side input validation
  if (!trimmedName) {
    throw new Error('Please enter your full name.');
  }

  if (trimmedName.length < 2) {
    throw new Error('Full name must be at least 2 characters.');
  }

  if (!normalizedEmail) {
    throw new Error('Please enter your email address.');
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error('Please provide a valid email address.');
  }

  // 2. Check if Supabase client is configured
  if (!isSupabaseConfigured) {
    console.warn(
      '[GraceGrid Waitlist] Supabase environment variables not configured. Simulating response in development mode.'
    );
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const mockData = {
      id: 'dev-simulation-id',
      fullName: trimmedName,
      email: normalizedEmail,
      role: trimmedRole,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gracegrid:waitlist-joined', {
          detail: mockData,
        })
      );
    }

    return {
      success: true,
      message: "🎉 You're officially on the GraceGrid waitlist!",
      data: mockData,
    };
  }

  // 3. Primary Path: Invoke Supabase Edge Function 'super-task'
  try {
    const { data, error } = await supabase.functions.invoke('super-task', {
      body: {
        fullName: trimmedName,
        email: normalizedEmail,
        role: trimmedRole,
      },
    });

    if (error) {
      const status = error.context?.status;
      let errorBody = null;
      try {
        if (error.context && typeof error.context.json === 'function') {
          errorBody = await error.context.json();
        }
      } catch (_) {}

      if (
        status === 409 ||
        errorBody?.status === 'duplicate' ||
        errorBody?.error?.includes('already on the GraceGrid waitlist') ||
        error.message?.includes('already on the GraceGrid waitlist') ||
        error.message?.includes('409')
      ) {
        throw new Error("You're already on the GraceGrid waitlist.");
      }

      if (
        status === 400 ||
        errorBody?.error?.includes('characters') ||
        errorBody?.error?.includes('valid email')
      ) {
        throw new Error(errorBody?.error || 'Please provide a valid name and email address.');
      }

      console.error('[GraceGrid Waitlist] super-task invocation error:', error, errorBody);
      throw new Error('Something went wrong. Please try again.');
    }

    if (data?.success) {
      const payloadResult = {
        success: true,
        message: data.message || "🎉 You're officially on the GraceGrid waitlist!",
        data: data.data || {
          fullName: trimmedName,
          email: normalizedEmail,
          role: trimmedRole,
        },
      };

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gracegrid:waitlist-joined', {
            detail: payloadResult.data,
          })
        );
      }

      return payloadResult;
    }

    if (data?.status === 'duplicate' || data?.error?.includes('already on the GraceGrid waitlist')) {
      throw new Error("You're already on the GraceGrid waitlist.");
    }

    throw new Error(data?.error || 'Something went wrong. Please try again.');
  } catch (err) {
    if (
      err.message === "You're already on the GraceGrid waitlist." ||
      err.message === 'Please enter your full name.' ||
      err.message === 'Full name must be at least 2 characters.' ||
      err.message === 'Please enter your email address.' ||
      err.message === 'Please provide a valid email address.'
    ) {
      throw err;
    }

    console.error('[GraceGrid Waitlist Service Error]:', err);
    throw new Error('Something went wrong. Please try again.');
  }
}

/**
 * Helper to format relative timestamps
 */
function formatRelativeTime(dateString) {
  if (!dateString) return 'recently';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Fetch total waitlist count dynamically from Supabase PostgreSQL.
 * Returns the real database count (or 0 if empty / offline).
 *
 * @returns {Promise<number>}
 */
export async function getWaitlistCount() {
  if (!isSupabaseConfigured) {
    return 0;
  }

  try {
    // 1. Try secure RPC function
    const { data: rpcCount, error: rpcError } = await supabase.rpc('get_waitlist_count');
    if (!rpcError && typeof rpcCount === 'number') {
      return rpcCount;
    }

    // 2. Try direct count query
    const { count, error: countError } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (!countError && typeof count === 'number') {
      return count;
    }
  } catch (err) {
    console.warn('[GraceGrid Waitlist] Unable to fetch count, falling back to 0:', err);
  }

  return 0;
}

/**
 * Fetch recent waitlist signups (first names and relative timestamps) from Supabase PostgreSQL.
 *
 * @param {number} [limit=10]
 * @returns {Promise<Array<{ id: string, name: string, city: string, time: string }>>}
 */
export async function getRecentWaitlistActivity(limit = 10) {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_recent_waitlist_activity', {
      limit_count: limit,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        name: item.first_name || 'Believer',
        city: 'GraceGrid Sanctuary',
        time: formatRelativeTime(item.created_at),
      }));
    }
  } catch (err) {
    console.warn('[GraceGrid Activity] Unable to fetch recent activity:', err);
  }

  return [];
}

/**
 * Subscribes to real-time waitlist changes from Supabase Realtime & local submissions.
 *
 * @param {Function} onNewMember
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToWaitlistUpdates(onNewMember) {
  const handleLocalJoined = (event) => {
    if (onNewMember) {
      onNewMember(event.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('gracegrid:waitlist-joined', handleLocalJoined);
  }

  let channel = null;
  if (isSupabaseConfigured) {
    try {
      channel = supabase
        .channel('public:waitlist-progress')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'waitlist' },
          (payload) => {
            if (onNewMember) {
              onNewMember(payload.new);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[GraceGrid Realtime] Channel subscription warning:', err);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('gracegrid:waitlist-joined', handleLocalJoined);
    }
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}

export default {
  joinWaitlist,
  getWaitlistCount,
  getRecentWaitlistActivity,
  subscribeToWaitlistUpdates,
  TARGET_WAITLIST_USERS,
  DEFAULT_INITIAL_COUNT,
};

