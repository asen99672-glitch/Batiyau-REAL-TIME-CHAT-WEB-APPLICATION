import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify karo user conversation ka part hai
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [req.user._id] },
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name username profilePicture')
      .populate('reactions.user', 'name username profilePicture')
      .populate({
        path: 'replyTo',
        select: 'message messageType attachments sender isDeleted',
        populate: {
          path: 'sender',
          select: 'name username profilePicture',
        },
      })
      .sort({ createdAt: 1 }); // Purani messages pehle

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const {
      conversationId,
      message,
      messageType,
      receiver,
      attachments,
      replyTo,
      isEncrypted,
      iv,
    } = req.body;

    if (!conversationId || (!message && messageType === 'text' && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check privacy & blocking in 1-on-1 chat
    if (!conversation.isGroup) {
      const otherParticipantId = conversation.participants.find(
        (p) => p.toString() !== req.user._id.toString()
      ) || receiver;

      if (otherParticipantId) {
        const currentUser = await User.findById(req.user._id);
        const otherUser = await User.findById(otherParticipantId);

        // 1. Did current user block target?
        const myBlocked = (currentUser?.privacySettings?.blockedContacts || []).map((id) => id.toString());
        if (myBlocked.includes(otherParticipantId.toString())) {
          return res.status(403).json({ message: 'You have blocked this contact. Unblock to send messages.' });
        }

        // 2. Did target block current user?
        const theirBlocked = (otherUser?.privacySettings?.blockedContacts || []).map((id) => id.toString());
        if (theirBlocked.includes(req.user._id.toString())) {
          return res.status(403).json({ message: 'Message could not be delivered.' });
        }

        // 3. Block unknown account messages check
        if (otherUser?.privacySettings?.blockUnknownMessages) {
          const isSenderInContacts = (otherUser.contacts || []).some(
            (c) =>
              c.phoneNumber &&
              currentUser?.phoneNumber &&
              c.phoneNumber.replace(/\D/g, '').slice(-10) === currentUser.phoneNumber.replace(/\D/g, '').slice(-10)
          );
          if (!isSenderInContacts) {
            return res.status(403).json({ message: 'This user only receives messages from saved contacts.' });
          }
        }
      }
    }

    // Naya message create karo (preserve E2EE flags and IV)
    let newMessage = await Message.create({
      sender: req.user._id,
      receiver,
      conversation: conversationId,
      message: message || '',
      isEncrypted: !!isEncrypted,
      iv: iv || '',
      messageType: messageType || 'text',
      attachments: attachments || [],
      replyTo: replyTo || undefined,
    });

    // Message ko sender info, reactions, aur replyTo ke saath populate karo
    newMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name username profilePicture')
      .populate('reactions.user', 'name username profilePicture')
      .populate({
        path: 'replyTo',
        select: 'message messageType attachments sender isDeleted',
        populate: {
          path: 'sender',
          select: 'name username profilePicture',
        },
      });

    // Conversation ka lastMessage update karo
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
      lastMessageAt: Date.now(),
    });

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    let shouldMarkRead = true;
    if (!conversation.isGroup) {
      const currentUser = await User.findById(req.user._id);
      const otherParticipantId = conversation.participants.find(
        (p) => p.toString() !== req.user._id.toString()
      );
      const otherUser = otherParticipantId ? await User.findById(otherParticipantId) : null;

      // WhatsApp rule: In direct 1-to-1 chats, if either participant has disabled read receipts, do not turn blue ticks on
      if (currentUser?.privacySettings?.readReceipts === false || otherUser?.privacySettings?.readReceipts === false) {
        shouldMarkRead = false;
      }
    }

    if (shouldMarkRead) {
      await Message.updateMany(
        {
          conversation: req.params.id,
          sender: { $ne: req.user._id }, // Apne messages nahi, dusre ke
          isRead: false,
        },
        { isRead: true }
      );
    }

    res.json({ message: shouldMarkRead ? 'Messages marked as read' : 'Read receipts off (ticks remain grey)' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message (for everyone or for me)
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const { deleteType = 'everyone' } = req.body || {};
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const isSender = message.sender.toString() === req.user._id.toString();

    if (deleteType === 'everyone') {
      if (!isSender) {
        return res.status(403).json({ message: 'Only sender can delete for everyone' });
      }
      message.isDeleted = true;
      message.message = 'This message was deleted';
      message.attachments = [];
      await message.save();

      return res.json({
        success: true,
        message: 'Message deleted for everyone',
        messageId: message._id,
        conversationId: message.conversation,
        deleteType: 'everyone',
        isDeleted: true,
      });
    } else {
      // Delete for me
      if (!message.deletedFor) message.deletedFor = [];
      const userIdStr = req.user._id.toString();
      if (!message.deletedFor.some((id) => id.toString() === userIdStr)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }

      return res.json({
        success: true,
        message: 'Message deleted for you',
        messageId: message._id,
        conversationId: message.conversation,
        deleteType: 'me',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete messages
// @route   POST /api/messages/bulk-delete
// @access  Private
const bulkDeleteMessages = async (req, res, next) => {
  try {
    const { messageIds, deleteType = 'me' } = req.body || {};
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'No messages selected for deletion' });
    }

    if (deleteType === 'everyone') {
      // Only delete for everyone messages where sender is current user
      const messages = await Message.find({
        _id: { $in: messageIds },
        sender: req.user._id,
      });

      const allowedIds = messages.map((m) => m._id);
      if (allowedIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: allowedIds } },
          { isDeleted: true, message: 'This message was deleted', attachments: [] }
        );
      }

      return res.json({
        success: true,
        deletedIds: allowedIds,
        deleteType: 'everyone',
      });
    } else {
      // Delete for me (applies to ANY message, including already deleted ones)
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { deletedFor: req.user._id } }
      );

      return res.json({
        success: true,
        deletedIds: messageIds,
        deleteType: 'me',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all messages as read across all user conversations
// @route   PUT /api/messages/mark-all/read
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    const userConvs = await Conversation.find({
      participants: req.user._id,
    }).select('_id');
    const convIds = userConvs.map((c) => c._id);

    await Message.updateMany(
      {
        conversation: { $in: convIds },
        sender: { $ne: req.user._id },
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle star on message
// @route   PUT /api/messages/:id/star
// @access  Private
const toggleStarMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const userIdStr = req.user._id.toString();
    const isStarred =
      Array.isArray(message.starredBy) &&
      message.starredBy.some((id) => id.toString() === userIdStr);

    if (isStarred) {
      message.starredBy = message.starredBy.filter(
        (id) => id.toString() !== userIdStr
      );
    } else {
      if (!message.starredBy) message.starredBy = [];
      message.starredBy.push(req.user._id);
    }

    await message.save();

    res.json({
      isStarred: !isStarred,
      messageId: message._id,
      starredBy: message.starredBy,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all starred messages for current user
// @route   GET /api/messages/starred/all
// @access  Private
const getStarredMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      starredBy: req.user._id,
      isDeleted: false,
    })
      .populate('sender', 'name username profilePicture')
      .populate({
        path: 'conversation',
        select: 'groupName isGroup participants',
        populate: {
          path: 'participants',
          select: 'name username profilePicture',
        },
      })
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Add or toggle reaction on message
// @route   PUT /api/messages/:id/react
// @access  Private
const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const userIdStr = req.user._id.toString();
    if (!message.reactions) message.reactions = [];

    const existingIndex = message.reactions.findIndex(
      (r) => (r.user?._id || r.user)?.toString() === userIdStr
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Same emoji clicked again -> remove reaction (toggle off)
        message.reactions.splice(existingIndex, 1);
      } else {
        // Changed reaction emoji
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username profilePicture')
      .populate('reactions.user', 'name username profilePicture');

    res.json(updatedMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload file/media
// @route   POST /api/messages/upload
// @access  Private
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear messages in a conversation
// @route   DELETE /api/messages/conversation/:conversationId/clear
// @access  Private
const clearChat = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    // Clear all messages for current user by adding to deletedFor
    await Message.updateMany(
      { conversation: conversationId },
      { $addToSet: { deletedFor: req.user._id } }
    );
    res.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin on message
// @route   PUT /api/messages/:id/pin
// @access  Private
const togglePinMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const newPinStatus = !message.isPinned;
    message.isPinned = newPinStatus;
    message.pinnedAt = newPinStatus ? new Date() : null;
    message.pinnedBy = newPinStatus ? req.user._id : null;
    await message.save();

    res.json({
      messageId: message._id,
      conversationId: message.conversation,
      isPinned: message.isPinned,
      pinnedAt: message.pinnedAt,
      pinnedBy: message.pinnedBy,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a message to admins (creates Report entry + real-time socket notification)
// @route   POST /api/messages/:id/report
// @access  Private
const reportMessage = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const { category = 'other', reason, severity = 'medium' } = req.body;

    const message = await Message.findById(messageId).populate('sender', 'name username profilePicture');
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Prevent self-report
    if (message.sender._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report your own message' });
    }

    const Report = (await import('../models/Report.js')).default;

    // Avoid duplicate pending reports by same user
    const existing = await Report.findOne({
      message: messageId,
      reportedBy: req.user._id,
      status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'You have already reported this message' });
    }

    // Mark message itself as reported
    if (!message.reportedBy) message.reportedBy = [];
    const userIdStr = req.user._id.toString();
    if (!message.reportedBy.some((id) => id.toString() === userIdStr)) {
      message.reportedBy.push(req.user._id);
      message.isReported = true;
      await message.save();
    }

    const newReport = await Report.create({
      reportedUser: message.sender._id,
      reportedBy: req.user._id,
      reportType: 'message',
      category,
      reason: reason || 'Reported message for moderation review',
      message: messageId,
      severity,
    });

    const populatedReport = await Report.findById(newReport._id)
      .populate('reportedUser', 'name username profilePicture phoneNumber createdAt isBanned')
      .populate('reportedBy', 'name username profilePicture')
      .populate('message', 'content messageType attachments sender createdAt');

    // Real-time: push to ALL connected admins instantly
    const io = req.app.get('io');
    if (io) {
      io.emit('adminReportCreated', populatedReport);
    }

    res.status(201).json({ success: true, report: populatedReport });
  } catch (error) {
    next(error);
  }
};

// @desc    Forward message to multiple conversations
// @route   POST /api/messages/forward
// @access  Private
const forwardMessage = async (req, res, next) => {
  try {
    const { messageId, conversationIds } = req.body;
    if (!messageId || !conversationIds || !conversationIds.length) {
      return res.status(400).json({ message: 'messageId and conversationIds are required' });
    }

    const originalMsg = await Message.findById(messageId);
    if (!originalMsg) {
      return res.status(404).json({ message: 'Original message not found' });
    }

    const forwardedMessages = [];

    for (const convId of conversationIds) {
      let fwdMsg = await Message.create({
        sender: req.user._id,
        conversation: convId,
        message: originalMsg.message,
        messageType: originalMsg.messageType,
        attachments: originalMsg.attachments,
      });

      fwdMsg = await Message.findById(fwdMsg._id)
        .populate('sender', 'name username profilePicture')
        .populate('reactions.user', 'name username profilePicture');

      await Conversation.findByIdAndUpdate(convId, {
        lastMessage: fwdMsg._id,
        lastMessageAt: Date.now(),
      });

      forwardedMessages.push(fwdMsg);
    }

    res.status(201).json({ success: true, forwardedMessages });
  } catch (error) {
    next(error);
  }
};

export {
  getMessages,
  sendMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  bulkDeleteMessages,
  toggleStarMessage,
  getStarredMessages,
  reactToMessage,
  uploadFile,
  clearChat,
  togglePinMessage,
  reportMessage,
  forwardMessage,
};

