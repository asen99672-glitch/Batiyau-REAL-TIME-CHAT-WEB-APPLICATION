import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import Icons from './AdminIcons';
import Avatar from '../Avatar';
import { getSocket, createSocketConnection } from '../../services/socket';
import {
  DeleteUserModal,
  PurgeConfirmModal,
  HistoryLogModal,
  SuperAdminActionModal,
} from './AdminModals';

const DeletedUsersView = ({
  allUsers = [],
  onViewUserDetails,
  showToast = () => {},
  isDarkMode = false,
}) => {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'retention' | 'purged'
  const [copiedId, setCopiedId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Modals state
  const [activeHistoryUser, setActiveHistoryUser] = useState(null);
  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [purgeModalUser, setPurgeModalUser] = useState(null);
  const [superAdminDeleteOpen, setSuperAdminDeleteOpen] = useState(false);
  const [singleDeleteUser, setSingleDeleteUser] = useState(null);

  // Live timer interval to update retention status in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch 100% Real Deleted Accounts from MongoDB
  const fetchDeletedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/deleted-users');
      setDeletedUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch deleted users:', err);
      showToast('Failed to load deleted accounts list', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDeletedUsers();
  }, [fetchDeletedUsers]);

  // Real-time Socket Event Listeners for Live Deleted Accounts Sync
  useEffect(() => {
    const token = localStorage.getItem('chatToken');
    let socket = getSocket();
    if (!socket && token) {
      socket = createSocketConnection(token);
    }
    if (socket) {
      socket.emit('joinAdminChannel');

      const handleDeletedRefresh = (payload) => {
        fetchDeletedUsers();
        if (payload?.action === 'delete') {
          showToast('Live update: Account archived under retention policy', 'warning');
        } else if (payload?.action === 'restore') {
          showToast('Live update: Account successfully restored', 'success');
        } else if (payload?.action === 'purge') {
          showToast('Live update: Account permanently purged', 'danger');
        }
      };

      const handleUserDeleted = () => {
        fetchDeletedUsers();
      };
      const handleUserRestored = () => {
        fetchDeletedUsers();
      };
      const handleUserPurged = () => {
        fetchDeletedUsers();
      };

      socket.on('adminDeletedUsersRefresh', handleDeletedRefresh);
      socket.on('userDeletedAdmin', handleUserDeleted);
      socket.on('userRestoredAdmin', handleUserRestored);
      socket.on('userPurgedAdmin', handleUserPurged);

      return () => {
        socket.off('adminDeletedUsersRefresh', handleDeletedRefresh);
        socket.off('userDeletedAdmin', handleUserDeleted);
        socket.off('userRestoredAdmin', handleUserRestored);
        socket.off('userPurgedAdmin', handleUserPurged);
      };
    }
  }, [fetchDeletedUsers, showToast]);

  // Copy User ID Helper
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast('User ID copied to clipboard ✓', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Restore Account Handler
  const handleRestoreAccount = async (u) => {
    if (u.isPurged) {
      showToast('Permanently purged accounts cannot be restored', 'error');
      return;
    }

    try {
      await api.post(`/admin/users/${u._id}/restore`, {
        reason: 'Restored to active status by Super Administrator',
      });
      showToast(`Account for ${u.name} restored to active status ✓`, 'success');
      fetchDeletedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore account', 'error');
    }
  };

  // Initiate Account Deletion (Soft-Delete with Retention)
  const handleConfirmDelete = async (u, deleteData) => {
    try {
      await api.post(`/admin/users/${u._id}/delete`, deleteData);
      showToast(`Account ${u.name} archived under ${deleteData.retentionDays}d retention policy ✓`, 'success');
      fetchDeletedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete account', 'error');
    }
  };

  // Permanently Purge Account
  const handleConfirmPurge = async (u) => {
    try {
      await api.delete(`/admin/users/${u._id}/purge`);
      showToast(`Account ${u.name} permanently purged and anonymized. Non-restorable.`, 'warning');
      fetchDeletedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to purge account', 'error');
    }
  };

  // Helper for Retention Countdown
  const getRetentionStatus = (u) => {
    if (u.isPurged) {
      return {
        badge: 'PURGED',
        color: '#64748b',
        bg: '#f1f5f9',
        text: `Data Permanently Purged on ${u.purgedAt ? new Date(u.purgedAt).toLocaleDateString() : 'N/A'} by ${u.purgedByName || 'Super Admin'}`,
        restorable: false,
      };
    }

    if (!u.retentionExpiryDate) {
      return {
        badge: 'IN RETENTION',
        color: '#d97706',
        bg: '#fef3c7',
        text: 'Archived under retention policy (Restorable)',
        restorable: true,
      };
    }

    const diff = new Date(u.retentionExpiryDate).getTime() - currentTime;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return {
        badge: 'RETENTION EXPIRED',
        color: '#dc2626',
        bg: '#fee2e2',
        text: 'Retention window elapsed — eligible for permanent database purge',
        restorable: true, // Still restorable until purged
      };
    }

    return {
      badge: `${days}d RETENTION LEFT`,
      color: '#2563eb',
      bg: '#eff6ff',
      text: `Retention active — ${days} days remaining until scheduled purge`,
      restorable: true,
    };
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return deletedUsers.filter((u) => {
      if (statusFilter === 'retention' && u.isPurged) return false;
      if (statusFilter === 'purged' && !u.isPurged) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchUser = u.username?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phoneNumber?.includes(q);
        const matchReason = u.deletionReason?.toLowerCase().includes(q);
        const matchType = u.deletionType?.toLowerCase().includes(q);
        const matchId = String(u._id).toLowerCase().includes(q);
        return matchName || matchUser || matchEmail || matchPhone || matchReason || matchType || matchId;
      }
      return true;
    });
  }, [deletedUsers, statusFilter, search]);

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
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <Icons.Trash style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                  Deleted & Archived Accounts
                </h2>
                <span
                  style={{
                    background: '#64748b',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {deletedUsers.length} Archived
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                OWASP-compliant account archiving, retention management, restoration, and permanent purge controls
              </p>
            </div>
          </div>
        </div>

        {/* Super Admin Control: Archive / Delete User button */}
        <button
          onClick={() => setSuperAdminDeleteOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <Icons.Trash style={{ width: 16, height: 16 }} />
          <span>+ Archive / Delete User</span>
        </button>
      </div>

      {/* OWASP Principle Info Banner */}
      <div
        style={{
          background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>🛡️</span>
        <div style={{ fontSize: '0.82rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          <strong>OWASP Architecture & Data Retention Rule:</strong> User accounts are securely soft-deleted and archived under a retention policy. This prevents Denial-of-Service to legitimate users and preserves compliance audit trails. Accounts can be restored at any time during retention, unless permanently purged.
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search deleted accounts by name, user ID, email, reason, or deletion type..."
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

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'retention', label: '⏳ In Retention (Restorable)' },
            { id: 'purged', label: '🚫 Purged (Non-Restorable)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: statusFilter === tab.id ? '1px solid #2563eb' : '1px solid var(--border-subtle, #cbd5e1)',
                background: statusFilter === tab.id ? 'rgba(37, 99, 235, 0.15)' : isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
                color: statusFilter === tab.id ? '#2563eb' : 'var(--text-muted, #64748b)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchDeletedUsers}
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
      </div>

      {/* Deleted Accounts List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
          Loading real-time deleted accounts data...
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
          <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>📂</span>
          <h3 style={{ margin: '0 0 6px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>No Deleted Accounts</h3>
          <p style={{ margin: 0, fontSize: '0.84rem' }}>
            {search ? 'No deleted accounts match your search query' : 'There are currently no deleted or archived accounts'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredList.map((u) => {
            const retention = getRetentionStatus(u);

            return (
              <div
                key={u._id}
                style={{
                  background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
                  borderRadius: 14,
                  border: u.isPurged ? '1px solid #cbd5e1' : '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  opacity: u.isPurged ? 0.8 : 1,
                }}
              >
                {/* Header Row */}
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
                          background: u.isPurged ? '#475569' : '#dc2626',
                          border: '2px solid #ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          color: '#fff',
                        }}
                      >
                        🗑
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

                        {/* Deletion Type Badge */}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              u.deletionType === 'Policy violation'
                                ? '#fee2e2'
                                : u.deletionType === 'User requested'
                                ? '#eff6ff'
                                : '#fef3c7',
                            color:
                              u.deletionType === 'Policy violation'
                                ? '#dc2626'
                                : u.deletionType === 'User requested'
                                ? '#1d4ed8'
                                : '#b45309',
                            border: '1px solid rgba(0,0,0,0.1)',
                          }}
                        >
                          Type: {u.deletionType || 'Admin action'}
                        </span>

                        {/* Retention Status Badge */}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: retention.bg,
                            color: retention.color,
                          }}
                        >
                          {retention.badge}
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

                  {/* Audit History Count Button */}
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
                    <span>📜 Audit History:</span>
                    <strong style={{ color: '#2563eb' }}>{u.deletionHistory?.length || 0} records</strong>
                  </button>
                </div>

                {/* Details Meta Grid */}
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
                      ACCOUNT DELETION DATE
                    </span>
                    <strong style={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                      {u.deletedAt ? new Date(u.deletedAt).toLocaleString() : 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      DELETED BY
                    </span>
                    <strong style={{ color: '#0284c7' }}>
                      🛡️ {u.deletedByName || u.deletedBy?.name || 'Super Admin'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      DELETION / RETENTION STATUS
                    </span>
                    <strong style={{ color: retention.color }}>
                      {retention.text}
                    </strong>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                      DELETION REASON
                    </span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      "{u.deletionReason || 'Administrative account deletion'}"
                    </span>
                  </div>
                </div>

                {/* Actions row: View Deletion Details, View Audit History, Restore Account, Permanently Purge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 8,
                    borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                    paddingTop: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setDetailsModalUser(u)}
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
                    View Deletion Details
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
                    View Audit History
                  </button>

                  {/* Restore Account (Allowed if not permanently purged) */}
                  {retention.restorable && (
                    <button
                      onClick={() => handleRestoreAccount(u)}
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
                      ↺ Restore Account*
                    </button>
                  )}

                  {/* Permanently Purge Account (Super Admin action) */}
                  {!u.isPurged ? (
                    <button
                      onClick={() => setPurgeModalUser(u)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#dc2626',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Permanent Purge
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: '#94a3b8',
                        padding: '4px 8px',
                        background: '#f1f5f9',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      ❌ Already Purged (Non-Restorable)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit History Modal */}
      {activeHistoryUser && (
        <HistoryLogModal
          isOpen={!!activeHistoryUser}
          onClose={() => setActiveHistoryUser(null)}
          title="Account Deletion & Audit History"
          type="deletion"
          user={activeHistoryUser}
          history={activeHistoryUser.deletionHistory || []}
        />
      )}

      {/* Deletion Details Modal */}
      {detailsModalUser && (
        <div className="admin-modal-backdrop" onClick={() => setDetailsModalUser(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-icon-badge danger">
                <Icons.Trash />
              </div>
              <div className="modal-title-wrap">
                <h3>Deletion Record & Metadata</h3>
                <p>Archived record for <strong>{detailsModalUser.name}</strong></p>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailsModalUser(null)}>×</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                <p style={{ margin: '0 0 6px' }}><strong>User:</strong> {detailsModalUser.name} (@{detailsModalUser.username})</p>
                <p style={{ margin: '0 0 6px' }}><strong>User ID:</strong> <code>{detailsModalUser._id}</code></p>
                <p style={{ margin: '0 0 6px' }}><strong>Email:</strong> {detailsModalUser.email}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Mobile:</strong> {detailsModalUser.phoneNumber || 'N/A'}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Deletion Date:</strong> {detailsModalUser.deletedAt ? new Date(detailsModalUser.deletedAt).toLocaleString() : 'N/A'}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Deleted By:</strong> {detailsModalUser.deletedByName || 'Super Admin'}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Deletion Type:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{detailsModalUser.deletionType || 'Admin action'}</span></p>
                <p style={{ margin: '0 0 6px' }}><strong>Reason:</strong> {detailsModalUser.deletionReason}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Retention Expiry:</strong> {detailsModalUser.retentionExpiryDate ? new Date(detailsModalUser.retentionExpiryDate).toLocaleString() : 'Standard 30 days'}</p>
                <p style={{ margin: 0 }}><strong>Purged Status:</strong> {detailsModalUser.isPurged ? 'Yes (Permanently destroyed & anonymized)' : 'No (In Retention / Restorable)'}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary-confirm" onClick={() => setDetailsModalUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Purge Modal */}
      {purgeModalUser && (
        <PurgeConfirmModal
          isOpen={!!purgeModalUser}
          onClose={() => setPurgeModalUser(null)}
          user={purgeModalUser}
          onConfirm={handleConfirmPurge}
        />
      )}

      {/* Super Admin Delete Any User Selector */}
      {superAdminDeleteOpen && (
        <SuperAdminActionModal
          isOpen={superAdminDeleteOpen}
          onClose={() => setSuperAdminDeleteOpen(false)}
          allUsers={allUsers}
          mode="delete"
          onConfirmAction={(target) => {
            setSingleDeleteUser(target);
          }}
        />
      )}

      {/* Delete Config Modal */}
      {singleDeleteUser && (
        <DeleteUserModal
          isOpen={!!singleDeleteUser}
          onClose={() => setSingleDeleteUser(null)}
          user={singleDeleteUser}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default DeletedUsersView;
