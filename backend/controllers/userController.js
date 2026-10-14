import User from '../models/User.js';

// Phone number normalization helper
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '').trim();
};

const phonesMatch = (p1, p2) => {
  const c1 = normalizePhone(p1);
  const c2 = normalizePhone(p2);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  // Compare last 10 digits for local vs international format (e.g. +919876543210 vs 9876543210)
  const d1 = c1.replace(/\D/g, '');
  const d2 = c2.replace(/\D/g, '');
  if (d1.length >= 10 && d2.length >= 10) {
    return d1.slice(-10) === d2.slice(-10);
  }
  return false;
};

// Helper to apply WhatsApp privacy rules when viewing a target user
export const filterUserPrivacy = (targetUserDoc, viewerUser) => {
  if (!targetUserDoc) return null;
  const target = targetUserDoc.toObject ? targetUserDoc.toObject() : { ...targetUserDoc };
  if (!viewerUser || target._id?.toString() === viewerUser._id?.toString()) {
    return target;
  }

  const viewerIdStr = viewerUser._id?.toString();
  const targetPrivacy = target.privacySettings || {};
  const viewerPrivacy = viewerUser.privacySettings || {};

  // Check if viewer has blocked target
  const viewerBlockedList = (viewerPrivacy.blockedContacts || []).map((id) => (id._id || id).toString());
  if (viewerBlockedList.includes(target._id?.toString())) {
    target.isBlockedByMe = true;
  }

  // Check if target has blocked viewer
  const targetBlockedList = (targetPrivacy.blockedContacts || []).map((id) => (id._id || id).toString());
  const isBlockedByTarget = targetBlockedList.includes(viewerIdStr);

  if (isBlockedByTarget) {
    target.isBlockedByThem = true;
    target.profilePicture = '';
    target.lastSeen = null;
    target.bio = '';
    target.status = 'offline';
    return target;
  }

  // Check if viewer is in target's contacts
  const isViewerInContacts = (target.contacts || []).some((c) =>
    phonesMatch(c.phoneNumber, viewerUser.phoneNumber)
  );

  // 1. Last Seen Privacy (includes reciprocal rule: if viewer hides own lastSeen, viewer cannot see target's)
  if (viewerPrivacy.lastSeen === 'nobody') {
    target.lastSeen = null;
  } else if (targetPrivacy.lastSeen === 'nobody') {
    target.lastSeen = null;
  } else if (targetPrivacy.lastSeen === 'contacts_except') {
    const excluded = (targetPrivacy.lastSeenExcluded || []).map((id) => (id._id || id).toString());
    if (excluded.includes(viewerIdStr)) target.lastSeen = null;
  } else if (targetPrivacy.lastSeen === 'contacts') {
    if (!isViewerInContacts) target.lastSeen = null;
  }

  // 2. Online Privacy
  if (targetPrivacy.online === 'same_as_last_seen' && target.lastSeen === null) {
    target.status = 'offline';
  }

  // 3. Profile Picture Privacy
  if (targetPrivacy.profilePicture === 'nobody') {
    target.profilePicture = '';
  } else if (targetPrivacy.profilePicture === 'contacts_except') {
    const excluded = (targetPrivacy.profilePictureExcluded || []).map((id) => (id._id || id).toString());
    if (excluded.includes(viewerIdStr)) target.profilePicture = '';
  } else if (targetPrivacy.profilePicture === 'contacts') {
    if (!isViewerInContacts) target.profilePicture = '';
  }

  // 4. About (Bio) Privacy
  if (targetPrivacy.about === 'nobody') {
    target.bio = '';
  } else if (targetPrivacy.about === 'contacts_except') {
    const excluded = (targetPrivacy.aboutExcluded || []).map((id) => (id._id || id).toString());
    if (excluded.includes(viewerIdStr)) target.bio = '';
  } else if (targetPrivacy.about === 'contacts') {
    if (!isViewerInContacts) target.bio = '';
  }

  return target;
};

// @desc    Get registered contacts only (registered on app AND saved in current user's phone contact list)
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const userContacts = currentUser?.contacts || [];

    // Agar current user ke contact list mein koi number nahi hai toh 0 users return honge
    if (userContacts.length === 0) {
      return res.json([]);
    }

    // Saare registered users jinke paas phoneNumber hai (current user ko chhod kar)
    const allRegisteredUsers = await User.find({
      _id: { $ne: req.user._id },
      phoneNumber: { $exists: true, $ne: '' },
    }).select('-password');

    // Filter: Sirf wahi users jo (1) registered hain aur (2) current user ki phone contact list mein hain
    const matchedUsers = [];

    for (const regUser of allRegisteredUsers) {
      const matchedContact = userContacts.find((c) =>
        phonesMatch(c.phoneNumber, regUser.phoneNumber)
      );

      if (matchedContact) {
        const userObj = regUser.toObject();
        userObj.contactName = matchedContact.name || regUser.name;
        matchedUsers.push(filterUserPrivacy(userObj, currentUser));
      }
    }

    res.json(matchedUsers);
  } catch (error) {
    next(error);
  }
};

// @desc    Search users among registered contacts only
// @route   GET /api/users/search?q=searchterm
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const currentUser = await User.findById(req.user._id);
    const userContacts = currentUser?.contacts || [];

    if (userContacts.length === 0) {
      return res.json([]);
    }

    const allRegisteredUsers = await User.find({
      _id: { $ne: req.user._id },
      phoneNumber: { $exists: true, $ne: '' },
    }).select('-password');

    const searchLower = q.toLowerCase();
    const matchedUsers = [];

    for (const regUser of allRegisteredUsers) {
      const matchedContact = userContacts.find((c) =>
        phonesMatch(c.phoneNumber, regUser.phoneNumber)
      );

      if (matchedContact) {
        const displayName = matchedContact.name || regUser.name;
        const matches =
          displayName.toLowerCase().includes(searchLower) ||
          regUser.name.toLowerCase().includes(searchLower) ||
          regUser.username.toLowerCase().includes(searchLower) ||
          (regUser.phoneNumber && regUser.phoneNumber.includes(searchLower));

        if (matches) {
          const userObj = regUser.toObject();
          userObj.contactName = displayName;
          matchedUsers.push(filterUserPrivacy(userObj, currentUser));
        }
      }
    }

    res.json(matchedUsers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all phone contacts saved by current user
// @route   GET /api/users/contacts
// @access  Private
const getMyContacts = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const contacts = currentUser?.contacts || [];

    const allRegistered = await User.find({
      _id: { $ne: req.user._id },
      phoneNumber: { $exists: true, $ne: '' },
    }).select('name username phoneNumber profilePicture status');

    const result = contacts.map((c) => {
      const reg = allRegistered.find((u) => phonesMatch(u.phoneNumber, c.phoneNumber));
      return {
        _id: c._id,
        name: c.name,
        phoneNumber: c.phoneNumber,
        savedAt: c.savedAt,
        isRegistered: !!reg,
        registeredUser: reg || null,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a contact to current user's phone contact list
// @route   POST /api/users/contacts
// @access  Private
const addContact = async (req, res, next) => {
  try {
    const { name, phoneNumber } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser.contacts) {
      currentUser.contacts = [];
    }

    const cleanNumber = phoneNumber.trim();

    // Check if phone number already exists
    const existingIndex = currentUser.contacts.findIndex((c) =>
      phonesMatch(c.phoneNumber, cleanNumber)
    );

    if (existingIndex >= 0) {
      currentUser.contacts[existingIndex].name = name.trim();
      currentUser.contacts[existingIndex].phoneNumber = cleanNumber;
    } else {
      currentUser.contacts.push({
        name: name.trim(),
        phoneNumber: cleanNumber,
      });
    }

    await currentUser.save();

    // Check if registered on ChatApp
    const allRegistered = await User.find({
      _id: { $ne: req.user._id },
      phoneNumber: { $exists: true, $ne: '' },
    }).select('-password');

    const matchingRegistered = allRegistered.find((u) =>
      phonesMatch(u.phoneNumber, cleanNumber)
    );

    res.status(201).json({
      message: 'Contact saved successfully',
      contact: { name: name.trim(), phoneNumber: cleanNumber },
      isRegistered: !!matchingRegistered,
      registeredUser: matchingRegistered || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contact from user's phone contact list
// @route   DELETE /api/users/contacts/:phoneNumber
// @access  Private
const deleteContact = async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    const currentUser = await User.findById(req.user._id);

    if (currentUser.contacts) {
      currentUser.contacts = currentUser.contacts.filter(
        (c) => !phonesMatch(c.phoneNumber, phoneNumber)
      );
      await currentUser.save();
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync multiple phone contacts
// @route   POST /api/users/contacts/sync
// @access  Private
const syncContacts = async (req, res, next) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ message: 'Contacts must be an array' });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser.contacts) currentUser.contacts = [];

    for (const c of contacts) {
      if (!c.phoneNumber) continue;
      const cleanPhone = c.phoneNumber.trim();
      const idx = currentUser.contacts.findIndex((existing) =>
        phonesMatch(existing.phoneNumber, cleanPhone)
      );
      if (idx >= 0) {
        currentUser.contacts[idx].name = c.name || currentUser.contacts[idx].name;
      } else {
        currentUser.contacts.push({
          name: c.name || cleanPhone,
          phoneNumber: cleanPhone,
        });
      }
    }

    await currentUser.save();
    res.json({ message: 'Contacts synced successfully', total: currentUser.contacts.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    const filteredUser = filterUserPrivacy(user, currentUser);

    res.json(filteredUser);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, profilePicture, phoneNumber, privacySettings } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
    if (privacySettings !== undefined) {
      const currentUser = await User.findById(req.user._id);
      updateData.privacySettings = {
        ...(currentUser?.privacySettings ? currentUser.privacySettings.toObject() : {}),
        ...privacySettings,
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's blocked contacts list
// @route   GET /api/users/blocked
// @access  Private
const getBlockedUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('privacySettings.blockedContacts', 'name username profilePicture phoneNumber bio status lastSeen');
    const blocked = currentUser?.privacySettings?.blockedContacts || [];
    res.json(blocked);
  } catch (error) {
    next(error);
  }
};

// @desc    Block a user
// @route   POST /api/users/block/:id
// @access  Private
const blockUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.privacySettings) {
      currentUser.privacySettings = {};
    }
    if (!currentUser.privacySettings.blockedContacts) {
      currentUser.privacySettings.blockedContacts = [];
    }

    const alreadyBlocked = currentUser.privacySettings.blockedContacts.some(
      (id) => id.toString() === targetId.toString()
    );

    if (!alreadyBlocked) {
      currentUser.privacySettings.blockedContacts.push(targetId);
      await currentUser.save();
    }

    const updatedUser = await User.findById(req.user._id)
      .populate('privacySettings.blockedContacts', 'name username profilePicture phoneNumber bio status lastSeen');

    const io = req.app.get('io');
    if (io) {
      const payload = {
        blockerId: req.user._id.toString(),
        blockerName: currentUser.name,
        blockerUsername: currentUser.username,
        blockedId: targetId.toString(),
        timestamp: new Date(),
      };
      io.emit('userBlocked', payload);
      io.to(targetId.toString()).emit('userBlockedBy', payload);
      io.to(req.user._id.toString()).emit('userBlockedSuccess', payload);
      io.emit('peerBlockUpdate', { ...payload, action: 'block' });
      io.emit('adminBlockedUsersRefresh', { action: 'peer_block', ...payload });
    }

    res.json({
      message: 'User blocked successfully',
      blockedContacts: updatedUser.privacySettings?.blockedContacts || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a user
// @route   POST /api/users/unblock/:id
// @access  Private
const unblockUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.privacySettings?.blockedContacts) {
      currentUser.privacySettings.blockedContacts = currentUser.privacySettings.blockedContacts.filter(
        (id) => id.toString() !== targetId.toString()
      );
      await currentUser.save();
    }

    const updatedUser = await User.findById(req.user._id)
      .populate('privacySettings.blockedContacts', 'name username profilePicture phoneNumber bio status lastSeen');

    const io = req.app.get('io');
    if (io) {
      const payload = {
        unblockerId: req.user._id.toString(),
        unblockerName: currentUser.name,
        unblockerUsername: currentUser.username,
        unblockedId: targetId.toString(),
        timestamp: new Date(),
      };
      io.emit('userUnblocked', payload);
      io.to(targetId.toString()).emit('userUnblockedBy', payload);
      io.to(req.user._id.toString()).emit('userUnblockedSuccess', payload);
      io.emit('peerBlockUpdate', { ...payload, action: 'unblock' });
      io.emit('adminBlockedUsersRefresh', { action: 'peer_unblock', ...payload });
    }

    res.json({
      message: 'User unblocked successfully',
      blockedContacts: updatedUser.privacySettings?.blockedContacts || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact in phone contact list & target user details
// @route   PUT /api/users/contacts
// @access  Private
const updateContact = async (req, res, next) => {
  try {
    const { name, phoneNumber, username, targetUserId, oldPhoneNumber } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    const cleanNumber = phoneNumber.trim();
    const cleanName = name.trim();
    const cleanUsername = username ? username.trim().toLowerCase().replace(/^@/, '') : '';

    const currentUser = await User.findById(req.user._id);
    if (!currentUser.contacts) currentUser.contacts = [];

    // Check if target user's username is taken by someone else
    if (cleanUsername && targetUserId) {
      const existingUserWithUsername = await User.findOne({
        username: cleanUsername,
        _id: { $ne: targetUserId },
      });
      if (existingUserWithUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // 1. Update in currentUser.contacts
    let existingIndex = -1;
    if (oldPhoneNumber) {
      existingIndex = currentUser.contacts.findIndex((c) =>
        phonesMatch(c.phoneNumber, oldPhoneNumber)
      );
    }
    if (existingIndex === -1) {
      existingIndex = currentUser.contacts.findIndex((c) =>
        phonesMatch(c.phoneNumber, cleanNumber)
      );
    }

    if (existingIndex >= 0) {
      currentUser.contacts[existingIndex].name = cleanName;
      currentUser.contacts[existingIndex].phoneNumber = cleanNumber;
      if (cleanUsername) {
        currentUser.contacts[existingIndex].username = cleanUsername;
      }
    } else {
      currentUser.contacts.push({
        name: cleanName,
        phoneNumber: cleanNumber,
        username: cleanUsername,
      });
    }

    await currentUser.save();

    // 2. If targetUserId exists, update target user document
    let updatedTargetUser = null;
    if (targetUserId) {
      const updateFields = {
        name: cleanName,
        phoneNumber: cleanNumber,
      };
      if (cleanUsername) {
        updateFields.username = cleanUsername;
      }

      updatedTargetUser = await User.findByIdAndUpdate(
        targetUserId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select('-password');
    }

    res.json({
      message: 'Contact updated successfully',
      contact: {
        name: cleanName,
        phoneNumber: cleanNumber,
        username: cleanUsername,
      },
      updatedUser: updatedTargetUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user's E2EE public key
// @route   PUT /api/users/public-key
// @access  Private
const updatePublicKey = async (req, res, next) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ message: 'Public key is required' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { publicKey } },
      { new: true }
    ).select('-password');

    res.json({ success: true, publicKey: updated.publicKey });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's E2EE public key
// @route   GET /api/users/:id/public-key
// @access  Private
const getPublicKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('publicKey name username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      userId: user._id,
      name: user.name,
      publicKey: user.publicKey || '',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Account Security Settings (Two-step PIN, Security alerts)
// @route   PUT /api/users/security
// @access  Private
const updateAccountSecurity = async (req, res, next) => {
  try {
    const { twoStepVerification, securityNotifications } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (twoStepVerification !== undefined) {
      user.accountSecurity = user.accountSecurity || {};
      user.accountSecurity.twoStepVerification = {
        ...user.accountSecurity.twoStepVerification,
        ...twoStepVerification,
      };
    }

    if (securityNotifications !== undefined) {
      user.accountSecurity = user.accountSecurity || {};
      user.accountSecurity.securityNotifications = !!securityNotifications;
    }

    await user.save();
    res.json({ success: true, accountSecurity: user.accountSecurity });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Chats Preferences (Enter is send, font size, etc.)
// @route   PUT /api/users/chats-preferences
// @access  Private
const updateChatsPreferences = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.chatsPreferences = {
      ...(user.chatsPreferences || {}),
      ...updates,
    };
    user.markModified('chatsPreferences');

    await user.save();
    res.json({ success: true, chatsPreferences: user.chatsPreferences });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Notification Preferences
// @route   PUT /api/users/notification-preferences
// @access  Private
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.notificationPreferences = {
      ...(user.notificationPreferences || {}),
      ...updates,
    };

    await user.save();
    res.json({ success: true, notificationPreferences: user.notificationPreferences });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Account Data (WhatsApp style report)
// @route   GET /api/users/account-data
// @access  Private
const requestAccountData = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const conversations = await Conversation.find({ participants: req.user._id })
      .select('groupName isGroup createdAt updatedAt')
      .lean();

    const report = {
      appName: 'Batiyau Chat',
      exportDate: new Date().toISOString(),
      accountInfo: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      privacySettings: user.privacySettings,
      securitySettings: user.accountSecurity,
      preferences: {
        chats: user.chatsPreferences,
        notifications: user.notificationPreferences,
      },
      contactsCount: user.contacts?.length || 0,
      conversationsCount: conversations.length,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    };

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete My Account (Permanent account deletion)
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Remove user from all conversations
    await Conversation.updateMany(
      { participants: userId },
      { $pull: { participants: userId, admins: userId } }
    );

    // 2. Delete empty conversations
    await Conversation.deleteMany({ participants: { $size: 0 } });

    // 3. Delete user's messages or mark deleted
    await Message.updateMany(
      { sender: userId },
      { $set: { isDeleted: true, message: 'This message was deleted with account' } }
    );

    // 4. Delete user record
    await User.findByIdAndDelete(userId);

    const io = req.app.get('io');
    if (io) {
      io.emit('userDeleted', { userId });
    }

    res.json({ success: true, message: 'Account successfully deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all messages across all user's chats
// @route   POST /api/users/clear-all-chats
// @access  Private
const clearAllChats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userConvs = await Conversation.find({ participants: userId });
    const convIds = userConvs.map((c) => c._id);

    // Add userId to deletedFor array of all messages in these conversations
    await Message.updateMany(
      { conversation: { $in: convIds } },
      { $addToSet: { deletedFor: userId } }
    );

    res.json({ success: true, message: 'All chat messages cleared' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all conversations for user
// @route   POST /api/users/delete-all-chats
// @access  Private
const deleteAllChats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userConvs = await Conversation.find({ participants: userId });
    const convIds = userConvs.map((c) => c._id);

    // Clear all messages in user's conversations for this user
    await Message.updateMany(
      { conversation: { $in: convIds } },
      { $addToSet: { deletedFor: userId } }
    );

    // Remove user from all conversations (both 1-on-1 and groups)
    await Conversation.updateMany(
      { participants: userId },
      {
        $pull: {
          participants: userId,
          groupAdmins: userId,
        },
      }
    );

    // If user was primary groupAdmin, unset it
    await Conversation.updateMany(
      { groupAdmin: userId },
      { $unset: { groupAdmin: '' } }
    );

    // Delete orphan chats (conversations with 0 participants)
    await Conversation.deleteMany({ participants: { $size: 0 } });

    res.json({ success: true, message: 'All chats deleted' });
  } catch (error) {
    next(error);
  }
};

export {
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
};

