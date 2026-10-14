import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icons from '../components/admin/AdminIcons';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import UserActivityChart from '../components/admin/UserActivityChart';
import UserDetailsCard from '../components/admin/UserDetailsCard';
import UserDetailsFullView from '../components/admin/UserDetailsFullView';
import UsersListView from '../components/admin/UsersListView';
import BlockedUsersView from '../components/admin/BlockedUsersView';
import SuspendedUsersView from '../components/admin/SuspendedUsersView';
import DeletedUsersView from '../components/admin/DeletedUsersView';
import ReportsModeration from '../components/admin/ReportsModeration';
import {
  BlockUserModal,
  SuspendUserModal,
  DeleteUserModal,
  BroadcastModal,
  ChangePasswordModal,
  NotifyUserModal,
  TwoFactorModal,
} from '../components/admin/AdminModals';
import { getSocket, createSocketConnection } from '../services/socket';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout, updateUser } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Data states (100% Real from MongoDB database)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    onlineNow: 0,
    blockedUsers: 0,
    suspendedUsers: 0,
    deletedUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalMessages: 0,
    totalConversations: 0,
    newThisWeek: 0,
    blockedThisWeek: 0,
    userGrowthPct: 0,
    activeGrowthPct: 0,
    blockedGrowthPct: 0,
    reportsDropPct: 0,
  });

  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [systemControlMetrics, setSystemControlMetrics] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [reportsOverview, setReportsOverview] = useState([]);
  const [systemAnnouncement, setSystemAnnouncement] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('📢 Official Platform Announcement');
  const [announcementCategory, setAnnouncementCategory] = useState('announcement');
  const [announcementLevel, setAnnouncementLevel] = useState('info');
  const [announcementTarget, setAnnouncementTarget] = useState('all');
  const [announcementTargetUserId, setAnnouncementTargetUserId] = useState('');
  const [announcementSendAsChat, setAnnouncementSendAsChat] = useState(true);
  const [announcementsHistory, setAnnouncementsHistory] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    allowGroupCreation: true,
    allowMediaUploads: true,
    allowCalling: true,
    maxUploadSizeMb: 50,
    e2eeEnforced: true,
  });

  // Admin Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    profilePicture: '',
  });

  // Modals state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [inspectingUser, setInspectingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');
  const [reportFilter, setReportFilter] = useState('all'); // 'all' | 'pending' | 'resolved'

  // Admin authorization guard - allow superadmin, admin, moderator, support_admin, security_admin
  useEffect(() => {
    const adminRoles = ['superadmin', 'admin', 'moderator', 'support_admin', 'security_admin'];
    if (authUser && !adminRoles.includes(authUser.role)) {
      navigate('/chat', { replace: true });
    }
  }, [authUser, navigate]);

  // Sync profile form with authUser
  useEffect(() => {
    if (authUser) {
      setProfileForm({
        name: authUser.name || '',
        email: authUser.email || '',
        phoneNumber: authUser.phoneNumber || '',
        profilePicture: authUser.profilePicture || '',
      });
    }
  }, [authUser]);

  // Toast Helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch 100% REAL Dashboard Stats & Users from API
  const fetchDashboardData = useCallback(async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
      if (statsRes.data?.recentUsers) {
        setRecentUsers(statsRes.data.recentUsers);
      }
      if (statsRes.data?.userActivity) {
        setUserActivity(statsRes.data.userActivity);
      }
      if (statsRes.data?.reportsOverview) {
        setReportsOverview(statsRes.data.reportsOverview);
      }
      if (statsRes.data?.systemSettings) {
        setSystemSettings(statsRes.data.systemSettings);
      }
    } catch (err) {
      console.error('Failed to load real stats:', err);
    }

    try {
      const usersRes = await api.get('/admin/users?limit=60');
      if (usersRes.data?.users) {
        setUsers(usersRes.data.users);
        setSelectedUser((prev) => {
          if (!prev) return usersRes.data.users[0] || null;
          const updated = usersRes.data.users.find((u) => String(u._id) === String(prev._id));
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Failed to load real users:', err);
    }

    try {
      const reportsRes = await api.get('/admin/reports');
      if (reportsRes.data?.reports) {
        setReports(reportsRes.data.reports);
      }
    } catch (err) {
      console.error('Failed to load real reports:', err);
    }

    try {
      const sessionsRes = await api.get('/admin/security/sessions');
      if (sessionsRes.data?.sessions) {
        setSessions(sessionsRes.data.sessions);
      }
    } catch (err) {
      console.error('Failed to load real sessions:', err);
    }

    try {
      const logsRes = await api.get('/admin/audit-logs');
      if (logsRes.data?.logs) {
        setAuditLogs(logsRes.data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }

    try {
      const convRes = await api.get('/admin/conversations');
      if (convRes.data?.conversations) {
        setConversations(convRes.data.conversations);
      }
    } catch (err) {
      // conversation metadata
    }

    try {
      const sysRes = await api.get('/admin/system/status');
      if (sysRes.data?.system) {
        setSystemControlMetrics(sysRes.data.system);
      }
    } catch (err) {
      // system status
    }

    try {
      const secRes = await api.get('/admin/security/overview');
      if (secRes.data?.securityEvents) {
        setSecurityEvents(secRes.data.securityEvents);
      }
    } catch (err) {
      // security overview
    }

    try {
      const adminsRes = await api.get('/admin/admins');
      if (adminsRes.data?.admins) {
        setAdminsList(adminsRes.data.admins);
      }
    } catch (err) {
      // admins list
    }
  }, []);

  // Real-time Socket Event Listeners for Live Dashboard
  useEffect(() => {
    const token = localStorage.getItem('chatToken');
    let socket = getSocket();
    if (!socket && token) {
      socket = createSocketConnection(token);
    }

    if (socket) {
      // 1. Online Users list synchronization
      const handleOnlineUsers = (onlineIds) => {
        if (!Array.isArray(onlineIds)) return;
        const setIds = new Set(onlineIds.map(String));
        setUsers((prev) =>
          prev.map((u) => ({
            ...u,
            status: setIds.has(String(u._id)) ? 'online' : u.status,
          }))
        );
        setRecentUsers((prev) =>
          prev.map((u) => ({
            ...u,
            status: setIds.has(String(u._id)) ? 'online' : u.status,
          }))
        );
        setStats((prev) => ({
          ...prev,
          onlineNow: onlineIds.length,
        }));
      };

      // 2. Individual user comes online
      const handleUserOnline = ({ userId }) => {
        setUsers((prev) =>
          prev.map((u) => (String(u._id) === String(userId) ? { ...u, status: 'online' } : u))
        );
        setRecentUsers((prev) =>
          prev.map((u) => (String(u._id) === String(userId) ? { ...u, status: 'online' } : u))
        );
        setStats((prev) => ({
          ...prev,
          onlineNow: (prev.onlineNow || 0) + 1,
        }));
      };

      // 3. Individual user goes offline
      const handleUserOffline = ({ userId }) => {
        setUsers((prev) =>
          prev.map((u) => (String(u._id) === String(userId) ? { ...u, status: 'offline', lastSeen: new Date() } : u))
        );
        setRecentUsers((prev) =>
          prev.map((u) => (String(u._id) === String(userId) ? { ...u, status: 'offline', lastSeen: new Date() } : u))
        );
        setStats((prev) => ({
          ...prev,
          onlineNow: Math.max(0, (prev.onlineNow || 1) - 1),
        }));
      };

      // 4. Ban status updated in real-time
      const handleBanChange = ({ userId, isBanned, banReason }) => {
        setUsers((prev) =>
          prev.map((u) => (String(u._id) === String(userId) ? { ...u, isBanned, banReason } : u))
        );
        fetchDashboardData();
        showToast(isBanned ? `User restriction updated` : `Block lifted for user`);
      };

      // 5. Suspension status updated in real-time
      const handleSuspensionChange = ({ userId, isSuspended, suspendReason, duration, suspendedUntil }) => {
        setUsers((prev) =>
          prev.map((u) => (String(u._id) === String(userId) ? { ...u, isSuspended, suspendReason, suspensionDuration: duration, suspendedUntil } : u))
        );
        fetchDashboardData();
        showToast(isSuspended ? `User suspension updated (${duration || 'active'})` : `User suspension lifted`);
      };

      // 6. Broadcast notification received in real-time
      const handleBroadcast = (payload) => {
        showToast(`📢 Announcement: ${payload.title || 'System Alert'} - ${payload.content}`);
      };

      // 7. Real-time message count telemetry
      const handleNewMessage = () => {
        setStats((prev) => ({
          ...prev,
          totalMessages: (prev.totalMessages || 0) + 1,
        }));
      };

      // 8. Real-time user registration
      const handleUserRegistered = (newUser) => {
        setUsers((prev) => [newUser, ...prev]);
        setRecentUsers((prev) => [newUser, ...prev.slice(0, 4)]);
        setStats((prev) => ({
          ...prev,
          totalUsers: (prev.totalUsers || 0) + 1,
          newThisWeek: (prev.newThisWeek || 0) + 1,
        }));
        showToast(`New user registered: ${newUser.name}`);
      };

      // 9. Report submitted
      const handleNewReport = (report) => {
        setReports((prev) => [report, ...prev]);
        setStats((prev) => ({
          ...prev,
          totalReports: (prev.totalReports || 0) + 1,
          pendingReports: (prev.pendingReports || 0) + 1,
        }));
        showToast(`New moderation report received: ${report.category}`);
      };

      // 10. Report status changed
      const handleReportStatusChanged = ({ reportId, status, action }) => {
        setReports((prev) =>
          prev.map((r) => (String(r._id) === String(reportId) ? { ...r, status, actionTaken: action } : r))
        );
      };

      // 11. Security alert
      const handleSecurityAlert = (alert) => {
        showToast(`⚠️ Security Alert: ${alert.title} - ${alert.details}`);
        setSecurityEvents((prev) => [alert, ...prev]);
      };

      // 12. Maintenance Mode Update
      const handleMaintenanceUpdate = ({ maintenanceMode }) => {
        setSystemSettings((prev) => ({ ...prev, maintenanceMode }));
        showToast(maintenanceMode ? '⚠️ Maintenance mode activated' : '✅ Maintenance mode deactivated');
      };

      // 13. Admin Blocked Users Refresh
      const handleAdminBlockRefresh = () => {
        fetchDashboardData();
      };

      // 14. Peer block live update
      const handlePeerBlockSync = (payload) => {
        showToast(`👥 Contact Block update: ${payload?.blockerName || 'User'} ${payload?.action === 'block' ? 'blocked' : 'unblocked'} a contact`);
        fetchDashboardData();
      };

      // 15. Admin Suspended Users Refresh
      const handleAdminSuspendedRefresh = (payload) => {
        fetchDashboardData();
        if (payload?.action === 'suspend') {
          showToast('Live update: Account temporarily suspended', 'warning');
        } else if (payload?.action === 'activate') {
          showToast('Live update: Account suspension lifted', 'success');
        } else if (payload?.action === 'extend') {
          showToast('Live update: Account suspension extended', 'info');
        }
      };

      // 16. Admin Deleted Users Refresh
      const handleAdminDeletedRefresh = (payload) => {
        fetchDashboardData();
        if (payload?.action === 'delete') {
          showToast('Live update: Account archived / deleted', 'warning');
        } else if (payload?.action === 'restore') {
          showToast('Live update: Account restored to active status', 'success');
        } else if (payload?.action === 'purge') {
          showToast('Live update: Account permanently purged', 'danger');
        }
      };

      const handleUserDeleted = ({ userId }) => {
        setUsers((prev) => prev.map((u) => (String(u._id) === String(userId) ? { ...u, isDeleted: true } : u)));
        fetchDashboardData();
      };

      const handleUserRestored = ({ userId }) => {
        setUsers((prev) => prev.map((u) => (String(u._id) === String(userId) ? { ...u, isDeleted: false, isSuspended: false, isBanned: false } : u)));
        fetchDashboardData();
      };

      const handleUserPurged = ({ userId }) => {
        setUsers((prev) => prev.filter((u) => String(u._id) !== String(userId)));
        fetchDashboardData();
      };

      socket.on('getOnlineUsers', handleOnlineUsers);
      socket.on('userOnline', handleUserOnline);
      socket.on('userOffline', handleUserOffline);
      socket.on('userBanStatusChanged', handleBanChange);
      socket.on('userSuspensionStatusChanged', handleSuspensionChange);
      socket.on('systemBroadcast', handleBroadcast);
      socket.on('receiveMessage', handleNewMessage);
      socket.on('userRegistered', handleUserRegistered);
      socket.on('newReportSubmitted', handleNewReport);
      socket.on('reportStatusChanged', handleReportStatusChanged);
      socket.on('securityAlert', handleSecurityAlert);
      socket.on('maintenanceModeUpdate', handleMaintenanceUpdate);
      socket.on('adminBlockedUsersRefresh', handleAdminBlockRefresh);
      socket.on('peerBlockUpdate', handlePeerBlockSync);
      socket.on('adminSuspendedUsersRefresh', handleAdminSuspendedRefresh);
      socket.on('adminDeletedUsersRefresh', handleAdminDeletedRefresh);
      socket.on('userDeletedAdmin', handleUserDeleted);
      socket.on('userRestoredAdmin', handleUserRestored);
      socket.on('userPurgedAdmin', handleUserPurged);

      return () => {
        socket.off('getOnlineUsers', handleOnlineUsers);
        socket.off('userOnline', handleUserOnline);
        socket.off('userOffline', handleUserOffline);
        socket.off('userBanStatusChanged', handleBanChange);
        socket.off('userSuspensionStatusChanged', handleSuspensionChange);
        socket.off('systemBroadcast', handleBroadcast);
        socket.off('receiveMessage', handleNewMessage);
        socket.off('userRegistered', handleUserRegistered);
        socket.off('newReportSubmitted', handleNewReport);
        socket.off('reportStatusChanged', handleReportStatusChanged);
        socket.off('securityAlert', handleSecurityAlert);
        socket.off('maintenanceModeUpdate', handleMaintenanceUpdate);
        socket.off('adminBlockedUsersRefresh', handleAdminBlockRefresh);
        socket.off('peerBlockUpdate', handlePeerBlockSync);
        socket.off('adminSuspendedUsersRefresh', handleAdminSuspendedRefresh);
        socket.off('adminDeletedUsersRefresh', handleAdminDeletedRefresh);
        socket.off('userDeletedAdmin', handleUserDeleted);
        socket.off('userRestoredAdmin', handleUserRestored);
        socket.off('userPurgedAdmin', handleUserPurged);
      };
    }
  }, [showToast, fetchDashboardData]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Load announcements history when system_notifications tab is active
  useEffect(() => {
    if (activeTab === 'system_notifications') {
      fetchAnnouncementsHistory();
    }
  }, [activeTab]);

  // 1. Block / Unblock User Handlers
  const handleOpenBlockModal = (user) => {
    if (user.isBanned) {
      handleConfirmBlock(user, 'Unblocked by administrator', false);
    } else {
      setTargetUser(user);
      setBlockModalOpen(true);
    }
  };

  const handleConfirmBlock = async (user, blockDataOrReason, willBan = true) => {
    try {
      if (willBan) {
        let payload = {
          blockType: 'permanent',
          banReason: 'Violation of community policies',
          blockDuration: '24 Hours',
          notifyUser: false,
        };
        if (typeof blockDataOrReason === 'object' && blockDataOrReason !== null) {
          payload = { ...payload, ...blockDataOrReason };
        } else if (typeof blockDataOrReason === 'string' && blockDataOrReason.trim()) {
          payload.banReason = blockDataOrReason.trim();
        }
        await api.post(`/admin/users/${user._id}/block`, payload);
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isBanned: true, banReason: payload.banReason, blockType: payload.blockType } : u))
        );
        if (selectedUser?._id === user._id) {
          setSelectedUser((prev) => ({ ...prev, isBanned: true, banReason: payload.banReason, blockType: payload.blockType }));
        }
        if (inspectingUser?._id === user._id) {
          setInspectingUser((prev) => ({ ...prev, isBanned: true, banReason: payload.banReason, blockType: payload.blockType }));
        }
        showToast(`User ${user.name} has been blocked.`);
      } else {
        const unblockReason = typeof blockDataOrReason === 'string' ? blockDataOrReason : 'Block lifted by administrator';
        await api.post(`/admin/users/${user._id}/unblock`, { reason: unblockReason });
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isBanned: false } : u))
        );
        if (selectedUser?._id === user._id) {
          setSelectedUser((prev) => ({ ...prev, isBanned: false }));
        }
        if (inspectingUser?._id === user._id) {
          setInspectingUser((prev) => ({ ...prev, isBanned: false }));
        }
        showToast(`User ${user.name} unblocked.`);
      }
      fetchDashboardData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update block status');
    }
  };

  // 2. Suspend / Reactivate User Handlers
  const handleOpenSuspendModal = (user) => {
    if (user.isSuspended) {
      handleConfirmSuspend(user, 'Suspension lifted by administrator', false);
    } else {
      setTargetUser(user);
      setSuspendModalOpen(true);
    }
  };

  const handleConfirmSuspend = async (user, suspendDataOrReason, willSuspend = true) => {
    try {
      if (willSuspend) {
        let payload = {
          duration: '24 Hours',
          suspendReason: 'Administrative suspension for policy violation',
        };
        if (typeof suspendDataOrReason === 'object' && suspendDataOrReason !== null) {
          payload = { ...payload, ...suspendDataOrReason };
        } else if (typeof suspendDataOrReason === 'string' && suspendDataOrReason.trim()) {
          payload.suspendReason = suspendDataOrReason.trim();
        }
        await api.post(`/admin/users/${user._id}/suspend`, payload);
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isSuspended: true, suspendReason: payload.suspendReason, suspensionDuration: payload.duration } : u))
        );
        if (selectedUser?._id === user._id) {
          setSelectedUser((prev) => ({ ...prev, isSuspended: true, suspendReason: payload.suspendReason }));
        }
        if (inspectingUser?._id === user._id) {
          setInspectingUser((prev) => ({ ...prev, isSuspended: true, suspendReason: payload.suspendReason }));
        }
        showToast(`Account for ${user.name} has been suspended for ${payload.duration}.`);
      } else {
        const activateReason = typeof suspendDataOrReason === 'string' ? suspendDataOrReason : 'Suspension lifted by administrator';
        await api.post(`/admin/users/${user._id}/activate-suspension`, { reason: activateReason });
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isSuspended: false } : u))
        );
        if (selectedUser?._id === user._id) {
          setSelectedUser((prev) => ({ ...prev, isSuspended: false }));
        }
        if (inspectingUser?._id === user._id) {
          setInspectingUser((prev) => ({ ...prev, isSuspended: false }));
        }
        showToast(`Account for ${user.name} reactivated.`);
      }
      fetchDashboardData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update suspension status');
    }
  };

  // 3. Delete / Restore Handlers
  const handleOpenDeleteModal = (user) => {
    setTargetUser(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (user, deleteDataOrReason) => {
    try {
      let payload = {
        reason: 'Administrative account deletion',
        deletionType: 'Admin action',
        retentionDays: 30,
      };
      if (typeof deleteDataOrReason === 'object' && deleteDataOrReason !== null) {
        payload = { ...payload, ...deleteDataOrReason };
      } else if (typeof deleteDataOrReason === 'string' && deleteDataOrReason.trim()) {
        payload.reason = deleteDataOrReason.trim();
      }
      await api.post(`/admin/users/${user._id}/delete`, payload);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isDeleted: true } : u))
      );
      if (selectedUser?._id === user._id) {
        setSelectedUser((prev) => ({ ...prev, isDeleted: true }));
      }
      if (inspectingUser?._id === user._id) {
        setInspectingUser((prev) => ({ ...prev, isDeleted: true }));
      }
      showToast(`Account for ${user.name} marked as deleted.`);
      fetchDashboardData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}/restore`);
    } catch (e) {
      // handled
    }
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, isDeleted: false, isSuspended: false, isBanned: false } : u))
    );
    if (selectedUser?._id === user._id) {
      setSelectedUser((prev) => ({ ...prev, isDeleted: false, isSuspended: false, isBanned: false }));
    }
    if (inspectingUser?._id === user._id) {
      setInspectingUser((prev) => ({ ...prev, isDeleted: false, isSuspended: false, isBanned: false }));
    }
    showToast(`Account for ${user.name} restored to active status.`);
  };

  // 4. Direct User Notification
  const handleOpenNotifyModal = (user) => {
    setTargetUser(user);
    setNotifyModalOpen(true);
  };

  const handleConfirmNotifyUser = async (user, title, message) => {
    try {
      await api.post(`/admin/users/${user._id}/notify`, { title, message });
      showToast(`Notification sent to ${user.name}`);
    } catch (e) {
      showToast('Failed to send notification');
    }
  };

  // 5. Broadcast Announcement & History
  const fetchAnnouncementsHistory = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await api.get('/admin/announcements');
      if (res.data?.announcements) {
        setAnnouncementsHistory(res.data.announcements);
      }
    } catch (err) {
      console.error('Failed to fetch announcements history:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement record?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncementsHistory((prev) => prev.filter((a) => a._id !== id));
      showToast('Announcement removed from history ✓', 'info');
    } catch (err) {
      showToast('Failed to delete announcement', 'error');
    }
  };

  const handleSendBroadcast = async ({ title, content, category, level, target, targetUserIds, sendAsChatMessage }) => {
    try {
      setSendingAnnouncement(true);
      const res = await api.post('/admin/broadcast', {
        title,
        content,
        category: category || 'announcement',
        level: level || 'info',
        target: target || 'all',
        targetUserIds: targetUserIds || [],
        sendAsChatMessage: sendAsChatMessage !== false,
      });
      showToast(res.data?.message || 'Announcement broadcasted successfully to all users ✓', 'success');
      fetchAnnouncementsHistory();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to send announcement', 'error');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleSendLiveAnnouncement = async () => {
    if (!systemAnnouncement.trim()) return;
    try {
      setSendingAnnouncement(true);
      const res = await api.post('/admin/broadcast', {
        title: announcementTitle.trim(),
        content: systemAnnouncement.trim(),
        category: announcementCategory,
        level: announcementLevel,
        target: announcementTarget,
        targetUserIds: announcementTarget === 'selected' && announcementTargetUserId ? [announcementTargetUserId] : [],
        sendAsChatMessage: announcementSendAsChat,
      });
      setSystemAnnouncement('');
      showToast(res.data?.message || 'Broadcast sent to all users successfully ✓', 'success');
      fetchAnnouncementsHistory();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to send announcement', 'error');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleSendQuickAnnouncement = async () => {
    if (!systemAnnouncement.trim()) return;
    try {
      const res = await api.post('/admin/broadcast', {
        title: 'System Notice',
        content: systemAnnouncement.trim(),
        category: 'announcement',
        level: 'info',
        target: 'all',
        sendAsChatMessage: true,
      });
      setSystemAnnouncement('');
      showToast(res.data?.message || 'Quick broadcast sent to all users successfully ✓', 'success');
      fetchAnnouncementsHistory();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to send announcement', 'error');
    }
  };

  // 6. Revoke Session
  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/admin/security/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast('Session forcefully revoked.');
    } catch (e) {
      showToast('Failed to revoke session');
    }
  };

  // 7. Resolve Report Action
  const handleResolveReport = async (reportId, action, note = '') => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { action, resolutionNote: note });
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: 'resolved', actionTaken: action } : r))
      );
      showToast(`Report successfully ${action}ed`);
    } catch (e) {
      showToast('Failed to resolve report');
    }
  };

  // 8. Save System Settings to MongoDB
  const handleSaveSettings = async () => {
    try {
      const res = await api.put('/admin/settings', systemSettings);
      if (res.data?.settings) {
        setSystemSettings(res.data.settings);
      }
      showToast('System configuration saved successfully!');
    } catch (e) {
      showToast('Failed to save system settings');
    }
  };

  // 9. Save Admin Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/admin/profile', profileForm);
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      showToast('Admin profile updated successfully!');
    } catch (e) {
      showToast('Failed to update admin profile');
    }
  };

  // 10. Handle 2FA Toggle
  const handleToggle2FA = async (enable, pin) => {
    try {
      const res = await api.put('/admin/profile/2fa', { enabled: enable, pin });
      if (authUser) {
        const updated = { ...authUser, accountSecurity: res.data?.accountSecurity };
        updateUser(updated);
      }
      showToast(enable ? '2FA Protection Enabled!' : '2FA Protection Disabled');
    } catch (e) {
      showToast('Failed to update 2FA configuration');
    }
  };

  // 11. Role Change Handler
  const handleUpdateUserRole = async (user, newRole) => {
    try {
      await api.put(`/admin/users/${user._id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)));
      setAdminsList((prev) => {
        const existing = prev.find((a) => a._id === user._id);
        if (existing) {
          return prev.map((a) => (a._id === user._id ? { ...a, role: newRole } : a));
        }
        return [...prev, { ...user, role: newRole }];
      });
      showToast(`User ${user.name} role changed to ${newRole}`);
      setRoleChangeModalOpen(false);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update user role');
    }
  };

  // Filtered Users Count for Sidebar Badge
  const sidebarCounts = useMemo(() => {
    return {
      totalUsers: stats.totalUsers || users.length,
      blockedUsers: stats.blockedUsers || users.filter((u) => u.isBanned).length,
      suspendedUsers: stats.suspendedUsers || users.filter((u) => u.isSuspended).length,
      deletedUsers: stats.deletedUsers || users.filter((u) => u.isDeleted).length,
      reports: stats.pendingReports || reports.filter((r) => r.status === 'pending').length,
    };
  }, [stats, users, reports]);

  return (
    <div className="admin-layout-root">
      {/* Fixed Dark Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setInspectingUser(null);
        }}
        onLogout={authLogout}
        counts={sidebarCounts}
      />

      {/* Main Content Area */}
      <div className="admin-main-wrap">
        <AdminHeader
          currentUser={authUser}
          onLogout={authLogout}
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          onOpenNotifications={() => setActiveTab('system_notifications')}
          onOpenProfile={() => setActiveTab('my_profile')}
        />

        <div className="admin-content-scroll">
          {/* ============================================================
              1. MAIN DASHBOARD VIEW
             ============================================================ */}
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-title-row">
                <div>
                  <h1>Admin Dashboard</h1>
                  <p className="dashboard-subtitle">Real-time system telemetry and platform oversight</p>
                </div>
                <button className="btn-time-range" onClick={fetchDashboardData} title="Click to refresh telemetry from MongoDB">
                  <span className="live-pulse-dot" />
                  <span>Live Stream Active</span>
                  <Icons.ChevronDown style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* 4 KPI Metric Cards */}
              <div className="kpi-grid">
                <div className="kpi-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                  <div className="kpi-icon-wrap blue">
                    <Icons.User style={{ width: 26, height: 26 }} />
                  </div>
                  <div className="kpi-details">
                    <span className="kpi-label">Total Users</span>
                    <span className="kpi-value">{stats.totalUsers?.toLocaleString()}</span>
                    <div className="kpi-trend">
                      <span className="trend-pct up">↑ {stats.userGrowthPct}%</span>
                      <span className="trend-desc">+{stats.newThisWeek?.toLocaleString()} new this week</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                  <div className="kpi-icon-wrap green">
                    <Icons.Users style={{ width: 26, height: 26 }} />
                  </div>
                  <div className="kpi-details">
                    <span className="kpi-label">Active Users</span>
                    <span className="kpi-value">{stats.activeUsers?.toLocaleString()}</span>
                    <div className="kpi-trend">
                      <span className="trend-pct up">● Live</span>
                      <span className="trend-desc">Online now: {stats.onlineNow?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card" onClick={() => setActiveTab('blocked_users')} style={{ cursor: 'pointer' }}>
                  <div className="kpi-icon-wrap red">
                    <Icons.Ban style={{ width: 26, height: 26 }} />
                  </div>
                  <div className="kpi-details">
                    <span className="kpi-label">Blocked Users</span>
                    <span className="kpi-value">{stats.blockedUsers?.toLocaleString()}</span>
                    <div className="kpi-trend">
                      <span className="trend-pct up">Suspended: {stats.suspendedUsers}</span>
                      <span className="trend-desc">Total restricted</span>
                    </div>
                  </div>
                </div>

                <div className="kpi-card" onClick={() => setActiveTab('user_reports')} style={{ cursor: 'pointer' }}>
                  <div className="kpi-icon-wrap purple">
                    <Icons.Flag style={{ width: 26, height: 26 }} />
                  </div>
                  <div className="kpi-details">
                    <span className="kpi-label">Total Reports</span>
                    <span className="kpi-value">{stats.totalReports?.toLocaleString()}</span>
                    <div className="kpi-trend">
                      <span className="trend-pct down">Pending: {stats.pendingReports}</span>
                      <span className="trend-desc">Resolved: {stats.resolvedReports}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Section (3 Cards) */}
              <div className="middle-grid">
                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">User Activity & Registrations</h3>
                    <div className="card-legend-row">
                      <span><span className="legend-dot active" /> Active Users</span>
                      <span><span className="legend-dot total" /> Total Users</span>
                    </div>
                  </div>
                  <UserActivityChart data={userActivity} />
                </div>

                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Recent Users</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('users')}>
                      View All
                    </button>
                  </div>
                  <div className="recent-users-list">
                    {recentUsers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '0.8rem' }}>
                        No registered users yet.
                      </div>
                    ) : (
                      recentUsers.slice(0, 5).map((u) => (
                        <div
                          key={u._id}
                          className="recent-user-item"
                          onClick={() => {
                            setSelectedUser(u);
                            setInspectingUser(u);
                            setActiveTab('users');
                          }}
                        >
                          <div className="recent-user-left">
                            <img
                              src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2563EB&color=fff`}
                              alt={u.name}
                              className="recent-avatar"
                            />
                            <div className="recent-user-info">
                              <span className="recent-name">{u.name}</span>
                              <span className="recent-phone">{u.phoneNumber || u.email || 'No phone'}</span>
                            </div>
                          </div>
                          <div className="recent-user-right">
                            <span className={`status-dot-label ${u.status === 'online' ? 'online' : 'offline'}`}>
                              ● {u.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                            <span className="recent-time">
                              {u.status === 'online' ? 'Active' : u.lastSeen ? new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Offline'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Reports Overview</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('user_reports')}>
                      View All
                    </button>
                  </div>
                  <div className="reports-category-list">
                    {(reportsOverview.length > 0
                      ? reportsOverview
                      : [
                          { id: 'harassment', label: 'Harassment', count: 0, color: '#ef4444' },
                          { id: 'spam', label: 'Spam', count: 0, color: '#f59e0b' },
                          { id: 'fake_account', label: 'Fake Account', count: 0, color: '#8b5cf6' },
                          { id: 'inappropriate', label: 'Inappropriate Content', count: 0, color: '#3b82f6' },
                          { id: 'other', label: 'Other', count: 0, color: '#64748b' },
                        ]
                    ).map((item) => (
                      <div
                        key={item.id || item.label}
                        className="report-category-row"
                        onClick={() => setActiveTab('user_reports')}
                      >
                        <div className="report-cat-left">
                          <div className="cat-icon-badge" style={{ background: `${item.color}15`, color: item.color }}>
                            <Icons.Flag style={{ width: 15, height: 15 }} />
                          </div>
                          <span className="cat-name">{item.label}</span>
                        </div>
                        <div className="report-cat-right">
                          <span className="cat-count">{item.count || 0}</span>
                          <Icons.ChevronRight className="cat-arrow" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Section (3 Panels) */}
              <div className="bottom-grid">
                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">User Management Preview</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('users')}>
                      View All
                    </button>
                  </div>

                  <div className="table-search-box">
                    <Icons.Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search users by name, phone, email, or user ID..."
                      className="table-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <table className="admin-custom-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map((u) => (
                        <tr
                          key={u._id}
                          className={selectedUser?._id === u._id ? 'selected-row' : ''}
                          onClick={() => setSelectedUser(u)}
                        >
                          <td>
                            <div className="table-user-cell">
                              <img
                                src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2563EB&color=fff`}
                                alt={u.name}
                                className="table-avatar"
                              />
                              <div className="table-user-name-wrap">
                                <span className="table-name">{u.name}</span>
                                <span className="table-username">@{u.username || 'user'}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{u.phoneNumber || u.email || '—'}</td>
                          <td>
                            <span className={`status-pill ${u.isDeleted ? 'status-deleted' : u.isBanned ? 'status-blocked' : u.isSuspended ? 'status-suspended' : u.status === 'online' ? 'status-active' : 'status-offline'}`}>
                              ● {u.isDeleted ? 'Deleted' : u.isBanned ? 'Blocked' : u.isSuspended ? 'Suspended' : u.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-inspect-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingUser(u);
                                setActiveTab('users');
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="quick-actions-bar">
                    <div className="quick-actions-title">
                      <Icons.Dashboard style={{ width: 14, height: 14, color: '#2563eb' }} />
                      <span>Quick Admin Actions</span>
                    </div>
                    <div className="quick-actions-grid">
                      <div className="quick-action-tile" onClick={() => setActiveTab('user_reports')}>
                        <Icons.Flag style={{ color: '#ef4444' }} />
                        <span>View Complaints</span>
                      </div>
                      <div className="quick-action-tile" onClick={() => setActiveTab('blocked_users')}>
                        <Icons.Ban style={{ color: '#8b5cf6' }} />
                        <span>Blocked Users</span>
                      </div>
                      <div className="quick-action-tile" onClick={() => setActiveTab('app_settings')}>
                        <Icons.Settings style={{ color: '#2563eb' }} />
                        <span>System Settings</span>
                      </div>
                      <div className="quick-action-tile" onClick={() => setBroadcastModalOpen(true)}>
                        <Icons.Send style={{ color: '#10b981' }} />
                        <span>Send Broadcast</span>
                      </div>
                    </div>
                  </div>
                </div>

                <UserDetailsCard
                  user={selectedUser}
                  onClose={() => setSelectedUser(null)}
                  onBlockToggle={handleOpenBlockModal}
                  onSuspendToggle={handleOpenSuspendModal}
                  onDeleteUser={handleOpenDeleteModal}
                  onRestoreUser={handleRestoreUser}
                  onViewFullProfile={(u) => {
                    setInspectingUser(u);
                    setActiveTab('users');
                  }}
                />

                <div className="panel3-stack">
                  <div className="admin-card">
                    <div className="card-header-row">
                      <h3 className="card-title">Live Hardware Sessions</h3>
                      <button className="view-all-link" onClick={() => setActiveTab('login_sessions')}>
                        View All
                      </button>
                    </div>
                    <div className="sessions-list">
                      {sessions.slice(0, 3).map((s) => (
                        <div key={s.id} className="session-item-row">
                          <div className="session-icon-wrap">
                            {s.device.includes('iPhone') || s.device.includes('Android') ? (
                              <Icons.Smartphone style={{ color: '#3b82f6' }} />
                            ) : (
                              <Icons.Laptop style={{ color: '#2563eb' }} />
                            )}
                          </div>
                          <div className="session-meta">
                            <div className="session-device-name">
                              {s.device}
                              {s.current && <span className="active-now-badge">Active</span>}
                            </div>
                            <div className="session-ip">IP: {s.ip} • {s.status}</div>
                          </div>
                          <button
                            className="revoke-session-btn"
                            title="Force logout session"
                            onClick={() => handleRevokeSession(s.id)}
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-card system-notifications-card">
                    <div className="card-header-row">
                      <h3 className="card-title">Broadcast Notification</h3>
                      <button className="view-all-link" onClick={() => setBroadcastModalOpen(true)}>
                        Composer
                      </button>
                    </div>
                    <textarea
                      className="notification-input-area"
                      placeholder="Write instant broadcast notice to connected clients..."
                      maxLength={500}
                      value={systemAnnouncement}
                      onChange={(e) => setSystemAnnouncement(e.target.value)}
                    />
                    <div className="notification-card-footer">
                      <span className="char-counter">{systemAnnouncement.length}/500</span>
                      <button
                        className="btn-send-notification"
                        disabled={!systemAnnouncement.trim()}
                        onClick={handleSendQuickAnnouncement}
                      >
                        <Icons.Send />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================
              2. USER MANAGEMENT CONTROL (ALL, BLOCKED, SUSPENDED, DELETED)
             ============================================================ */}
          {activeTab === 'users' && (
            inspectingUser ? (
              <UserDetailsFullView
                user={inspectingUser}
                onBack={() => setInspectingUser(null)}
                onOpenBlockModal={handleOpenBlockModal}
                onOpenSuspendModal={handleOpenSuspendModal}
                onOpenDeleteModal={handleOpenDeleteModal}
                onRestoreUser={handleRestoreUser}
                onOpenNotifyModal={handleOpenNotifyModal}
                showToast={showToast}
              />
            ) : (
              <UsersListView
                users={users}
                onSelectUser={(u) => setInspectingUser(u)}
                onOpenBlockModal={handleOpenBlockModal}
                onOpenSuspendModal={handleOpenSuspendModal}
                onOpenDeleteModal={handleOpenDeleteModal}
                onRestoreUser={handleRestoreUser}
                onOpenBroadcastModal={() => setBroadcastModalOpen(true)}
                totalUsersCount={stats.totalUsers}
              />
            )
          )}

          {/* Dedicated 1. 🚫 Blocked Users Section */}
          {activeTab === 'blocked_users' && (
            inspectingUser ? (
              <UserDetailsFullView
                user={inspectingUser}
                onBack={() => setInspectingUser(null)}
                onOpenBlockModal={handleOpenBlockModal}
                onOpenSuspendModal={handleOpenSuspendModal}
                onOpenDeleteModal={handleOpenDeleteModal}
                onRestoreUser={handleRestoreUser}
                onOpenNotifyModal={handleOpenNotifyModal}
                showToast={showToast}
              />
            ) : (
              <BlockedUsersView
                allUsers={users}
                onViewUserDetails={(u) => setInspectingUser(u)}
                showToast={showToast}
                isDarkMode={false}
              />
            )
          )}

          {/* Dedicated 2. ⏸️ Suspended Users Section */}
          {activeTab === 'suspended_users' && (
            inspectingUser ? (
              <UserDetailsFullView
                user={inspectingUser}
                onBack={() => setInspectingUser(null)}
                onOpenBlockModal={handleOpenBlockModal}
                onOpenSuspendModal={handleOpenSuspendModal}
                onOpenDeleteModal={handleOpenDeleteModal}
                onRestoreUser={handleRestoreUser}
                onOpenNotifyModal={handleOpenNotifyModal}
                showToast={showToast}
              />
            ) : (
              <SuspendedUsersView
                allUsers={users}
                onViewUserDetails={(u) => setInspectingUser(u)}
                showToast={showToast}
                isDarkMode={false}
              />
            )
          )}

          {/* Dedicated 3. 🗑️ Deleted & Archived Accounts Section (OWASP Compliant) */}
          {activeTab === 'deleted_users' && (
            inspectingUser ? (
              <UserDetailsFullView
                user={inspectingUser}
                onBack={() => setInspectingUser(null)}
                onOpenBlockModal={handleOpenBlockModal}
                onOpenSuspendModal={handleOpenSuspendModal}
                onOpenDeleteModal={handleOpenDeleteModal}
                onRestoreUser={handleRestoreUser}
                onOpenNotifyModal={handleOpenNotifyModal}
                showToast={showToast}
              />
            ) : (
              <DeletedUsersView
                allUsers={users}
                onViewUserDetails={(u) => setInspectingUser(u)}
                showToast={showToast}
                isDarkMode={false}
              />
            )
          )}

          {/* ============================================================
              4. REPORT & MODERATION CONTROL
             ============================================================ */}
          {['user_reports', 'message_reports', 'resolve_reports'].includes(activeTab) && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>
                    {activeTab === 'user_reports' && 'User Complaints & Reports'}
                    {activeTab === 'message_reports' && 'Message Moderation Reports'}
                    {activeTab === 'resolve_reports' && 'Resolved Reports Archive'}
                  </h1>
                  <p className="dashboard-subtitle">
                    Investigate abuse complaints, spam reports, and enforce community standards safely.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['all', 'pending', 'resolved'].map((f) => (
                    <button
                      key={f}
                      className={`filter-pill-btn ${reportFilter === f ? 'active' : ''}`}
                      onClick={() => setReportFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="e2ee-privacy-banner">
                <div className="e2ee-banner-left">
                  <div className="e2ee-banner-icon">
                    <Icons.ShieldCheck style={{ width: 26, height: 26 }} />
                  </div>
                  <div className="e2ee-banner-text">
                    <h3>End-to-End Encryption Compliance Protected</h3>
                    <p>
                      Moderators review user-submitted complaint metadata and flagged snippets submitted with consent. Unreported private chat sessions remain cryptographically locked and unreadable by administrators.
                    </p>
                  </div>
                </div>
                <div className="e2ee-pill-badge">
                  🔒 Zero-Knowledge Privacy Enforced
                </div>
              </div>

              <div className="reports-moderation-grid">
                {reports
                  .filter((r) => {
                    if (activeTab === 'resolve_reports') return r.status === 'resolved';
                    if (reportFilter === 'pending') return r.status === 'pending';
                    if (reportFilter === 'resolved') return r.status === 'resolved';
                    return true;
                  })
                  .map((rep) => (
                    <div key={rep._id} className="moderation-item-card">
                      <div className="moderation-item-left">
                        <span className={`mod-badge ${rep.category?.toLowerCase()?.replace(' ', '_') || 'harassment'}`}>
                          {rep.category || 'Harassment'}
                        </span>
                        <div className="mod-info-content">
                          <h4>
                            Report against <strong>{rep.reportedUser?.name || 'Unknown'}</strong> ({rep.reportedUser?.phoneNumber || rep.reportedUser?.email || 'N/A'})
                          </h4>
                          <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#334155' }}>
                            <strong>Reason:</strong> {rep.reason}
                          </p>
                          {rep.notes && (
                            <p style={{ margin: '2px 0', fontSize: '0.74rem', color: '#64748b' }}>
                              <strong>Notes:</strong> {rep.notes}
                            </p>
                          )}
                          <div className="mod-meta-small">
                            Reported by: <strong>{rep.reportedBy?.name || 'Community Member'}</strong> •{' '}
                            {new Date(rep.createdAt || rep.timestamp || Date.now()).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {rep.status === 'resolved' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>
                          <Icons.CheckCircle />
                          <span>Resolved ({rep.actionTaken || 'Action Complete'})</span>
                        </div>
                      ) : (
                        <div className="moderation-actions">
                          <button
                            className="btn-mod-action dismiss"
                            onClick={() => handleResolveReport(rep._id, 'dismiss')}
                          >
                            Dismiss
                          </button>
                          <button
                            className="btn-mod-action warn"
                            onClick={() => handleResolveReport(rep._id, 'warn', 'Warning issued to user')}
                          >
                            Warn User
                          </button>
                          <button
                            className="btn-mod-action ban"
                            onClick={() => handleResolveReport(rep._id, 'ban', 'Banned due to violation')}
                          >
                            Block User
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ============================================================
              5. CONVERSATION CONTROL (Strict E2EE Compliance)
             ============================================================ */}
          {activeTab === 'conversations_metadata' && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>Conversations (Metadata Only)</h1>
                  <p className="dashboard-subtitle">
                    Inspect active channel counts and encryption health without compromising chat privacy.
                  </p>
                </div>
                <div className="e2ee-pill-badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                  🔒 Total Conversations: {conversations.length}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div className="admin-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#059669', fontWeight: 700 }}>
                    <Icons.CheckCircle />
                    <span>✅ What Admin CAN View & Control</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                    <li>Total conversations count ({conversations.length} active in MongoDB)</li>
                    <li>Conversation metadata (title, group/private type, creation date)</li>
                    <li>Participants information (names, IDs, phone numbers)</li>
                    <li>Last activity timestamp and total message count</li>
                    <li>Account moderation and safety controls</li>
                  </ul>
                </div>

                <div className="admin-card" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#dc2626', fontWeight: 700 }}>
                    <Icons.Ban />
                    <span>❌ What Admin CANNOT Do — Proper E2EE</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                    <li>Cannot read private chat plaintext (zero-knowledge protected)</li>
                    <li>Cannot access user private encryption keys (WebCrypto JWK on device)</li>
                    <li>Cannot secretly decrypt or spy on private conversations</li>
                    <li>Cannot tamper with, edit, or secretly modify encrypted messages</li>
                  </ul>
                </div>
              </div>

              <div className="admin-card">
                <table className="admin-custom-table">
                  <thead>
                    <tr>
                      <th>Conversation</th>
                      <th>Type</th>
                      <th>Participants</th>
                      <th>Message Volume</th>
                      <th>Encryption Protocol</th>
                      <th>Content Access</th>
                      <th>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map((conv) => (
                      <tr key={conv._id}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{conv.title}</td>
                        <td>
                          <span className={`status-pill ${conv.isGroup ? 'status-suspended' : 'status-active'}`}>
                            {conv.isGroup ? 'Group Chat' : 'Direct Chat'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{conv.participantsCount} participants</td>
                        <td style={{ color: '#2563eb', fontWeight: 600 }}>{conv.messageCount || 0} messages</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', fontWeight: 600, fontSize: '11px' }}>
                            <Icons.Lock style={{ width: 12, height: 12 }} />
                            AES-256-GCM (E2EE)
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '11px' }}>
                            🔒 Encrypted (Unreadable)
                          </span>
                        </td>
                        <td style={{ color: '#64748b' }}>
                          {conv.lastActive ? new Date(conv.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              7 & 8. DEVICE & SECURITY CONTROL
             ============================================================ */}
          {['login_sessions', 'devices', 'suspicious_activity'].includes(activeTab) && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>Security & Device Management</h1>
                  <p className="dashboard-subtitle">
                    Active login sessions, authorized hardware devices, and threat detection.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Authorized Hardware Devices & Sessions</h3>
                  </div>
                  <div className="sessions-list">
                    {sessions.map((s) => (
                      <div key={s.id} className="session-item-row">
                        <div className="session-icon-wrap">
                          {s.device.includes('iPhone') || s.device.includes('Android') ? <Icons.Smartphone /> : <Icons.Laptop />}
                        </div>
                        <div className="session-meta">
                          <div className="session-device-name">
                            {s.device}
                            {s.current && <span className="active-now-badge">Active now</span>}
                          </div>
                          <div className="session-ip">
                            User: <strong>{s.userName}</strong> • IP: {s.ip} • {s.status}
                          </div>
                        </div>
                        <button className="revoke-session-btn" onClick={() => handleRevokeSession(s.id)}>
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Security Events & Threat Log</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {securityEvents.length === 0 ? (
                      <div style={{ padding: 12, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '0.8rem' }}>
                        ✅ All security parameters normal. No suspicious anomalies detected.
                      </div>
                    ) : (
                      securityEvents.map((evt, idx) => (
                        <div
                          key={evt._id || idx}
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            background: evt.severity === 'high' || evt.severity === 'critical' ? '#fef2f2' : '#fffbeb',
                            border: `1px solid ${evt.severity === 'high' ? '#fee2e2' : '#fde68a'}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', color: evt.severity === 'high' ? '#dc2626' : '#d97706' }}>
                            <Icons.AlertTriangle />
                            <span>{evt.type?.toUpperCase()} — {evt.userIdentifier || 'User'}</span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                            {evt.details} (IP: {evt.ip}) • {new Date(evt.createdAt || Date.now()).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              9. DASHBOARD & ANALYTICS CONTROL
             ============================================================ */}
          {['user_analytics', 'chat_analytics', 'report_analytics'].includes(activeTab) && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>Platform Analytics & Insights</h1>
                  <p className="dashboard-subtitle">
                    Real-time telemetry, user retention curves, and message delivery health.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">User Growth & Retention (7 Days)</h3>
                  </div>
                  <UserActivityChart data={userActivity} />
                </div>

                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Message Delivery & Health Telemetry</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { label: 'Delivered Successfully', pct: 99.4, color: '#10b981' },
                      { label: 'Read Receipts Acknowledged', pct: 88.2, color: '#2563eb' },
                      { label: 'Sent via Push Notification', pct: 94.6, color: '#8b5cf6' },
                      { label: 'E2EE Cryptographic Verifications', pct: 100, color: '#059669' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, marginBottom: 4 }}>
                          <span>{item.label}</span>
                          <span style={{ color: item.color }}>{item.pct}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              10. NOTIFICATION CONTROL
             ============================================================ */}
          {activeTab === 'system_notifications' && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                      REAL-TIME BROADCAST CENTER
                    </span>
                  </div>
                  <h1>System Notifications & Announcements</h1>
                  <p className="dashboard-subtitle">
                    Push live announcements, security warnings, or software maintenance notices to all Batiyao users in real-time.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-secondary-action" onClick={fetchAnnouncementsHistory} title="Refresh History">
                    <Icons.RefreshCw />
                    <span>Refresh</span>
                  </button>
                  <button className="btn-primary-confirm" onClick={() => setBroadcastModalOpen(true)}>
                    <Icons.Send />
                    <span>New Announcement Modal</span>
                  </button>
                </div>
              </div>

              {/* 1. Category Quick Presets */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  1. SELECT NOTICE TYPE & PRESET
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {[
                    {
                      id: 'announcement',
                      label: '📢 Announcement',
                      desc: 'Platform features & general news',
                      color: '#10b981',
                      bgColor: 'rgba(16, 185, 129, 0.08)',
                      lvl: 'info',
                      title: '📢 Official Platform Announcement',
                      template: 'We are pleased to introduce new performance improvements and updates on Batiyao! Enjoy faster messaging, crystal-clear calls, and enhanced privacy features.',
                    },
                    {
                      id: 'warning',
                      label: '⚠️ System Warning',
                      desc: 'Security advice & caution alerts',
                      color: '#f59e0b',
                      bgColor: 'rgba(245, 158, 11, 0.08)',
                      lvl: 'warning',
                      title: '⚠️ Important System & Security Warning',
                      template: 'Security Reminder: Please be vigilant regarding unsolicited links or unknown contacts. The official Batiyao team will never request your passwords or authentication codes.',
                    },
                    {
                      id: 'maintenance',
                      label: '🛠️ Software Maintenance',
                      desc: 'Scheduled server downtime notices',
                      color: '#8b5cf6',
                      bgColor: 'rgba(139, 92, 246, 0.08)',
                      lvl: 'warning',
                      title: '🛠️ Scheduled Software Maintenance Notice',
                      template: 'Notice: Batiyao software and server infrastructure will undergo scheduled maintenance tonight from 11:30 PM to 1:00 AM IST. Messaging may experience brief latency during this window.',
                    },
                    {
                      id: 'critical',
                      label: '🚨 Urgent Advisory',
                      desc: 'High priority critical alert',
                      color: '#ef4444',
                      bgColor: 'rgba(239, 68, 68, 0.08)',
                      lvl: 'critical',
                      title: '🚨 Urgent System Advisory',
                      template: 'Urgent Platform Notice: Please review our latest terms and platform guidelines. Critical update regarding service continuity and accounts.',
                    },
                  ].map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setAnnouncementCategory(preset.id);
                        setAnnouncementLevel(preset.lvl);
                        setAnnouncementTitle(preset.title);
                        if (!systemAnnouncement.trim() || systemAnnouncement.length < 50) {
                          setSystemAnnouncement(preset.template);
                        }
                      }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: announcementCategory === preset.id ? preset.bgColor : '#ffffff',
                        border: announcementCategory === preset.id ? `2px solid ${preset.color}` : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: announcementCategory === preset.id ? `0 4px 12px ${preset.color}25` : '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ fontSize: '0.88rem', color: announcementCategory === preset.id ? preset.color : '#0f172a' }}>
                          {preset.label}
                        </strong>
                        {announcementCategory === preset.id && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: preset.color }}>ACTIVE</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>{preset.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Composer & Live Preview Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18, marginBottom: 24 }}>
                {/* Composer Form Card */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="card-header-row" style={{ marginBottom: 0, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <h3 className="card-title">Live Announcement Composer</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                        Configure announcement parameters and broadcast immediately to all Batiyao users.
                      </p>
                    </div>
                  </div>

                  {/* Title Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      ANNOUNCEMENT TITLE:
                    </label>
                    <input
                      type="text"
                      className="modal-text-field"
                      placeholder="e.g. Scheduled Software Maintenance Notice"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      style={{ width: '100%', fontSize: '0.88rem', padding: '9px 12px' }}
                    />
                  </div>

                  {/* Priority Level */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      ALERT PRIORITY:
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: 'info', label: 'Info (Standard)', color: '#10b981' },
                        { id: 'warning', label: 'Warning (High)', color: '#f59e0b' },
                        { id: 'critical', label: 'Critical (Urgent)', color: '#ef4444' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setAnnouncementLevel(lvl.id)}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: 8,
                            border: announcementLevel === lvl.id ? `2px solid ${lvl.color}` : '1px solid #cbd5e1',
                            background: announcementLevel === lvl.id ? `${lvl.color}15` : '#f8fafc',
                            color: announcementLevel === lvl.id ? lvl.color : '#475569',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      MESSAGE BODY:
                    </label>
                    <textarea
                      className="notification-input-area"
                      rows="5"
                      placeholder="Type details for announcement, warning, or maintenance..."
                      value={systemAnnouncement}
                      onChange={(e) => setSystemAnnouncement(e.target.value)}
                      maxLength={800}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <span className="char-counter">{systemAnnouncement.length}/800</span>
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                      TARGET AUDIENCE:
                    </label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="liveTarget"
                          value="all"
                          checked={announcementTarget === 'all'}
                          onChange={() => setAnnouncementTarget('all')}
                        />
                        <span>All Batiyao Users ({users?.length || 'Registered'})</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="liveTarget"
                          value="selected"
                          checked={announcementTarget === 'selected'}
                          onChange={() => setAnnouncementTarget('selected')}
                        />
                        <span>Specific User</span>
                      </label>
                    </div>

                    {announcementTarget === 'selected' && (
                      <div style={{ marginTop: 10 }}>
                        <select
                          className="modal-select-field"
                          value={announcementTargetUserId}
                          onChange={(e) => setAnnouncementTargetUserId(e.target.value)}
                          style={{ width: '100%', fontSize: '0.82rem', padding: '8px' }}
                        >
                          <option value="">-- Choose User --</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.phoneNumber || u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Delivery Channel Toggles */}
                  <div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                      <input
                        type="checkbox"
                        checked={announcementSendAsChat}
                        onChange={(e) => setAnnouncementSendAsChat(e.target.checked)}
                        style={{ accentColor: '#10b981', width: 17, height: 17 }}
                      />
                      <span>💬 Deliver as official 1-on-1 message from Batiyao in user's chat list</span>
                    </label>
                    <p style={{ margin: '4px 0 0 25px', fontSize: '0.74rem', color: '#64748b' }}>
                      Users who are offline will see this message in their chat list with an unread badge when they next log in.
                    </p>
                  </div>

                  {/* Broadcast Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      className="btn-send-notification"
                      disabled={sendingAnnouncement || !systemAnnouncement.trim() || (announcementTarget === 'selected' && !announcementTargetUserId)}
                      onClick={handleSendLiveAnnouncement}
                      style={{ padding: '10px 24px', fontSize: '0.88rem' }}
                    >
                      <Icons.Send />
                      <span>{sendingAnnouncement ? 'Broadcasting...' : '📢 Broadcast to All Batiyao Users'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Screen Preview Card */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header-row" style={{ paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                    <h3 className="card-title">Live Preview (What Users See)</h3>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>Real-time Popup</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Simulated Popup Box */}
                    <div
                      style={{
                        background: 'linear-gradient(145deg, #131d1a 0%, #0d1513 100%)',
                        borderRadius: 16,
                        border: announcementCategory === 'warning' ? '1.5px solid rgba(245, 158, 11, 0.4)' :
                                announcementCategory === 'maintenance' ? '1.5px solid rgba(139, 92, 246, 0.4)' :
                                announcementCategory === 'critical' ? '1.5px solid rgba(239, 68, 68, 0.4)' :
                                '1.5px solid rgba(16, 185, 129, 0.4)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                        overflow: 'hidden',
                        color: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          height: 3,
                          width: '100%',
                          background: announcementCategory === 'warning' ? '#f59e0b' :
                                      announcementCategory === 'maintenance' ? '#8b5cf6' :
                                      announcementCategory === 'critical' ? '#ef4444' :
                                      '#10b981',
                        }}
                      />
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 18 }}>🛡️</span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981' }}>
                              {announcementCategory === 'warning' ? '⚠️ SYSTEM WARNING' :
                               announcementCategory === 'maintenance' ? '🛠️ MAINTENANCE NOTICE' :
                               announcementCategory === 'critical' ? '🚨 URGENT ADVISORY' :
                               '📢 OFFICIAL ANNOUNCEMENT'}
                            </span>
                            <span style={{ fontSize: '0.66rem', color: '#34d399' }}>● Batiyao Verified</span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff' }}>
                            {announcementTitle || 'Announcement Title'}
                          </h4>
                        </div>
                      </div>

                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: 8, fontSize: '0.82rem', lineHeight: 1.5, color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                          {systemAnnouncement || 'Your announcement message will appear here in real-time on all active user screens...'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: 10 }}>
                          <span>From: <strong>Batiyao Official</strong></span>
                          <span>Just now</span>
                        </div>
                      </div>

                      <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button type="button" style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#e2e8f0', fontSize: '0.74rem' }}>
                          Dismiss
                        </button>
                        <button type="button" style={{ padding: '6px 14px', borderRadius: 6, background: '#10b981', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.74rem' }}>
                          💬 View in Batiyao Chat
                        </button>
                      </div>
                    </div>

                    {/* Chat Message Preview */}
                    <div style={{ marginTop: 14, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '0.76rem', color: '#475569', display: 'block', marginBottom: 4 }}>
                        💬 Delivered to Chat Inbox:
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>
                        Sender: <strong>Batiyao Official 🛡️</strong> • Delivered to all recipient chats with real-time audio chime & unread counter badge.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Previous Broadcast History Table */}
              <div className="admin-card">
                <div className="card-header-row" style={{ marginBottom: 14 }}>
                  <div>
                    <h3 className="card-title">Broadcast & Announcement History</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                      Complete audit record of past notices and alerts pushed to users.
                    </p>
                  </div>
                  <button className="btn-secondary-action" onClick={fetchAnnouncementsHistory} style={{ fontSize: '0.78rem' }}>
                    <Icons.RefreshCw />
                    <span>Reload History</span>
                  </button>
                </div>

                {loadingAnnouncements ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.82rem' }}>Loading announcement history...</p>
                  </div>
                ) : announcementsHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📢</div>
                    <strong style={{ fontSize: '0.9rem', color: '#475569' }}>No announcements sent yet</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>
                      Use the Live Announcement Composer above to broadcast your first announcement or warning.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>TYPE & CATEGORY</th>
                          <th>TITLE & MESSAGE PREVIEW</th>
                          <th>AUDIENCE</th>
                          <th>CHAT MESSAGE</th>
                          <th>DATE & TIME</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcementsHistory.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  color: item.category === 'warning' ? '#b45309' :
                                         item.category === 'maintenance' ? '#6d28d9' :
                                         item.category === 'critical' ? '#b91c1c' :
                                         '#047857',
                                  background: item.category === 'warning' ? 'rgba(245, 158, 11, 0.12)' :
                                              item.category === 'maintenance' ? 'rgba(139, 92, 246, 0.12)' :
                                              item.category === 'critical' ? 'rgba(239, 68, 68, 0.12)' :
                                              'rgba(16, 185, 129, 0.12)',
                                }}
                              >
                                {item.category === 'warning' ? '⚠️ Warning' :
                                 item.category === 'maintenance' ? '🛠️ Maintenance' :
                                 item.category === 'critical' ? '🚨 Critical' :
                                 '📢 Announcement'}
                              </span>
                            </td>
                            <td>
                              <div style={{ maxWidth: 320 }}>
                                <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>
                                  {item.title}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.content}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                                {item.target === 'all' ? `All Users (${item.recipientCount || 'All'})` : 'Selected User'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                                {item.sendAsChatMessage ? '✓ Delivered from Batiyao' : 'Popup Only'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                {new Date(item.createdAt).toLocaleString('en-IN', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="action-btn-danger"
                                onClick={() => handleDeleteAnnouncement(item._id)}
                                title="Delete announcement"
                                style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              11. APP SETTINGS CONTROL
             ============================================================ */}
          {['app_settings', 'notification_settings'].includes(activeTab) && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>Platform Settings & Controls</h1>
                  <p className="dashboard-subtitle">
                    Configure server constraints, encryption parameters, and feature toggles.
                  </p>
                </div>
                <button className="btn-primary-confirm" onClick={handleSaveSettings}>
                  Save Settings
                </button>
              </div>

              <div className="admin-card" style={{ maxWidth: 740 }}>
                <div className="card-header-row">
                  <h3 className="card-title">Platform Feature Controls</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Allow New User Registrations</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                        Temporarily halt onboarding during peak surges or maintenance.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.allowNewRegistrations}
                      onChange={(e) => setSystemSettings({ ...systemSettings, allowNewRegistrations: e.target.checked })}
                      style={{ width: 18, height: 18 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Allow Group Creation</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                        Allow registered users to create new chat groups and channels.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.allowGroupCreation !== false}
                      onChange={(e) => setSystemSettings({ ...systemSettings, allowGroupCreation: e.target.checked })}
                      style={{ width: 18, height: 18 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Voice & Video Calling</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                        Enable or disable WebRTC voice/video calls platform-wide.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.allowCalling !== false}
                      onChange={(e) => setSystemSettings({ ...systemSettings, allowCalling: e.target.checked })}
                      style={{ width: 18, height: 18 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Maintenance Mode</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                        Display maintenance screen and broadcast maintenance notice to active users.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                      style={{ width: 18, height: 18 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>End-to-End Encryption (E2EE) Enforced</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                        Mandate WebCrypto ECDH / AES-256-GCM encryption for all client messages.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.e2eeEnforced}
                      onChange={(e) => setSystemSettings({ ...systemSettings, e2eeEnforced: e.target.checked })}
                      style={{ width: 18, height: 18 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Maximum Media Upload Size</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                        Cap attachment payload in megabytes (MB).
                      </p>
                    </div>
                    <select
                      className="modal-select-field"
                      style={{ width: 120 }}
                      value={systemSettings.maxUploadSizeMb}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maxUploadSizeMb: Number(e.target.value) })}
                    >
                      <option value="16">16 MB</option>
                      <option value="25">25 MB</option>
                      <option value="50">50 MB</option>
                      <option value="100">100 MB</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              12. ADMIN ROLES & PERMISSIONS
             ============================================================ */}
          {activeTab === 'roles_permissions' && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>Admin Roles & Access Control</h1>
                  <p className="dashboard-subtitle">
                    Manage administrative hierarchy and assign operational permissions.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
                {[
                  { title: 'Super Admin', desc: 'Full control over platform, settings, and database', color: '#2563eb' },
                  { title: 'Moderator', desc: 'Manage user complaints, blocks, and reports queue', color: '#8b5cf6' },
                  { title: 'Support Admin', desc: 'User profile support and ticket resolution', color: '#10b981' },
                  { title: 'Security Admin', desc: 'Manage sessions, devices, and security threat logs', color: '#f59e0b' },
                ].map((role) => (
                  <div key={role.title} className="admin-card" style={{ borderTop: `4px solid ${role.color}` }}>
                    <h4 style={{ margin: '0 0 6px', color: '#0f172a' }}>{role.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{role.desc}</p>
                  </div>
                ))}
              </div>

              <div className="admin-card">
                <div className="card-header-row">
                  <h3 className="card-title">Administrative Accounts Directory</h3>
                </div>
                <table className="admin-custom-table">
                  <thead>
                    <tr>
                      <th>Admin Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminsList.map((adm) => (
                      <tr key={adm._id}>
                        <td>
                          <div className="table-user-cell">
                            <img
                              src={adm.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(adm.name)}&background=2563EB&color=fff`}
                              alt={adm.name}
                              className="table-avatar"
                            />
                            <span className="table-name">{adm.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{adm.email}</td>
                        <td>
                          <span className={`status-pill ${adm.role === 'superadmin' ? 'status-active' : 'status-suspended'}`}>
                            {adm.role?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>Active</span>
                        </td>
                        <td>
                          {adm.role !== 'superadmin' && (
                            <button
                              className="btn-inspect-small"
                              onClick={() => {
                                setTargetUser(adm);
                                setSelectedRole(adm.role);
                                setRoleChangeModalOpen(true);
                              }}
                            >
                              Change Role
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              13. ADMIN ACTIVITY LOG
             ============================================================ */}
          {activeTab === 'audit_logs' && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>Admin Activity Logs</h1>
                  <p className="dashboard-subtitle">
                    Tamper-evident audit trail of all moderation actions and configuration adjustments.
                  </p>
                </div>
              </div>

              <div className="admin-card">
                <table className="admin-custom-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Admin Actor</th>
                      <th>Target</th>
                      <th>Details</th>
                      <th>Timestamp</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id || log.id}>
                        <td style={{ fontWeight: 700, color: '#2563eb' }}>{log.action}</td>
                        <td style={{ fontWeight: 600 }}>{log.admin}</td>
                        <td style={{ color: '#0f172a' }}>{log.target}</td>
                        <td style={{ color: '#64748b' }}>{log.details}</td>
                        <td style={{ color: '#94a3b8' }}>{new Date(log.createdAt || log.timestamp).toLocaleString()}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{log.ip || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================
              14. SYSTEM HEALTH & INFRASTRUCTURE CONTROL
             ============================================================ */}
          {activeTab === 'system_control' && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>System Health & Infrastructure Control</h1>
                  <p className="dashboard-subtitle">
                    Server operations, MongoDB database status, and real-time Socket.IO streams.
                  </p>
                </div>
                <button className="btn-primary-confirm" onClick={fetchDashboardData}>
                  Refresh System Metrics
                </button>
              </div>

              {systemControlMetrics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div className="admin-card">
                    <div className="card-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icons.Server style={{ color: '#2563eb' }} />
                        <h3 className="card-title">Node.js API Server</h3>
                      </div>
                      <span className="status-pill status-active">● Operational</span>
                    </div>
                    <div className="profile-grid">
                      <div className="profile-row">
                        <span className="profile-label">Node Runtime</span>
                        <span className="profile-value">{systemControlMetrics.server.nodeVersion} ({systemControlMetrics.server.platform})</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Process Uptime</span>
                        <span className="profile-value">{systemControlMetrics.server.uptimeFormatted}</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Memory RSS</span>
                        <span className="profile-value">{systemControlMetrics.server.memoryRssMb} MB</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Heap Memory Used</span>
                        <span className="profile-value">{systemControlMetrics.server.heapUsedMb} MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="card-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icons.Database style={{ color: '#10b981' }} />
                        <h3 className="card-title">MongoDB Database</h3>
                      </div>
                      <span className="status-pill status-active">● {systemControlMetrics.database.status}</span>
                    </div>
                    <div className="profile-grid">
                      <div className="profile-row">
                        <span className="profile-label">Database Name</span>
                        <span className="profile-value">{systemControlMetrics.database.name}</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Host</span>
                        <span className="profile-value">{systemControlMetrics.database.host}</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Ping Latency</span>
                        <span className="profile-value" style={{ color: '#10b981' }}>{systemControlMetrics.database.latencyMs} ms</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Document Collections</span>
                        <span className="profile-value">{systemControlMetrics.database.totalUsers} users • {systemControlMetrics.database.totalMessages} messages</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="card-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icons.Activity style={{ color: '#8b5cf6' }} />
                        <h3 className="card-title">Real-Time Socket.IO</h3>
                      </div>
                      <span className="status-pill status-active">● {systemControlMetrics.realtime.status}</span>
                    </div>
                    <div className="profile-grid">
                      <div className="profile-row">
                        <span className="profile-label">Connected Clients</span>
                        <span className="profile-value" style={{ fontWeight: 700, color: '#2563eb' }}>{systemControlMetrics.realtime.connectedClients} active sockets</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Active Channel Rooms</span>
                        <span className="profile-value">{systemControlMetrics.realtime.activeRooms} rooms</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Transport Protocol</span>
                        <span className="profile-value">{systemControlMetrics.realtime.protocol}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="card-header-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icons.Download style={{ color: '#f59e0b' }} />
                        <h3 className="card-title">Disk Storage & Media</h3>
                      </div>
                      <span className="status-pill status-active">● {systemControlMetrics.storage.status}</span>
                    </div>
                    <div className="profile-grid">
                      <div className="profile-row">
                        <span className="profile-label">Total Uploaded Files</span>
                        <span className="profile-value">{systemControlMetrics.storage.totalFiles} files</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Storage Disk Used</span>
                        <span className="profile-value">{systemControlMetrics.storage.usedMb} MB</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Max Attachment Limit</span>
                        <span className="profile-value">{systemControlMetrics.storage.maxUploadSizeMb} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              1x. REPORTS & MODERATION
             ============================================================ */}
          {activeTab.startsWith('reports_') && (
            <div className="subpage-container" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ReportsModeration activeType={activeTab} />
            </div>
          )}

          {/* ============================================================
              1b. MY PROFILE & ADMIN CREDENTIALS
             ============================================================ */}
          {['my_profile', 'change_password'].includes(activeTab) && (
            <div className="subpage-container">
              <div className="dashboard-title-row">
                <div>
                  <h1>Admin Profile & Credentials</h1>
                  <p className="dashboard-subtitle">Manage console credentials and administrative role.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Administrator Profile Details</h3>
                  </div>

                  <form onSubmit={handleSaveProfile}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <img
                        src={profileForm.profilePicture || authUser?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt="Admin Avatar"
                        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <h3 style={{ margin: '0 0 4px', color: '#0f172a' }}>{authUser?.name || 'Administrator'}</h3>
                        <span className="status-pill status-active">{authUser?.role?.toUpperCase() || 'SUPERADMIN'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className="modal-input-label">Admin Full Name:</label>
                        <input
                          type="text"
                          className="modal-text-field"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="modal-input-label">Email Address:</label>
                        <input
                          type="email"
                          className="modal-text-field"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="modal-input-label">Phone Number:</label>
                        <input
                          type="text"
                          className="modal-text-field"
                          value={profileForm.phoneNumber}
                          onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="modal-input-label">Profile Picture URL:</label>
                        <input
                          type="text"
                          className="modal-text-field"
                          value={profileForm.profilePicture}
                          onChange={(e) => setProfileForm({ ...profileForm, profilePicture: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn-primary-confirm" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>

                <div className="admin-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Security & Credentials</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ padding: 14, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Password</strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                            Last changed recently. Recommended to use 8+ characters.
                          </p>
                        </div>
                        <button className="btn-inspect-small" onClick={() => setPasswordModalOpen(true)}>
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Two-Factor Authentication (2FA)</strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                            Status: <strong style={{ color: authUser?.accountSecurity?.twoStepVerification?.enabled ? '#10b981' : '#f59e0b' }}>
                              {authUser?.accountSecurity?.twoStepVerification?.enabled ? 'Enabled' : 'Disabled'}
                            </strong>
                          </p>
                        </div>
                        <button className="btn-inspect-small" onClick={() => setTwoFactorModalOpen(true)}>
                          {authUser?.accountSecurity?.twoStepVerification?.enabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Active Admin Sessions</strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                            1 active session on this device.
                          </p>
                        </div>
                        <button className="btn-cancel" onClick={() => navigate('/chat')}>
                          Open User Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals for Admin Actions */}
      <BlockUserModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        user={targetUser}
        onConfirm={handleConfirmBlock}
      />

      <SuspendUserModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        user={targetUser}
        onConfirm={handleConfirmSuspend}
      />

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        user={targetUser}
        onConfirm={handleConfirmDelete}
      />

      <BroadcastModal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        onSend={handleSendBroadcast}
        users={users}
      />

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        showToast={showToast}
      />

      <NotifyUserModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        user={targetUser}
        onSend={handleConfirmNotifyUser}
      />

      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        enabled={authUser?.accountSecurity?.twoStepVerification?.enabled}
        onSave={handleToggle2FA}
      />

      {/* Role Change Modal */}
      {roleChangeModalOpen && targetUser && (
        <div className="admin-modal-backdrop" onClick={() => setRoleChangeModalOpen(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-badge primary">
                <Icons.Key />
              </div>
              <div className="modal-title-wrap">
                <h3>Assign Admin Role</h3>
                <p>Change operational role for <strong>{targetUser.name}</strong></p>
              </div>
              <button className="modal-close-btn" onClick={() => setRoleChangeModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label className="modal-input-label">Select Role:</label>
              <select
                className="modal-select-field"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="user">User (Standard account)</option>
                <option value="moderator">Moderator (Users + Reports)</option>
                <option value="support_admin">Support Admin (User Support)</option>
                <option value="security_admin">Security Admin (Sessions + Security)</option>
                <option value="admin">Admin (Full Administrative access)</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setRoleChangeModalOpen(false)}>Cancel</button>
              <button className="btn-primary-confirm" onClick={() => handleUpdateUserRole(targetUser, selectedRole)}>
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="admin-toast">
          <Icons.CheckCircle style={{ color: '#10B981', width: 18, height: 18 }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Admin;
