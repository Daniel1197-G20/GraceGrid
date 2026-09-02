import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  fetchAdminWaitlist, 
  exportWaitlistToCSV, 
  formatFullDateTime, 
  formatRelativeTime,
  TARGET_WAITLIST_USERS
} from '../../services/adminWaitlist';
import { subscribeToWaitlistUpdates } from '../../services/waitlist';
import { 
  broadcastPhaseUpdate, 
  updateSubscriberRole, 
  deleteSubscriber 
} from '../../services/adminUpdates';
import {
  Users,
  Target,
  Sparkles,
  TrendingUp,
  Search,
  Download,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Mail,
  User,
  Church,
  GraduationCap,
  HeartHandshake,
  Layers,
  Flame,
  Radio,
  Building2,
  Trash2,
  CreditCard,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Database,
  Plus
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { adminUser, logout, authProvider, isSupabaseConfigured } = useAdminAuth();
  const navigate = useNavigate();

  // Data states
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState('waitlist'); // 'waitlist' | 'broadcast' | 'treasury'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Role Edit & Delete state
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Phase Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    phaseName: 'Phase 2: Closed Alpha & Scripture Feed',
    subject: '🕊️ GraceGrid Update: We have entered Phase 2 Alpha!',
    headline: 'Alpha Testing Is Live for Early Believers',
    message: 'We are thrilled to share that the core streaming architecture and scripture rooms have reached closed alpha. Early waitlist members are now being onboarded in cohorts.',
    highlights: [
      'Ultra-low latency livestreaming engine completed',
      'Interactive prayer circle rooms live in alpha testing',
      'Pastor sermon management portal ready for test cohorts'
    ],
    ctaText: 'View Community Progress',
    ctaUrl: 'https://gracegrid.app/#community-progress',
    filterRole: 'all',
    testEmail: adminUser?.email || '',
  });
  const [newHighlightText, setNewHighlightText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3800);
  }, []);

  // Fetch subscribers from Supabase
  const loadSubscribers = useCallback(async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const data = await fetchAdminWaitlist();
      setSubscribers(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[AdminDashboard] Fetch error:', err);
      showToast('Error refreshing data from database.', 'error');
    } finally {
      setIsLoading(false);
      if (showSpin) {
        setTimeout(() => setIsRefreshing(false), 450);
        showToast('Dashboard data refreshed from Supabase.', 'success');
      }
    }
  }, [showToast]);

  // Initial load & real-time sync
  useEffect(() => {
    loadSubscribers();

    const unsubscribe = subscribeToWaitlistUpdates((newEntry) => {
      setSubscribers((prev) => {
        const exists = prev.some(
          (s) => s.id === newEntry.id || s.email?.toLowerCase() === newEntry.email?.toLowerCase()
        );
        if (exists) return prev;

        const mapped = {
          id: newEntry.id || `live-${Date.now()}`,
          fullName: newEntry.full_name || newEntry.fullName || 'New Believer',
          email: newEntry.email || '',
          role: newEntry.role || 'believer',
          createdAt: newEntry.created_at || new Date().toISOString(),
        };

        showToast(`🎉 New registration: ${mapped.fullName}`, 'info');
        return [mapped, ...prev];
      });
      setLastUpdated(new Date());
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadSubscribers, showToast]);

  // Compute metrics
  const totalSubscribers = subscribers.length;
  const targetGoal = TARGET_WAITLIST_USERS;
  const progressPercent = Math.min(100, Math.round((totalSubscribers / targetGoal) * 100));
  const remainingSpots = Math.max(0, targetGoal - totalSubscribers);

  // Role counts
  const roleBreakdown = useMemo(() => {
    const counts = { all: totalSubscribers, believer: 0, pastor: 0, leader: 0, student: 0, group: 0 };
    subscribers.forEach((s) => {
      const r = (s.role || 'believer').toLowerCase();
      if (counts[r] !== undefined) {
        counts[r]++;
      } else {
        counts.believer++;
      }
    });
    return counts;
  }, [subscribers, totalSubscribers]);

  // Filtered subscribers list
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesSearch = 
        !searchQuery.trim() ||
        sub.fullName?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        sub.email?.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesRole = 
        selectedRole === 'all' || 
        (sub.role || 'believer').toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [subscribers, searchQuery, selectedRole]);

  // Pagination
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage) || 1;
  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubscribers.slice(start, start + itemsPerPage);
  }, [filteredSubscribers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, itemsPerPage]);

  // Copy email action
  const handleCopyEmail = (email) => {
    if (!email) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        setCopiedEmail(email);
        showToast(`Copied ${email} to clipboard!`, 'success');
        setTimeout(() => setCopiedEmail(null), 3000);
      });
    }
  };

  // Export CSV action
  const handleExportCSV = () => {
    try {
      const exportList = filteredSubscribers.length > 0 ? filteredSubscribers : subscribers;
      if (exportList.length === 0) {
        showToast('No subscribers available to export.', 'error');
        return;
      }
      exportWaitlistToCSV(exportList);
      showToast(`Exported ${exportList.length} subscribers to CSV.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to export CSV.', 'error');
    }
  };

  // Update Subscriber Role in Supabase
  const handleSaveRole = async (subscriberId, newRole) => {
    setIsUpdatingRole(true);
    try {
      await updateSubscriberRole(subscriberId, newRole);
      setSubscribers((prev) =>
        prev.map((s) => (s.id === subscriberId ? { ...s, role: newRole } : s))
      );
      setEditingSubscriber(null);
      showToast(`Updated role to ${newRole}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update subscriber role.', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Delete Subscriber from Supabase
  const handleDeleteSubscriber = async (subscriberId) => {
    try {
      await deleteSubscriber(subscriberId);
      setSubscribers((prev) => prev.filter((s) => s.id !== subscriberId));
      setDeleteConfirmId(null);
      showToast('Subscriber removed successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete subscriber.', 'error');
    }
  };

  // Phase Broadcast Highlights Management
  const handleAddHighlight = () => {
    if (!newHighlightText.trim()) return;
    setBroadcastForm((prev) => ({
      ...prev,
      highlights: [...prev.highlights, newHighlightText.trim()],
    }));
    setNewHighlightText('');
  };

  const handleRemoveHighlight = (index) => {
    setBroadcastForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  // Send Phase Broadcast (Test Preview or Full Broadcast)
  const handleDispatchBroadcast = async (isTestOnly = false) => {
    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const payload = {
        ...broadcastForm,
        testEmail: isTestOnly ? (broadcastForm.testEmail || adminUser?.email) : null,
      };

      const res = await broadcastPhaseUpdate(payload);
      setBroadcastResult(res);
      showToast(
        isTestOnly
          ? `Test preview sent to ${payload.testEmail}!`
          : `Phase update broadcast dispatched!`,
        'success'
      );
    } catch (err) {
      setBroadcastResult({ success: false, error: err.message });
      showToast(err.message || 'Failed to broadcast update.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Logout action
  const handleLogout = async () => {
    await logout();
    navigate('/gracegrid-admin', { replace: true });
  };

  // Role Badge Helper
  const renderRoleBadge = (role) => {
    const norm = (role || 'believer').toLowerCase();
    switch (norm) {
      case 'pastor':
        return (
          <span className="role-tag role-pastor">
            <Church size={12} /> Pastor / Minister
          </span>
        );
      case 'leader':
        return (
          <span className="role-tag role-leader">
            <HeartHandshake size={12} /> Group Leader
          </span>
        );
      case 'student':
        return (
          <span className="role-tag role-student">
            <GraduationCap size={12} /> Student
          </span>
        );
      case 'group':
        return (
          <span className="role-tag role-group">
            <Users size={12} /> Small Group
          </span>
        );
      default:
        return (
          <span className="role-tag role-believer">
            <User size={12} /> Believer
          </span>
        );
    }
  };

  return (
    <div className="admin-layout">
      
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className={`admin-toast admin-toast-${toastMessage.type}`} role="status">
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true" 
        />
      )}

      {/* =========================================================================
          Sidebar Navigation
          ========================================================================= */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-emblem-halo">
              <ShieldCheck size={22} className="brand-cross-icon" />
            </div>
            <div className="brand-text-block">
              <span className="brand-name">GraceGrid</span>
              <span className="brand-tagline">Admin Control</span>
            </div>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Sanctuary Management</div>

          <button 
            className={`nav-item ${activeTab === 'waitlist' ? 'nav-item-active' : ''}`}
            onClick={() => { setActiveTab('waitlist'); setMobileSidebarOpen(false); }}
          >
            <Layers size={18} className="nav-icon" />
            <span>Waitlist & Cohort</span>
            <span className="nav-badge-count">{totalSubscribers}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'broadcast' ? 'nav-item-active' : ''}`}
            onClick={() => { setActiveTab('broadcast'); setMobileSidebarOpen(false); }}
          >
            <Send size={18} className="nav-icon" />
            <span>Pass Phase Updates</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'treasury' ? 'nav-item-active' : ''}`}
            onClick={() => { setActiveTab('treasury'); setMobileSidebarOpen(false); }}
          >
            <Building2 size={18} className="nav-icon" />
            <span>Stewardship Treasury</span>
          </button>

          <div className="nav-section-title">Database & Links</div>

          <div className="sidebar-status-card">
            <div className="db-status-row">
              <Database size={14} className="db-icon" />
              <span className="db-status-label">Supabase Auth:</span>
              <span className="db-status-pill">{authProvider === 'supabase' ? 'Connected' : 'MVP Mode'}</span>
            </div>
          </div>

          <Link 
            to="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-item nav-link-external"
          >
            <ExternalLink size={18} className="nav-icon" />
            <span>Live Public Sanctuary</span>
          </Link>
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="sidebar-footer">
          <div className="admin-user-pill">
            <div className="user-avatar-circle">
              <span>{adminUser?.email?.[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="user-info-text">
              <span className="user-email-display" title={adminUser?.email}>
                {adminUser?.email || 'gracegrid4@gmail.com'}
              </span>
              <span className="user-role-label">{adminUser?.authType || 'Super Admin'}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="btn-sidebar-logout"
            title="Sign out of Admin Dashboard"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          Main Content Surface
          ========================================================================= */}
      <div className="admin-main-surface">
        
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-hamburger-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="topbar-title">
                {activeTab === 'waitlist' && 'Early Access Waitlist'}
                {activeTab === 'broadcast' && 'Broadcast Phase Updates'}
                {activeTab === 'treasury' && 'Stewardship Treasury'}
              </h1>
              <p className="topbar-subtitle">
                {activeTab === 'waitlist' && 'Real-time subscriber management linked with Supabase'}
                {activeTab === 'broadcast' && 'Pass development progress emails directly to registered believers'}
                {activeTab === 'treasury' && 'Dedicated treasury details & donor stewardship reference'}
              </p>
            </div>
          </div>

          <div className="topbar-actions">
            {/* Realtime Status Indicator */}
            <div className="realtime-status-badge" title="Connected to Supabase Realtime Channels">
              <span className="pulse-dot" />
              <Radio size={14} className="radio-icon" />
              <span className="status-label">Supabase Sync</span>
            </div>

            {/* Refresh Button */}
            <button 
              onClick={() => loadSubscribers(true)} 
              disabled={isRefreshing}
              className="btn-topbar-action btn-refresh"
              title="Refresh subscriber records"
              aria-label="Refresh data"
            >
              <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
              <span className="hide-mobile">Refresh</span>
            </button>

            {/* Export CSV Button */}
            <button 
              onClick={handleExportCSV} 
              className="btn-topbar-action btn-export-csv"
              title="Download full waitlist as CSV"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            {/* Desktop Logout Button */}
            <button 
              onClick={handleLogout} 
              className="btn-topbar-logout hide-mobile"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="admin-content-body">
          
          {/* =====================================================================
              METRICS CARDS GRID (Top KPIs)
              ===================================================================== */}
          <div className="metrics-cards-grid">
            
            {/* 1. Total Subscribers Card */}
            <div className="metric-card glass-card-dark">
              <div className="metric-card-inner">
                <div className="metric-icon-box icon-emerald">
                  <Users size={24} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Total Subscribers</span>
                  <div className="metric-number-row">
                    <span className="metric-value">{totalSubscribers}</span>
                    <span className="metric-subtext">Believers Joined</span>
                  </div>
                </div>
              </div>
              <div className="metric-card-footer">
                <span className="footer-pill gold-pill">
                  <Sparkles size={12} /> {progressPercent}% of Launch Target
                </span>
              </div>
            </div>

            {/* 2. Progress Goal Target Card (50 Users) */}
            <div className="metric-card glass-card-dark">
              <div className="metric-card-inner">
                <div className="metric-icon-box icon-gold">
                  <Target size={24} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Launch Cohort Target</span>
                  <div className="metric-number-row">
                    <span className="metric-value">{totalSubscribers} <span className="metric-denom">/ {targetGoal}</span></span>
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="metric-progress-wrapper">
                <div className="metric-progress-track">
                  <div 
                    className="metric-progress-fill" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
                <div className="progress-labels-row">
                  <span>{progressPercent}% Complete</span>
                  <span>Goal: 50 Believers</span>
                </div>
              </div>
            </div>

            {/* 3. Remaining Spots Card */}
            <div className="metric-card glass-card-dark">
              <div className="metric-card-inner">
                <div className="metric-icon-box icon-flame">
                  <Flame size={24} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Remaining Spots</span>
                  <div className="metric-number-row">
                    <span className="metric-value">{remainingSpots}</span>
                    <span className="metric-subtext">Spots Left</span>
                  </div>
                </div>
              </div>
              <div className="metric-card-footer">
                <span className={`footer-pill ${remainingSpots > 0 ? 'emerald-pill' : 'gold-pill'}`}>
                  {remainingSpots > 0 ? '✨ Cohort Open' : '🎉 Goal Reached!'}
                </span>
              </div>
            </div>

            {/* 4. Role Breakdown Mini Card */}
            <div className="metric-card glass-card-dark">
              <div className="metric-card-inner">
                <div className="metric-icon-box icon-purple">
                  <TrendingUp size={24} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Community Roles</span>
                  <div className="roles-mini-grid">
                    <span className="role-mini-item">Believers: <strong>{roleBreakdown.believer}</strong></span>
                    <span className="role-mini-item">Pastors: <strong>{roleBreakdown.pastor}</strong></span>
                    <span className="role-mini-item">Leaders: <strong>{roleBreakdown.leader}</strong></span>
                    <span className="role-mini-item">Students: <strong>{roleBreakdown.student}</strong></span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* =====================================================================
              TAB 1: WAITLIST SUBSCRIBERS TABLE
              ===================================================================== */}
          {activeTab === 'waitlist' && (
            <div className="subscribers-table-container glass-card-dark">
              
              {/* Table Control & Filter Bar */}
              <div className="table-controls-bar">
                
                {/* Search by Name / Email */}
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search subscribers by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-search-input"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="btn-clear-search"
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Role Filter Tabs */}
                <div className="role-filters-row">
                  <button
                    className={`role-filter-btn ${selectedRole === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('all')}
                  >
                    All ({totalSubscribers})
                  </button>
                  <button
                    className={`role-filter-btn ${selectedRole === 'believer' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('believer')}
                  >
                    Believers ({roleBreakdown.believer})
                  </button>
                  <button
                    className={`role-filter-btn ${selectedRole === 'pastor' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('pastor')}
                  >
                    Pastors ({roleBreakdown.pastor})
                  </button>
                  <button
                    className={`role-filter-btn ${selectedRole === 'leader' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('leader')}
                  >
                    Leaders ({roleBreakdown.leader})
                  </button>
                  <button
                    className={`role-filter-btn ${selectedRole === 'student' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('student')}
                  >
                    Students ({roleBreakdown.student})
                  </button>
                </div>

              </div>

              {/* Table Meta Summary Bar */}
              <div className="table-summary-bar">
                <span className="summary-count">
                  Showing <strong>{paginatedSubscribers.length}</strong> of <strong>{filteredSubscribers.length}</strong> matching subscribers
                </span>

                <div className="last-sync-badge">
                  <Clock size={13} />
                  <span>Last updated {formatRelativeTime(lastUpdated)}</span>
                </div>
              </div>

              {/* Table View */}
              <div className="table-responsive-wrapper">
                <table className="subscribers-table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '50px' }}>#</th>
                      <th scope="col">Believer</th>
                      <th scope="col">Email Address</th>
                      <th scope="col">Role</th>
                      <th scope="col">Joined Date</th>
                      <th scope="col" className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="table-loading-cell">
                          <div className="table-loader">
                            <div className="loader-spinner" />
                            <span>Connecting to Supabase PostgreSQL...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty-cell">
                          <div className="empty-state-card">
                            <Users size={40} className="empty-icon" />
                            <h3>No Subscribers Found</h3>
                            <p>
                              {searchQuery || selectedRole !== 'all'
                                ? 'No subscribers match your search or filter criteria.'
                                : 'No waitlist registrations recorded yet.'}
                            </p>
                            {(searchQuery || selectedRole !== 'all') && (
                              <button 
                                onClick={() => { setSearchQuery(''); setSelectedRole('all'); }}
                                className="btn-reset-filters"
                              >
                                Reset Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedSubscribers.map((subscriber, index) => {
                        const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1;
                        const initial = subscriber.fullName?.[0]?.toUpperCase() || 'B';
                        const isCopied = copiedEmail === subscriber.email;
                        const isEditingThis = editingSubscriber?.id === subscriber.id;
                        const isDeletingThis = deleteConfirmId === subscriber.id;

                        return (
                          <tr key={subscriber.id || index} className="subscriber-row">
                            
                            {/* Row Index */}
                            <td className="index-cell">{absoluteIndex}</td>

                            {/* Believer Name & Avatar */}
                            <td className="user-name-cell">
                              <div className="believer-name-group">
                                <div className="believer-avatar">
                                  <span>{initial}</span>
                                </div>
                                <div className="believer-name-meta">
                                  <span className="full-name-text">{subscriber.fullName}</span>
                                  <span className="verified-badge">
                                    <ShieldCheck size={11} /> Verified Waitlist
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Email Address */}
                            <td className="email-cell">
                              <div className="email-group">
                                <span className="email-text">{subscriber.email}</span>
                              </div>
                            </td>

                            {/* Role (Inline Editor) */}
                            <td className="role-cell">
                              {isEditingThis ? (
                                <div className="role-inline-edit">
                                  <select
                                    defaultValue={subscriber.role || 'believer'}
                                    onChange={(e) => handleSaveRole(subscriber.id, e.target.value)}
                                    disabled={isUpdatingRole}
                                    className="role-select"
                                    autoFocus
                                  >
                                    <option value="believer">Believer</option>
                                    <option value="pastor">Pastor / Minister</option>
                                    <option value="leader">Group Leader</option>
                                    <option value="student">Student</option>
                                    <option value="group">Small Group</option>
                                  </select>
                                  <button
                                    onClick={() => setEditingSubscriber(null)}
                                    className="btn-cancel-edit"
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="role-display-row">
                                  {renderRoleBadge(subscriber.role)}
                                  <button
                                    onClick={() => setEditingSubscriber(subscriber)}
                                    className="btn-edit-role-icon"
                                    title="Change role in Supabase"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Joined Date */}
                            <td className="date-cell">
                              <div className="date-group">
                                <span className="date-relative">{formatRelativeTime(subscriber.createdAt)}</span>
                                <span className="date-full">{formatFullDateTime(subscriber.createdAt)}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="actions-cell text-right">
                              <div className="row-actions-group">
                                <button
                                  onClick={() => handleCopyEmail(subscriber.email)}
                                  className={`btn-copy-email ${isCopied ? 'copied' : ''}`}
                                  title="Copy email to clipboard"
                                  aria-label={`Copy email for ${subscriber.fullName}`}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check size={14} className="green-icon" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={14} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                {isDeletingThis ? (
                                  <div className="delete-confirm-group">
                                    <button
                                      onClick={() => handleDeleteSubscriber(subscriber.id)}
                                      className="btn-confirm-delete"
                                      title="Confirm remove from Supabase"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="btn-cancel-delete"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(subscriber.id)}
                                    className="btn-delete-row"
                                    title="Remove subscriber from Supabase"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredSubscribers.length > 0 && (
                <div className="table-pagination-footer">
                  <div className="pagination-items-per-page">
                    <span>Rows per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="pagination-select"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div className="pagination-page-controls">
                    <span className="page-indicator">
                      Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn-pagination-nav"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-pagination-nav"
                      aria-label="Next page"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* =====================================================================
              TAB 2: PASS PROJECT DEVELOPMENT PHASE UPDATES
              ===================================================================== */}
          {activeTab === 'broadcast' && (
            <div className="broadcast-surface-card glass-card-dark">
              
              <div className="broadcast-card-header">
                <div className="broadcast-header-icon-box">
                  <Send size={24} className="send-gold-icon" />
                </div>
                <div>
                  <h2 className="broadcast-main-title">Pass Project Development Phase Update</h2>
                  <p className="broadcast-subtitle">
                    Broadcast rich progress updates to your early access waitlist community via Brevo Transactional Email & Supabase Edge Functions.
                  </p>
                </div>
              </div>

              {/* Broadcast Result Banner */}
              {broadcastResult && (
                <div 
                  className={`broadcast-result-banner ${broadcastResult.success ? 'result-success' : 'result-error'}`}
                >
                  {broadcastResult.success ? (
                    <CheckCircle2 size={20} className="res-icon-success" />
                  ) : (
                    <AlertCircle size={20} className="res-icon-error" />
                  )}
                  <div>
                    <strong>{broadcastResult.success ? 'Update Dispatched Successfully' : 'Broadcast Error'}</strong>
                    <p>{broadcastResult.message || broadcastResult.error}</p>
                    {broadcastResult.stats && (
                      <span className="stats-tag">
                        Targeted: {broadcastResult.stats.totalTargeted} | Sent: {broadcastResult.stats.totalSent}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Form Grid */}
              <div className="broadcast-form-grid">
                
                {/* Left Column: Form Controls */}
                <div className="broadcast-form-fields">
                  
                  <div className="b-field-group">
                    <label className="b-label">Development Phase Name</label>
                    <input
                      type="text"
                      value={broadcastForm.phaseName}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, phaseName: e.target.value })}
                      className="b-input"
                      placeholder="e.g. Phase 2: Closed Alpha & Scripture Feed"
                    />
                  </div>

                  <div className="b-field-group">
                    <label className="b-label">Email Subject Line</label>
                    <input
                      type="text"
                      value={broadcastForm.subject}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                      className="b-input"
                      placeholder="e.g. 🕊️ GraceGrid Update: We have entered Phase 2!"
                    />
                  </div>

                  <div className="b-field-group">
                    <label className="b-label">Headline Title</label>
                    <input
                      type="text"
                      value={broadcastForm.headline}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, headline: e.target.value })}
                      className="b-input"
                      placeholder="e.g. Alpha Testing Is Live for Early Believers"
                    />
                  </div>

                  <div className="b-field-group">
                    <label className="b-label">Progress Message</label>
                    <textarea
                      rows={4}
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                      className="b-textarea"
                      placeholder="Detailed update message to your waitlist subscribers..."
                    />
                  </div>

                  {/* Accomplishments Bullet Points */}
                  <div className="b-field-group">
                    <label className="b-label">Phase Accomplishment Highlights</label>
                    <div className="highlights-list">
                      {broadcastForm.highlights.map((h, i) => (
                        <div key={i} className="highlight-item-row">
                          <span>&bull; {h}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(i)}
                            className="btn-remove-highlight"
                            title="Remove bullet point"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="add-highlight-row">
                      <input
                        type="text"
                        placeholder="Add milestone achievement bullet..."
                        value={newHighlightText}
                        onChange={(e) => setNewHighlightText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHighlight(); } }}
                        className="b-input"
                      />
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="btn-add-highlight"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>

                  {/* Target Audience Filter */}
                  <div className="b-field-group">
                    <label className="b-label">Target Audience Segment</label>
                    <select
                      value={broadcastForm.filterRole}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, filterRole: e.target.value })}
                      className="b-select"
                    >
                      <option value="all">All Waitlist Subscribers ({totalSubscribers})</option>
                      <option value="believer">Believers Only ({roleBreakdown.believer})</option>
                      <option value="pastor">Pastors & Ministers Only ({roleBreakdown.pastor})</option>
                      <option value="leader">Group Leaders Only ({roleBreakdown.leader})</option>
                      <option value="student">Students Only ({roleBreakdown.student})</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="broadcast-actions-row">
                    
                    {/* Test Preview */}
                    <div className="test-preview-box">
                      <input
                        type="email"
                        placeholder="test.admin@gracegrid.app"
                        value={broadcastForm.testEmail}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, testEmail: e.target.value })}
                        className="b-input-test"
                      />
                      <button
                        type="button"
                        onClick={() => handleDispatchBroadcast(true)}
                        disabled={isBroadcasting}
                        className="btn-test-preview"
                      >
                        <Mail size={16} />
                        <span>Send Test Preview</span>
                      </button>
                    </div>

                    {/* Mass Broadcast */}
                    <button
                      type="button"
                      onClick={() => handleDispatchBroadcast(false)}
                      disabled={isBroadcasting || totalSubscribers === 0}
                      className="btn-mass-broadcast"
                    >
                      <Send size={16} />
                      <span>{isBroadcasting ? 'Broadcasting...' : `Broadcast to Audience (${broadcastForm.filterRole === 'all' ? totalSubscribers : roleBreakdown[broadcastForm.filterRole] || 0})`}</span>
                    </button>

                  </div>

                </div>

                {/* Right Column: Live Email Preview */}
                <div className="email-preview-column">
                  <div className="preview-phone-frame">
                    <div className="phone-header-bar">
                      <span className="phone-dot dot-red" />
                      <span className="phone-dot dot-yellow" />
                      <span className="phone-dot dot-green" />
                      <span className="preview-label">Live Email Preview</span>
                    </div>

                    <div className="email-rendered-card">
                      <div className="email-header-top">
                        <span className="email-dove">🕊️</span>
                        <span className="email-phase-pill">{broadcastForm.phaseName}</span>
                        <h3 className="email-preview-title">{broadcastForm.headline}</h3>
                      </div>

                      <div className="email-body-preview">
                        <p>Grace and peace to you, <strong>Fellow Believer</strong>,</p>
                        <p className="email-preview-text">{broadcastForm.message}</p>

                        {broadcastForm.highlights.length > 0 && (
                          <div className="email-highlights-box">
                            <span className="hl-title">Phase Accomplishments</span>
                            <ul>
                              {broadcastForm.highlights.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="email-cta-preview-btn">
                          {broadcastForm.ctaText}
                        </div>
                      </div>

                      <div className="email-preview-footer">
                        &copy; {new Date().getFullYear()} GraceGrid. Building a sacred digital sanctuary.
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =====================================================================
              TAB 3: STEWARDSHIP / TREASURY DETAILS
              ===================================================================== */}
          {activeTab === 'treasury' && (
            <div className="treasury-card glass-card-dark">
              <div className="treasury-header">
                <CreditCard size={24} className="treasury-gold-icon" />
                <div>
                  <h2 className="treasury-title">Stewardship & Payment Gateway (Paystack)</h2>
                  <p className="treasury-desc">Configured Paystack gateway details for online kingdom giving.</p>
                </div>
              </div>
              <div className="treasury-grid">
                <div className="treasury-item">
                  <span className="treasury-item-label">Payment Gateway</span>
                  <span className="treasury-item-val">Paystack</span>
                </div>
                <div className="treasury-item">
                  <span className="treasury-item-label">Supported Channels</span>
                  <span className="treasury-item-val">Cards · Bank Transfer · USSD · Apple Pay</span>
                </div>
                <div className="treasury-item">
                  <span className="treasury-item-label">Giving Page Link</span>
                  <span className="treasury-item-val highlight-number">
                    {import.meta.env.VITE_PAYSTACK_PAYMENT_URL || 'https://paystack.com/pay/gracegrid'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
