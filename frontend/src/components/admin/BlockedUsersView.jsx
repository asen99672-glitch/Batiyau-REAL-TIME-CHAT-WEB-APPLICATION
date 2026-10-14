import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import Icons from './AdminIcons';
import Avatar from '../Avatar';
import { useAuth } from '../../context/AuthContext';
import { getSocket, createSocketConnection } from '../../services/socket';
import {
  BlockUserModal,
  HistoryLogModal,
  SuperAdminActionModal,
  UnblockUserModal,
  ChangeBlockReasonModal,
  ExtendBlockModal,
  MakePermanentBlockModal,
  BlockedUserDetailsModal,
} from './AdminModals';

const BlockedUsersView = ({
  allUsers = [],
  onViewUserDetails,
  showToast = () => {},
  isDarkMode = false,
}) => {
  const { user: authUser } = useAuth();

  // Data states
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [peerBlockedUsers, setPeerBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('platform_blocks'); // 'platform_blocks' | 'peer_blocks'
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'temporary' | 'permanent'
  const [copiedId, setCopiedId] = useState(null);
  const [ticker, setTicker] = useState(0);

  // Modals state
  const [selectedDetailsUser, setSelectedDetailsUser] = useState(null);
  const [activeHistoryUser, setActiveHistoryUser] = useState(null);
  const [superAdminBlockOpen, setSuperAdminBlockOpen] = useState(false);
  const [singleBlockUser, setSingleBlockUser] = useState(null);
  const [unblockModalUser, setUnblockModalUser] = useState(null);
  const [changeReasonUser, setChangeReasonUser] = useState(null);
  const [extendBlockUser, setExtendBlockUser] = useState(null);
  const [makePermanentUser, setMakePermanentUser] = useState(null);

  // Live timer interval to update countdown tickers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Real Blocked Users from MongoDB
  const fetchBlockedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/blocked-users');
      setBlockedUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
      showToast('Failed to load blocked users list', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch Peer-to-Peer Blocked Users (User-to-User blocks)
  const fetchPeerBlockedUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/peer-blocked-users');
      setPeerBlockedUsers(data.peerBlocks || []);
    } catch (err) {
      console.error('Failed to fetch peer blocked users:', err);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
    fetchPeerBlockedUsers();
  }, [fetchBlockedUsers, fetchPeerBlockedUsers]);

  // Real-time Socket Event Listeners for Live Block & Unblock Synchronization
  useEffect(() => {
    const token = localStorage.getItem('chatToken');
    let socket = getSocket();
    if (!socket && token) {
      socket = createSocketConnection(token);
    }

    if (socket) {
      socket.emit('joinAdminChannel');

      const handleAdminRefresh = (payload) => {
        fetchBlockedUsers();
        fetchPeerBlockedUsers();
        if (payload?.action === 'block') {
          showToast(`Real-time update: User restricted`, 'info');
        } else if (payload?.action === 'unblock') {
          showToast(`Real-time update: User unblocked`, 'info');
        }
      };

      const handleBanStatusChanged = () => {
        fetchBlockedUsers();
      };

      const handlePeerBlockUpdate = (payload) => {
        fetchPeerBlockedUsers();
        if (payload?.action === 'block') {
          showToast(`Live event: ${payload.blockerName || 'User'} blocked a contact`, 'info');
        } else if (payload?.action === 'unblock') {
          showToast(`Live event: ${payload.unblockerName || 'User'} unblocked a contact`, 'info');
        }
      };

      socket.on('adminBlockedUsersRefresh', handleAdminRefresh);
      socket.on('userBanStatusChanged', handleBanStatusChanged);
      socket.on('peerBlockUpdate', handlePeerBlockUpdate);
      socket.on('userBlocked', handlePeerBlockUpdate);
      socket.on('userUnblocked', handlePeerBlockUpdate);

      return () => {
        socket.off('adminBlockedUsersRefresh', handleAdminRefresh);
        socket.off('userBanStatusChanged', handleBanStatusChanged);
        socket.off('peerBlockUpdate', handlePeerBlockUpdate);
        socket.off('userBlocked', handlePeerBlockUpdate);
        socket.off('userUnblocked', handlePeerBlockUpdate);
      };
    }
  }, [fetchBlockedUsers, fetchPeerBlockedUsers, showToast]);

  // Copy User ID Helper
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    showToast('User ID copied to clipboard ✓', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Block Handler (From BlockUserModal)
  const handleConfirmBlock = async (u, blockData) => {
    try {
      await api.post(`/admin/users/${u._id}/block`, blockData);
      showToast(
        `User ${u.name} ${blockData.blockType === 'temporary' ? 'temporarily' : 'permanently'} blocked ✓`,
        'success'
      );
      fetchBlockedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to block user', 'error');
    }
  };

  // Unblock Handler (From UnblockUserModal)
  const handleConfirmUnblock = async (u, unblockData) => {
    try {
      await api.post(`/admin/users/${u._id}/unblock`, unblockData);
      showToast(`User ${u.name} unblocked successfully ✓`, 'success');
      fetchBlockedUsers();
      if (selectedDetailsUser && selectedDetailsUser._id === u._id) {
        setSelectedDetailsUser(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unblock user', 'error');
    }
  };

  // Change Block Reason Handler
  const handleConfirmChangeReason = async (u, newReason) => {
    try {
      await api.put(`/admin/users/${u._id}/block-reason`, { reason: newReason });
      showToast('Block reason updated successfully ✓', 'success');
      fetchBlockedUsers();
      if (selectedDetailsUser && selectedDetailsUser._id === u._id) {
        setSelectedDetailsUser((prev) => ({ ...prev, banReason: newReason }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change block reason', 'error');
    }
  };

  // Extend Block Duration Handler
  const handleConfirmExtendBlock = async (u, extendData) => {
    try {
      const res = await api.post(`/admin/users/${u._id}/extend-block`, extendData);
      showToast('Block duration extended successfully ✓', 'success');
      fetchBlockedUsers();
      if (selectedDetailsUser && selectedDetailsUser._id === u._id && res.data?.user) {
        setSelectedDetailsUser(res.data.user);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to extend block duration', 'error');
    }
  };

  // Make Permanent Block Handler
  const handleConfirmMakePermanent = async (u, reason) => {
    try {
      const res = await api.post(`/admin/users/${u._id}/make-permanent-block`, { reason });
      showToast('Block converted to permanent successfully ✓', 'success');
      fetchBlockedUsers();
      if (selectedDetailsUser && selectedDetailsUser._id === u._id && res.data?.user) {
        setSelectedDetailsUser(res.data.user);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to make block permanent', 'error');
    }
  };

  // Remaining time calculation helper with live countdown
  const getRemainingTime = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - Date.now();
    if (diff <= 0) return 'Expired (Auto-lift pending)';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m ${secs}s remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s remaining`;
    }
    return `${mins}m ${secs}s remaining`;
  };

  // Filtered blocked users list (platform + peer contact blocks)
  const filteredList = useMemo(() => {
    return blockedUsers.filter((u) => {
      if (filterType === 'platform' && u.isPeerBlocked) return false;
      if (filterType === 'peer' && !u.isPeerBlocked) return false;
      if (filterType === 'temporary' && u.blockType !== 'temporary') return false;
      if (filterType === 'permanent' && (u.isPeerBlocked || u.blockType === 'temporary')) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchUser = u.username?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phoneNumber?.includes(q);
        const matchReason = u.banReason?.toLowerCase().includes(q);
        const matchId = String(u._id).toLowerCase().includes(q);
        const matchAdmin = (u.blockedByName || u.blockedBy?.name || u.blockerName || '').toLowerCase().includes(q);
        return matchName || matchUser || matchEmail || matchPhone || matchReason || matchId || matchAdmin;
      }
      return true;
    });
  }, [blockedUsers, filterType, search]);

  // Filtered peer blocked list
  const filteredPeerList = useMemo(() => {
    if (!search.trim()) return peerBlockedUsers;
    const q = search.toLowerCase().trim();
    return peerBlockedUsers.filter((item) => {
      const matchBlocker =
        item.blocker?.name?.toLowerCase().includes(q) ||
        item.blocker?.username?.toLowerCase().includes(q) ||
        item.blocker?.phoneNumber?.includes(q);
      const matchBlocked =
        item.blocked?.name?.toLowerCase().includes(q) ||
        item.blocked?.username?.toLowerCase().includes(q) ||
        item.blocked?.phoneNumber?.includes(q);
      return matchBlocker || matchBlocked;
    });
  }, [peerBlockedUsers, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      {/* Top Banner & Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '16px 20px',
          background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
          borderRadius: 14,
          border: '1px solid var(--border-subtle, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <Icons.Ban style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                Blocked Users Center
              </h2>
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                {blockedUsers.length} Blocked Users
              </span>
              <span
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}></span>
                Live Socket Sync Active
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
              Real-time administrative restriction controls, user profiles, duration extension, and peer block auditing
            </p>
          </div>
        </div>

        {/* Action Button: Block User */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setSuperAdminBlockOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.28)',
              transition: 'all 0.15s ease',
            }}
          >
            <Icons.Ban style={{ width: 16, height: 16 }} />
            <span>+ Block Any User</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Selector: All Blocked Accounts vs Peer-to-Peer Blocks */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid var(--border-subtle, #e2e8f0)', paddingBottom: 8 }}>
        <button
          onClick={() => setActiveMainTab('platform_blocks')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeMainTab === 'platform_blocks' ? '#ef4444' : 'transparent',
            color: activeMainTab === 'platform_blocks' ? '#ffffff' : 'var(--text-muted, #64748b)',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>🛡️ All Blocked Users (Real-Time)</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: '0.72rem',
              background: activeMainTab === 'platform_blocks' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
              color: activeMainTab === 'platform_blocks' ? '#fff' : 'inherit',
            }}
          >
            {blockedUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('peer_blocks')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeMainTab === 'peer_blocks' ? '#2563eb' : 'transparent',
            color: activeMainTab === 'peer_blocks' ? '#ffffff' : 'var(--text-muted, #64748b)',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>👥 Contact Block Pairs</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: '0.72rem',
              background: activeMainTab === 'peer_blocks' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
              color: activeMainTab === 'peer_blocks' ? '#fff' : 'inherit',
            }}
          >
            {peerBlockedUsers.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <input
            type="text"
            placeholder={
              activeMainTab === 'platform_blocks'
                ? 'Search by name, ID, mobile, email, admin/blocker, or reason...'
                : 'Search blocker or blocked user name, phone, email...'
            }
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

        {activeMainTab === 'platform_blocks' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${blockedUsers.length})` },
              { id: 'platform', label: `🛡️ Platform Bans (${blockedUsers.filter((u) => !u.isPeerBlocked).length})` },
              { id: 'peer', label: `👥 Contact Blocks (${blockedUsers.filter((u) => u.isPeerBlocked).length})` },
              { id: 'temporary', label: `⏳ Temporary (${blockedUsers.filter((u) => u.blockType === 'temporary').length})` },
              { id: 'permanent', label: `🚫 Permanent (${blockedUsers.filter((u) => !u.isPeerBlocked && u.blockType !== 'temporary').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                style={{
                  padding: '7px 11px',
                  borderRadius: 8,
                  border: filterType === tab.id ? '1px solid #ef4444' : '1px solid var(--border-subtle, #cbd5e1)',
                  background: filterType === tab.id ? 'rgba(239, 68, 68, 0.15)' : isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
                  color: filterType === tab.id ? '#ef4444' : 'var(--text-muted, #64748b)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            fetchBlockedUsers();
            fetchPeerBlockedUsers();
            showToast('Refreshed real-time block records ✓', 'info');
          }}
          title="Refresh from MongoDB"
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle, #cbd5e1)',
            background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* VIEW 1: Platform Blocked Accounts */}
      {activeMainTab === 'platform_blocks' && (
        <>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
              Loading real-time blocked users data...
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
              <h3 style={{ margin: '0 0 6px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>No Blocked Users Found</h3>
              <p style={{ margin: 0, fontSize: '0.84rem' }}>
                {search ? 'No blocked users match your search criteria' : 'There are currently no active blocks on the platform'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredList.map((u) => {
                const isTemp = u.blockType === 'temporary';
                const remaining = isTemp ? getRemainingTime(u.blockExpiryDate) : null;

                return (
                  <div
                    key={u._id}
                    style={{
                      background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
                      borderRadius: 14,
                      border: isTemp ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1.5px solid rgba(239, 68, 68, 0.4)',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Header Row: Avatar, Identity, Badges */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar user={u} size={48} />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 17,
                              height: 17,
                              borderRadius: '50%',
                              background: isTemp ? '#f59e0b' : '#ef4444',
                              border: '2px solid #ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              color: '#fff',
                              fontWeight: 900,
                            }}
                          >
                            ✕
                          </span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                              {u.name}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                              @{u.username}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: u.isPeerBlocked
                                  ? 'rgba(124, 58, 237, 0.12)'
                                  : isTemp
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                                color: u.isPeerBlocked ? '#7c3aed' : isTemp ? '#d97706' : '#dc2626',
                                border: u.isPeerBlocked
                                  ? '1px solid #7c3aed'
                                  : isTemp
                                  ? '1px solid #f59e0b'
                                  : '1px solid #ef4444',
                              }}
                            >
                              {u.isPeerBlocked
                                ? `👥 CONTACT BLOCK (by @${u.blockerName || u.blockedByName || 'user'})`
                                : isTemp
                                ? '⏳ TEMPORARY BLOCK'
                                : '🚫 PERMANENT BLOCK'}
                            </span>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: 6,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: u.isPeerBlocked ? '#ede9fe' : '#fee2e2',
                                color: u.isPeerBlocked ? '#6d28d9' : '#991b1b',
                              }}
                            >
                              {u.isPeerBlocked ? 'PEER RESTRICTED' : 'RESTRICTED'}
                            </span>
                          </div>

                          {/* Contact Meta Row */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              marginTop: 4,
                              flexWrap: 'wrap',
                              fontSize: '0.78rem',
                              color: 'var(--text-muted, #64748b)',
                            }}
                          >
                            <span
                              onClick={() => handleCopyId(u._id)}
                              title="Click to copy User ID"
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                color: copiedId === u._id ? '#10b981' : 'inherit',
                                fontWeight: 600,
                              }}
                            >
                              ID: <code style={{ fontSize: '0.74rem', background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>{u._id}</code>
                              {copiedId === u._id ? '✓ Copied' : '📋'}
                            </span>
                            <span>📱 {u.phoneNumber || 'No mobile number'}</span>
                            <span>✉️ {u.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* View Profile / Details & History Pill */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedDetailsUser(u)}
                          style={{
                            background: 'rgba(37, 99, 235, 0.08)',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            borderRadius: 8,
                            padding: '5px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#2563eb',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <span>👤</span>
                          <span>View Profile & Details</span>
                        </button>

                        <button
                          onClick={() => setActiveHistoryUser(u)}
                          style={{
                            background: 'rgba(0,0,0,0.04)',
                            border: '1px solid var(--border-subtle, #cbd5e1)',
                            borderRadius: 8,
                            padding: '5px 10px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: 'var(--text-muted, #64748b)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>📜 History:</span>
                          <strong style={{ color: '#ef4444' }}>{u.blockHistory?.length || 0}</strong>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid (Requirement 1 fields) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                        gap: 10,
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                        padding: '12px 14px',
                        borderRadius: 10,
                        fontSize: '0.8rem',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                          BLOCKED DATE & TIME
                        </span>
                        <strong style={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                          {u.blockedAt ? new Date(u.blockedAt).toLocaleString() : 'Recently'}
                        </strong>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                          BLOCKED BY
                        </span>
                        <strong style={{ color: u.isPeerBlocked ? '#7c3aed' : '#0284c7' }}>
                          {u.isPeerBlocked ? '👤 ' : '🛡️ '}
                          {u.blockedByName || u.blockedBy?.name || u.blockerName || 'Super Admin'}
                        </strong>
                      </div>

                      {isTemp ? (
                        <div>
                          <span style={{ color: '#d97706', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>
                            EXPIRY DATE & COUNTDOWN
                          </span>
                          <strong style={{ color: '#b45309' }}>
                            {u.blockExpiryDate ? new Date(u.blockExpiryDate).toLocaleString() : 'N/A'}
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.74rem', color: '#d97706', fontWeight: 700, marginTop: 1 }}>
                            ⏱️ {remaining}
                          </span>
                        </div>
                      ) : u.isPeerBlocked ? (
                        <div>
                          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                            EXPIRY STATUS
                          </span>
                          <span style={{ color: '#7c3aed', fontWeight: 600 }}>Contact Privacy Lock</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                            EXPIRY STATUS
                          </span>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Permanent (No expiration)</span>
                        </div>
                      )}

                      <div style={{ gridColumn: isTemp ? 'span 1' : 'span 1' }}>
                        <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                          BLOCK REASON
                        </span>
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                          "{u.banReason || 'Violation of community policies'}"
                        </span>
                      </div>
                    </div>

                    {/* Action Controls Row (Requirement 2 & 3) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                        borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                        paddingTop: 10,
                      }}
                    >
                      {/* Left: Modify controls */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setChangeReasonUser(u)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Change Reason
                        </button>

                        {isTemp && (
                          <>
                            <button
                              onClick={() => setExtendBlockUser(u)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: '#fef3c7',
                                border: '1px solid #f59e0b',
                                color: '#92400e',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              ⏳ Extend Duration
                            </button>

                            <button
                              onClick={() => setMakePermanentUser(u)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: '#fee2e2',
                                border: '1px solid #ef4444',
                                color: '#dc2626',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              🚫 Make Permanent
                            </button>
                          </>
                        )}
                      </div>

                      {/* Right: Unblock User button */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setUnblockModalUser(u)}
                          style={{
                            padding: '7px 16px',
                            borderRadius: 8,
                            background: '#10b981',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span>🔓</span>
                          <span>Unblock User</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Peer-to-Peer Blocked Users (User A blocked User B) */}
      {activeMainTab === 'peer_blocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: '0.82rem',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              👥 <strong>Peer-to-Peer Real-Time Block Tracker:</strong> Displays registered users who have blocked other users in chats or contact privacy settings.
            </div>
            <span style={{ fontSize: '0.74rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {peerBlockedUsers.length} Peer Blocks
            </span>
          </div>

          {filteredPeerList.length === 0 ? (
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
              <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>🤝</span>
              <h3 style={{ margin: '0 0 6px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>No Peer Blocks Found</h3>
              <p style={{ margin: 0, fontSize: '0.84rem' }}>
                No users currently have contacts placed on their blocklist.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredPeerList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: isDarkMode ? 'var(--bg-card, #17191e)' : '#ffffff',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  {/* Blocker User Card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                    <Avatar user={item.blocker} size={42} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                        {item.blocker.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        @{item.blocker.username} • {item.blocker.phoneNumber || item.blocker.email}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700 }}>
                        BLOCKER (User who blocked)
                      </span>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '4px 12px',
                      background: '#fee2e2',
                      borderRadius: 8,
                      border: '1px solid #fecaca',
                    }}
                  >
                    <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.72rem' }}>
                      🚫 HAS BLOCKED
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#991b1b' }}>
                      {new Date(item.blockedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Blocked User Card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                    <Avatar user={item.blocked} size={42} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                        {item.blocked.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        @{item.blocked.username} • {item.blocked.phoneNumber || item.blocked.email}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 700 }}>
                        BLOCKED USER
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Selected User Profile & Details Modal (Requirement 1) */}
      {selectedDetailsUser && (
        <BlockedUserDetailsModal
          isOpen={!!selectedDetailsUser}
          onClose={() => setSelectedDetailsUser(null)}
          user={selectedDetailsUser}
          onChangeReason={(u) => setChangeReasonUser(u)}
          onExtendBlock={(u) => setExtendBlockUser(u)}
          onMakePermanent={(u) => setMakePermanentUser(u)}
          onUnblock={(u) => setUnblockModalUser(u)}
          onViewHistory={(u) => setActiveHistoryUser(u)}
        />
      )}

      {/* MODAL 2: Unblock User Modal (Requirement 3) */}
      {unblockModalUser && (
        <UnblockUserModal
          isOpen={!!unblockModalUser}
          onClose={() => setUnblockModalUser(null)}
          user={unblockModalUser}
          currentAdminName={authUser?.name || 'Super Admin'}
          onConfirm={handleConfirmUnblock}
        />
      )}

      {/* MODAL 3: Change Block Reason Modal (Requirement 2) */}
      {changeReasonUser && (
        <ChangeBlockReasonModal
          isOpen={!!changeReasonUser}
          onClose={() => setChangeReasonUser(null)}
          user={changeReasonUser}
          onConfirm={handleConfirmChangeReason}
        />
      )}

      {/* MODAL 4: Extend Block Duration Modal (Requirement 2) */}
      {extendBlockUser && (
        <ExtendBlockModal
          isOpen={!!extendBlockUser}
          onClose={() => setExtendBlockUser(null)}
          user={extendBlockUser}
          onConfirm={handleConfirmExtendBlock}
        />
      )}

      {/* MODAL 5: Make Permanent Block Modal (Requirement 2) */}
      {makePermanentUser && (
        <MakePermanentBlockModal
          isOpen={!!makePermanentUser}
          onClose={() => setMakePermanentUser(null)}
          user={makePermanentUser}
          onConfirm={handleConfirmMakePermanent}
        />
      )}

      {/* MODAL 6: History Modal */}
      {activeHistoryUser && (
        <HistoryLogModal
          isOpen={!!activeHistoryUser}
          onClose={() => setActiveHistoryUser(null)}
          title="Account Block History & Audit Log"
          type="block"
          user={activeHistoryUser}
          history={activeHistoryUser.blockHistory || []}
        />
      )}

      {/* MODAL 7: Super Admin Block Any User Selector Modal */}
      {superAdminBlockOpen && (
        <SuperAdminActionModal
          isOpen={superAdminBlockOpen}
          onClose={() => setSuperAdminBlockOpen(false)}
          allUsers={allUsers}
          mode="block"
          onConfirmAction={(target) => {
            setSingleBlockUser(target);
          }}
        />
      )}

      {/* MODAL 8: Block Config Modal */}
      {singleBlockUser && (
        <BlockUserModal
          isOpen={!!singleBlockUser}
          onClose={() => setSingleBlockUser(null)}
          user={singleBlockUser}
          onConfirm={handleConfirmBlock}
        />
      )}
    </div>
  );
};

export default BlockedUsersView;
