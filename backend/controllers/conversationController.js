import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { filterUserPrivacy } from './userController.js';

// @desc    Get all conversations for current user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user._id] },
    })
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        // Find the single latest message in this conversation visible to the current user
        const lastVisibleMsg = await Message.findOne({
          conversation: conv._id,
          deletedFor: { $ne: req.user._id },
        })
          .sort({ createdAt: -1 })
          .populate('sender', 'name username profilePicture');

        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          isRead: false,
          isDeleted: false,
          deletedFor: { $ne: req.user._id },
        });

        const convObj = conv.toObject();
        convObj.lastMessage = lastVisibleMsg || null;
        convObj.lastMessageAt = lastVisibleMsg ? lastVisibleMsg.createdAt : null;
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    // Sort: latest active conversations first
    conversationsWithUnread.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.updatedAt || 0).getTime();
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    const currentUser = await User.findById(req.user._id);
    const sanitizedConversations = conversationsWithUnread.map((conv) => {
      if (conv.participants) {
        conv.participants = conv.participants.map((p) => filterUserPrivacy(p, currentUser));
      }
      return conv;
    });

    res.json(sanitizedConversations);
  } catch (error) {
    next(error);
  }
};

// @desc    Create or get private conversation
// @route   POST /api/conversations
// @access  Private
const createOrGetConversation = async (req, res, next) => {
  try {
    const { userId } = req.body; // Dusre user ka ID

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Pehle check karo ki conversation already exist karta hai ya nahi
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] },
    })
      .populate('participants', '-password');

    if (conversation) {
      const lastVisibleMsg = await Message.findOne({
        conversation: conversation._id,
        deletedFor: { $ne: req.user._id },
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'name username profilePicture');

      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        isRead: false,
        isDeleted: false,
        deletedFor: { $ne: req.user._id },
      });

      const convObj = conversation.toObject();
      convObj.lastMessage = lastVisibleMsg || null;
      convObj.lastMessageAt = lastVisibleMsg ? lastVisibleMsg.createdAt : null;
      convObj.unreadCount = unreadCount;

      return res.json(convObj);
    }

    // Naya private conversation create karo
    const currentUser = await User.findById(req.user._id);
    const defaultTimer = currentUser?.privacySettings?.defaultMessageTimer || 'off';

    conversation = await Conversation.create({
      participants: [req.user._id, userId],
      isGroup: false,
      disappearingTimer: defaultTimer,
    });

    conversation = await Conversation.findById(conversation._id).populate(
      'participants',
      '-password'
    );

    const convObj = conversation.toObject();
    if (convObj.participants) {
      convObj.participants = convObj.participants.map((p) => filterUserPrivacy(p, currentUser));
    }

    res.status(201).json({
      ...convObj,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check karo ki user is conversation ka part hai ya nahi
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    const currentUser = await User.findById(req.user._id);

    const lastVisibleMsg = await Message.findOne({
      conversation: conversation._id,
      deletedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name username profilePicture');

    const unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      sender: { $ne: req.user._id },
      isRead: false,
      isDeleted: false,
      deletedFor: { $ne: req.user._id },
    });

    const convObj = conversation.toObject();
    convObj.lastMessage = lastVisibleMsg || null;
    convObj.lastMessageAt = lastVisibleMsg ? lastVisibleMsg.createdAt : null;
    convObj.unreadCount = unreadCount;

    res.json(convObj);
  } catch (error) {
    next(error);
  }
};

// @desc    Create group conversation
// @route   POST /api/conversations/group
// @access  Private
const createGroup = async (req, res, next) => {
  try {
    const { groupName, participants, groupImage, groupDescription } = req.body;

    if (!groupName || !participants || participants.length < 1) {
      return res
        .status(400)
        .json({ message: 'Group name and at least 1 participant required' });
    }

    // Check privacy settings: Who can add me to groups
    const targetUsers = await User.find({ _id: { $in: participants } });
    for (const u of targetUsers) {
      if (u._id.toString() === req.user._id.toString()) continue;
      const grpSetting = u.privacySettings?.groups || 'everyone';
      if (grpSetting === 'nobody') {
        return res.status(403).json({
          message: `${u.name || 'A contact'} cannot be added due to their privacy settings.`,
        });
      }
      if (grpSetting === 'contacts_except') {
        const excluded = (u.privacySettings?.groupsExcluded || []).map((id) => id.toString());
        if (excluded.includes(req.user._id.toString())) {
          return res.status(403).json({
            message: `${u.name || 'A contact'} cannot be added due to their privacy settings.`,
          });
        }
      }
    }

    // Current user ko bhi participants mein add karo
    const allParticipants = [...new Set([...participants, req.user._id.toString()])];
    const inviteCode = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

    const group = await Conversation.create({
      isGroup: true,
      groupName,
      groupImage: groupImage || '',
      groupDescription: groupDescription || '',
      participants: allParticipants,
      groupAdmin: req.user._id,
      groupAdmins: [req.user._id],
      inviteCode,
      groupPermissions: {
        editGroupSettings: true,
        sendMessages: true,
        addMembers: true,
        sendMessageHistory: true,
        approveNewMembers: false,
      },
    });

    const fullGroup = await Conversation.findById(group._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    res.status(201).json(fullGroup);
  } catch (error) {
    next(error);
  }
};

// @desc    Update group (rename, description, add/remove members)
// @route   PUT /api/conversations/:id
// @access  Private
const updateGroup = async (req, res, next) => {
  try {
    const { groupName, groupImage, groupDescription, addParticipants, removeParticipants } = req.body;

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = conversation.groupAdmin?.toString() === req.user._id.toString() ||
      conversation.groupAdmins?.some((a) => a.toString() === req.user._id.toString());

    if (!isAdmin && conversation.groupPermissions?.editGroupSettings === false) {
      return res.status(403).json({ message: 'Only admin can update group settings' });
    }

    if (groupName) conversation.groupName = groupName;
    if (groupImage !== undefined) conversation.groupImage = groupImage;
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription;

    // Participants add karo
    if (addParticipants && addParticipants.length > 0) {
      if (!isAdmin && conversation.groupPermissions?.addMembers === false) {
        return res.status(403).json({ message: 'Only admin can add members' });
      }
      conversation.participants = [
        ...new Set([...conversation.participants.map((p) => p.toString()), ...addParticipants]),
      ];
    }

    // Participants remove karo
    if (removeParticipants && removeParticipants.length > 0) {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only admin can remove members' });
      }
      conversation.participants = conversation.participants.filter(
        (p) => !removeParticipants.includes(p.toString())
      );
      conversation.groupAdmins = (conversation.groupAdmins || []).filter(
        (a) => !removeParticipants.includes(a.toString())
      );
      if (removeParticipants.includes(conversation.groupAdmin?.toString())) {
        conversation.groupAdmin = conversation.groupAdmins?.[0] || conversation.participants?.[0] || null;
      }
    }

    await conversation.save();

    const updatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    res.json(updatedConversation);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single conversation
// @route   DELETE /api/conversations/:id
// @access  Private
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await Message.deleteMany({ conversation: req.params.id });
    await Conversation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete conversations
// @route   POST /api/conversations/bulk-delete
// @access  Private
const bulkDeleteConversations = async (req, res, next) => {
  try {
    const { conversationIds } = req.body;
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({ message: 'No conversation IDs provided' });
    }

    await Message.deleteMany({ conversation: { $in: conversationIds } });
    await Conversation.deleteMany({
      _id: { $in: conversationIds },
      participants: req.user._id,
    });

    res.json({ message: 'Conversations deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group permissions (members can / admins can)
// @route   PUT /api/conversations/:id/permissions
// @access  Private
const updateGroupPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = conversation.groupAdmin?.toString() === req.user._id.toString() ||
      conversation.groupAdmins?.some((a) => a.toString() === req.user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only group admins can change group permissions' });
    }

    conversation.groupPermissions = {
      ...(conversation.groupPermissions?.toObject ? conversation.groupPermissions.toObject() : conversation.groupPermissions),
      ...permissions,
    };
    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Add members to group
// @route   POST /api/conversations/:id/members
// @access  Private
const addGroupMembers = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = conversation.groupAdmin?.toString() === req.user._id.toString() ||
      conversation.groupAdmins?.some((a) => a.toString() === req.user._id.toString());

    if (!isAdmin && conversation.groupPermissions?.addMembers === false) {
      return res.status(403).json({ message: 'Only admins can add members to this group' });
    }

    conversation.participants = [
      ...new Set([...conversation.participants.map((p) => p.toString()), ...userIds]),
    ];
    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/conversations/:id/members/:userId
// @access  Private
const removeGroupMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = conversation.groupAdmin?.toString() === req.user._id.toString() ||
      conversation.groupAdmins?.some((a) => a.toString() === req.user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== userId.toString()
    );
    conversation.groupAdmins = (conversation.groupAdmins || []).filter(
      (a) => a.toString() !== userId.toString()
    );

    if (conversation.groupAdmin?.toString() === userId.toString()) {
      conversation.groupAdmin = conversation.groupAdmins?.[0] || conversation.participants?.[0] || null;
    }

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Leave group (exit group)
// @route   POST /api/conversations/:id/leave
// @access  Private
const leaveGroup = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const userId = req.user._id.toString();
    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== userId
    );
    conversation.groupAdmins = (conversation.groupAdmins || []).filter(
      (a) => a.toString() !== userId
    );

    // If leaving user was primary admin, reassign admin
    if (conversation.groupAdmin?.toString() === userId) {
      conversation.groupAdmin = conversation.groupAdmins?.[0] || conversation.participants?.[0] || null;
      if (conversation.groupAdmin && !conversation.groupAdmins?.some((a) => a.toString() === conversation.groupAdmin.toString())) {
        conversation.groupAdmins.push(conversation.groupAdmin);
      }
    }

    await conversation.save();
    res.json({ message: 'You left the group successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle group admin role
// @route   PUT /api/conversations/:id/admins
// @access  Private
const toggleGroupAdmin = async (req, res, next) => {
  try {
    const { userId, action } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isCurrentAdmin = conversation.groupAdmin?.toString() === req.user._id.toString() ||
      conversation.groupAdmins?.some((a) => a.toString() === req.user._id.toString());

    if (!isCurrentAdmin) {
      return res.status(403).json({ message: 'Only group admins can manage admin roles' });
    }

    if (!conversation.groupAdmins) conversation.groupAdmins = [];
    if (conversation.groupAdmin && !conversation.groupAdmins.some((a) => a.toString() === conversation.groupAdmin.toString())) {
      conversation.groupAdmins.push(conversation.groupAdmin);
    }

    if (action === 'add') {
      if (!conversation.groupAdmins.some((a) => a.toString() === userId.toString())) {
        conversation.groupAdmins.push(userId);
      }
    } else if (action === 'remove') {
      conversation.groupAdmins = conversation.groupAdmins.filter(
        (a) => a.toString() !== userId.toString()
      );
      if (conversation.groupAdmin?.toString() === userId.toString()) {
        conversation.groupAdmin = conversation.groupAdmins[0] || req.user._id;
      }
    }

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get group invite link code
// @route   GET /api/conversations/:id/invite
// @access  Private
const getGroupInvite = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!conversation.inviteCode) {
      conversation.inviteCode = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      await conversation.save();
    }

    res.json({
      inviteCode: conversation.inviteCode,
      groupName: conversation.groupName,
      groupImage: conversation.groupImage,
      memberCount: conversation.participants.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset group invite link code
// @route   POST /api/conversations/:id/invite/reset
// @access  Private
const resetGroupInvite = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = conversation.groupAdmin?.toString() === req.user._id.toString() ||
      conversation.groupAdmins?.some((a) => a.toString() === req.user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can reset the invite link' });
    }

    conversation.inviteCode = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    await conversation.save();

    res.json({
      inviteCode: conversation.inviteCode,
      message: 'Invite link reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join group via invite code
// @route   POST /api/conversations/join/:inviteCode
// @access  Private
const joinGroupByInvite = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    const conversation = await Conversation.findOne({ inviteCode, isGroup: true });
    if (!conversation) {
      return res.status(404).json({ message: 'Invalid or expired invite link' });
    }

    const userId = req.user._id.toString();
    if (!conversation.participants.some((p) => p.toString() === userId)) {
      conversation.participants.push(req.user._id);
      await conversation.save();
    }

    const fullGroup = await Conversation.findById(conversation._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('groupAdmins', '-password');

    res.json(fullGroup);
  } catch (error) {
    next(error);
  }
};

export {
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
};

