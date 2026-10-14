import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import Avatar from './Avatar';
import BlockedUsersView from './admin/BlockedUsersView';
import SuspendedUsersView from './admin/SuspendedUsersView';
import DeletedUsersView from './admin/DeletedUsersView';
import UserDetailsModal from './admin/UserDetailsModal';

const AdminPanel = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useChat();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'blocked' | 'suspended' | 'deleted' | 'reports' | 'broadcast' | 'settings'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inspectedUser, setInspectedUser] = useState(null);

  // Reports state
  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('📢 Official Platform Announcement');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState('announcement');
  const [broadcastLevel, setBroadcastLevel] = useState('info');
  const [sendAsChatMessage, setSendAsChatMessage] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // System Settings state
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxUploadSizeMb: 50,
    e2eeEnforced: true,
  });

  // Ban Dialog Modal
  const [banModalUser, setBanModalUser] = useState(null);
  const [banReason, setBanReason] = useState('');

  // 1. Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const { data } = await api.get('/admin/stats');
      setStats(data.stats);
      if (data.systemSettings) {
        setSystemSettings(data.systemSettings);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      showToast(err.response?.data?.message || 'Failed to load admin statistics', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data } = await api.get('/admin/users', {
        params: {
          search: userSearch,
          role: roleFilter,
          status: statusFilter,
        },
      });
      setUsersList(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('Failed to load user directory', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 3. Fetch Reports
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const { data } = await api.get('/admin/reports');
      setReportsList(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  // Real-time live updates via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeBan = ({ userId, isBanned, banReason }) => {
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBanned, banReason } : u))
      );
      fetchStats();
    };

    const handleRealtimeSuspension = () => {
      fetchStats();
      fetchUsers();
    };

    const handleRealtimeDeletion = () => {
      fetchStats();
      fetchUsers();
    };

    const handleRealtimeRole = ({ userId, role }) => {
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role } : u))
      );
      fetchStats();
    };

    const handleRealtimeReport = () => {
      fetchStats();
      if (activeTab === 'reports') {
        fetchReports();
      }
    };

    const handleRealtimeBroadcast = (b) => {
      if (b) {
        showToast(`Dispatched broadcast: "${b.title}"`, 'success', '📢');
      }
    };

    const handleUserPresence = () => {
      fetchStats();
    };

    socket.on('userBanStatusChanged', handleRealtimeBan);
    socket.on('userBlocked', handleRealtimeBan);
    socket.on('userUnblocked', handleRealtimeBan);
    socket.on('userSuspensionStatusChanged', handleRealtimeSuspension);
    socket.on('userSuspended', handleRealtimeSuspension);
    socket.on('userActivated', handleRealtimeSuspension);
    socket.on('userDeletedAdmin', handleRealtimeDeletion);
    socket.on('userDeleted', handleRealtimeDeletion);
    socket.on('userRestoredAdmin', handleRealtimeDeletion);
    socket.on('userPurgedAdmin', handleRealtimeDeletion);
    socket.on('userRoleUpdated', handleRealtimeRole);
    socket.on('messageReported', handleRealtimeReport);
    socket.on('systemBroadcast', handleRealtimeBroadcast);
    socket.on('userOnline', handleUserPresence);
    socket.on('userOffline', handleUserPresence);

    // Auto-polling every 8s while Admin Panel is open
    const pollInterval = setInterval(() => {
      fetchStats();
    }, 8000);

    return () => {
      socket.off('userBanStatusChanged', handleRealtimeBan);
      socket.off('userBlocked', handleRealtimeBan);
      socket.off('userUnblocked', handleRealtimeBan);
      socket.off('userSuspensionStatusChanged', handleRealtimeSuspension);
      socket.off('userSuspended', handleRealtimeSuspension);
      socket.off('userActivated', handleRealtimeSuspension);
      socket.off('userDeletedAdmin', handleRealtimeDeletion);
      socket.off('userDeleted', handleRealtimeDeletion);
      socket.off('userRestoredAdmin', handleRealtimeDeletion);
      socket.off('userPurgedAdmin', handleRealtimeDeletion);
      socket.off('userRoleUpdated', handleRealtimeRole);
      socket.off('messageReported', handleRealtimeReport);
      socket.off('systemBroadcast', handleRealtimeBroadcast);
      socket.off('userOnline', handleUserPresence);
      socket.off('userOffline', handleUserPresence);
      clearInterval(pollInterval);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, roleFilter, statusFilter]);

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showToast(`Role updated to ${newRole} ✓`, 'success');
      fetchUsers();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change role', 'error');
    }
  };

  // Handle Ban / Unban
  const handleToggleBan = async (targetUser) => {
    if (targetUser.isBanned) {
      // Unban immediately
      try {
        await api.put(`/admin/users/${targetUser._id}/ban`, { isBanned: false });
        showToast(`User suspension removed ✓`, 'success');
        fetchUsers();
        fetchStats();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to unban user', 'error');
      }
    } else {
      // Open ban modal
      setBanModalUser(targetUser);
      setBanReason('');
    }
  };

  const handleConfirmBan = async () => {
    if (!banModalUser) return;
    try {
      await api.put(`/admin/users/${banModalUser._id}/ban`, {
        isBanned: true,
        banReason: banReason.trim() || 'Violation of community policies',
      });
      showToast(`User suspended ✓`, 'info');
      setBanModalUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to suspend user', 'error');
    }
  };

  // Handle Report Action
  const handleResolveReport = async (reportId, action) => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { action });
      showToast(`Report ${action === 'dismiss' ? 'dismissed' : 'actioned'} ✓`, 'success');
      fetchReports();
      fetchStats();
    } catch (err) {
      showToast('Failed to resolve report', 'error');
    }
  };

  // Send Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    try {
      setSendingBroadcast(true);
      await api.post('/admin/broadcast', {
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        category: broadcastCategory,
        level: broadcastLevel,
        target: 'all',
        sendAsChatMessage,
      });
      showToast('Announcement & Batiyao official message broadcasted successfully ✓', 'success');
      setBroadcastContent('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send broadcast', 'error');
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Update System Settings
  const handleUpdateSettings = async (key, val) => {
    try {
      const updated = { ...systemSettings, [key]: val };
      setSystemSettings(updated);
      await api.put('/admin/settings', updated);
      showToast('System configuration updated ✓', 'success');
    } catch (err) {
      showToast('Failed to update system configuration', 'error');
    }
  };

  const navTabStyle = (tabKey) => ({
    padding: '8px 14px',
    borderRadius: 10,
    background: activeTab === tabKey ? 'rgba(0, 168, 132, 0.18)' : 'transparent',
    color: activeTab === tabKey ? '#00a884' : 'var(--text-muted)',
    border: activeTab === tabKey ? '1px solid rgba(0, 168, 132, 0.35)' : '1px solid transparent',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  });

  const adminRoles = ['superadmin', 'admin', 'moderator', 'support_admin', 'security_admin'];
  if (!adminRoles.includes(user?.role)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
          textAlign: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: '#ef4444',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
          Access Denied
        </h3>
        <p style={{ maxWidth: 360, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
          Admin Panel ka access sirf Super Admin ke paas hai.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary-color, #00a884)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            ← Return to Chats
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100%',
        background: 'var(--bg-primary, #111215)',
        color: 'var(--text-primary, #f3f4f6)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--bg-card, #17191e)',
          borderBottom: '1px solid var(--border-subtle, #1e2127)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#4ee3c5',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🛡️</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Admin Control Panel</h2>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#00a884', fontWeight: 600 }}>
                Logged in as {user?.name} ({user?.role?.toUpperCase() || 'ADMIN'})
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              color: '#3b82f6',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'var(--transition)',
            }}
            title="Open Full Screen Admin Dashboard"
          >
            <span>Full Dashboard ↗</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          background: 'var(--bg-secondary, #131418)',
          borderBottom: '1px solid var(--border-subtle, #1e2127)',
          overflowX: 'auto',
        }}
      >
        <button onClick={() => setActiveTab('overview')} style={navTabStyle('overview')}>
          📊 Overview
        </button>
        <button onClick={() => setActiveTab('users')} style={navTabStyle('users')}>
          👥 Users {stats ? `(${stats.totalUsers})` : ''}
        </button>
        <button onClick={() => setActiveTab('blocked')} style={navTabStyle('blocked')}>
          🚫 Blocked {stats?.blockedUsers > 0 ? `(${stats.blockedUsers})` : ''}
        </button>
        <button onClick={() => setActiveTab('suspended')} style={navTabStyle('suspended')}>
          ⏸️ Suspended {stats?.suspendedUsers > 0 ? `(${stats.suspendedUsers})` : ''}
        </button>
        <button onClick={() => setActiveTab('deleted')} style={navTabStyle('deleted')}>
          🗑️ Deleted {stats?.deletedUsers > 0 ? `(${stats.deletedUsers})` : ''}
        </button>
        <button onClick={() => setActiveTab('reports')} style={navTabStyle('reports')}>
          ⚠️ Reports {stats?.reportedMessagesCount > 0 ? `(${stats.reportedMessagesCount})` : ''}
        </button>
        <button onClick={() => setActiveTab('broadcast')} style={navTabStyle('broadcast')}>
          📢 Broadcast
        </button>
        <button onClick={() => setActiveTab('settings')} style={navTabStyle('settings')}>
          ⚙️ Settings
        </button>
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: '18px 16px', flex: 1 }}>
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ background: 'var(--bg-card, #17191e)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Users</span>
                <p style={{ margin: '6px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#ffffff' }}>
                  {stats?.totalUsers || 0}
                </p>
                <span style={{ fontSize: '0.72rem', color: '#00a884' }}>● {stats?.onlineUsers || 0} Online</span>
              </div>

              <div style={{ background: 'var(--bg-card, #17191e)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Messages Today</span>
                <p style={{ margin: '6px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#4ee3c5' }}>
                  {stats?.messagesToday || 0}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total: {stats?.totalMessages || 0}</span>
              </div>

              <div style={{ background: 'var(--bg-card, #17191e)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Calls</span>
                <p style={{ margin: '6px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#60a5fa' }}>
                  {stats?.totalCalls || 0}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Audio & Video</span>
              </div>

              <div style={{ background: 'var(--bg-card, #17191e)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Flagged Reports</span>
                <p style={{ margin: '6px 0 0', fontSize: '1.6rem', fontWeight: 700, color: stats?.reportedMessagesCount > 0 ? '#ef4444' : '#10b981' }}>
                  {stats?.reportedMessagesCount || 0}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pending review</span>
              </div>
            </div>

            {/* Software Status Card */}
            <div
              style={{
                background: 'var(--bg-card, #17191e)',
                borderRadius: 14,
                border: '1px solid var(--border-subtle)',
                padding: '16px',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#ffffff' }}>System Security & Encryption</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>End-to-End Encryption</span>
                  <span style={{ color: '#00a884', fontWeight: 600 }}>🔒 Active (ECDH P-256 + AES-GCM)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>System Status</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>● All Services Operational</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Banned Accounts</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{stats?.bannedUsers || 0} Accounts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search and Filters */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={fetchUsers}
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: '#00a884',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Search
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', 'user', 'moderator', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: roleFilter === r ? 'rgba(0,168,132,0.2)' : 'var(--bg-card)',
                    color: roleFilter === r ? '#00a884' : 'var(--text-muted)',
                    border: roleFilter === r ? '1px solid #00a884' : '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setStatusFilter(statusFilter === 'banned' ? 'all' : 'banned')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: statusFilter === 'banned' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)',
                  color: statusFilter === 'banned' ? '#ef4444' : 'var(--text-muted)',
                  border: statusFilter === 'banned' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Suspended Only
              </button>
            </div>

            {/* Users List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingUsers ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
              ) : usersList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No users found matching query</div>
              ) : (
                usersList.map((u) => (
                  <div
                    key={u._id}
                    style={{
                      background: 'var(--bg-card, #17191e)',
                      border: u.isBanned ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar user={u} size={38} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffffff' }}>{u.name}</span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: u.role === 'admin' ? 'rgba(78, 227, 197, 0.2)' : u.role === 'moderator' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                color: u.role === 'admin' ? '#4ee3c5' : u.role === 'moderator' ? '#f59e0b' : 'var(--text-muted)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              {u.role || 'user'}
                            </span>
                            {u.isBanned && (
                              <span style={{ fontSize: '0.68rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                SUSPENDED
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            @{u.username} • {u.email} {u.phoneNumber ? `• ${u.phoneNumber}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Set Role:</span>
                        {['user', 'moderator', 'admin'].map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(u._id, r)}
                            disabled={u.role === r}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: u.role === r ? 'rgba(0,168,132,0.3)' : 'transparent',
                              border: '1px solid var(--border-subtle)',
                              color: u.role === r ? '#00a884' : 'var(--text-muted)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: u.role === r ? 'default' : 'pointer',
                              textTransform: 'capitalize',
                            }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleToggleBan(u)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: u.isBanned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: u.isBanned ? '1px solid #10b981' : '1px solid #ef4444',
                          color: u.isBanned ? '#10b981' : '#ef4444',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {u.isBanned ? 'Lift Suspension' : 'Suspend User'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2b. BLOCKED USERS TAB */}
        {activeTab === 'blocked' && (
          <BlockedUsersView
            allUsers={usersList}
            onViewUserDetails={(u) => setInspectedUser(u)}
            showToast={showToast}
            isDarkMode={true}
          />
        )}

        {/* 2c. SUSPENDED USERS TAB */}
        {activeTab === 'suspended' && (
          <SuspendedUsersView
            allUsers={usersList}
            onViewUserDetails={(u) => setInspectedUser(u)}
            showToast={showToast}
            isDarkMode={true}
          />
        )}

        {/* 2d. DELETED ACCOUNTS TAB */}
        {activeTab === 'deleted' && (
          <DeletedUsersView
            allUsers={usersList}
            onViewUserDetails={(u) => setInspectedUser(u)}
            showToast={showToast}
            isDarkMode={true}
          />
        )}

        {/* 3. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#ffffff' }}>
              Flagged Messages ({reportsList.length})
            </h4>

            {loadingReports ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading reports...</div>
            ) : reportsList.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 14 }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>✅</span>
                No flagged messages pending review!
              </div>
            ) : (
              reportsList.map((rep) => (
                <div
                  key={rep._id}
                  style={{
                    background: 'var(--bg-card, #17191e)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 14,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#ef4444' }}>
                        Reported for Community Policy Violation
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Sender: <b style={{ color: '#ffffff' }}>{rep.sender?.name}</b> (@{rep.sender?.username})
                      </p>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-primary)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      borderLeft: '3px solid #ef4444',
                    }}
                  >
                    "{rep.message}"
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      onClick={() => handleResolveReport(rep._id, 'dismiss')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep._id, 'delete')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Remove Message
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep._id, 'ban_sender')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#ef4444',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Suspend Sender
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--bg-card, #17191e)', borderRadius: 14, padding: 18, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.3rem' }}>📢</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.94rem', color: '#ffffff' }}>Send System Notification & Broadcast</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pushed in real-time to all connected users & delivered as official Batiyao messages.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>
                    NOTICE CATEGORY & TYPE
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {[
                      { id: 'announcement', lvl: 'info', label: '📢 Announcement', defaultTitle: '📢 Official Platform Announcement' },
                      { id: 'warning', lvl: 'warning', label: '⚠️ System Warning', defaultTitle: '⚠️ Important System & Security Warning' },
                      { id: 'maintenance', lvl: 'warning', label: '🛠️ Maintenance', defaultTitle: '🛠️ Scheduled Software Maintenance Notice' },
                      { id: 'critical', lvl: 'critical', label: '🚨 Urgent Alert', defaultTitle: '🚨 Urgent System Advisory' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setBroadcastCategory(cat.id);
                          setBroadcastLevel(cat.lvl);
                          setBroadcastTitle(cat.defaultTitle);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: broadcastCategory === cat.id ? 'rgba(0, 168, 132, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: broadcastCategory === cat.id ? '1.5px solid #00a884' : '1px solid var(--border-subtle)',
                          color: broadcastCategory === cat.id ? '#00a884' : '#e2e8f0',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    ANNOUNCEMENT TITLE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scheduled Software Maintenance / Important Update"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    MESSAGE CONTENT
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Type announcement or warning details to send..."
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: '#e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={sendAsChatMessage}
                      onChange={(e) => setSendAsChatMessage(e.target.checked)}
                      style={{ accentColor: '#00a884', width: 16, height: 16 }}
                    />
                    <span>💬 Deliver as official chat message from Batiyao</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={sendingBroadcast || !broadcastContent.trim()}
                  style={{
                    padding: '11px',
                    borderRadius: 10,
                    background: '#00a884',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: sendingBroadcast || !broadcastContent.trim() ? 'not-allowed' : 'pointer',
                    opacity: sendingBroadcast || !broadcastContent.trim() ? 0.6 : 1,
                    marginTop: 4,
                  }}
                >
                  {sendingBroadcast ? 'Broadcasting...' : '📢 Broadcast to All Batiyao Users'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 5. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--bg-card, #17191e)', borderRadius: 14, padding: 18, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '0.94rem', color: '#ffffff' }}>System Controls</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Maintenance mode */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Maintenance Mode</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Temporarily restrict access for scheduled maintenance.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) => handleUpdateSettings('maintenanceMode', e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#ef4444' }}
                  />
                </div>

                {/* Allow registrations */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Allow New Registrations</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Permit new users to sign up on Batiyau Chat.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.allowNewRegistrations}
                    onChange={(e) => handleUpdateSettings('allowNewRegistrations', e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#00a884' }}
                  />
                </div>

                {/* E2EE enforcement */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Enforce End-to-End Encryption</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      All messages are encrypted with device keys.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#00a884', fontWeight: 700 }}>ALWAYS ON ✓</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ban Reason Dialog */}
      {banModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setBanModalUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              background: 'var(--bg-secondary, #131418)',
              borderRadius: 18,
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: 24,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#ef4444' }}>
              Suspend {banModalUser.name}?
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              This user will be logged out and prevented from accessing messages or calls.
            </p>

            <input
              type="text"
              placeholder="Reason (e.g. Harassment / Spam)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setBanModalUser(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  background: 'var(--bg-hover)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Details Inspection Modal */}
      {inspectedUser && (
        <UserDetailsModal
          isOpen={!!inspectedUser}
          onClose={() => setInspectedUser(null)}
          user={inspectedUser}
        />
      )}
    </div>
  );
};

export default AdminPanel;
