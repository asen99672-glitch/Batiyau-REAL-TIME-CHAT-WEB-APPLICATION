import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import Icons from './AdminIcons';
import Avatar from '../Avatar';
import { getSocket, createSocketConnection } from '../../services/socket';
import {
  SuspendUserModal,
  ExtendSuspensionModal,
  HistoryLogModal,
  SuperAdminActionModal,
} from './AdminModals';

const SuspendedUsersView = ({
  allUsers = [],
  onViewUserDetails,
  showToast = () => {},
  isDarkMode = false,
}) => {
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [activeHistoryUser, setActiveHistoryUser] = useState(null);
  const [extendModalUser, setExtendModalUser] = useState(null);
  const [superAdminSuspendOpen, setSuperAdminSuspendOpen] = useState(false);
  const [singleSuspendUser, setSingleSuspendUser] = useState(null);

  // Ticking timer every 1 second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch 100% Real Suspended Users from MongoDB
  const fetchSuspendedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/suspended-users');
      setSuspendedUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch suspended users:', err);
      showToast('Failed to load suspended users list', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSuspendedUsers();
  }, [fetchSuspendedUsers]);

  // Real-time Socket Event Listeners for Live Suspended Users Sync
  useEffect(() => {
    const token = localStorage.getItem('chatToken');
    let socket = getSocket();
    if (!socket && token) {
      socket = createSocketConnection(token);
    }
    if (socket) {
      socket.emit('joinAdminChannel');

      const handleSuspendedRefresh = (payload) => {
        fetchSuspendedUsers();
        if (payload?.action === 'suspend') {
          showToast('Live update: Account temporarily suspended', 'warning');
        } else if (payload?.action === 'activate') {
          showToast('Live update: Account suspension removed & activated', 'success');
        } else if (payload?.action === 'extend') {
          showToast('Live update: Suspension period extended', 'info');
        }
      };

      const handleSuspensionStatusChanged = () => {
        fetchSuspendedUsers();
      };

      socket.on('adminSuspendedUsersRefresh', handleSuspendedRefresh);
      socket.on('userSuspensionStatusChanged', handleSuspensionStatusChanged);

      return () => {
        socket.off('adminSuspendedUsersRefresh', handleSuspendedRefresh);
        socket.off('userSuspensionStatusChanged', handleSuspensionStatusChanged);
      };
    }
  }, [fetchSuspendedUsers, showToast]);

  // Copy User ID Helper
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast('User ID copied to clipboard ✓', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Immediate Activate (lift suspension)
  const handleActivate = async (u) => {
    try {
      await api.post(`/admin/users/${u._id}/activate-suspension`, {
        reason: 'Suspension immediately lifted by Super Admin',
      });
      showToast(`User ${u.name} immediately activated ✓`, 'success');
      fetchSuspendedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to activate user', 'error');
    }
  };

  // Suspend User
  const handleConfirmSuspend = async (u, suspendData) => {
    try {
      await api.post(`/admin/users/${u._id}/suspend`, suspendData);
      showToast(`User ${u.name} suspended for ${suspendData.duration} ✓`, 'warning');
      fetchSuspendedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to suspend user', 'error');
    }
  };

  // Extend Suspension
  const handleConfirmExtend = async (u, extendData) => {
    try {
      await api.post(`/admin/users/${u._id}/extend-suspension`, extendData);
      showToast(`Suspension extended by ${extendData.duration} ✓`, 'success');
      fetchSuspendedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to extend suspension', 'error');
    }
  };

  // Live countdown string calculator with seconds
  const formatLiveCountdown = (suspendedUntil) => {
    if (!suspendedUntil) return 'No timer set';
    const diff = new Date(suspendedUntil).getTime() - currentTime;
    if (diff <= 0) return 'Expired (Activation pending)';

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s remaining`;
    }
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s remaining`;
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return suspendedUsers.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchUser = u.username?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phoneNumber?.includes(q);
        const matchReason = u.suspendReason?.toLowerCase().includes(q);
        const matchId = String(u._id).toLowerCase().includes(q);
        return matchName || matchUser || matchEmail || matchPhone || matchReason || matchId;
      }
      return true;
    });
  }, [suspendedUsers, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      {/* Top Banner & Super Admin Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          padding: '16px 20px',
          background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
          borderRadius: 14,
          border: '1px solid var(--border-subtle, #e2e8f0)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <Icons.PauseCircle style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                  Suspended Users
                </h2>
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {suspendedUsers.length} Temporarily Restricted
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                Temporary restriction for a limited period with live countdown timers, extend, and instant activation controls
              </p>
            </div>
          </div>
        </div>

        {/* Super Admin Control: Suspend User button */}
        <button
          onClick={() => setSuperAdminSuspendOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            background: '#f59e0b',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <Icons.PauseCircle style={{ width: 16, height: 16 }} />
          <span>+ Suspend Any User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search suspended accounts by name, user ID, phone, email, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              borderRadius: 10,
              background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              color: isDarkMode ? '#ffffff' : '#0f172a',
              fontSize: '0.86rem',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
            <Icons.Search style={{ width: 16, height: 16 }} />
          </span>
        </div>

        <button
          onClick={fetchSuspendedUsers}
          title="Refresh from MongoDB"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle, #cbd5e1)',
            background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Suspended Users List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
          Loading real-time suspended users data...
        </div>
      ) : filteredList.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
            borderRadius: 14,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            color: 'var(--text-muted, #64748b)',
          }}
        >
          <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>🎉</span>
          <h3 style={{ margin: '0 0 6px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>No Suspended Users</h3>
          <p style={{ margin: 0, fontSize: '0.84rem' }}>
            {search ? 'No suspended users match your search criteria' : 'There are currently no active suspensions'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredList.map((u) => {
            const countdownStr = formatLiveCountdown(u.suspendedUntil);
            const isExpired = u.suspendedUntil && new Date(u.suspendedUntil).getTime() <= currentTime;

            return (
              <div
                key={u._id}
                style={{
                  background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
                  borderRadius: 14,
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Header row: Avatar, Info, Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar user={u} size={46} />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#f59e0b',
                          border: '2px solid #ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          color: '#fff',
                        }}
                      >
                        ⏸
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.98rem', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                          {u.name}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                          @{u.username}
                        </span>
                        {/* Suspension Duration badge */}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #f59e0b',
                          }}
                        >
                          Duration: {u.suspensionDuration || '24 Hours'}
                        </span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 6,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: isExpired ? '#fee2e2' : '#fef3c7',
                            color: isExpired ? '#991b1b' : '#b45309',
                          }}
                        >
                          {isExpired ? 'EXPIRED' : 'ACTIVE SUSPENSION'}
                        </span>
                      </div>

                      {/* Contact row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                        <span
                          onClick={() => handleCopyId(u._id)}
                          title="Click to copy User ID"
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: copiedId === u._id ? '#10b981' : 'inherit' }}
                        >
                          ID: <code style={{ fontSize: '0.74rem', background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: 4 }}>{u._id}</code>
                          {copiedId === u._id ? '✓' : '📋'}
                        </span>
                        <span>📱 {u.phoneNumber || 'No phone'}</span>
                        <span>✉️ {u.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Previous suspension count */}
                  <button
                    onClick={() => setActiveHistoryUser(u)}
                    style={{
                      background: 'rgba(0,0,0,0.04)',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted, #64748b)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>📜 Suspensions:</span>
                    <strong style={{ color: '#d97706' }}>{u.suspensionHistory?.length || 0} times</strong>
                  </button>
                </div>

                {/* Meta details & Live Countdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10,
                    background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: 10,
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      SUSPENSION DATE
                    </span>
                    <strong style={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      {u.suspendedAt ? new Date(u.suspendedAt).toLocaleDateString() : 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      START TIME
                    </span>
                    <strong style={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      {u.suspendedAt ? new Date(u.suspendedAt).toLocaleTimeString() : 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      END TIME
                    </span>
                    <strong style={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      {u.suspendedUntil ? new Date(u.suspendedUntil).toLocaleString() : 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      SUSPENDED BY
                    </span>
                    <strong style={{ color: '#0284c7' }}>
                      🛡️ {u.suspendedByName || u.suspendedBy?.name || 'Super Admin'}
                    </strong>
                  </div>

                  {/* LIVE TICKING COUNTDOWN */}
                  <div style={{ gridColumn: '1 / -1', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="live-pulse-dot" style={{ background: '#d97706' }} />
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                        LIVE REMAINING TIME:
                      </span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.92rem', color: isExpired ? '#dc2626' : '#b45309' }}>
                      ⏱️ {countdownStr}
                    </span>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      SUSPENSION REASON
                    </span>
                    <span style={{ color: '#92400e', fontWeight: 600 }}>
                      "{u.suspendReason || 'Administrative suspension'}"
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 8,
                    borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                    paddingTop: 10,
                  }}
                >
                  <button
                    onClick={() => onViewUserDetails && onViewUserDetails(u)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      color: isDarkMode ? '#e2e8f0' : '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View User Details
                  </button>

                  <button
                    onClick={() => setActiveHistoryUser(u)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid #3b82f6',
                      color: '#2563eb',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View History
                  </button>

                  <button
                    onClick={() => setExtendModalUser(u)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid #f59e0b',
                      color: '#d97706',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Extend Suspension
                  </button>

                  <button
                    onClick={() => handleActivate(u)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    ⚡ Immediately Activate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {activeHistoryUser && (
        <HistoryLogModal
          isOpen={!!activeHistoryUser}
          onClose={() => setActiveHistoryUser(null)}
          title="Account Suspension History & Timeline"
          type="suspension"
          user={activeHistoryUser}
          history={activeHistoryUser.suspensionHistory || []}
        />
      )}

      {/* Extend Modal */}
      {extendModalUser && (
        <ExtendSuspensionModal
          isOpen={!!extendModalUser}
          onClose={() => setExtendModalUser(null)}
          user={extendModalUser}
          onConfirm={handleConfirmExtend}
        />
      )}

      {/* Super Admin Suspend Any User Selector */}
      {superAdminSuspendOpen && (
        <SuperAdminActionModal
          isOpen={superAdminSuspendOpen}
          onClose={() => setSuperAdminSuspendOpen(false)}
          allUsers={allUsers}
          mode="suspend"
          onConfirmAction={(target) => {
            setSingleSuspendUser(target);
          }}
        />
      )}

      {/* Suspend Config Modal */}
      {singleSuspendUser && (
        <SuspendUserModal
          isOpen={!!singleSuspendUser}
          onClose={() => setSingleSuspendUser(null)}
          user={singleSuspendUser}
          onConfirm={handleConfirmSuspend}
        />
      )}
    </div>
  );
};

export default SuspendedUsersView;
