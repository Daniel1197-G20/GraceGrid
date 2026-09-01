import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Service to broadcast project development phase updates to waitlist subscribers
 * via the Supabase Edge Function `send-phase-update`.
 *
 * @param {Object} payload
 * @param {string} payload.phaseName - e.g. "Phase 2: Closed Alpha & Scripture Feed"
 * @param {string} payload.subject - Email subject line
 * @param {string} payload.headline - Email header headline
 * @param {string} payload.message - Main body text
 * @param {string[]} payload.highlights - Bullet points
 * @param {string} [payload.ctaText] - Button label
 * @param {string} [payload.ctaUrl] - Button link
 * @param {string} [payload.filterRole='all'] - Target role segment
 * @param {string} [payload.testEmail] - If provided, sends test preview to this email only
 * @returns {Promise<{ success: boolean, message: string, stats?: any }>}
 */
export async function broadcastPhaseUpdate(payload) {
  if (!isSupabaseConfigured) {
    // Graceful simulation in dev mode if Supabase env is not yet populated
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      mode: payload.testEmail ? 'test_preview' : 'broadcast_simulation',
      message: payload.testEmail 
        ? `[DEV SIMULATION] Test update delivered to ${payload.testEmail}`
        : `[DEV SIMULATION] Phase update broadcast simulated for ${payload.phaseName}`,
      stats: {
        phaseName: payload.phaseName,
        totalTargeted: 8,
        totalSent: 8,
        failedCount: 0,
      },
    };
  }

  try {
    const adminKey = import.meta.env.VITE_ADMIN_API_KEY || import.meta.env.VITE_ADMIN_SECRET || '';
    const headers = {};
    if (adminKey) {
      headers['x-admin-key'] = adminKey;
    }

    const { data, error } = await supabase.functions.invoke('send-phase-update', {
      body: {
        phaseName: payload.phaseName,
        subject: payload.subject,
        headline: payload.headline,
        message: payload.message,
        highlights: payload.highlights || [],
        ctaText: payload.ctaText || 'View Community Progress',
        ctaUrl: payload.ctaUrl || 'https://gracegrid.app/#community-progress',
        filterRole: payload.filterRole || 'all',
        testEmail: payload.testEmail ? String(payload.testEmail).trim().toLowerCase() : null,
      },
      headers,
    });

    if (error) {
      throw new Error(error.message || 'Edge function error broadcasting phase update.');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to dispatch phase update.');
    }

    return data;
  } catch (err) {
    console.error('[GraceGrid Broadcast Service Error]:', err);
    throw new Error(err.message || 'Error communicating with phase update service.');
  }
}

/**
 * Update subscriber role in Supabase PostgreSQL
 *
 * @param {string} subscriberId
 * @param {string} newRole
 * @returns {Promise<{ success: boolean, data?: any }>}
 */
export async function updateSubscriberRole(subscriberId, newRole) {
  if (!isSupabaseConfigured) {
    return { success: true, data: { id: subscriberId, role: newRole } };
  }

  try {
    // 1. Try direct update
    const { data: directData, error: directError } = await supabase
      .from('waitlist')
      .update({ role: newRole })
      .eq('id', subscriberId)
      .select('id, full_name, email, role, created_at')
      .single();

    if (!directError && directData) {
      return {
        success: true,
        data: {
          id: directData.id,
          fullName: directData.full_name,
          email: directData.email,
          role: directData.role,
          createdAt: directData.created_at,
        },
      };
    }

    // 2. Fallback to RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_subscriber_role', {
      subscriber_id: subscriberId,
      new_role: newRole,
    });

    if (!rpcError && rpcData?.success) {
      return rpcData;
    }

    if (directError) {
      throw directError;
    }
  } catch (err) {
    console.error('[GraceGrid Update Role Error]:', err);
    throw new Error(err.message || 'Failed to update subscriber role.');
  }

  return { success: true };
}

/**
 * Delete a subscriber from Supabase PostgreSQL (e.g. for spam cleanup)
 *
 * @param {string} subscriberId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteSubscriber(subscriberId) {
  if (!isSupabaseConfigured) {
    return { success: true, id: subscriberId };
  }

  try {
    // 1. Direct delete
    const { error: directError } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', subscriberId);

    if (!directError) {
      return { success: true, id: subscriberId };
    }

    // 2. RPC fallback
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_delete_subscriber', {
      subscriber_id: subscriberId,
    });

    if (!rpcError && rpcData?.success) {
      return rpcData;
    }

    if (directError) throw directError;
  } catch (err) {
    console.error('[GraceGrid Delete Subscriber Error]:', err);
    throw new Error(err.message || 'Failed to delete subscriber.');
  }

  return { success: true };
}

export default {
  broadcastPhaseUpdate,
  updateSubscriberRole,
  deleteSubscriber,
};
