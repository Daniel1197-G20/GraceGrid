import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const TARGET_WAITLIST_USERS = 50;

/**
 * Format ISO date string into human-readable local date and time
 */
export function formatFullDateTime(dateString) {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Unknown date';
  }
}

/**
 * Helper to format relative time (e.g. '2m ago', '3h ago')
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'recently';
  try {
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'recently';
    const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return 'recently';
  }
}

/**
 * Fetch all waitlist subscribers from Supabase for the Admin Dashboard.
 * Ordered by newest first.
 *
 * @returns {Promise<Array<{ id: string, fullName: string, email: string, role: string, createdAt: string }>>}
 */
export async function fetchAdminWaitlist() {
  if (!isSupabaseConfigured) {
    console.warn('[GraceGrid Admin] Supabase not configured in client. Providing dev mock dataset.');
    return getDevMockSubscribers();
  }

  try {
    // 1. Primary: Direct query on waitlist table ordered by created_at DESC
    const { data: directData, error: directError } = await supabase
      .from('waitlist')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (!directError && Array.isArray(directData) && directData.length > 0) {
      return directData.map((item) => ({
        id: item.id,
        fullName: item.full_name || 'Anonymous Believer',
        email: item.email || '',
        role: item.role || 'believer',
        createdAt: item.created_at,
      }));
    }

    // 2. Fallback: Query via admin RPC function get_admin_waitlist_all
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_waitlist_all', {
      limit_count: 1000,
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map((item) => ({
        id: item.id,
        fullName: item.full_name || 'Anonymous Believer',
        email: item.email || '',
        role: item.role || 'believer',
        createdAt: item.created_at,
      }));
    }

    if (directError && directError.code !== 'PGRST116') {
      console.warn('[GraceGrid Admin] Query notice:', directError.message);
    }

    // If database returned an empty table or dev fallback
    if (Array.isArray(directData) && directData.length === 0) {
      return [];
    }
  } catch (err) {
    console.error('[GraceGrid Admin] Error fetching waitlist subscribers:', err);
  }

  return [];
}

/**
 * Export subscriber list as CSV and trigger browser download
 *
 * @param {Array<Object>} subscribers
 */
export function exportWaitlistToCSV(subscribers = []) {
  if (!subscribers || subscribers.length === 0) {
    throw new Error('No subscriber data available to export.');
  }

  const escapeCSV = (value) => {
    const stringVal = String(value ?? '');
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const headers = [
    'Subscriber ID',
    'Full Name',
    'Email Address',
    'Community Role',
    'Joined Timestamp (UTC)',
    'Joined Date (Local)',
  ];

  const rows = subscribers.map((sub) => [
    escapeCSV(sub.id),
    escapeCSV(sub.fullName),
    escapeCSV(sub.email),
    escapeCSV(sub.role),
    escapeCSV(sub.createdAt),
    escapeCSV(formatFullDateTime(sub.createdAt)),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `gracegrid_waitlist_subscribers_${todayStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { totalExported: subscribers.length };
}

/**
 * High-fidelity mock subscribers for initial development mode preview
 */
function getDevMockSubscribers() {
  const now = Date.now();
  const mockList = [
    {
      id: 'sub-001',
      fullName: 'Praise Victor Egbaunu',
      email: 'praise.victor@gracegrid.app',
      role: 'leader',
      createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'sub-002',
      fullName: 'Sarah Elizabeth Adeyemi',
      email: 'sarah.adeyemi@gmail.com',
      role: 'pastor',
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'sub-003',
      fullName: 'David Oluwaseun King',
      email: 'david.king@faithsanctuary.org',
      role: 'believer',
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'sub-004',
      fullName: 'Hannah Grace Mensah',
      email: 'hannah.mensah@campusministry.edu',
      role: 'student',
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'sub-005',
      fullName: 'Emmanuel Chimamanda Okafor',
      email: 'pastor.emmanuel@bethelgathering.com',
      role: 'pastor',
      createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 'sub-006',
      fullName: 'Deborah Oluwakemi Adeleke',
      email: 'deborah.adeleke@yahoo.com',
      role: 'group',
      createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: 'sub-007',
      fullName: 'Caleb Joshua Nnamdi',
      email: 'caleb.nnamdi@outlook.com',
      role: 'believer',
      createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'sub-008',
      fullName: 'Miriam Ruth Oladipo',
      email: 'miriam.oladipo@gracefellowship.org',
      role: 'leader',
      createdAt: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
    },
  ];

  return mockList;
}

export default {
  TARGET_WAITLIST_USERS,
  fetchAdminWaitlist,
  exportWaitlistToCSV,
  formatFullDateTime,
  formatRelativeTime,
};
