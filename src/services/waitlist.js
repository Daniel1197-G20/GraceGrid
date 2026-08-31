import { supabase, isSupabaseConfigured } from '../lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TARGET_WAITLIST_USERS = 50;
export const DEFAULT_INITIAL_COUNT = 27;

/**
 * Service function to submit a user to the GraceGrid waitlist.
 * Invokes the Supabase Edge Function `join-waitlist` which securely handles
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
    // Graceful dev simulation delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const mockData = {
      id: 'dev-simulation-id',
      fullName: trimmedName,
      email: normalizedEmail,
      role: trimmedRole,
      createdAt: new Date().toISOString(),
    };

    // Dispatch custom event for real-time progress bar reaction
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gracegrid:waitlist-joined', {
          detail: mockData,
        })
      );
    }

    return {
      success: true,
      message: "🎉 Welcome! You're officially on the GraceGrid waitlist.",
      data: mockData,
    };
  }

  try {
    // 3. Invoke the Supabase Edge Function 'join-waitlist'
    const { data, error } = await supabase.functions.invoke('join-waitlist', {
      body: {
        fullName: trimmedName,
        email: normalizedEmail,
        role: trimmedRole,
      },
    });

    if (error) {
      let errorMessage = 'Something went wrong. Please try again.';
      let isDuplicate = false;

      // Handle FunctionsHttpError response body from Supabase Edge Function
      if (error.context) {
        try {
          const errorBody = await error.context.json();
          if (errorBody) {
            if (
              error.context.status === 409 ||
              errorBody.status === 'duplicate' ||
              (errorBody.error && errorBody.error.includes('already on the GraceGrid waitlist'))
            ) {
              isDuplicate = true;
              errorMessage = "You're already on the GraceGrid waitlist.";
            } else if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch {
          // Fallback if context is not JSON
          if (error.context.status === 409) {
            isDuplicate = true;
            errorMessage = "You're already on the GraceGrid waitlist.";
          }
        }
      }

      if (isDuplicate || (error.message && error.message.includes('already on the GraceGrid waitlist'))) {
        throw new Error("You're already on the GraceGrid waitlist.");
      }

      throw new Error(errorMessage);
    }

    if (!data || data.success === false) {
      const errorMsg = data?.error || 'Something went wrong. Please try again.';
      if (data?.status === 'duplicate' || errorMsg.includes('already on the GraceGrid waitlist')) {
        throw new Error("You're already on the GraceGrid waitlist.");
      }
      throw new Error(errorMsg);
    }

    const payloadResult = {
      success: true,
      message: data.message || "🎉 Welcome! You're officially on the GraceGrid waitlist.",
      data: data.data || {
        fullName: trimmedName,
        email: normalizedEmail,
        role: trimmedRole,
      },
    };

    // Dispatch real-time local event so the progress bar updates immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gracegrid:waitlist-joined', {
          detail: payloadResult.data,
        })
      );
    }

    return payloadResult;
  } catch (err) {
    // If it's already our formatted error message, rethrow it
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
 * Fetch total waitlist count dynamically from Supabase PostgreSQL.
 * Defaults to 27 if database is fresh, offline, or unconfigured.
 *
 * @returns {Promise<number>}
 */
export async function getWaitlistCount() {
  if (!isSupabaseConfigured) {
    return DEFAULT_INITIAL_COUNT;
  }

  try {
    // 1. Try secure RPC function
    const { data: rpcCount, error: rpcError } = await supabase.rpc('get_waitlist_count');
    if (!rpcError && typeof rpcCount === 'number') {
      return Math.max(DEFAULT_INITIAL_COUNT, rpcCount);
    }

    // 2. Try direct count query
    const { count, error: countError } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (!countError && typeof count === 'number') {
      return Math.max(DEFAULT_INITIAL_COUNT, count);
    }
  } catch (err) {
    console.warn('[GraceGrid Waitlist] Unable to fetch count, falling back to default:', err);
  }

  return DEFAULT_INITIAL_COUNT;
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
  subscribeToWaitlistUpdates,
  TARGET_WAITLIST_USERS,
  DEFAULT_INITIAL_COUNT,
};
