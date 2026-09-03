import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Globe, Smartphone, Heart, Sparkles, ShieldCheck } from 'lucide-react';

export const ICON_MAP = {
  Globe,
  Smartphone,
  Heart,
  Sparkles,
  ShieldCheck,
};

export const DEFAULT_CAMPAIGN_MILESTONES = [
  {
    id: 'domain',
    title: 'GraceGrid .com Domain',
    badgeText: 'Milestone 1',
    icon: Globe,
    target: 10000,
    raised: 0,
    description: 'Securing our permanent official gracegrid.com domain and dedicated SSL encryption for global fellowship, worship streaming, and community access.',
    displayOrder: 1,
  },
  {
    id: 'playstore',
    title: 'Google Play Store Release',
    badgeText: 'Milestone 2',
    icon: Smartphone,
    target: 37000,
    raised: 0,
    description: 'Acquiring the Google Play Console developer license to publish and distribute the GraceGrid Android sanctuary app directly to believers worldwide.',
    displayOrder: 2,
  },
];

const CACHE_KEY = 'gracegrid_cached_milestones_v2';
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

let inMemoryMilestones = null;
let inMemoryTimestamp = 0;

/**
 * Normalizes a milestone row from Supabase to frontend shape
 */
export function normalizeMilestone(row) {
  if (!row) return null;
  const iconComponent = typeof row.icon === 'string' 
    ? (ICON_MAP[row.icon] || Globe) 
    : (row.icon || Globe);

  return {
    id: row.id,
    title: row.title,
    badgeText: row.badge_text || row.badgeText || 'Milestone',
    icon: iconComponent,
    iconName: typeof row.icon === 'string' ? row.icon : (row.iconName || 'Globe'),
    target: Number(row.target || row.target_amount || 0),
    raised: Number(row.raised || row.raised_amount || 0),
    description: row.description || '',
    displayOrder: Number(row.display_order || row.displayOrder || 1),
  };
}

/**
 * Update cached milestones in memory and sessionStorage
 */
export function setCachedMilestones(milestones) {
  inMemoryMilestones = milestones;
  inMemoryTimestamp = Date.now();
  try {
    const serializable = milestones.map((m) => ({
      ...m,
      icon: m.iconName || 'Globe',
    }));
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: serializable, time: inMemoryTimestamp }));
  } catch (_) {}
}

/**
 * Get cached milestones from memory or sessionStorage
 */
export function getCachedMilestones() {
  // Purge legacy mock cache if present
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('gracegrid_cached_milestones');
    }
  } catch (_) {}

  const now = Date.now();
  if (inMemoryMilestones && (now - inMemoryTimestamp < CACHE_TTL_MS)) {
    // If memory cache still has old mock values (6500 or 14500), bust it
    const hasMock = inMemoryMilestones.some((m) => (m.id === 'domain' && m.raised === 6500) || (m.id === 'playstore' && m.raised === 14500));
    if (!hasMock) {
      return inMemoryMilestones;
    }
  }

  try {
    const stored = sessionStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
        // Discard if containing legacy mock values
        const hasMock = parsed.data.some((m) => (m.id === 'domain' && m.raised === 6500) || (m.id === 'playstore' && m.raised === 14500));
        if (!hasMock) {
          const normalized = parsed.data.map(normalizeMilestone);
          inMemoryMilestones = normalized;
          inMemoryTimestamp = parsed.time || now;
          return normalized;
        }
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Fetch live milestones from Supabase PostgreSQL database.
 * Falls back cleanly to cache or default milestones.
 */
export async function getSupportMilestones(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getCachedMilestones();
    if (cached) {
      return cached;
    }
  }

  if (!isSupabaseConfigured) {
    return DEFAULT_CAMPAIGN_MILESTONES;
  }

  try {
    // 1. Try secure RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_support_milestones');
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      const normalized = rpcData.map(normalizeMilestone);
      setCachedMilestones(normalized);
      return normalized;
    }

    // 2. Try direct select from support_milestones table
    const { data: selectData, error: selectError } = await supabase
      .from('support_milestones')
      .select('*')
      .order('display_order', { ascending: true });

    if (!selectError && Array.isArray(selectData) && selectData.length > 0) {
      const normalized = selectData.map(normalizeMilestone);
      setCachedMilestones(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn('[GraceGrid Milestones] Unable to fetch live milestones, using fallback:', err);
  }

  return DEFAULT_CAMPAIGN_MILESTONES;
}

/**
 * Subscribes to real-time changes on the support_milestones table.
 * Automatically notifies callback when another user or admin donates or updates.
 *
 * @param {Function} onUpdate - callback(updatedMilestones)
 * @returns {Function} unsubscribe cleanup function
 */
export function subscribeToMilestoneUpdates(onUpdate) {
  // Listen to local optimistic events
  const handleLocalUpdate = (event) => {
    if (event?.detail && Array.isArray(event.detail)) {
      setCachedMilestones(event.detail);
      if (onUpdate) onUpdate(event.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('gracegrid:milestones-updated', handleLocalUpdate);
  }

  let channel = null;
  if (isSupabaseConfigured) {
    try {
      channel = supabase
        .channel('public:support_milestones_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_milestones' },
          async () => {
            // Fetch latest updated values from DB
            const fresh = await getSupportMilestones(true);
            if (onUpdate) onUpdate(fresh);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[GraceGrid Milestones Realtime] Subscription warning:', err);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('gracegrid:milestones-updated', handleLocalUpdate);
    }
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Record a donation in Supabase and update milestone raised amounts in real-time.
 *
 * @param {Object} payload
 * @param {number} payload.amount - Amount in NGN
 * @param {string} [payload.email] - Donor email
 * @param {string} [payload.donorName] - Donor name
 * @param {string} [payload.reference] - Paystack payment reference
 * @param {string} [payload.milestoneId] - Optional specific milestone ID
 * @returns {Promise<{ success: boolean, milestones?: Array, error?: string }>}
 */
export async function recordSupportDonation({
  amount,
  email = '',
  donorName = '',
  reference = '',
  milestoneId = null,
}) {
  const numericAmount = Number(amount);
  if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Please provide a valid donation amount.');
  }

  // 1. Try Supabase RPC call
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('record_support_donation', {
        p_amount: numericAmount,
        p_email: email ? String(email).trim() : null,
        p_donor_name: donorName ? String(donorName).trim() : null,
        p_reference: reference ? String(reference).trim() : null,
        p_milestone_id: milestoneId || null,
      });

      if (!error && data?.success && Array.isArray(data.milestones)) {
        const normalized = data.milestones.map(normalizeMilestone);
        setCachedMilestones(normalized);

        // Dispatch local event so this browser updates immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gracegrid:milestones-updated', { detail: normalized })
          );
        }

        return { success: true, milestones: normalized };
      }

      if (error) {
        console.warn('[GraceGrid Milestones] RPC error, attempting fallback:', error);
      }
    } catch (err) {
      console.warn('[GraceGrid Milestones] Error invoking record_support_donation RPC:', err);
    }
  }

  // 2. Fallback / Optimistic local calculation
  const current = getCachedMilestones() || DEFAULT_CAMPAIGN_MILESTONES;
  let unallocated = numericAmount;
  const updated = current.map((m) => {
    if (unallocated <= 0) return m;
    const needed = Math.max(0, m.target - (m.raised || 0));
    const add = Math.min(needed > 0 ? needed : unallocated, unallocated);
    unallocated -= add;
    return { ...m, raised: (m.raised || 0) + add };
  });

  if (unallocated > 0 && updated.length > 0) {
    const lastIndex = updated.length - 1;
    updated[lastIndex] = {
      ...updated[lastIndex],
      raised: (updated[lastIndex].raised || 0) + unallocated,
    };
  }

  setCachedMilestones(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gracegrid:milestones-updated', { detail: updated })
    );
  }

  return { success: true, milestones: updated };
}

/**
 * Admin action: update milestone targets or raised amounts directly
 */
export async function adminUpdateMilestone({
  id,
  target,
  raised,
  title,
  description,
}) {
  if (!id) throw new Error('Milestone ID is required.');

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('admin_update_milestone', {
        p_id: id,
        p_target: target !== undefined && target !== null ? Number(target) : null,
        p_raised: raised !== undefined && raised !== null ? Number(raised) : null,
        p_title: title || null,
        p_description: description || null,
      });

      if (!error && data?.success) {
        const fresh = await getSupportMilestones(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gracegrid:milestones-updated', { detail: fresh })
          );
        }
        return { success: true, milestones: fresh };
      }

      // If RPC failed or unavailable, fallback to direct table update
      const updatePayload = {};
      if (target !== undefined && target !== null) updatePayload.target = Number(target);
      if (raised !== undefined && raised !== null) updatePayload.raised = Number(raised);
      if (title) updatePayload.title = title;
      if (description) updatePayload.description = description;
      updatePayload.updated_at = new Date().toISOString();

      const { error: tblError } = await supabase
        .from('support_milestones')
        .update(updatePayload)
        .eq('id', id);

      if (!tblError) {
        const fresh = await getSupportMilestones(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gracegrid:milestones-updated', { detail: fresh })
          );
        }
        return { success: true, milestones: fresh };
      }
    } catch (err) {
      console.error('[GraceGrid Milestones Admin] Update error:', err);
      throw err;
    }
  }

  throw new Error('Supabase is not configured to update milestones.');
}

/**
 * Fetch all recorded stewardship donations for Admin Dashboard
 */
export async function fetchAdminDonations(limit = 100) {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data)) {
      return data.map((item) => ({
        id: item.id,
        amount: Number(item.amount || 0),
        email: item.email || 'Anonymous',
        donorName: item.donor_name || 'Anonymous Believer',
        reference: item.reference || 'N/A',
        milestoneId: item.milestone_id,
        status: item.status || 'success',
        paymentMethod: item.payment_method || 'paystack',
        createdAt: item.created_at,
      }));
    }
  } catch (err) {
    console.error('[GraceGrid Admin Donations] Fetch error:', err);
  }

  return [];
}

export default {
  DEFAULT_CAMPAIGN_MILESTONES,
  normalizeMilestone,
  getSupportMilestones,
  subscribeToMilestoneUpdates,
  recordSupportDonation,
  adminUpdateMilestone,
  fetchAdminDonations,
};
