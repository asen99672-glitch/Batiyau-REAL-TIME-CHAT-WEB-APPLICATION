import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// Online users ka map: userId -> Set<socketId>
const userSockets = new Map();

const initializeSocket = (io) => {
  // Socket connection se pehle JWT verify karo
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user; // User info socket pe store karo
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    // Single-active socket per user (WhatsApp style: previous tab/window disconnects)
    const isFirstSocket = !userSockets.has(userId) || userSockets.get(userId).size === 0;
    if (userSockets.has(userId) && userSockets.get(userId).size > 0) {
      const existingSockets = userSockets.get(userId);
      for (const oldSocketId of existingSockets) {
        if (oldSocketId !== socket.id) {
          console.log(`⚠️ Emitting sessionConflict to previous socket ${oldSocketId} for user ${socket.user.username}`);
          io.to(oldSocketId).emit('sessionConflict', {
            message: 'Your account is open in another tab or window.',
          });
          const oldSocket = io.sockets.sockets.get(oldSocketId);
          if (oldSocket) {
            oldSocket.disconnect(true);
          }
        }
      }
      userSockets.set(userId, new Set([socket.id]));
    } else {
      userSockets.set(userId, new Set([socket.id]));
    }

    // Join personal user room & admin room
    socket.join(userId);
    if (['admin', 'superadmin', 'moderator', 'support_admin', 'security_admin'].includes(socket.user.role)) {
      socket.join('admin_channel');
    }

    if (isFirstSocket) {
      await User.findByIdAndUpdate(userId, { status: 'online' });
      io.emit('userOnline', { userId });
    }

    // Har connected client ko updated online users list bhejo
    io.emit('onlineUsers', Array.from(userSockets.keys()));

    socket.on('joinAdminChannel', () => {
      if (['admin', 'superadmin', 'moderator', 'support_admin', 'security_admin'].includes(socket.user.role)) {
        socket.join('admin_channel');
      }
    });

    // Client explicitly online users maang sakta hai
    socket.on('getOnlineUsers', () => {
      socket.emit('onlineUsers', Array.from(userSockets.keys()));
    });

    // Conversation join karna (room concept)
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`${socket.user.username} joined conversation: ${conversationId}`);
    });

    // Conversation leave karna
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // Real-time message send karna
    socket.on('sendMessage', async (messageData) => {
      const { conversationId } = messageData;
      // 1. Usi conversation ke active room members ko message bhejo
      socket.to(conversationId).emit('receiveMessage', messageData);

      // 2. Jo participants conversation room mein nahi hain, unhe direct unke socket pe bhejo
      // taaki chat list mein real-time unread count aur last message turant update ho
      try {
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv && conv.participants) {
          conv.participants.forEach((pId) => {
            const pIdStr = pId.toString();
            if (pIdStr !== userId) {
              const sockets = userSockets.get(pIdStr);
              if (sockets) {
                for (const sId of sockets) {
                  const room = io.sockets.adapter.rooms.get(conversationId);
                  if (!room || !room.has(sId)) {
                    io.to(sId).emit('receiveMessage', messageData);
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error broadcasting message to participants:', err);
      }
    });

    // Typing indicator - start (Broadcasts to room + all participants like WhatsApp)
    socket.on('typing', async ({ conversationId }) => {
      const payload = {
        userId,
        userName: socket.user.name || socket.user.username,
        conversationId,
      };

      // 1. Room members ko bhejo
      socket.to(conversationId).emit('typing', payload);

      // 2. Jo participants conversation room mein nahi hain, unhe bhi unke socket pe bhejo (Sidebar update)
      try {
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv && conv.participants) {
          conv.participants.forEach((pId) => {
            const pIdStr = pId.toString();
            if (pIdStr !== userId) {
              const sockets = userSockets.get(pIdStr);
              if (sockets) {
                for (const sId of sockets) {
                  const room = io.sockets.adapter.rooms.get(conversationId);
                  if (!room || !room.has(sId)) {
                    io.to(sId).emit('typing', payload);
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error broadcasting typing indicator:', err);
      }
    });

    // Typing indicator - stop
    socket.on('stopTyping', async ({ conversationId }) => {
      const payload = {
        userId,
        conversationId,
      };

      socket.to(conversationId).emit('stopTyping', payload);

      try {
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv && conv.participants) {
          conv.participants.forEach((pId) => {
            const pIdStr = pId.toString();
            if (pIdStr !== userId) {
              const sockets = userSockets.get(pIdStr);
              if (sockets) {
                for (const sId of sockets) {
                  const room = io.sockets.adapter.rooms.get(conversationId);
                  if (!room || !room.has(sId)) {
                    io.to(sId).emit('stopTyping', payload);
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error broadcasting stopTyping indicator:', err);
      }
    });

    // Message delivered
    socket.on('messageDelivered', ({ messageId, conversationId }) => {
      socket.to(conversationId).emit('messageDelivered', { messageId });
    });

    // Message read
    socket.on('messageRead', async ({ conversationId, readBy }) => {
      // WhatsApp privacy: If either participant in a 1-to-1 conversation has readReceipts turned off,
      // do not update DB or broadcast read receipt (remains grey double ticks)
      try {
        const conv = await Conversation.findById(conversationId).select('participants isGroup');
        if (conv && !conv.isGroup) {
          const readerUser = await User.findById(readBy || userId).select('privacySettings');
          const otherId = conv.participants.find((p) => p.toString() !== (readBy || userId).toString());
          const otherUser = otherId ? await User.findById(otherId).select('privacySettings') : null;

          if (readerUser?.privacySettings?.readReceipts === false || otherUser?.privacySettings?.readReceipts === false) {
            return;
          }
        }
      } catch (privacyErr) {
        console.error('Read receipt check error in socket:', privacyErr);
      }

      // 1. Database mein is conversation ke unread messages ko isRead: true mark karo
      try {
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: readBy || userId },
            isRead: false,
          },
          { isRead: true }
        );
      } catch (dbErr) {
        console.error('Error marking messages as read in DB via socket:', dbErr);
      }

      // 2. Room ke active members ko emit karo
      socket.to(conversationId).emit('messageRead', { conversationId, readBy });

      // 3. Jo participants conversation room se bahar hain, unhe bhi inform karo (Sidebar real-time update)
      try {
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv && conv.participants) {
          conv.participants.forEach((pId) => {
            const pIdStr = pId.toString();
            if (pIdStr !== userId) {
              const sockets = userSockets.get(pIdStr);
              if (sockets) {
                for (const sId of sockets) {
                  const room = io.sockets.adapter.rooms.get(conversationId);
                  if (!room || !room.has(sId)) {
                    io.to(sId).emit('messageRead', { conversationId, readBy });
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error broadcasting messageRead:', err);
      }
    });

    // Message reaction (WhatsApp style)
    socket.on('reactMessage', ({ conversationId, messageId, reactions }) => {
      socket.to(conversationId).emit('messageReaction', { messageId, reactions, conversationId });
    });

    // Delete message (WhatsApp style real-time deletion)
    socket.on('deleteMessage', ({ conversationId, messageId, deleteType }) => {
      socket.to(conversationId).emit('messageDeleted', { messageId, conversationId, deleteType });
    });

    // Bulk delete messages
    socket.on('bulkDeleteMessages', ({ conversationId, messageIds, deleteType }) => {
      socket.to(conversationId).emit('messagesBulkDeleted', { messageIds, conversationId, deleteType });
    });

    // Pin / unpin message
    socket.on('pinMessage', ({ conversationId, messageId, isPinned, pinnedAt }) => {
      socket.to(conversationId).emit('messagePinned', { messageId, conversationId, isPinned, pinnedAt });
    });

    // Clear conversation (WhatsApp style: personal clear for this user only)
    socket.on('clearConversation', ({ conversationId }) => {
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        for (const sockId of userSocketSet) {
          io.to(sockId).emit('conversationCleared', { conversationId });
        }
      }
    });

    // Clear all chats across all conversations for current user
    socket.on('clearAllChats', () => {
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        for (const sockId of userSocketSet) {
          io.to(sockId).emit('allChatsCleared');
        }
      }
    });

    // Delete all chats for current user
    socket.on('deleteAllChats', () => {
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        for (const sockId of userSocketSet) {
          io.to(sockId).emit('allChatsDeleted');
        }
      }
    });

    // WebRTC Call signaling events (Supports both 1-on-1 and Group calls)
    socket.on('callUser', async ({ userToCall, callerName, callerAvatar, callType, callId, offer, isGroup, groupId, groupName, groupImage, participants }) => {
      const fromId = userId.toString();

      if (isGroup) {
        // Group Call: Ring all other participants in the group
        let recipientIds = [];
        if (Array.isArray(participants) && participants.length > 0) {
          recipientIds = participants
            .map((p) => (p?._id || p)?.toString())
            .filter((pId) => pId && pId !== fromId);
        } else if (groupId || userToCall) {
          try {
            const conv = await Conversation.findById(groupId || userToCall).select('participants');
            if (conv && Array.isArray(conv.participants)) {
              recipientIds = conv.participants
                .map((p) => (p?._id || p)?.toString())
                .filter((pId) => pId && pId !== fromId);
            }
          } catch (e) {
            console.error('Failed to lookup group participants for call:', e);
          }
        }

        recipientIds.forEach((targetId) => {
          const receiverSocketSet = userSockets.get(targetId);
          if (receiverSocketSet && receiverSocketSet.size > 0) {
            for (const targetSocketId of receiverSocketSet) {
              io.to(targetSocketId).emit('incomingCall', {
                from: userId,
                callerName: callerName || socket.user.name,
                callerAvatar: callerAvatar || socket.user.profilePicture,
                callType: callType || 'audio',
                callId,
                offer,
                isGroup: true,
                groupId: groupId || userToCall,
                groupName: groupName || 'Group Call',
                groupImage: groupImage || '',
                participants: recipientIds,
              });
            }
          }
        });
      } else {
        // 1-on-1 Call: Check official channel & blocking
        try {
          const targetUserDoc = await User.findById(userToCall).select('privacySettings isOfficial username');
          if (targetUserDoc?.isOfficial || targetUserDoc?.username === 'batiyao') {
            socket.emit('callDeclined', { callId, reason: 'Calls are not supported for the official Batiyau channel' });
            return;
          }
          const currentUserDoc = await User.findById(userId).select('privacySettings');

          const isTargetBlockedByMe = (currentUserDoc?.privacySettings?.blockedContacts || []).some(
            (id) => id.toString() === userToCall.toString()
          );
          const isMeBlockedByTarget = (targetUserDoc?.privacySettings?.blockedContacts || []).some(
            (id) => id.toString() === userId.toString()
          );

          if (isTargetBlockedByMe || isMeBlockedByTarget) {
            socket.emit('callDeclined', { callId, reason: 'User is unavailable' });
            return;
          }
        } catch (callErr) {
          console.error('Call blocking check error:', callErr);
        }

        const receiverSocketSet = userSockets.get(userToCall);
        if (receiverSocketSet && receiverSocketSet.size > 0) {
          for (const targetSocketId of receiverSocketSet) {
            io.to(targetSocketId).emit('incomingCall', {
              from: userId,
              callerName: callerName || socket.user.name,
              callerAvatar: callerAvatar || socket.user.profilePicture,
              callType: callType || 'audio',
              callId,
              offer,
              isGroup: false,
            });
          }
        }
      }
    });

    socket.on('answerCall', ({ to, callId, answer, isGroup, groupId, fromUser }) => {
      const callerSocketSet = userSockets.get(to);
      if (callerSocketSet && callerSocketSet.size > 0) {
        for (const targetSocketId of callerSocketSet) {
          io.to(targetSocketId).emit('callAccepted', {
            callId,
            from: userId,
            answer,
            isGroup: !!isGroup,
            groupId,
            fromUser: fromUser || {
              _id: userId,
              name: socket.user.name,
              profilePicture: socket.user.profilePicture,
            },
          });
        }
      }
    });

    socket.on('iceCandidate', ({ to, candidate, isGroup, groupId }) => {
      const targetSocketSet = userSockets.get(to);
      if (targetSocketSet && targetSocketSet.size > 0) {
        for (const targetSocketId of targetSocketSet) {
          io.to(targetSocketId).emit('iceCandidate', {
            candidate,
            from: userId,
            isGroup: !!isGroup,
            groupId,
          });
        }
      }
    });

    socket.on('rejectCall', ({ to, callId, isGroup, groupId }) => {
      const callerSocketSet = userSockets.get(to);
      if (callerSocketSet && callerSocketSet.size > 0) {
        for (const targetSocketId of callerSocketSet) {
          io.to(targetSocketId).emit('callRejected', {
            callId,
            from: userId,
            isGroup: !!isGroup,
            groupId,
          });
        }
      }
    });

    socket.on('endCall', async ({ to, callId, isGroup, groupId, participants }) => {
      if (isGroup) {
        let recipientIds = [];
        if (Array.isArray(participants) && participants.length > 0) {
          recipientIds = participants
            .map((p) => (p?._id || p)?.toString())
            .filter((pId) => pId && pId !== userId.toString());
        } else if (groupId) {
          try {
            const conv = await Conversation.findById(groupId).select('participants');
            if (conv && Array.isArray(conv.participants)) {
              recipientIds = conv.participants
                .map((p) => (p?._id || p)?.toString())
                .filter((pId) => pId && pId !== userId.toString());
            }
          } catch (e) {
            console.error('Failed to lookup group participants for endCall:', e);
          }
        }

        if (to && !recipientIds.includes(to.toString())) {
          recipientIds.push(to.toString());
        }

        recipientIds.forEach((targetId) => {
          const targetSocketSet = userSockets.get(targetId);
          if (targetSocketSet && targetSocketSet.size > 0) {
            for (const targetSocketId of targetSocketSet) {
              io.to(targetSocketId).emit('callEnded', { callId, isGroup: true, groupId });
            }
          }
        });
      } else {
        const targetSocketSet = userSockets.get(to);
        if (targetSocketSet && targetSocketSet.size > 0) {
          for (const targetSocketId of targetSocketSet) {
            io.to(targetSocketId).emit('callEnded', { callId, isGroup: false });
          }
        }
      }
    });

    // Group create event
    socket.on('createGroup', (groupData) => {
      groupData.participants.forEach((participantId) => {
        const participantSockets = userSockets.get(participantId);
        if (participantSockets) {
          for (const sId of participantSockets) {
            io.to(sId).emit('userAddedToGroup', groupData);
          }
        }
      });
    });

    // Status socket events
    socket.on('sendNewStatus', (statusData) => {
      io.emit('newStatus', statusData);
    });

    socket.on('viewStatus', (data) => {
      io.emit('statusViewed', data);
    });

    socket.on('deleteStatus', (data) => {
      io.emit('statusDeleted', data);
    });

    // Community socket events
    socket.on('newCommunity', (communityData) => {
      io.emit('communityCreated', communityData);
    });

    socket.on('updateCommunity', (communityData) => {
      io.emit('communityUpdated', communityData);
    });

    // Disconnect hone par
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username} (${socket.id})`);

      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);

          // Database mein offline mark karo + lastSeen update karo
          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: Date.now(),
          });

          // Sab users ko updated online list bhejo
          io.emit('onlineUsers', Array.from(userSockets.keys()));
          io.emit('userOffline', { userId, lastSeen: Date.now() });
        }
      }
    });
  });
};

// Kisi specific user ka first socketId nikalna
const getSocketId = (userId) => {
  const sockets = userSockets.get(userId);
  if (sockets && sockets.size > 0) {
    return Array.from(sockets)[0];
  }
  return null;
};

// Kisi user ke sabhi active sockets par event emit karna
const emitToUser = (io, userId, event, data) => {
  if (!io || !userId) return;
  const targetId = userId.toString();
  const sockets = userSockets.get(targetId);
  if (sockets && sockets.size > 0) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
};

export { initializeSocket, getSocketId, emitToUser, userSockets as onlineUsers };

