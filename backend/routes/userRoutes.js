import express from 'express';
import {
  getAllUsers,
  searchUsers,
  getUserById,
  updateProfile,
  getMyContacts,
  addContact,
  updateContact,
  deleteContact,
  syncContacts,
  getBlockedUsers,
  blockUser,
  unblockUser,
  updatePublicKey,
  getPublicKey,
  updateAccountSecurity,
  updateChatsPreferences,
  updateNotificationPreferences,
  requestAccountData,
  deleteAccount,
  clearAllChats,
  deleteAllChats,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { getActiveSystemAnnouncement } from '../controllers/adminController.js';

const router = express.Router();

// Sab routes protected hain (login required)
router.use(protect);

router.get('/announcements/active', getActiveSystemAnnouncement);

router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/contacts', getMyContacts);
router.post('/contacts', addContact);
router.put('/contacts', updateContact);
router.delete('/contacts/:phoneNumber', deleteContact);
router.post('/contacts/sync', syncContacts);
router.put('/profile', updateProfile);

// E2EE public key routes
router.put('/public-key', updatePublicKey);
router.get('/:id/public-key', getPublicKey);

// WhatsApp Account Security & Preferences
router.put('/security', updateAccountSecurity);
router.put('/chats-preferences', updateChatsPreferences);
router.put('/notification-preferences', updateNotificationPreferences);
router.get('/account-data', requestAccountData);
router.delete('/account', deleteAccount);

// Chat History Management
router.post('/clear-all-chats', clearAllChats);
router.post('/delete-all-chats', deleteAllChats);

// Blocked users management
router.get('/blocked', getBlockedUsers);
router.post('/block/:id', blockUser);
router.post('/unblock/:id', unblockUser);

router.get('/:id', getUserById);

export default router;

