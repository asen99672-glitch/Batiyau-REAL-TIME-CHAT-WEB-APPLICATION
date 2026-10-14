import express from 'express';
import {
  protect,
  requireAnyAdmin,
  requireAdmin,
  requireSuperAdmin,
  requireModerator,
  requireSecurityAdmin,
} from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAllUsersAdmin,
  getUserDetailsAdmin,
  notifyUserAdmin,
  exportUsersAdmin,
  updateUserRole,
  toggleBanUser,
  toggleSuspendUser,
  deleteUserAdmin,
  restoreUserAdmin,
  getBlockedUsersAdmin,
  blockUserAdmin,
  unblockUserAdmin,
  getUserBlockHistory,
  changeBlockReasonAdmin,
  extendBlockDurationAdmin,
  makeBlockPermanentAdmin,
  getPeerBlockedUsersAdmin,
  getSuspendedUsersAdmin,
  suspendUserAdmin,
  activateSuspendedUser,
  extendSuspensionUser,
  getUserSuspensionHistory,
  getDeletedUsersAdmin,
  purgeUserAdmin,
  getUserDeletionHistory,
  getConversationMetadata,
  getMessageStats,
  getSecuritySessions,
  revokeUserSession,
  getSecurityOverview,
  sendSystemBroadcast,
  getSystemAnnouncements,
  deleteSystemAnnouncement,
  getActiveSystemAnnouncement,
  getSystemSettings,
  updateSystemSettings,
  getAllAdmins,
  getAdminActivityLogs,
  getSystemControlStatus,
  updateAdminProfile,
  changeAdminPassword,
  toggleAdmin2FA,
} from '../controllers/adminController.js';
import {
  getAdminReports,
  createReport,
  resolveAdminReport,
} from '../controllers/reportController.js';

const router = express.Router();

// 1. Dashboard stats & overview
router.get('/stats', protect, requireAnyAdmin, getDashboardStats);

// 2. User management (search, list, roles, details, notify, export)
router.get('/users/export', protect, requireAnyAdmin, exportUsersAdmin);
router.get('/users', protect, requireAnyAdmin, getAllUsersAdmin);
router.get('/users/:id/details', protect, requireAnyAdmin, getUserDetailsAdmin);
router.post('/users/:id/notify', protect, requireAnyAdmin, notifyUserAdmin);
router.put('/users/:id/role', protect, requireSuperAdmin, updateUserRole);

// Blocked Users Management (Temporary / Permanent, History, Super Admin & Moderator)
router.get('/blocked-users', protect, requireAnyAdmin, getBlockedUsersAdmin);
router.post('/users/:id/block', protect, requireModerator, blockUserAdmin);
router.post('/users/:id/unblock', protect, requireModerator, unblockUserAdmin);
router.put('/users/:id/block-reason', protect, requireModerator, changeBlockReasonAdmin);
router.post('/users/:id/extend-block', protect, requireModerator, extendBlockDurationAdmin);
router.post('/users/:id/make-permanent-block', protect, requireModerator, makeBlockPermanentAdmin);
router.get('/users/:id/block-history', protect, requireAnyAdmin, getUserBlockHistory);
router.get('/peer-blocked-users', protect, requireAnyAdmin, getPeerBlockedUsersAdmin);
router.put('/users/:id/ban', protect, requireModerator, toggleBanUser);

// Suspended Users Management (Presets, Custom Duration, Live Remaining, Extend, Activate)
router.get('/suspended-users', protect, requireAnyAdmin, getSuspendedUsersAdmin);
router.post('/users/:id/suspend', protect, requireModerator, suspendUserAdmin);
router.post('/users/:id/activate-suspension', protect, requireModerator, activateSuspendedUser);
router.post('/users/:id/extend-suspension', protect, requireModerator, extendSuspensionUser);
router.get('/users/:id/suspension-history', protect, requireAnyAdmin, getUserSuspensionHistory);
router.put('/users/:id/suspend', protect, requireModerator, toggleSuspendUser);

// Deleted / Archived Accounts Management (OWASP Retention Policy, Restore, Purge)
router.get('/deleted-users', protect, requireAnyAdmin, getDeletedUsersAdmin);
router.post('/users/:id/delete', protect, requireAdmin, deleteUserAdmin);
router.delete('/users/:id', protect, requireAdmin, deleteUserAdmin);
router.post('/users/:id/restore', protect, requireAdmin, restoreUserAdmin);
router.put('/users/:id/restore', protect, requireAdmin, restoreUserAdmin);
router.delete('/users/:id/purge', protect, requireSuperAdmin, purgeUserAdmin);
router.get('/users/:id/deletion-history', protect, requireAnyAdmin, getUserDeletionHistory);

// 3. Reports & Moderation
router.get('/reports', protect, requireModerator, getAdminReports);
router.post('/reports', protect, createReport);
router.post('/reports/:id/resolve', protect, requireModerator, resolveAdminReport);

// 4. Conversation Metadata (Zero-knowledge E2EE metadata inspection)
router.get('/conversations', protect, requireAnyAdmin, getConversationMetadata);

// 5. Message Telemetry & Control
router.get('/messages/stats', protect, requireAnyAdmin, getMessageStats);

// 6. Security, Sessions & Device Control
router.get('/security/sessions', protect, requireSecurityAdmin, getSecuritySessions);
router.delete('/security/sessions/:id', protect, requireSecurityAdmin, revokeUserSession);
router.get('/security/overview', protect, requireSecurityAdmin, getSecurityOverview);

// 7. System Broadcast Announcements & Notifications
router.post('/broadcast', protect, requireAdmin, sendSystemBroadcast);
router.get('/announcements', protect, requireAdmin, getSystemAnnouncements);
router.delete('/announcements/:id', protect, requireAdmin, deleteSystemAnnouncement);
router.get('/announcements/active', protect, getActiveSystemAnnouncement);

// 8. Platform System Configuration & Settings
router.get('/settings', protect, requireAdmin, getSystemSettings);
router.put('/settings', protect, requireSuperAdmin, updateSystemSettings);

// 9. Admin Roles & Permissions
router.get('/admins', protect, requireSuperAdmin, getAllAdmins);

// 10. Audit Activity Logs
router.get('/audit-logs', protect, requireAnyAdmin, getAdminActivityLogs);

// 11. System Health & Infrastructure Control
router.get('/system/status', protect, requireAnyAdmin, getSystemControlStatus);

// 12. Admin Account Control (Profile, Password, 2FA)
router.put('/profile', protect, requireAnyAdmin, updateAdminProfile);
router.put('/profile/password', protect, requireAnyAdmin, changeAdminPassword);
router.put('/profile/2fa', protect, requireAnyAdmin, toggleAdmin2FA);

export default router;
