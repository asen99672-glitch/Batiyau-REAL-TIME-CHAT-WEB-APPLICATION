import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socket';
import api from '../services/api';
import {
  getOrInitUserKeys,
  deriveSharedAesKey,
} from '../utils/crypto';
import { playAnnouncementSound } from '../utils/soundEffects';

const ChatContext = createContext(null);

// Google STUN servers for WebRTC NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const ChatProvider = ({ children }) => {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [calls, setCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null); // { otherUser, type, status, duration, isIncoming, offer, callId }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Search state in chat
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  // Quoted reply state (WhatsApp style)
  const [replyingTo, setReplyingTo] = useState(null);

  // Message Multi-Select state (WhatsApp style)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  // Contact info right panel state (WhatsApp style)
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Status (Stories) state (WhatsApp style)
  const [myStatuses, setMyStatuses] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [viewedUpdates, setViewedUpdates] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(false);

  // Communities state (WhatsApp style)
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);

  // Global sidebar navigation state & modals accessible from empty chat state
  const [sidebarNavTab, setSidebarNavTab] = useState('chats');
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showCreateStatusModalGlobal, setShowCreateStatusModalGlobal] = useState(false);
  const [showNewCommunityModalGlobal, setShowNewCommunityModalGlobal] = useState(false);
  const [systemAnnouncement, setSystemAnnouncement] = useState(null);

  // Clear message selection on conversation switch
  useEffect(() => {
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  }, [activeConversation?._id]);

  // Archived chats state
  const [archivedChatIds, setArchivedChatIds] = useState(() => {
    try {
      const saved = localStorage.getItem('chatapp_archived_chats');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleArchiveConversation = useCallback((convId) => {
    if (!convId) return;
    setArchivedChatIds((prev) => {
      const convIdStr = convId.toString();
      const exists = prev.some((id) => id?.toString() === convIdStr);
      const next = exists
        ? prev.filter((id) => id?.toString() !== convIdStr)
        : [...prev, convIdStr];
      try {
        localStorage.setItem('chatapp_archived_chats', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // End-to-End Encryption (E2EE) ECDH + AES-GCM Key Pair State
  const [userKeyPair, setUserKeyPair] = useState(null);

  useEffect(() => {
    if (!user?._id) return;
    let isCancelled = false;
    const initE2EE = async () => {
      try {
        const keys = await getOrInitUserKeys(user._id);
        if (!isCancelled) setUserKeyPair(keys);
        if (user.publicKey !== keys?.publicKeyJWK && keys?.publicKeyJWK) {
          await api.put('/users/public-key', { publicKey: keys.publicKeyJWK });
          if (updateUser) {
            updateUser({ ...user, publicKey: keys.publicKeyJWK });
          }
        }
      } catch (err) {
        console.warn('E2EE key initialization error:', err);
      }
    };
    initE2EE();
    return () => {
      isCancelled = true;
    };
  }, [user?._id]);


  // Global Toast state
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success', icon = '') => {
    setToast({ message, type, icon });
  }, []);

  const blockedUsers = useMemo(() => {
    return (user?.privacySettings?.blockedContacts || []).map((id) => (id?._id || id)?.toString());
  }, [user?.privacySettings?.blockedContacts]);

  const isUserBlocked = useCallback(
    (targetUserId) => {
      if (!targetUserId) return false;
      return blockedUsers.includes(targetUserId.toString());
    },
    [blockedUsers]
  );

  const blockUser = useCallback(
    async (targetUserId) => {
      try {
        const { data } = await api.post(`/users/block/${targetUserId}`);
        if (updateUser) {
          updateUser({
            ...user,
            privacySettings: {
              ...(user.privacySettings || {}),
              blockedContacts: data.blockedContacts,
            },
          });
        }
        showToast('Contact blocked', 'info', '🛡️');
      } catch (err) {
        console.error('Failed to block user:', err);
        showToast(err.response?.data?.message || 'Failed to block contact', 'error');
      }
    },
    [user, updateUser, showToast]
  );

  const unblockUser = useCallback(
    async (targetUserId) => {
      try {
        const { data } = await api.post(`/users/unblock/${targetUserId}`);
        if (updateUser) {
          updateUser({
            ...user,
            privacySettings: {
              ...(user.privacySettings || {}),
              blockedContacts: data.blockedContacts,
            },
          });
        }
        showToast('Contact unblocked', 'success', '✓');
      } catch (err) {
        console.error('Failed to unblock user:', err);
        showToast(err.response?.data?.message || 'Failed to unblock contact', 'error');
      }
    },
    [user, updateUser, showToast]
  );

  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutsRef = useRef({});
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [callsLoading, setCallsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // WebRTC Refs
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const candidateQueueRef = useRef([]);
  const connectedPeerIdRef = useRef(null);

  // Active conversation ref for event handlers
  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Cleanup WebRTC hardware media streams and peer connection
  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    candidateQueueRef.current = [];
    connectedPeerIdRef.current = null;
  }, []);

  // Conversations fetch karo
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await api.get('/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Sare users list fetch karo
  const fetchAllUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    setUsersLoading(true);
    try {
      const { data } = await api.get('/users');
      setAllUsers(data);
    } catch (error) {
      console.error('Failed to fetch all users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [isAuthenticated]);

  // Call history fetch karo
  const fetchCalls = useCallback(async () => {
    if (!isAuthenticated) return;
    setCallsLoading(true);
    try {
      const { data } = await api.get('/api/calls');
      setCalls(data);
    } catch (error) {
      try {
        const { data } = await api.get('/calls');
        setCalls(data);
      } catch (e) {
        console.error('Failed to fetch calls:', e);
      }
    } finally {
      setCallsLoading(false);
    }
  }, [isAuthenticated]);

  // Call history clear karo
  const clearCalls = useCallback(async () => {
    try {
      await api.delete('/calls');
      setCalls([]);
    } catch (error) {
      console.error('Failed to clear calls:', error);
    }
  }, []);

  // Call log record create karo
  const logCall = useCallback(
    async ({ callerId, receiverId, type, status, duration }) => {
      try {
        const { data } = await api.post('/calls', {
          callerId,
          receiverId,
          type,
          status,
          duration,
        });
        setCalls((prev) => {
          if (prev.some((c) => c._id === data._id)) return prev;
          return [data, ...prev];
        });
        return data;
      } catch (error) {
        console.error('Failed to log call:', error);
      }
    },
    []
  );

  // Helper: Create RTCPeerConnection and bind event handlers
  const createPeerConnection = useCallback((targetUserId, isGroup = false, groupId = null) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const config = user?.privacySettings?.protectIpInCalls
      ? { ...ICE_SERVERS, iceTransportPolicy: 'relay' }
      : ICE_SERVERS;
    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        if (socket) {
          const to = connectedPeerIdRef.current || targetUserId;
          if (to) {
            socket.emit('iceCandidate', {
              to,
              candidate: event.candidate,
              isGroup: !!isGroup,
              groupId: isGroup ? (groupId || targetUserId) : null,
            });
          }
        }
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    return pc;
  }, []);

  // Start a Call with WebRTC (Audio or Video - supports 1-on-1 and Groups)
  const startCall = useCallback(
    async (targetUser, callType = 'audio') => {
      if (!targetUser) return;
      const isGroup = !!targetUser.isGroup;

      const isBatiyaoOfficial =
        !isGroup &&
        (targetUser.isOfficial ||
          targetUser.username === 'batiyao' ||
          targetUser.email === 'official@batiyao.com' ||
          (targetUser.name && targetUser.name.toLowerCase() === 'batiyao'));

      if (isBatiyaoOfficial) {
        showToast('Voice and video calls are not available for the official Batiyau channel.', 'info', '🛡️');
        return;
      }

      if (!isGroup && targetUser._id && isUserBlocked(targetUser._id)) {
        showToast('You blocked this contact. Unblock to start a call.', 'error', '⊘');
        return;
      }
      cleanupMedia();

      const isVideo = callType === 'video';
      const callId = Date.now().toString();
      const groupId = isGroup ? targetUser._id : null;
      connectedPeerIdRef.current = null;

      setActiveCall({
        otherUser: {
          ...targetUser,
          name: targetUser.name || targetUser.groupName || 'Group Call',
          displayName: targetUser.name || targetUser.groupName || 'Group Call',
          profilePicture: targetUser.profilePicture || targetUser.groupImage || '',
          isGroup,
          groupId,
          participants: targetUser.participants || [],
        },
        type: callType,
        status: 'calling', // 'calling' | 'connected' | 'ended'
        isIncoming: false,
        startTime: Date.now(),
        callId,
      });

      try {
        // Request camera and microphone access
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          });
        } catch (mediaErr) {
          if (isVideo) {
            // Video camera fail hone par audio-only try karo
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } else {
            throw mediaErr;
          }
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Initialize WebRTC Peer Connection
        const pc = createPeerConnection(targetUser._id, isGroup, groupId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Create WebRTC Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send Offer via Socket.IO
        const socket = getSocket();
        if (socket) {
          socket.emit('callUser', {
            userToCall: targetUser._id,
            callerName: user?.name,
            callerAvatar: user?.profilePicture,
            callType,
            callId,
            offer,
            isGroup,
            groupId,
            groupName: targetUser.name || targetUser.groupName || 'Group Call',
            groupImage: targetUser.profilePicture || targetUser.groupImage || '',
            participants: targetUser.participants || [],
          });
        }
      } catch (err) {
        console.error('Failed to access camera/mic or create offer:', err);
        cleanupMedia();
        setActiveCall(null);
        alert('Camera / Microphone permission is required to start a call.');
      }
    },
    [user, cleanupMedia, createPeerConnection, isUserBlocked, showToast]
  );

  // Answer incoming call with WebRTC
  const answerCall = useCallback(async () => {
    if (!activeCall || !activeCall.offer) return;
    const isVideo = activeCall.type === 'video';
    const isGroup = !!activeCall.otherUser?.isGroup;
    const targetPeerId = activeCall.otherUser?.callerId || activeCall.otherUser?._id;
    connectedPeerIdRef.current = targetPeerId;

    setActiveCall((prev) => ({
      ...prev,
      status: 'connected',
      connectedAt: Date.now(),
    }));

    try {
      // Get user camera and microphone stream
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
      } catch (mediaErr) {
        if (isVideo) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } else {
          throw mediaErr;
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create Peer Connection
      const pc = createPeerConnection(targetPeerId, isGroup, activeCall.otherUser?.groupId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Set caller's remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(activeCall.offer));

      // Process any queued ICE candidates received before answer
      while (candidateQueueRef.current.length > 0) {
        const cand = candidateQueueRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.error('Error adding queued ICE candidate:', e);
        }
      }

      // Create WebRTC Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send Answer via Socket.IO
      const socket = getSocket();
      if (socket && targetPeerId) {
        socket.emit('answerCall', {
          to: targetPeerId,
          callId: activeCall.callId,
          answer,
          isGroup,
          groupId: activeCall.otherUser?.groupId,
          fromUser: {
            _id: user?._id,
            name: user?.name,
            profilePicture: user?.profilePicture,
          },
        });
      }
    } catch (err) {
      console.error('Failed to answer call with WebRTC:', err);
      cleanupMedia();
      setActiveCall(null);
      alert('Camera / Microphone access failed.');
    }
  }, [activeCall, user, cleanupMedia, createPeerConnection]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!activeCall) return;
    const socket = getSocket();
    const isGroup = !!activeCall.otherUser?.isGroup;
    const targetPeerId = activeCall.otherUser?.callerId || activeCall.otherUser?._id;
    if (socket && targetPeerId) {
      socket.emit('rejectCall', {
        to: targetPeerId,
        callId: activeCall.callId,
        isGroup,
        groupId: activeCall.otherUser?.groupId,
      });
    }

    if (!isGroup && targetPeerId) {
      logCall({
        callerId: targetPeerId,
        receiverId: user?._id,
        type: activeCall.type || 'audio',
        status: 'declined',
        duration: 0,
      });
    }

    cleanupMedia();
    setActiveCall(null);
  }, [activeCall, logCall, user, cleanupMedia]);

  // End call
  const endCall = useCallback(() => {
    if (!activeCall) return;
    const isGroup = !!activeCall.otherUser?.isGroup;
    const duration = activeCall.connectedAt
      ? Math.round((Date.now() - activeCall.connectedAt) / 1000)
      : 0;

    const socket = getSocket();
    const targetPeerId = connectedPeerIdRef.current || activeCall.otherUser?.callerId || activeCall.otherUser?._id;
    if (socket) {
      socket.emit('endCall', {
        to: targetPeerId,
        callId: activeCall.callId,
        isGroup,
        groupId: activeCall.otherUser?.groupId || (isGroup ? activeCall.otherUser?._id : null),
        participants: activeCall.otherUser?.participants,
      });
    }

    // Call history log save karo
    const isConnected = activeCall.status === 'connected';
    const isIncoming = !!activeCall.isIncoming;

    if (!isGroup && targetPeerId) {
      const callerId = isIncoming ? targetPeerId : user?._id;
      const receiverId = isIncoming ? user?._id : targetPeerId;
      const status = isConnected ? 'completed' : (isIncoming ? 'declined' : 'missed');

      logCall({
        callerId,
        receiverId,
        type: activeCall.type || 'audio',
        status,
        duration,
      });
    }

    cleanupMedia();
    setActiveCall(null);
  }, [activeCall, logCall, user, cleanupMedia]);

  // 1-minute (60 seconds) call timeout: auto end/cancel if not answered in 60 seconds
  useEffect(() => {
    if (!activeCall || activeCall.status === 'connected' || activeCall.status === 'ended') {
      return;
    }

    const timer = setTimeout(() => {
      console.log('⏱️ [CALL TIMEOUT] 1 minute elapsed without answer. Auto-ending call.');
      showToast('Call timed out (1 min unanswered)', 'info', '⏱️');
      if (activeCall.isIncoming) {
        rejectCall();
      } else {
        endCall();
      }
    }, 60000); // 60 seconds = 1 minute

    return () => clearTimeout(timer);
  }, [activeCall?.callId, activeCall?.status, activeCall?.isIncoming, endCall, rejectCall, showToast]);

  // Toggle Microphone Mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle Camera On/Off
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Messages fetch karo for active conversation (plain text, no client-side decryption needed)
  const fetchMessages = useCallback(
    async (conversationId, convObj) => {
      setMessagesLoading(true);
      try {
        const { data } = await api.get(`/messages/${conversationId}`);
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    },
    []
  );

  // Conversation select karna
  const selectConversation = useCallback(
    async (conversation) => {
      if (!conversation) {
        setActiveConversation(null);
        activeConversationRef.current = null;
        setMessages([]);
        setReplyingTo(null);
        setIsSelectMode(false);
        setSelectedMessageIds([]);
        return;
      }
      setActiveConversation(conversation);
      activeConversationRef.current = conversation;
      setReplyingTo(null);

      // Unread count ko turant 0 karo taaki badge gayab ho jaye
      setConversations((prev) =>
        prev.map((c) =>
          c._id?.toString() === conversation._id?.toString()
            ? { ...c, unreadCount: 0 }
            : c
        )
      );

      await fetchMessages(conversation._id, conversation);

      const socket = getSocket();
      if (socket) {
        socket.emit('joinConversation', conversation._id);
        socket.emit('messageRead', { conversationId: conversation._id, readBy: user?._id });
      }

      try {
        await api.put(`/messages/${conversation._id}/read`);
      } catch (error) {
        // Ignore
      }
    },
    [fetchMessages, user]
  );

  // Close active conversation completely
  const closeChat = useCallback(() => {
    selectConversation(null);
    setShowContactInfo(false);
  }, [selectConversation]);

  // New message send karna with WhatsApp E2EE (ECDH + AES-GCM)
  const sendMessage = useCallback(
    async (messageData) => {
      if (!activeConversation) return;

      // Check if contact is blocked
      if (!activeConversation.isGroup && activeConversation.participants) {
        const otherParticipant = activeConversation.participants.find(
          (p) => (p?._id || p)?.toString() !== user?._id?.toString()
        );
        const otherId = (otherParticipant?._id || otherParticipant)?.toString();
        if (otherId && isUserBlocked(otherId)) {
          showToast('You blocked this contact. Unblock to send messages.', 'error', '⊘');
          return;
        }
      }

      try {
        let payload = {
          conversationId: activeConversation._id,
          replyTo: replyingTo?._id,
          ...messageData,
          isEncrypted: false,
          iv: '',
        };

        // Messages are sent as plain text — HTTPS provides transport security.
        // No client-side E2EE encryption to avoid key-loss causing unreadable messages.

        const { data } = await api.post('/messages', payload);

        setMessages((prev) => [...prev, data]);
        setReplyingTo(null);

        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? { ...c, lastMessage: data, lastMessageAt: data.createdAt }
              : c
          )
        );

        const socket = getSocket();
        if (socket) {
          socket.emit('sendMessage', {
            ...data,
            conversationId: activeConversation._id,
          });
        }

        return data;
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    },
    [activeConversation, replyingTo, user?._id, isUserBlocked, showToast]
  );

  // Typing indicators
  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit('typing', {
        conversationId: activeConversation._id,
        userId: user._id,
      });
    }
  }, [activeConversation, user]);

  const emitStopTyping = useCallback(() => {
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit('stopTyping', {
        conversationId: activeConversation._id,
        userId: user._id,
      });
    }
  }, [activeConversation, user]);

  // Start private conversation
  const startConversation = useCallback(async (userId) => {
    try {
      const { data } = await api.post('/conversations', { userId });
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === data._id);
        if (!exists) return [data, ...prev];
        return prev;
      });
      return data;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }, []);

  // Create group conversation
  const createGroup = useCallback(async (groupName, participants, groupImage = '') => {
    try {
      const { data } = await api.post('/conversations/group', {
        groupName,
        participants,
        groupImage,
      });
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === data._id);
        if (!exists) return [data, ...prev];
        return prev;
      });
      return data;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }, []);

  // Open 1-on-1 private chat with a user
  const startDirectConversation = useCallback(
    async (targetUserId) => {
      try {
        const conv = await startConversation(targetUserId);
        if (conv) {
          selectConversation(conv);
          setShowContactInfo(false);
        }
        return conv;
      } catch (err) {
        console.error('Failed to start direct conversation:', err);
        throw err;
      }
    },
    [startConversation, selectConversation]
  );

  // Add members to group
  const addGroupMembers = useCallback(async (conversationId, memberIds) => {
    try {
      const { data } = await api.post(`/conversations/${conversationId}/members`, { memberIds });
      setConversations((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      if (activeConversationRef.current?._id === data._id) {
        setActiveConversation(data);
      }
      return data;
    } catch (error) {
      console.error('Failed to add members:', error);
      throw error;
    }
  }, []);

  // Remove member from group
  const removeGroupMember = useCallback(async (conversationId, targetUserId) => {
    try {
      const { data } = await api.delete(`/conversations/${conversationId}/members/${targetUserId}`);
      setConversations((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      if (activeConversationRef.current?._id === data._id) {
        setActiveConversation(data);
      }
      return data;
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }, []);

  // Leave group
  const leaveGroup = useCallback(async (conversationId) => {
    try {
      await api.post(`/conversations/${conversationId}/leave`);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
        setShowContactInfo(false);
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }, []);

  // Update group permissions
  const updateGroupPermissions = useCallback(async (conversationId, permissions) => {
    try {
      const { data } = await api.put(`/conversations/${conversationId}/permissions`, permissions);
      setConversations((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      if (activeConversationRef.current?._id === data._id) {
        setActiveConversation(data);
      }
      return data;
    } catch (error) {
      console.error('Failed to update group permissions:', error);
      throw error;
    }
  }, []);

  // Toggle group admin
  const toggleGroupAdmin = useCallback(async (conversationId, targetUserId, makeAdmin) => {
    try {
      const { data } = await api.put(`/conversations/${conversationId}/admins`, { targetUserId, makeAdmin });
      setConversations((prev) => prev.map((c) => (c._id === data._id ? data : c)));
      if (activeConversationRef.current?._id === data._id) {
        setActiveConversation(data);
      }
      return data;
    } catch (error) {
      console.error('Failed to toggle admin:', error);
      throw error;
    }
  }, []);

  // Get group invite link
  const getGroupInviteLink = useCallback(async (conversationId) => {
    try {
      const { data } = await api.get(`/conversations/${conversationId}/invite`);
      return data;
    } catch (error) {
      console.error('Failed to get invite link:', error);
      throw error;
    }
  }, []);

  // Reset group invite link
  const resetGroupInviteLink = useCallback(async (conversationId) => {
    try {
      const { data } = await api.post(`/conversations/${conversationId}/invite/reset`);
      return data;
    } catch (error) {
      console.error('Failed to reset invite link:', error);
      throw error;
    }
  }, []);

  // Join group by invite code
  const joinGroupByInvite = useCallback(async (inviteCode) => {
    try {
      const { data } = await api.post(`/conversations/join/${inviteCode}`);
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === data._id);
        if (!exists) return [data, ...prev];
        return prev.map((c) => (c._id === data._id ? data : c));
      });
      return data;
    } catch (error) {
      console.error('Failed to join group by invite:', error);
      throw error;
    }
  }, []);

  // Mark all conversations/messages as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/messages/mark-all/read');
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          unreadCount: 0,
          lastMessage: c.lastMessage ? { ...c.lastMessage, isRead: true } : c.lastMessage,
        }))
      );
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await api.delete(`/conversations/${conversationId}`);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, []);

  // Bulk delete conversations
  const bulkDeleteConversations = useCallback(async (conversationIds) => {
    try {
      await api.post('/conversations/bulk-delete', { conversationIds });
      const idSet = new Set(conversationIds);
      setConversations((prev) => prev.filter((c) => !idSet.has(c._id)));
      if (activeConversationRef.current && idSet.has(activeConversationRef.current._id)) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to bulk delete conversations:', error);
      throw error;
    }
  }, []);

  // Toggle star message
  const toggleStarMessage = useCallback(async (messageId) => {
    try {
      const { data } = await api.put(`/messages/${messageId}/star`);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, starredBy: data.starredBy } : m
        )
      );
      showToast(data.isStarred ? 'Message starred' : 'Message unstarred', 'success', '⭐');
      return data;
    } catch (error) {
      console.error('Failed to toggle star message:', error);
      showToast('Failed to star message', 'error');
      throw error;
    }
  }, [showToast]);

  // Toggle pin message
  const togglePinMessage = useCallback(
    async (messageId) => {
      if (!messageId) return;
      try {
        const { data } = await api.put(`/messages/${messageId}/pin`);
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, isPinned: data.isPinned, pinnedAt: data.pinnedAt, pinnedBy: data.pinnedBy }
              : m
          )
        );

        const socket = getSocket();
        if (socket && activeConversationRef.current) {
          socket.emit('pinMessage', {
            conversationId: activeConversationRef.current._id,
            messageId,
            isPinned: data.isPinned,
            pinnedAt: data.pinnedAt,
          });
        }

        showToast(data.isPinned ? 'Message pinned' : 'Message unpinned', 'success', '📌');
        return data;
      } catch (error) {
        console.error('Failed to pin message:', error);
        showToast('Failed to pin message', 'error');
        throw error;
      }
    },
    [showToast]
  );

  // Delete message (everyone or me)
  const deleteMessage = useCallback(
    async (messageId, deleteType = 'everyone') => {
      if (!messageId) return;
      try {
        const { data } = await api.delete(`/messages/${messageId}`, {
          data: { deleteType },
        });

        const curConvId = activeConversationRef.current?._id?.toString();

        if (deleteType === 'everyone') {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId
                ? { ...m, isDeleted: true, message: 'This message was deleted', attachments: [] }
                : m
            )
          );

          // Optimistically update conversation in sidebar
          setConversations((prev) =>
            prev.map((c) => {
              if (c._id?.toString() === curConvId) {
                if (c.lastMessage?._id?.toString() === messageId?.toString()) {
                  return {
                    ...c,
                    lastMessage: {
                      ...c.lastMessage,
                      isDeleted: true,
                      message: 'This message was deleted',
                      attachments: [],
                    },
                  };
                }
              }
              return c;
            })
          );

          const socket = getSocket();
          if (socket && activeConversationRef.current) {
            socket.emit('deleteMessage', {
              conversationId: activeConversationRef.current._id,
              messageId,
              deleteType: 'everyone',
            });
          }
          showToast('Message deleted for everyone', 'success', '🗑️');
        } else {
          // Delete for me
          const remaining = messages.filter((m) => m._id !== messageId);
          setMessages(remaining);

          // Optimistically roll back lastMessage in sidebar if this was the last message
          const newLast = remaining.length > 0 ? remaining[remaining.length - 1] : null;
          setConversations((prev) =>
            prev.map((c) => {
              if (c._id?.toString() === curConvId) {
                if (c.lastMessage?._id?.toString() === messageId?.toString()) {
                  return {
                    ...c,
                    lastMessage: newLast,
                    lastMessageAt: newLast ? newLast.createdAt : null,
                  };
                }
              }
              return c;
            })
          );
          showToast('Message deleted for you', 'success', '🗑️');
        }

        fetchConversations();
        return data;
      } catch (error) {
        console.error('Failed to delete message:', error);
        showToast(error.response?.data?.message || 'Failed to delete message', 'error');
        throw error;
      }
    },
    [showToast, messages, fetchConversations]
  );

  // Toggle selection of a message
  const toggleSelectMessage = useCallback((messageId) => {
    setSelectedMessageIds((prev) => {
      const idStr = messageId?.toString();
      const exists = prev.some((id) => id?.toString() === idStr);
      if (exists) {
        return prev.filter((id) => id?.toString() !== idStr);
      } else {
        return [...prev, messageId];
      }
    });
  }, []);

  // Select all messages
  const selectAllMessages = useCallback(() => {
    setSelectedMessageIds(messages.map((m) => m._id));
  }, [messages]);

  // Clear selection and exit selection mode
  const clearSelection = useCallback(() => {
    setSelectedMessageIds([]);
    setIsSelectMode(false);
  }, []);

  // Bulk delete selected messages
  const deleteSelectedMessages = useCallback(
    async (deleteType = 'me') => {
      if (selectedMessageIds.length === 0) return;
      try {
        const { data } = await api.post('/messages/bulk-delete', {
          messageIds: selectedMessageIds,
          deleteType,
        });

        const deletedIds = (data?.deletedIds || selectedMessageIds).map((id) => id.toString());
        const idSet = new Set(deletedIds);
        const curConvId = activeConversationRef.current?._id?.toString();

        if (deleteType === 'everyone') {
          setMessages((prev) =>
            prev.map((m) =>
              idSet.has(m._id.toString())
                ? { ...m, isDeleted: true, message: 'This message was deleted', attachments: [] }
                : m
            )
          );

          setConversations((prev) =>
            prev.map((c) => {
              if (c._id?.toString() === curConvId) {
                if (c.lastMessage && idSet.has(c.lastMessage._id?.toString())) {
                  return {
                    ...c,
                    lastMessage: {
                      ...c.lastMessage,
                      isDeleted: true,
                      message: 'This message was deleted',
                      attachments: [],
                    },
                  };
                }
              }
              return c;
            })
          );

          const socket = getSocket();
          if (socket && activeConversationRef.current) {
            socket.emit('bulkDeleteMessages', {
              conversationId: activeConversationRef.current._id,
              messageIds: deletedIds,
              deleteType: 'everyone',
            });
          }
          showToast(`${deletedIds.length} message(s) deleted for everyone`, 'success', '🗑️');
        } else {
          // Delete for me
          const remaining = messages.filter((m) => !idSet.has(m._id.toString()));
          setMessages(remaining);

          const newLast = remaining.length > 0 ? remaining[remaining.length - 1] : null;
          setConversations((prev) =>
            prev.map((c) => {
              if (c._id?.toString() === curConvId) {
                if (c.lastMessage && idSet.has(c.lastMessage._id?.toString())) {
                  return {
                    ...c,
                    lastMessage: newLast,
                    lastMessageAt: newLast ? newLast.createdAt : null,
                  };
                }
              }
              return c;
            })
          );
          showToast(`${deletedIds.length} message(s) deleted for you`, 'success', '🗑️');
        }

        clearSelection();
        fetchConversations();
        return data;
      } catch (error) {
        console.error('Failed to bulk delete messages:', error);
        showToast(error.response?.data?.message || 'Failed to delete messages', 'error');
        throw error;
      }
    },
    [selectedMessageIds, clearSelection, showToast, messages, fetchConversations]
  );

  // Forward message to conversations
  const forwardMessage = useCallback(
    async (messageId, targetIds) => {
      if (!messageId || !targetIds || !targetIds.length) return;
      try {
        const conversationIds = [];
        for (const targetId of targetIds) {
          if (targetId.startsWith('user-')) {
            const uId = targetId.replace('user-', '');
            const { data: newConv } = await api.post('/conversations', { userId: uId });
            conversationIds.push(newConv._id);
          } else {
            conversationIds.push(targetId);
          }
        }

        const { data } = await api.post('/messages/forward', {
          messageId,
          conversationIds,
        });

        const socket = getSocket();
        if (socket && data.forwardedMessages) {
          data.forwardedMessages.forEach((fwdMsg) => {
            socket.emit('sendMessage', {
              ...fwdMsg,
              conversationId: fwdMsg.conversation,
            });
          });
        }

        fetchConversations();
        showToast(`Forwarded to ${conversationIds.length} chat(s)`, 'success', '↪');
        return data;
      } catch (error) {
        console.error('Failed to forward message:', error);
        showToast('Failed to forward message', 'error');
        throw error;
      }
    },
    [fetchConversations, showToast]
  );

  // Report message
  const reportMessage = useCallback(
    async (messageId, { category = 'other', reason = 'Reported by user', severity = 'medium' } = {}) => {
      if (!messageId) return;
      try {
        const { data } = await api.post(`/messages/${messageId}/report`, { category, reason, severity });
        showToast('Report submitted to admins. Thank you for keeping our community safe. 🛡️', 'success');
        return data;
      } catch (error) {
        const msg = error?.response?.data?.message || 'Failed to report message';
        console.error('Failed to report message:', error);
        showToast(msg, 'error');
        throw error;
      }
    },
    [showToast]
  );

  // Get starred messages
  const getStarredMessages = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/starred/all');
      return data;
    } catch (error) {
      console.error('Failed to fetch starred messages:', error);
      return [];
    }
  }, []);

  // Upload media file to server
  const uploadMediaFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }, []);

  // React to message (WhatsApp style)
  const reactToMessage = useCallback(
    async (messageId, emoji) => {
      if (!messageId || !emoji) return;
      try {
        const { data } = await api.put(`/messages/${messageId}/react`, { emoji });
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: data.reactions } : m))
        );

        const socket = getSocket();
        if (socket && activeConversationRef.current) {
          socket.emit('reactMessage', {
            conversationId: activeConversationRef.current._id,
            messageId,
            reactions: data.reactions,
          });
        }
        return data;
      } catch (error) {
        console.error('Failed to react to message:', error);
      }
    },
    []
  );

  // Clear current active conversation chat
  const clearCurrentChat = useCallback(async () => {
    if (!activeConversationRef.current) return;
    const convId = activeConversationRef.current._id;
    try {
      await api.delete(`/messages/conversation/${convId}/clear`);
      setMessages([]);
      // Optimistically clear lastMessage and timestamp in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c._id?.toString() === convId?.toString()
            ? { ...c, lastMessage: null, lastMessageAt: null, unreadCount: 0 }
            : c
        )
      );
      const socket = getSocket();
      if (socket) {
        socket.emit('clearConversation', { conversationId: convId });
      }
      fetchConversations();
    } catch (error) {
      console.error('Failed to clear chat:', error);
      throw error;
    }
  }, [fetchConversations]);

  // Update contact info (name, mobile number, username)
  const updateContact = useCallback(
    async ({ targetUserId, name, phoneNumber, username, oldPhoneNumber }) => {
      try {
        const { data } = await api.put('/users/contacts', {
          targetUserId,
          name,
          phoneNumber,
          username,
          oldPhoneNumber,
        });

        const cleanName = name.trim();
        const cleanPhone = phoneNumber.trim();
        const cleanUsername = username ? username.trim().toLowerCase().replace(/^@/, '') : '';

        // 1. Update activeConversation in state
        setActiveConversation((prev) => {
          if (!prev) return prev;
          const updatedParticipants = prev.participants?.map((p) => {
            const pId = (p?._id || p)?.toString();
            if (pId === targetUserId?.toString()) {
              return {
                ...p,
                name: cleanName,
                contactName: cleanName,
                phoneNumber: cleanPhone,
                ...(cleanUsername ? { username: cleanUsername } : {}),
              };
            }
            return p;
          });
          return { ...prev, participants: updatedParticipants };
        });

        // 2. Update conversations list in state
        setConversations((prev) =>
          prev.map((conv) => {
            const hasParticipant = conv.participants?.some(
              (p) => (p?._id || p)?.toString() === targetUserId?.toString()
            );
            if (hasParticipant) {
              const updatedParticipants = conv.participants?.map((p) => {
                const pId = (p?._id || p)?.toString();
                if (pId === targetUserId?.toString()) {
                  return {
                    ...p,
                    name: cleanName,
                    contactName: cleanName,
                    phoneNumber: cleanPhone,
                    ...(cleanUsername ? { username: cleanUsername } : {}),
                  };
                }
                return p;
              });
              return { ...conv, participants: updatedParticipants };
            }
            return conv;
          })
        );

        return data;
      } catch (error) {
        console.error('Failed to update contact:', error);
        throw error;
      }
    },
    []
  );

  // Delete phone contact
  const deletePhoneContact = useCallback(async (phoneNumber) => {
    try {
      const { data } = await api.delete(`/users/contacts/${encodeURIComponent(phoneNumber)}`);
      return data;
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }, []);

  // Search matches computed from messages in active conversation
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return messages
      .filter((m) => !m.isDeleted && m.message && m.message.toLowerCase().includes(q))
      .map((m) => m._id);
  }, [messages, searchQuery]);

  // Reset search index when search query or matches change
  useEffect(() => {
    setActiveSearchIndex(0);
  }, [searchQuery]);

  const goToNextSearchMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setActiveSearchIndex((prev) => (prev + 1) % searchMatches.length);
  }, [searchMatches.length]);

  const goToPrevSearchMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setActiveSearchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
  }, [searchMatches.length]);

  // --- STATUS (STORIES) METHODS ---
  const fetchStatuses = useCallback(async () => {
    setStatusesLoading(true);
    try {
      const { data } = await api.get('/status');
      setMyStatuses(data.myStatuses || []);
      setRecentUpdates(data.recentUpdates || []);
      setViewedUpdates(data.viewedUpdates || []);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    } finally {
      setStatusesLoading(false);
    }
  }, []);

  const createStatus = useCallback(
    async (formDataOrData) => {
      try {
        let res;
        if (formDataOrData instanceof FormData) {
          res = await api.post('/status', formDataOrData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          res = await api.post('/status', formDataOrData);
        }
        setMyStatuses((prev) => [res.data, ...prev]);
        const socket = getSocket();
        if (socket) {
          socket.emit('sendNewStatus', res.data);
        }
        showToast('Status posted successfully', 'success', '✨');
        return res.data;
      } catch (error) {
        console.error('Failed to create status:', error);
        showToast(error.response?.data?.message || 'Failed to post status', 'error');
        throw error;
      }
    },
    [showToast]
  );

  const viewStatus = useCallback(
    async (statusId) => {
      if (!statusId) return;
      try {
        const { data } = await api.post(`/status/${statusId}/view`);
        const socket = getSocket();
        if (socket) {
          socket.emit('viewStatus', { statusId, user });
        }
        return data;
      } catch (error) {
        console.error('Failed to view status:', error);
      }
    },
    [user]
  );

  const deleteStatus = useCallback(
    async (statusId) => {
      if (!statusId) return;
      try {
        await api.delete(`/status/${statusId}`);
        setMyStatuses((prev) => prev.filter((s) => s._id !== statusId));
        const socket = getSocket();
        if (socket) {
          socket.emit('deleteStatus', { statusId, userId: user?._id });
        }
        showToast('Status deleted', 'success', '🗑️');
      } catch (error) {
        console.error('Failed to delete status:', error);
        showToast('Failed to delete status', 'error');
        throw error;
      }
    },
    [user, showToast]
  );

  const getStatusViewers = useCallback(async (statusId) => {
    if (!statusId) return [];
    try {
      const { data } = await api.get(`/status/${statusId}/viewers`);
      return data;
    } catch (error) {
      console.error('Failed to fetch status viewers:', error);
      return [];
    }
  }, []);

  // --- COMMUNITIES METHODS ---
  const fetchCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    try {
      const { data } = await api.get('/communities');
      setCommunities(data || []);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setCommunitiesLoading(false);
    }
  }, []);

  const createCommunity = useCallback(
    async (communityData) => {
      try {
        const { data } = await api.post('/communities', communityData);
        setCommunities((prev) => [data, ...prev]);
        fetchConversations();
        const socket = getSocket();
        if (socket) {
          socket.emit('newCommunity', data);
        }
        showToast('Community created successfully', 'success', '👥');
        return data;
      } catch (error) {
        console.error('Failed to create community:', error);
        showToast(error.response?.data?.message || 'Failed to create community', 'error');
        throw error;
      }
    },
    [fetchConversations, showToast]
  );

  const addCommunityGroup = useCallback(
    async (communityId, groupData) => {
      try {
        const { data } = await api.post(`/communities/${communityId}/groups`, groupData);
        setCommunities((prev) =>
          prev.map((c) => (c._id === communityId ? data.community : c))
        );
        fetchConversations();
        const socket = getSocket();
        if (socket) {
          socket.emit('updateCommunity', data.community);
        }
        showToast('Group added to community', 'success', '✓');
        return data;
      } catch (error) {
        console.error('Failed to add group to community:', error);
        showToast(error.response?.data?.message || 'Failed to add group', 'error');
        throw error;
      }
    },
    [fetchConversations, showToast]
  );

  const joinCommunity = useCallback(
    async (communityId) => {
      try {
        const { data } = await api.post(`/communities/${communityId}/join`);
        setCommunities((prev) =>
          prev.map((c) => (c._id === communityId ? data : c))
        );
        fetchConversations();
        showToast('Joined community', 'success', '👋');
        return data;
      } catch (error) {
        console.error('Failed to join community:', error);
        showToast('Failed to join community', 'error');
        throw error;
      }
    },
    [fetchConversations, showToast]
  );

  const leaveCommunity = useCallback(
    async (communityId) => {
      try {
        await api.post(`/communities/${communityId}/leave`);
        setCommunities((prev) => prev.filter((c) => c._id !== communityId));
        fetchConversations();
        showToast('Left community', 'info');
      } catch (error) {
        console.error('Failed to leave community:', error);
        showToast('Failed to leave community', 'error');
        throw error;
      }
    },
    [fetchConversations, showToast]
  );

  const deleteCommunity = useCallback(
    async (communityId) => {
      try {
        await api.delete(`/communities/${communityId}`);
        setCommunities((prev) => prev.filter((c) => c._id !== communityId));
        fetchConversations();
        showToast('Community deleted', 'success', '🗑️');
      } catch (error) {
        console.error('Failed to delete community:', error);
        showToast('Failed to delete community', 'error');
        throw error;
      }
    },
    [fetchConversations, showToast]
  );

  // Socket events setup
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    // Immediately request current online users
    socket.emit('getOnlineUsers');

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      setAllUsers((prev) =>
        prev.map((u) => ((u._id || u)?.toString() === userId?.toString() ? { ...u, status: 'online' } : u))
      );
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants?.map((p) =>
            (p?._id || p)?.toString() === userId?.toString() ? { ...p, status: 'online' } : p
          ),
        };
      });
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setOnlineUsers((prev) => prev.filter((id) => (id?._id || id)?.toString() !== userId?.toString()));
      const updateData = { status: 'offline', ...(lastSeen ? { lastSeen } : {}) };
      setAllUsers((prev) =>
        prev.map((u) => ((u._id || u)?.toString() === userId?.toString() ? { ...u, ...updateData } : u))
      );
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants?.map((p) =>
            (p?._id || p)?.toString() === userId?.toString() ? { ...p, ...updateData } : p
          ),
        }))
      );
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants?.map((p) =>
            (p?._id || p)?.toString() === userId?.toString() ? { ...p, ...updateData } : p
          ),
        };
      });
    };

    const handleReceiveMessage = async (message) => {
      const convId = (message.conversationId || message.conversation?._id || message.conversation)?.toString();
      const currentActive = activeConversationRef.current;
      const isCurrentActive = currentActive && currentActive._id?.toString() === convId;

      // Messages are now plain text — no decryption needed
      const displayMsg = message;

      if (isCurrentActive) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === displayMsg._id)) return prev;
          return [...prev, displayMsg];
        });
        api.put(`/messages/${convId}/read`).catch(() => {});
        socket.emit('messageRead', { conversationId: convId, readBy: user?._id });
      }

      // Keep chats archived logic: if keepChatsArchived is false, unarchive on new message
      const keepChatsArchived = user?.chatsPreferences?.keepChatsArchived ?? true;
      if (!keepChatsArchived && convId) {
        setArchivedChatIds((prev) => {
          if (prev.some((id) => id?.toString() === convId)) {
            const next = prev.filter((id) => id?.toString() !== convId);
            try {
              localStorage.setItem('chatapp_archived_chats', JSON.stringify(next));
            } catch (e) {}
            return next;
          }
          return prev;
        });
      }

      setConversations((prev) => {
        let found = false;
        const updated = prev.map((c) => {
          if (c._id?.toString() === convId) {
            found = true;
            return {
              ...c,
              lastMessage: displayMsg,
              lastMessageAt: displayMsg.createdAt || new Date().toISOString(),
              unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });

        if (!found) {
          fetchConversations();
          return prev;
        }

        return updated.sort(
          (a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0)
        );
      });
    };

    const handleMessageRead = ({ conversationId }) => {
      const convIdStr = conversationId?.toString();
      const currentActive = activeConversationRef.current;
      if (currentActive && currentActive._id?.toString() === convIdStr) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
      }

      setConversations((prev) =>
        prev.map((c) =>
          c._id?.toString() === convIdStr
            ? {
                ...c,
                lastMessage: c.lastMessage ? { ...c.lastMessage, isRead: true } : c.lastMessage,
              }
            : c
        )
      );
    };

    const handleTyping = ({ userId: typingUserId, userName, conversationId }) => {
      // Don't show typing for ourselves
      if (typingUserId && user?._id && typingUserId.toString() === user._id.toString()) {
        return;
      }
      if (!conversationId) return;

      const convIdStr = conversationId.toString();

      // Clear any existing timeout for this conversation
      if (typingTimeoutsRef.current[convIdStr]) {
        clearTimeout(typingTimeoutsRef.current[convIdStr]);
      }

      setTypingUsers((prev) => ({
        ...prev,
        [convIdStr]: { userId: typingUserId, userName: userName || 'Someone' },
      }));

      // Automatically stop typing after 3 seconds of silence (WhatsApp failsafe)
      typingTimeoutsRef.current[convIdStr] = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[convIdStr];
          return updated;
        });
        delete typingTimeoutsRef.current[convIdStr];
      }, 3000);
    };

    const handleStopTyping = ({ conversationId }) => {
      if (!conversationId) return;
      const convIdStr = conversationId.toString();

      if (typingTimeoutsRef.current[convIdStr]) {
        clearTimeout(typingTimeoutsRef.current[convIdStr]);
        delete typingTimeoutsRef.current[convIdStr];
      }

      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[convIdStr];
        return updated;
      });
    };

    // WebRTC Signaling Events (Handles 1-on-1 and Group calls)
    const handleIncomingCall = ({
      from,
      callerName,
      callerAvatar,
      callType,
      callId,
      offer,
      isGroup,
      groupId,
      groupName,
      groupImage,
      participants,
    }) => {
      connectedPeerIdRef.current = from;
      setActiveCall({
        otherUser: {
          _id: from,
          callerId: from,
          callerName,
          name: isGroup ? (groupName || 'Group Call') : callerName,
          displayName: isGroup ? (groupName || 'Group Call') : callerName,
          profilePicture: isGroup ? (groupImage || callerAvatar) : callerAvatar,
          isGroup: !!isGroup,
          groupId,
          participants,
        },
        type: callType,
        status: 'ringing',
        isIncoming: true,
        callId,
        offer,
        startTime: Date.now(),
      });
    };

    const handleCallAccepted = async ({ answer, from, fromUser, isGroup, groupId }) => {
      if (from) {
        connectedPeerIdRef.current = from;
      }

      setActiveCall((prev) =>
        prev
          ? {
              ...prev,
              status: 'connected',
              connectedAt: Date.now(),
              otherUser: {
                ...prev.otherUser,
                connectedName: fromUser?.name || 'Member',
              },
            }
          : null
      );

      // Set remote answer on caller's RTCPeerConnection
      if (peerConnectionRef.current && answer) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

          // Process any queued ICE candidates
          while (candidateQueueRef.current.length > 0) {
            const cand = candidateQueueRef.current.shift();
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.error('Error adding queued ICE candidate on caller:', e);
            }
          }
        } catch (err) {
          console.error('Failed to set remote description on caller:', err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add received ICE candidate:', err);
        }
      } else {
        candidateQueueRef.current.push(candidate);
      }
    };

    const handleCallRejected = ({ from, isGroup }) => {
      if (!isGroup) {
        cleanupMedia();
        setActiveCall(null);
        fetchCalls();
      } else {
        showToast('A member declined the group call', 'info');
      }
    };

    const handleCallEnded = () => {
      cleanupMedia();
      setActiveCall(null);
      fetchCalls();
    };

    const handleCallLogCreated = (callData) => {
      if (!callData) return;
      setCalls((prev) => {
        if (prev.some((c) => c._id === callData._id)) return prev;
        return [callData, ...prev];
      });

      const isReceiver = (callData.receiver?._id || callData.receiver)?.toString() === user?._id?.toString();
      if (isReceiver && (callData.status === 'missed' || callData.status === 'declined')) {
        showToast(
          `Missed call from ${callData.caller?.name || 'Contact'}`,
          'error',
          '📞'
        );
      }
    };

    const handleCallHistoryCleared = () => {
      setCalls([]);
    };

    const handleMessageReaction = ({ messageId, reactions, conversationId }) => {
      const convIdStr = conversationId?.toString();
      const currentActive = activeConversationRef.current;
      if (currentActive && currentActive._id?.toString() === convIdStr) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
        );
      }
    };

    const handleMessageDeleted = ({ messageId, conversationId, deleteType }) => {
      const convIdStr = conversationId?.toString();
      const currentActive = activeConversationRef.current;
      if (currentActive && currentActive._id?.toString() === convIdStr) {
        if (deleteType === 'everyone') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? { ...msg, isDeleted: true, message: 'This message was deleted', attachments: [] }
                : msg
            )
          );
        }
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c._id?.toString() === convIdStr) {
            if (c.lastMessage?._id?.toString() === messageId?.toString()) {
              if (deleteType === 'everyone') {
                return {
                  ...c,
                  lastMessage: {
                    ...c.lastMessage,
                    isDeleted: true,
                    message: 'This message was deleted',
                    attachments: [],
                  },
                };
              }
            }
          }
          return c;
        })
      );
      fetchConversations();
    };

    const handleMessagesBulkDeleted = ({ messageIds, conversationId, deleteType }) => {
      const convIdStr = conversationId?.toString();
      const currentActive = activeConversationRef.current;
      if (currentActive && currentActive._id?.toString() === convIdStr) {
        if (deleteType === 'everyone' && Array.isArray(messageIds)) {
          const idSet = new Set(messageIds.map((id) => id.toString()));
          setMessages((prev) =>
            prev.map((msg) =>
              idSet.has(msg._id.toString())
                ? { ...msg, isDeleted: true, message: 'This message was deleted', attachments: [] }
                : msg
            )
          );
        }
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c._id?.toString() === convIdStr) {
            if (c.lastMessage && messageIds?.some((id) => id.toString() === c.lastMessage._id?.toString())) {
              if (deleteType === 'everyone') {
                return {
                  ...c,
                  lastMessage: {
                    ...c.lastMessage,
                    isDeleted: true,
                    message: 'This message was deleted',
                    attachments: [],
                  },
                };
              }
            }
          }
          return c;
        })
      );
      fetchConversations();
    };

    const handleMessagePinned = ({ messageId, conversationId, isPinned, pinnedAt }) => {
      const convIdStr = conversationId?.toString();
      const currentActive = activeConversationRef.current;
      if (currentActive && currentActive._id?.toString() === convIdStr) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, isPinned, pinnedAt } : msg
          )
        );
      }
    };

    const handleConversationCleared = ({ conversationId }) => {
      const convIdStr = conversationId?.toString();
      const currentActive = activeConversationRef.current;
      if (currentActive && currentActive._id?.toString() === convIdStr) {
        setMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id?.toString() === convIdStr
            ? { ...c, lastMessage: null, lastMessageAt: null, unreadCount: 0 }
            : c
        )
      );
      fetchConversations();
    };

    const handleAllChatsCleared = () => {
      setMessages([]);
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
        }))
      );
      fetchConversations();
    };

    const handleAllChatsDeleted = () => {
      selectConversation(null);
      setMessages([]);
      setConversations([]);
      setArchivedChatIds([]);
      try {
        localStorage.removeItem('chatapp_archived_chats');
      } catch (e) {}
      fetchConversations();
    };

    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callRejected', handleCallRejected);
    socket.on('callEnded', handleCallEnded);
    socket.on('callLogCreated', handleCallLogCreated);
    socket.on('callHistoryCleared', handleCallHistoryCleared);
    socket.on('messageRead', handleMessageRead);
    socket.on('messageReaction', handleMessageReaction);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messagesBulkDeleted', handleMessagesBulkDeleted);
    socket.on('messagePinned', handleMessagePinned);
    socket.on('conversationCleared', handleConversationCleared);
    socket.on('allChatsCleared', handleAllChatsCleared);
    socket.on('allChatsDeleted', handleAllChatsDeleted);

    const handleStatusUpdate = () => {
      fetchStatuses();
    };

    const handleCommunityUpdate = () => {
      fetchCommunities();
    };

    socket.on('newStatus', handleStatusUpdate);
    socket.on('statusViewed', handleStatusUpdate);
    socket.on('statusDeleted', handleStatusUpdate);
    socket.on('communityCreated', handleCommunityUpdate);
    socket.on('communityUpdated', handleCommunityUpdate);
    socket.on('communityDeleted', handleCommunityUpdate);

    // Admin Real-time Events
    const handleUserBanStatusChanged = ({ userId, isBanned, banReason }) => {
      if (user?._id && userId?.toString() === user._id.toString() && isBanned) {
        alert(`Your account has been suspended by the administrator.\nReason: ${banReason || 'Policy violation'}`);
        window.location.href = '/login';
      }
    };

    const handleUserRoleUpdated = ({ userId, role }) => {
      if (user?._id && userId?.toString() === user._id.toString()) {
        if (updateUser) {
          updateUser({ ...user, role });
        }
        showToast(`Your account role was updated to: ${role.toUpperCase()}`, 'info', '🛡️');
      }
    };

    const handleSystemBroadcast = (payload) => {
      if (!payload) return;
      console.log('📢 Real-time System Broadcast received:', payload);

      const title = payload.title || 'Official Announcement';
      const content = payload.content || payload.broadcastMessage || 'System notification';
      const level = payload.level || payload.broadcastType || 'info';
      const category = payload.category || (level === 'warning' ? 'warning' : level === 'critical' ? 'critical' : 'announcement');

      // 1. Synthesize audio chime
      playAnnouncementSound(category);

      // 2. Open rich modal popup
      setSystemAnnouncement({
        ...payload,
        title,
        content,
        level,
        category,
      });

      // 3. High-visibility Toast
      const emojiMap = {
        warning: '⚠️',
        maintenance: '🛠️',
        critical: '🚨',
        update: '🚀',
        announcement: '📢',
      };
      showToast(`[${title}] ${content}`, level, emojiMap[category] || '📢');

      // 4. Refresh conversation list so the Batiyao official message arrives at top
      fetchConversations();
    };

    socket.on('userBanStatusChanged', handleUserBanStatusChanged);
    socket.on('userRoleUpdated', handleUserRoleUpdated);
    socket.on('systemBroadcast', handleSystemBroadcast);

    return () => {
      socket.off('userBanStatusChanged', handleUserBanStatusChanged);
      socket.off('userRoleUpdated', handleUserRoleUpdated);
      socket.off('systemBroadcast', handleSystemBroadcast);
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callRejected', handleCallRejected);
      socket.off('callEnded', handleCallEnded);
      socket.off('callLogCreated', handleCallLogCreated);
      socket.off('callHistoryCleared', handleCallHistoryCleared);
      socket.off('messageRead', handleMessageRead);
      socket.off('messageReaction', handleMessageReaction);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messagesBulkDeleted', handleMessagesBulkDeleted);
      socket.off('messagePinned', handleMessagePinned);
      socket.off('conversationCleared', handleConversationCleared);
      socket.off('allChatsCleared', handleAllChatsCleared);
      socket.off('allChatsDeleted', handleAllChatsDeleted);
      socket.off('newStatus', handleStatusUpdate);
      socket.off('statusViewed', handleStatusUpdate);
      socket.off('statusDeleted', handleStatusUpdate);
      socket.off('communityCreated', handleCommunityUpdate);
      socket.off('communityUpdated', handleCommunityUpdate);
      socket.off('communityDeleted', handleCommunityUpdate);
    };
  }, [
    isAuthenticated,
    activeConversation,
    fetchConversations,
    fetchCalls,
    cleanupMedia,
    fetchStatuses,
    fetchCommunities,
  ]);

  // Auth hone par conversations, all users, calls, statuses, communities load karo
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchAllUsers();
      fetchCalls();
      fetchStatuses();
      fetchCommunities();
    }
  }, [
    isAuthenticated,
    fetchConversations,
    fetchAllUsers,
    fetchCalls,
    fetchStatuses,
    fetchCommunities,
  ]);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUsers.includes(userId.toString());
    },
    [onlineUsers]
  );

  const dismissSystemAnnouncement = useCallback(() => {
    setSystemAnnouncement(null);
  }, []);

  const openBatiyaoChat = useCallback(async () => {
    let batiyaoConv = conversations.find((c) =>
      c.participants?.some(
        (p) =>
          p?.isOfficial ||
          p?.username === 'batiyao' ||
          (p?.name && p.name.toLowerCase().includes('batiyao'))
      )
    );

    if (batiyaoConv) {
      selectConversation(batiyaoConv);
      return;
    }

    try {
      const res = await api.get('/conversations');
      const fresh = res.data || [];
      setConversations(fresh);
      batiyaoConv = fresh.find((c) =>
        c.participants?.some(
          (p) =>
            p?.isOfficial ||
            p?.username === 'batiyao' ||
            (p?.name && p.name.toLowerCase().includes('batiyao'))
        )
      );
      if (batiyaoConv) {
        selectConversation(batiyaoConv);
      }
    } catch (err) {
      console.error('Failed to open Batiyao chat:', err);
    }
  }, [conversations, selectConversation]);

  const value = {
    conversations,
    allUsers,
    calls,
    activeConversation,
    messages,
    onlineUsers,
    isUserBlocked,
    blockUser,
    unblockUser,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    typingUsers,
    loading,
    usersLoading,
    callsLoading,
    messagesLoading,
    fetchConversations,
    fetchAllUsers,
    fetchCalls,
    clearCalls,
    selectConversation,
    sendMessage,
    startConversation,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    emitTyping,
    emitStopTyping,
    isUserOnline,
    setMessages,
    setConversations,
    createGroup,
    markAllAsRead,
    deleteConversation,
    bulkDeleteConversations,
    toggleStarMessage,
    getStarredMessages,
    uploadMediaFile,
    reactToMessage,
    clearCurrentChat,
    togglePinMessage,
    deleteMessage,
    isSelectMode,
    setIsSelectMode,
    selectedMessageIds,
    setSelectedMessageIds,
    toggleSelectMessage,
    selectAllMessages,
    clearSelection,
    deleteSelectedMessages,
    forwardMessage,
    reportMessage,
    replyingTo,
    setReplyingTo,
    toast,
    setToast,
    showToast,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    activeSearchIndex,
    setActiveSearchIndex,
    searchMatches,
    goToNextSearchMatch,
    goToPrevSearchMatch,
    blockedUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    closeChat,
    showContactInfo,
    setShowContactInfo,
    updateContact,
    deletePhoneContact,
    startDirectConversation,
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
    updateGroupPermissions,
    toggleGroupAdmin,
    getGroupInviteLink,
    joinGroupByInvite,
    // Status (Stories)
    myStatuses,
    recentUpdates,
    viewedUpdates,
    statusesLoading,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getStatusViewers,
    // Communities
    communities,
    communitiesLoading,
    fetchCommunities,
    createCommunity,
    addCommunityGroup,
    joinCommunity,
    leaveCommunity,
    deleteCommunity,
    // Global sidebar navigation & triggers
    sidebarNavTab,
    setSidebarNavTab,
    showUserListModal,
    setShowUserListModal,
    showCreateStatusModalGlobal,
    setShowCreateStatusModalGlobal,
    showNewCommunityModalGlobal,
    setShowNewCommunityModalGlobal,
    // E2EE
    userKeyPair,
    // Archived chats
    archivedChatIds,
    toggleArchiveConversation,
    setArchivedChatIds,
    // Real-time System Announcements & Notifications
    systemAnnouncement,
    setSystemAnnouncement,
    dismissSystemAnnouncement,
    openBatiyaoChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

export default ChatProvider;
