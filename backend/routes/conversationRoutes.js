import express from 'express';
import {
  getConversations,
  createOrGetConversation,
  getConversationById,
  createGroup,
  updateGroup,
  deleteConversation,
  bulkDeleteConversations,
  updateGroupPermissions,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  toggleGroupAdmin,
  getGroupInvite,
  resetGroupInvite,
  joinGroupByInvite,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/', createOrGetConversation);
router.post('/group', createGroup);
router.post('/join/:inviteCode', joinGroupByInvite);
router.post('/bulk-delete', bulkDeleteConversations);
router.get('/:id', getConversationById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteConversation);

// Group management routes
router.put('/:id/permissions', updateGroupPermissions);
router.post('/:id/members', addGroupMembers);
router.delete('/:id/members/:userId', removeGroupMember);
router.post('/:id/leave', leaveGroup);
router.put('/:id/admins', toggleGroupAdmin);
router.get('/:id/invite', getGroupInvite);
router.post('/:id/invite/reset', resetGroupInvite);

export default router;

