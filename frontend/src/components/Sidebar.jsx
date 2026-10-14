import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import UserList from './UserList';
import NewGroupModal from './NewGroupModal';
import StarredMessagesModal from './StarredMessagesModal';
import { AppLockSetupModal } from './AppLock';
import AppearanceSettings from './AppearanceSettings';
import PrivacySettings from './PrivacySettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import ChatSettings from './ChatSettings';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import HelpSettings from './HelpSettings';
import AdminPanel from './AdminPanel';
import StatusViewer from './StatusViewer';
import CreateStatusModal from './CreateStatusModal';
import NewCommunityModal from './NewCommunityModal';
import CommunityDetailModal from './CommunityDetailModal';
import BatiyauLogo from './BatiyauLogo';
import {
  PhoneIcon,
  IncomingCallIcon,
  OutgoingCallIcon,
  SearchIcon,
  VideoCallIcon,
  CommunityIcon,
  AnnouncementIcon,
  CirclePlusIcon,
  PencilIcon,
  CameraIcon,
  GearIcon,
} from './CallIcons';
import api from '../services/api';

const Sidebar = ({ onConversationSelect, isMobile, onClose, onLockApp }) => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const isAdmin = ['superadmin', 'admin', 'moderator', 'support_admin', 'security_admin'].includes(user?.role);
  const {
    conversations,
    allUsers,
    calls,
    activeConversation,
    messages,
    selectConversation,
    startConversation,
    startCall,
    clearCalls,
    loading,
    usersLoading,
    callsLoading,
    isUserOnline,
    typingUsers,
    markAllAsRead,
    bulkDeleteConversations,
    // Status (Stories)
    myStatuses,
    recentUpdates,
    viewedUpdates,
    // Communities
    communities,
    // Global navigation & modals
    sidebarNavTab,
    setSidebarNavTab,
    showUserListModal,
    setShowUserListModal,
    showCreateStatusModalGlobal,
    setShowCreateStatusModalGlobal,
    showNewCommunityModalGlobal,
    setShowNewCommunityModalGlobal,
    // Archived chats
    archivedChatIds = [],
    toggleArchiveConversation,
  } = useChat();

  // Navigation tab synced globally with empty chat state
  const navTab = sidebarNavTab || 'chats';
  const setNavTab = setSidebarNavTab;

  // Archived chats view state
  const [viewArchived, setViewArchived] = useState(false);

  // Status & Communities modal states
  const [showCreateStatusModal, setShowCreateStatusModal] = useState(false);
  const [createStatusInitialType, setCreateStatusInitialType] = useState('text');
  const [activeViewingStatusGroup, setActiveViewingStatusGroup] = useState(null);
  const [showNewCommunityModal, setShowNewCommunityModal] = useState(false);
  const [selectedCommunityForDetail, setSelectedCommunityForDetail] = useState(null);
  const [viewedUpdatesExpanded, setViewedUpdatesExpanded] = useState(true);

  // Sub-filter in calls: 'all' | 'missed'
  const [callFilter, setCallFilter] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showChatsMenu, setShowChatsMenu] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showAppLockModal, setShowAppLockModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const chatsMenuRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Settings Panel states
  const [settingsView, setSettingsView] = useState('main'); // 'main' | 'profile'
  const [settingsSearch, setSettingsSearch] = useState('');
  const [editProfileField, setEditProfileField] = useState(null); // 'name' | 'bio' | 'phoneNumber' | 'profilePicture'
  const [editProfileValue, setEditProfileValue] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  const handleStartEditProfile = (field, currentVal) => {
    setEditProfileField(field);
    setEditProfileValue(currentVal || '');
  };

  const handleCancelEditProfile = () => {
    setEditProfileField(null);
    setEditProfileValue('');
  };

  const handleSaveProfileField = async (field) => {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const payload = {
        name: field === 'name' ? editProfileValue.trim() : user?.name,
        bio: field === 'bio' ? editProfileValue.trim() : user?.bio,
        phoneNumber: field === 'phoneNumber' ? editProfileValue.trim() : user?.phoneNumber,
        profilePicture:
          field === 'profilePicture' ? editProfileValue.trim() : user?.profilePicture,
      };
      const { data } = await api.put('/users/profile', payload);
      if (updateUser) {
        updateUser({ ...user, ...data });
      }
      setEditProfileField(null);
      setEditProfileValue('');
      showToast('Profile updated successfully ✓');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    const phone = user?.phoneNumber || '';
    if (!phone) {
      showToast('No phone number saved yet');
      return;
    }
    navigator.clipboard.writeText(phone);
    setPhoneCopied(true);
    showToast('Phone number copied to clipboard! 📋');
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatsMenuRef.current && !chatsMenuRef.current.contains(e.target)) {
        setShowChatsMenu(false);
      }
    };
    if (showChatsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatsMenu]);

  const handleToggleSelectChat = (convId) => {
    setSelectedChatIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleToggleSelectAll = () => {
    const allConvIds = chatListItems
      .filter((item) => item.type === 'conversation')
      .map((item) => item.conversation._id);

    if (selectedChatIds.length === allConvIds.length) {
      setSelectedChatIds([]);
    } else {
      setSelectedChatIds(allConvIds);
    }
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedChatIds.length === 0) return;
    if (window.confirm(`Delete ${selectedChatIds.length} selected chat(s)?`)) {
      try {
        if (bulkDeleteConversations) {
          await bulkDeleteConversations(selectedChatIds);
        }
        showToast(`${selectedChatIds.length} chat(s) deleted`);
        setSelectedChatIds([]);
        setIsSelectionMode(false);
      } catch (err) {
        console.error('Failed to delete chats:', err);
      }
    }
  };

  // Conversation click
  const handleConversationClick = async (conv) => {
    await selectConversation(conv);
    if (onConversationSelect) onConversationSelect(conv);
    if (isMobile && onClose) onClose();
  };

  // User click from "All Users" list
  const handleUserClick = async (targetUser) => {
    try {
      const conv = await startConversation(targetUser._id);
      await selectConversation(conv);
      if (onConversationSelect) onConversationSelect(conv);
      if (isMobile && onClose) onClose();
    } catch (err) {
      console.error('Failed to open chat with user:', err);
    }
  };

  // Conversation ka display naam get karo
  const getConversationName = (conv) => {
    if (conv.isGroup) return conv.groupName;
    const other = conv.participants?.find((p) => p._id !== user?._id);
    return other?.name || 'Unknown User';
  };

  // Conversation ka other user get karo
  const getOtherUser = (conv) => {
    if (conv.isGroup) return null;
    return conv.participants?.find(
      (p) => (p?._id || p)?.toString() !== user?._id?.toString()
    );
  };

  // Last message text
  const getLastMessageText = (msg) => {
    if (!msg) return '';
    // If message was deleted for this user, show nothing
    if (
      msg.deletedFor &&
      user?._id &&
      Array.isArray(msg.deletedFor) &&
      msg.deletedFor.some((id) => (id?._id || id)?.toString() === user._id.toString())
    ) {
      return '';
    }
    if (msg.isDeleted) return '🚫 Message deleted';
    if (msg.messageType === 'image') return '📷 Photo';
    if (msg.messageType === 'video') return '🎥 Video';
    if (msg.messageType === 'audio') return '🎧 Audio';
    if (msg.messageType === 'document' || msg.messageType === 'file') return '📎 Document';
    return msg.message?.length > 35 ? msg.message.slice(0, 35) + '...' : msg.message;
  };

  // Time format
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  // Call duration format
  const formatCallDuration = (sec) => {
    if (!sec || sec === 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Unified chat items: existing conversations + all other registered users
  const chatListItems = (() => {
    const items = [];
    const userMapWithConv = new Set();

    // 1. Existing conversations
    conversations.forEach((conv) => {
      const isArchived = Array.isArray(archivedChatIds) && archivedChatIds.some((id) => id?.toString() === conv._id?.toString());
      if (viewArchived) {
        if (!isArchived) return; // Only show archived chats in archived view
      } else {
        if (isArchived) return; // Hide archived chats from regular view
      }

      const otherUser = getOtherUser(conv);
      if (otherUser) {
        userMapWithConv.add(otherUser._id);
      }

      const isCurrentActive =
        activeConversation?._id &&
        conv._id &&
        activeConversation._id.toString() === conv._id.toString();

      // If this conversation is currently open, derive the real-time last message from active messages
      const effectiveLastMessage = isCurrentActive
        ? (messages.length > 0 ? messages[messages.length - 1] : null)
        : conv.lastMessage;

      const isCurrentActiveEmpty = isCurrentActive && messages.length === 0;
      const isLastMessageDeleted = !!effectiveLastMessage?.isDeleted;
      const isDeletedForMe =
        isCurrentActiveEmpty ||
        !effectiveLastMessage ||
        (effectiveLastMessage?.deletedFor &&
          user?._id &&
          Array.isArray(effectiveLastMessage.deletedFor) &&
          effectiveLastMessage.deletedFor.some((id) => (id?._id || id)?.toString() === user._id.toString()));

      const hasVisibleMessage = !isDeletedForMe && !!effectiveLastMessage;
      const lastMsgSender = effectiveLastMessage?.sender?._id || effectiveLastMessage?.sender;
      // Do NOT show ticks on deleted messages or when no message
      const isLastMessageMine = !!(
        hasVisibleMessage &&
        !isLastMessageDeleted &&
        lastMsgSender &&
        user?._id &&
        lastMsgSender.toString() === user._id.toString()
      );
      const isLastMessageRead = !!effectiveLastMessage?.isRead;
      const effectiveTime = hasVisibleMessage
        ? (effectiveLastMessage.createdAt || conv.lastMessageAt)
        : null;

      items.push({
        type: 'conversation',
        id: conv._id,
        conversation: conv,
        user: otherUser,
        isGroup: conv.isGroup,
        name: getConversationName(conv),
        lastMessage: hasVisibleMessage ? getLastMessageText(effectiveLastMessage) : '',
        isLastMessageMine,
        isLastMessageRead,
        time: effectiveTime,
        unreadCount: conv.unreadCount || 0,
      });
    });

    // 2. All other registered users (only in normal chats view when actively searching)
    if (!viewArchived && searchQuery && searchQuery.trim()) {
      allUsers.forEach((u) => {
        if (!userMapWithConv.has(u._id)) {
          items.push({
            type: 'user',
            id: u._id,
            user: u,
            isGroup: false,
            name: u.contactName || u.name,
            lastMessage: u.bio || `@${u.username}`,
            time: null,
            unreadCount: 0,
          });
        }
      });
    }

    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.lastMessage && item.lastMessage.toLowerCase().includes(q)) ||
        (item.user?.username && item.user.username.toLowerCase().includes(q))
    );
  })();

  // Check if a call was missed by current user (WhatsApp rule: I am the receiver and it was not answered/declined)
  const isCallMissedForMe = (c) => {
    const receiverId = (c.receiver?._id || c.receiver)?.toString();
    const myId = user?._id?.toString();
    const isReceiver = receiverId && myId && receiverId === myId;
    return isReceiver && (c.status === 'missed' || c.status === 'declined');
  };

  // Count missed calls
  const missedCallsCount = calls.filter(isCallMissedForMe).length;

  // Filter calls
  const filteredCalls = calls.filter((c) => {
    const isCaller = (c.caller?._id || c.caller)?.toString() === user?._id?.toString();
    const other = isCaller ? c.receiver : c.caller;
    const name = (other?.name || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    if (callFilter === 'missed') {
      return matchesSearch && isCallMissedForMe(c);
    }
    return matchesSearch;
  });

  // Count unread conversations
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div
      style={{
        width: isMobile ? '100%' : '500px',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* 1. Left Icon Rail (Side Navigation Bar: Chats, Calls, Settings) */}
      <div
        style={{
          width: '68px',
          height: '100%',
          background: 'var(--bg-rail, #0a2e2b)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Top: App Logo & Main Navigation Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
          {/* Logo - Batiyau Fifth Image Brand Logo */}
          <div
            title="Batiyau"
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: 8,
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onClick={() => setNavTab('chats')}
          >
            <BatiyauLogo size={44} idPrefix="sidebar-rail" />
          </div>

          {/* Nav Item: Chats (Message Icon matching user design) */}
          <button
            id="nav-tab-chats"
            onClick={() => setNavTab('chats')}
            title="Chats"
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              border: 'none',
              background: navTab === 'chats' ? '#184b47' : 'transparent',
              color: navTab === 'chats' ? '#4ee3c5' : '#8da4ad',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'var(--transition)',
            }}
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 14.5a3.5 3.5 0 0 1-3.5 3.5H8.2L4.5 21.5V6A3.5 3.5 0 0 1 8 2.5h9.5A3.5 3.5 0 0 1 21 6v8.5z" />
              <line x1="8.5" y1="8" x2="16.5" y2="8" />
              <line x1="8.5" y1="11.5" x2="16.5" y2="11.5" />
              <line x1="8.5" y1="15" x2="13" y2="15" />
            </svg>
            {totalUnread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 5px',
                  lineHeight: 1.2,
                }}
              >
                {totalUnread}
              </span>
            )}
          </button>

          {/* Nav Item: Status (WhatsApp Status Ring Icon) */}
          <button
            id="nav-tab-status"
            onClick={() => setNavTab('status')}
            title="Status"
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              border: 'none',
              background: navTab === 'status' ? '#184b47' : 'transparent',
              color: navTab === 'status' ? '#4ee3c5' : '#8da4ad',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'var(--transition)',
            }}
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
            >
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
              <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
              <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
            </svg>
            {recentUpdates.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 7,
                  width: 8,
                  height: 8,
                  background: 'var(--accent-primary)',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px var(--accent-primary)',
                }}
              />
            )}
          </button>

          {/* Nav Item: Communities (WhatsApp Community 3-People Icon) */}
          <button
            id="nav-tab-communities"
            onClick={() => setNavTab('communities')}
            title="Communities"
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              border: 'none',
              background: navTab === 'communities' ? '#184b47' : 'transparent',
              color: navTab === 'communities' ? '#4ee3c5' : '#8da4ad',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'var(--transition)',
            }}
          >
            <CommunityIcon size={24} color={navTab === 'communities' ? '#4ee3c5' : '#8da4ad'} />
          </button>

          {/* Nav Item: Calls (Handset Icon matching user design) */}
          <button
            id="nav-tab-calls"
            onClick={() => setNavTab('calls')}
            title="Calls"
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              border: 'none',
              background: navTab === 'calls' ? '#184b47' : 'transparent',
              color: navTab === 'calls' ? '#4ee3c5' : '#8da4ad',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'var(--transition)',
            }}
          >
            <PhoneIcon size={22} color={navTab === 'calls' ? '#4ee3c5' : '#8da4ad'} />
            {missedCallsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'var(--danger-color)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 5px',
                  lineHeight: 1.2,
                }}
              >
                {missedCallsCount}
              </span>
            )}
          </button>

          {/* Nav Item: Admin Panel (Directly under Calls, opens full Admin Dashboard) */}
          {isAdmin && (
            <button
              id="nav-tab-admin"
              onClick={() => navigate('/admin')}
              title="Admin Dashboard Control Center"
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                border: 'none',
                background: navTab === 'admin' ? '#184b47' : 'transparent',
                color: navTab === 'admin' ? '#4ee3c5' : '#8da4ad',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'var(--transition)',
              }}
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom: Settings & Profile (Replaced logout with settings) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Nav Item: Settings */}
          <button
            id="nav-tab-settings"
            onClick={() => setNavTab('settings')}
            title="Settings"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: 'none',
              background: navTab === 'settings' ? '#184b47' : 'transparent',
              color: navTab === 'settings' ? '#4ee3c5' : '#8da4ad',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              if (navTab !== 'settings') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onMouseLeave={(e) => {
              if (navTab !== 'settings') e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* User Profile Avatar with Online indicator */}
          <div
            id="sidebar-profile-avatar"
            onClick={() => navigate('/profile')}
            title={`${user?.name} (Click to edit profile)`}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Avatar user={user} size={40} showOnline isOnline />
          </div>
        </div>
      </div>

      {/* 2. Main Content Panel (Chats / Calls / Settings) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* VIEW A: CHATS */}
        {navTab === 'chats' && (
          <>
            {/* Header */}
            <div
              style={{
                padding: '18px 16px 12px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {isSelectionMode ? (
                /* Select Chats Mode Action Bar */
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    background: '#164642',
                    padding: '8px 12px',
                    borderRadius: 10,
                    color: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedChatIds([]);
                      }}
                      title="Cancel selection"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: 16,
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      ✕
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {selectedChatIds.length} selected
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={handleToggleSelectAll}
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#ffffff',
                        padding: '4px 8px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {selectedChatIds.length ===
                      chatListItems.filter((c) => c.type === 'conversation').length
                        ? 'Deselect'
                        : 'Select All'}
                    </button>
                    <button
                      disabled={selectedChatIds.length === 0}
                      onClick={handleDeleteSelectedChats}
                      title="Delete selected chats"
                      style={{
                        background: 'none',
                        border: 'none',
                        color:
                          selectedChatIds.length === 0
                            ? 'rgba(255,255,255,0.4)'
                            : '#f87171',
                        cursor:
                          selectedChatIds.length === 0
                            ? 'not-allowed'
                            : 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>

                    {/* Archive/Unarchive selected chats */}
                    <button
                      id="archive-selected-chats-btn"
                      onClick={() => {
                        selectedChatIds.forEach((id) => toggleArchiveConversation && toggleArchiveConversation(id));
                        setIsSelectionMode(false);
                        setSelectedChatIds([]);
                        showToast(`${selectedChatIds.length} chat(s) updated in archive 🗄️`);
                      }}
                      title="Archive/Unarchive selected chats"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4ee3c5',
                        fontSize: 16,
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="21 8 21 21 3 21 3 8" />
                        <rect x="1" y="3" width="22" height="5" />
                        <line x1="10" y1="12" x2="14" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Chats Header */
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <h2
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Chats
                  </h2>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      position: 'relative',
                    }}
                  >
                    {/* Menu Vertical button (Pencil ke left side) */}
                    <button
                      id="chats-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowChatsMenu((prev) => !prev);
                      }}
                      title="Menu"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: showChatsMenu
                          ? 'rgba(78, 227, 197, 0.18)'
                          : '#164642',
                        border: showChatsMenu
                          ? '1.5px solid #4ee3c5'
                          : 'none',
                        color: showChatsMenu ? '#4ee3c5' : '#ffffff',
                        fontSize: 16,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition)',
                        boxShadow: '0 2px 6px rgba(10, 46, 43, 0.2)',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="5" r="2.1" />
                        <circle cx="12" cy="12" r="2.1" />
                        <circle cx="12" cy="19" r="2.1" />
                      </svg>
                    </button>

                    {/* Pencil (New Message) Button */}
                    <button
                      id="new-chat-btn"
                      onClick={() => setShowUserList(true)}
                      title="New Message"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#164642',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: 16,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition)',
                        boxShadow: '0 2px 6px rgba(10, 46, 43, 0.2)',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu (Exact 6 options from screenshot) */}
                    {showChatsMenu && (
                      <div
                        ref={chatsMenuRef}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          width: 205,
                          background: '#111b21',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 12,
                          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.75)',
                          padding: '6px 0',
                          zIndex: 1000,
                          animation: 'fadeIn 0.15s ease',
                        }}
                      >
                        {/* 1. New group */}
                        <button
                          id="menu-item-new-group"
                          onClick={() => {
                            setShowChatsMenu(false);
                            setShowNewGroupModal(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 18px',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#e9edef',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'rgba(255, 255, 255, 0.08)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                          </svg>
                          <span>New group</span>
                        </button>

                        {/* 2. Starred messages */}
                        <button
                          id="menu-item-starred"
                          onClick={() => {
                            setShowChatsMenu(false);
                            setShowStarredModal(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 18px',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#e9edef',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'rgba(255, 255, 255, 0.08)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span>Starred messages</span>
                        </button>

                        {/* 3. Select chats */}
                        <button
                          id="menu-item-select-chats"
                          onClick={() => {
                            setShowChatsMenu(false);
                            setIsSelectionMode(true);
                            setSelectedChatIds([]);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 18px',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#e9edef',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'rgba(255, 255, 255, 0.08)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          <span>Select chats</span>
                        </button>

                        {/* 4. Mark all as read */}
                        <button
                          id="menu-item-mark-all-read"
                          onClick={async () => {
                            setShowChatsMenu(false);
                            try {
                              if (markAllAsRead) await markAllAsRead();
                              showToast('All chats marked as read ✓✓');
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 18px',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#e9edef',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'rgba(255, 255, 255, 0.08)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            <line x1="8" y1="9" x2="16" y2="9" />
                            <line x1="8" y1="13" x2="14" y2="13" />
                          </svg>
                          <span>Mark all as read</span>
                        </button>

                        {/* Divider */}
                        <div
                          style={{
                            margin: '5px 0',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        />

                        {/* 5. App lock */}
                        <button
                          id="menu-item-app-lock"
                          onClick={() => {
                            setShowChatsMenu(false);
                            const pin = user?._id
                              ? localStorage.getItem(`chatapp_pin_${user._id}`)
                              : null;
                            if (pin) {
                              if (onLockApp) onLockApp();
                            } else {
                              setShowAppLockModal(true);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 18px',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#e9edef',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'rgba(255, 255, 255, 0.08)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>App lock</span>
                        </button>

                        {/* Admin Dashboard - For Admins */}
                        {isAdmin && (
                          <button
                            id="menu-item-admin"
                            onClick={() => {
                              setShowChatsMenu(false);
                              navigate('/admin');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: '10px 18px',
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              color: '#4ee3c5',
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                'rgba(78, 227, 197, 0.12)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'transparent')
                            }
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <path d="M9 12l2 2 4-4" />
                            </svg>
                            <span>Admin Dashboard</span>
                          </button>
                        )}

                        {/* 6. Log out */}
                        <button
                          id="menu-item-logout"
                          onClick={() => {
                            setShowChatsMenu(false);
                            logout();
                            navigate('/login');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '10px 18px',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#e9edef',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'rgba(255, 255, 255, 0.08)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>Log out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="12" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  id="search-conversations"
                  type="text"
                  placeholder="Search chats or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{
                    paddingLeft: 38,
                    paddingTop: 8,
                    paddingBottom: 8,
                    fontSize: '0.85rem',
                    borderRadius: 24,
                    border: '1.5px solid var(--border-color)',
                    background: '#ffffff',
                    color: '#111827',
                  }}
                />
              </div>

            </div>

            {/* Chats List (All Conversations & Users) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {/* Archived Chats Banner / View Header */}
              {viewArchived ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    marginBottom: 10,
                    borderRadius: 10,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => setViewArchived(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00a884',
                      cursor: 'pointer',
                      fontSize: 18,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Back to all chats"
                  >
                    ←
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Archived chats ({archivedChatIds.length})
                  </span>
                </div>
              ) : (
                archivedChatIds.length > 0 && (
                  <div
                    onClick={() => setViewArchived(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      marginBottom: 8,
                      borderRadius: 10,
                      background: 'rgba(0, 168, 132, 0.08)',
                      border: '1px solid rgba(0, 168, 132, 0.2)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 168, 132, 0.16)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 168, 132, 0.08)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16 }}>🗄️</span>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        Archived
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#00a884', fontWeight: 700 }}>
                      {archivedChatIds.length}
                    </span>
                  </div>
                )
              )}

              {loading && usersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <div className="spinner" style={{ width: 28, height: 28 }} />
                </div>
              ) : chatListItems.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 16px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                  <p style={{ fontSize: '0.9rem', marginBottom: 6 }}>No chats or users found</p>
                </div>
              ) : (
                chatListItems.map((item) => {
                  const isConv = item.type === 'conversation';
                  const isActive = isConv && activeConversation?._id === item.conversation?._id;
                  const isOnline = item.user ? isUserOnline(item.user._id) : false;
                  const isItemTyping = isConv
                    ? !!typingUsers[item.id]
                    : Object.values(typingUsers).some((t) => t?.userId?.toString() === item.user?._id?.toString());
                  const isSelected = isConv && selectedChatIds.includes(item.conversation?._id);

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      id={`chat-item-${item.id}`}
                      className={`conversation-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (isSelectionMode) {
                          if (isConv) handleToggleSelectChat(item.conversation._id);
                        } else {
                          if (isConv) {
                            handleConversationClick(item.conversation);
                          } else {
                            handleUserClick(item.user);
                          }
                        }
                      }}
                      style={{
                        background: isSelected ? 'rgba(78, 227, 197, 0.12)' : undefined,
                      }}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && isConv && (
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            border: isSelected ? '2px solid #4ee3c5' : '1.5px solid var(--border-color)',
                            background: isSelected ? '#4ee3c5' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0d2825',
                            fontSize: 11,
                            fontWeight: 800,
                            marginRight: 8,
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && '✓'}
                        </div>
                      )}

                      <div style={{ position: 'relative' }}>
                        <Avatar
                          user={
                            item.isGroup
                              ? { name: item.name, profilePicture: item.conversation?.groupImage }
                              : item.user
                          }
                          size={46}
                          showOnline={!item.isGroup}
                          isOnline={isOnline}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </span>
                            {(item.user?.isOfficial || item.user?.username === 'batiyao' || (item.name && item.name.toLowerCase().includes('batiyao'))) && (
                              <span
                                title="Official Batiyao Channel"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  fontSize: '0.74rem',
                                  color: '#10b981',
                                  flexShrink: 0,
                                }}
                              >
                                🛡️
                              </span>
                            )}
                          </span>
                          {item.time ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                              {formatTime(item.time)}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: isOnline ? 'var(--online-color)' : 'var(--text-muted)',
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              {isOnline ? '● Online' : 'Offline'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {isItemTyping ? (
                            <span
                              style={{
                                fontSize: '0.78rem',
                                color: '#00a884',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              typing...
                              <span style={{ display: 'inline-flex', gap: 2 }}>
                                <span className="typing-dot" style={{ width: 4, height: 4, background: '#00a884' }} />
                                <span className="typing-dot" style={{ width: 4, height: 4, background: '#00a884' }} />
                                <span className="typing-dot" style={{ width: 4, height: 4, background: '#00a884' }} />
                              </span>
                            </span>
                          ) : (
                            <p
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {item.isLastMessageMine && (
                                <svg
                                  width="14"
                                  height="10"
                                  viewBox="0 0 16 11"
                                  fill="none"
                                  style={{ flexShrink: 0 }}
                                  title={item.isLastMessageRead ? 'Seen' : 'Sent'}
                                >
                                  <path
                                    d="M1 5.5L4 8.5L10.5 2"
                                    stroke={item.isLastMessageRead ? '#53bdeb' : 'var(--text-muted)'}
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M5.5 5.5L8.5 8.5L15 2"
                                    stroke={item.isLastMessageRead ? '#53bdeb' : 'var(--text-muted)'}
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {item.lastMessage}
                              </span>
                            </p>
                          )}
                          {item.unreadCount > 0 && (
                            <span
                              id={`unread-badge-${item.id}`}
                              style={{
                                background: 'var(--accent-primary)',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                borderRadius: 12,
                                minWidth: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 6px',
                                marginLeft: 6,
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(20, 66, 62, 0.35)',
                              }}
                            >
                              {item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* VIEW: STATUS (WhatsApp Stories) */}
        {navTab === 'status' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div
              style={{
                padding: '18px 16px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Status
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Text status pencil (Image 5) */}
                <button
                  id="create-text-status-btn"
                  onClick={() => {
                    setCreateStatusInitialType('text');
                    setShowCreateStatusModal(true);
                  }}
                  title="New Text Status"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <PencilIcon size={18} color="var(--text-primary)" />
                </button>
                {/* Media status camera (Image with camera) */}
                <button
                  id="create-media-status-btn"
                  onClick={() => {
                    setCreateStatusInitialType('media');
                    setShowCreateStatusModal(true);
                  }}
                  title="New Photo/Video Status"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <CameraIcon size={19} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* Status list body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
              {/* 1. My Status Item */}
              <div
                id="my-status-item"
                onClick={() => {
                  if (myStatuses.length > 0) {
                    setActiveViewingStatusGroup({
                      user,
                      statuses: myStatuses,
                    });
                  } else {
                    setCreateStatusInitialType('text');
                    setShowCreateStatusModal(true);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  marginBottom: 16,
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar with Status Ring or Plus Badge */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      borderRadius: '50%',
                      padding: myStatuses.length > 0 ? 2.5 : 0,
                      border: myStatuses.length > 0 ? '2.5px solid #00a884' : 'none',
                    }}
                  >
                    <Avatar user={user} size={48} />
                  </div>
                  {myStatuses.length === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg-secondary)',
                      }}
                    >
                      <CirclePlusIcon size={16} color="#ffffff" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                    My status
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {myStatuses.length > 0
                      ? formatTime(myStatuses[myStatuses.length - 1].createdAt)
                      : 'Tap to add status update'}
                  </p>
                </div>

                {myStatuses.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreateStatusInitialType('text');
                        setShowCreateStatusModal(true);
                      }}
                      title="Add status"
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CirclePlusIcon size={18} color="var(--text-primary)" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Recent Updates Section */}
              {recentUpdates.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      padding: '4px 12px 8px',
                    }}
                  >
                    Recent Updates
                  </h3>
                  {recentUpdates.map((group) => (
                    <div
                      key={group.user?._id}
                      onClick={() => setActiveViewingStatusGroup(group)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        style={{
                          borderRadius: '50%',
                          padding: 2.5,
                          border: '2.5px solid #00a884',
                        }}
                      >
                        <Avatar user={group.user} size={46} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            marginBottom: 2,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {group.user?.name || 'Contact'}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatTime(group.lastUpdated)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Viewed Updates Section */}
              {viewedUpdates.length > 0 && (
                <div>
                  <div
                    onClick={() => setViewedUpdatesExpanded((v) => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Viewed Updates ({viewedUpdates.length})
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {viewedUpdatesExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {viewedUpdatesExpanded &&
                    viewedUpdates.map((group) => (
                      <div
                        key={group.user?._id}
                        onClick={() => setActiveViewingStatusGroup(group)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          opacity: 0.85,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div
                          style={{
                            borderRadius: '50%',
                            padding: 2.5,
                            border: '2px solid rgba(130, 145, 155, 0.4)',
                          }}
                        >
                          <Avatar user={group.user} size={46} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                              marginBottom: 2,
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {group.user?.name || 'Contact'}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatTime(group.lastUpdated)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Empty State */}
              {myStatuses.length === 0 && recentUpdates.length === 0 && viewedUpdates.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <CameraIcon size={32} color="var(--text-muted)" />
                    </div>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                    No status updates yet
                  </p>
                  <p style={{ fontSize: '0.78rem', marginBottom: 16 }}>
                    Share photos, videos, or text updates that disappear after 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setCreateStatusInitialType('text');
                      setShowCreateStatusModal(true);
                    }}
                    style={{
                      background: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      padding: '8px 18px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Add Status Update
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: COMMUNITIES (WhatsApp Communities) */}
        {navTab === 'communities' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div
              style={{
                padding: '18px 16px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Communities
              </h2>
              <button
                id="new-community-btn"
                onClick={() => setShowNewCommunityModal(true)}
                title="New Community"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                }}
              >
                <CirclePlusIcon size={20} color="#ffffff" />
              </button>
            </div>

            {/* Content List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
              {/* New Community CTA row */}
              <div
                onClick={() => setShowNewCommunityModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  marginBottom: 12,
                  background: 'var(--bg-tertiary)',
                  border: '1px dashed var(--border-color)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CirclePlusIcon size={22} color="#ffffff" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    New Community
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Add groups & send announcements
                  </p>
                </div>
              </div>

              {/* Communities list */}
              {communities && communities.length > 0 ? (
                communities.map((comm) => (
                  <div
                    key={comm._id}
                    style={{
                      marginBottom: 14,
                      background: 'var(--bg-secondary)',
                      borderRadius: 14,
                      border: '1px solid var(--border-subtle)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Community Parent Header */}
                    <div
                      onClick={() => setSelectedCommunityForDetail(comm)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: 'var(--bg-tertiary)',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      {comm.icon ? (
                        <img
                          src={comm.icon}
                          alt={comm.name}
                          style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CommunityIcon size={24} color="var(--text-primary)" />
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {comm.name}
                        </h4>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {comm.members?.length || 1} members • {(comm.groups?.length || 0) + 1} groups
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCommunityForDetail(comm);
                        }}
                        title="Community Info"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: 16,
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <GearIcon size={18} color="currentColor" />
                      </button>
                    </div>

                    {/* Community Sub-items: Announcement Group */}
                    {comm.announcementGroup && (
                      <div
                        onClick={() => handleConversationClick(comm.announcementGroup)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          borderBottom: comm.groups?.length > 0 ? '1px solid var(--border-subtle)' : 'none',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AnnouncementIcon size={18} color="var(--text-primary)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {comm.announcementGroup.groupName || 'Announcements'}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '0.74rem',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {getLastMessageText(comm.announcementGroup.lastMessage) || 'Admin announcements'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Community Sub-items: Child Groups */}
                    {comm.groups &&
                      comm.groups.map((grp) => (
                        <div
                          key={grp._id}
                          onClick={() => handleConversationClick(grp)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 16px',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Avatar
                            user={{ name: grp.groupName, profilePicture: grp.groupImage }}
                            size={36}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {grp.groupName}
                            </span>
                            <p
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {getLastMessageText(grp.lastMessage) || 'Tap to chat'}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ))
              ) : (
                /* WhatsApp Style Empty Community Explainer */
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)' }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                    }}
                  >
                    <CommunityIcon size={30} color="var(--text-primary)" />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Stay connected with a community
                  </h3>
                  <p style={{ fontSize: '0.8rem', lineHeight: 1.4, marginBottom: 16 }}>
                    Communities bring members together in topic-based groups, and make it easy to get admin announcements.
                  </p>
                  <button
                    onClick={() => setShowNewCommunityModal(true)}
                    style={{
                      background: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      padding: '9px 20px',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    Start your Community
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW B: CALLS */}
        {navTab === 'calls' && (
          <>
            {/* Header */}
            <div
              style={{
                padding: '18px 16px 12px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Calls</h2>
                {calls.length > 0 && (
                  <button
                    onClick={clearCalls}
                    title="Clear Call History"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger-color)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    Clear History
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <SearchIcon size={16} color="var(--text-muted)" />
                </span>
                <input
                  id="search-calls"
                  type="text"
                  placeholder="Search calls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: 38, paddingTop: 9, paddingBottom: 9, fontSize: '0.85rem' }}
                />
              </div>

              {/* Filter: All vs Missed */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: 3,
                  borderRadius: 10,
                  gap: 4,
                }}
              >
                <button
                  onClick={() => setCallFilter('all')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: callFilter === 'all' ? 'var(--accent-primary)' : 'transparent',
                    color: callFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  All Calls ({calls.length})
                </button>
                <button
                  onClick={() => setCallFilter('missed')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: callFilter === 'missed' ? 'var(--accent-primary)' : 'transparent',
                    color: callFilter === 'missed' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  Missed ({missedCallsCount})
                </button>
              </div>
            </div>

            {/* Calls List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {callsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <div className="spinner" style={{ width: 28, height: 28 }} />
                </div>
              ) : filteredCalls.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {callFilter === 'missed' ? (
                    <>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 14px',
                        }}
                      >
                        <IncomingCallIcon size={28} color="#f87171" />
                      </div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        No missed calls
                      </p>
                      <p style={{ fontSize: '0.78rem' }}>
                        Missed calls will appear here in real time.
                      </p>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'rgba(78, 227, 197, 0.12)',
                          color: '#4ee3c5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 14px',
                        }}
                      >
                        <PhoneIcon size={28} color="#4ee3c5" />
                      </div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        No call history
                      </p>
                      <p style={{ fontSize: '0.78rem' }}>
                        Calls you make or receive will appear here.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                filteredCalls.map((call) => {
                  const isCaller = (call.caller?._id || call.caller)?.toString() === user?._id?.toString();
                  const otherUser = isCaller ? call.receiver : call.caller;
                  const isOnline = otherUser ? isUserOnline(otherUser._id) : false;

                  const isMissed = !isCaller && (call.status === 'missed' || call.status === 'declined');
                  const isOutgoing = isCaller;
                  const isIncomingAnswered = !isCaller && !isMissed;

                  return (
                    <div
                      key={call._id}
                      id={`call-log-${call._id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 10px',
                        borderRadius: 'var(--radius-md)',
                        transition: 'var(--transition)',
                        marginBottom: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Avatar user={otherUser} size={44} showOnline isOnline={isOnline} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: isMissed ? '#f87171' : 'var(--text-primary)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {otherUser?.name || 'Unknown User'}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: 3,
                          }}
                        >
                          {/* Direction icon from user images */}
                          {isMissed ? (
                            <IncomingCallIcon size={16} color="#f87171" />
                          ) : isOutgoing ? (
                            <OutgoingCallIcon size={16} color="#38bdf8" />
                          ) : (
                            <IncomingCallIcon size={16} color="#22c55e" />
                          )}

                          <span
                            style={{
                              color: isMissed ? '#f87171' : 'inherit',
                              fontWeight: isMissed ? 600 : 400,
                            }}
                          >
                            {isMissed
                              ? (call.status === 'declined' ? 'Declined' : 'Missed')
                              : (call.type === 'video' ? 'Video' : 'Voice')}
                          </span>
                          <span>•</span>
                          <span>{formatTime(call.createdAt)}</span>
                          {call.duration > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatCallDuration(call.duration)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quick Redial button */}
                      {otherUser && (
                        <button
                          onClick={() => startCall(otherUser, call.type || 'audio')}
                          title={`Call ${otherUser.name}`}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'rgba(20, 66, 62, 0.12)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'var(--transition)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-primary)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(20, 66, 62, 0.12)';
                            e.currentTarget.style.color = 'var(--accent-primary)';
                          }}
                        >
                          {call.type === 'video' ? (
                            <VideoCallIcon size={18} color="currentColor" />
                          ) : (
                            <PhoneIcon size={17} color="currentColor" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* VIEW C: SETTINGS (WhatsApp Style with Search, User Profile, and Interactive Profile Sub-page) */}
        {navTab === 'settings' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              background: 'var(--bg-primary)',
              overflowY: 'auto',
            }}
          >
            {settingsView === 'profile' ? (
              /* SUB-PAGE: EDIT PROFILE (Opens on clicking user photo / card) */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Profile Sub-page Header */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <button
                    id="profile-subpage-back-btn"
                    onClick={() => {
                      setSettingsView('main');
                      setEditProfileField(null);
                    }}
                    title="Back to Settings"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4ee3c5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Profile
                  </h2>
                </div>

                {/* Profile Form Details */}
                <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto' }}>
                  {/* Photo Avatar with Edit/Change Option */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: 28,
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        padding: 3,
                        background: 'linear-gradient(135deg, #4ee3c5 0%, #164642 100%)',
                      }}
                      onClick={() =>
                        handleStartEditProfile('profilePicture', user?.profilePicture || '')
                      }
                      title="Click to change profile photo URL"
                    >
                      <Avatar user={user} size={92} showOnline isOnline />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#164642',
                          border: '2px solid var(--bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: 13,
                        }}
                      >
                        📷
                      </div>
                    </div>

                    {editProfileField === 'profilePicture' ? (
                      <div style={{ marginTop: 12, width: '100%', maxWidth: 320 }}>
                        <input
                          type="url"
                          placeholder="Paste image URL (https://...)"
                          value={editProfileValue}
                          onChange={(e) => setEditProfileValue(e.target.value)}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem',
                            outline: 'none',
                            marginBottom: 8,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={handleCancelEditProfile}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: '1px solid var(--border-subtle)',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveProfileField('profilePicture')}
                            disabled={savingProfile}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#164642',
                              color: '#ffffff',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: savingProfile ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {savingProfile ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        onClick={() =>
                          handleStartEditProfile('profilePicture', user?.profilePicture || '')
                        }
                        style={{
                          fontSize: '0.75rem',
                          color: '#4ee3c5',
                          marginTop: 8,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Change profile photo
                      </p>
                    )}
                  </div>

                  {/* Field 1: Your Name (Edit Option) */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 14,
                      padding: '16px',
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: '#4ee3c5',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 6,
                      }}
                    >
                      Your Name
                    </span>

                    {editProfileField === 'name' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            id="edit-name-input"
                            type="text"
                            maxLength={35}
                            value={editProfileValue}
                            onChange={(e) => setEditProfileValue(e.target.value)}
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid #4ee3c5',
                              background: 'var(--bg-hover)',
                              color: 'var(--text-primary)',
                              fontSize: '0.92rem',
                              outline: 'none',
                            }}
                          />
                          <button
                            id="save-name-btn"
                            onClick={() => handleSaveProfileField('name')}
                            disabled={savingProfile || !editProfileValue.trim()}
                            title="Save name"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#164642',
                              border: 'none',
                              color: '#ffffff',
                              cursor: savingProfile || !editProfileValue.trim() ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEditProfile}
                            title="Cancel"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {user?.name || 'Set your name'}
                        </p>
                        <button
                          id="edit-name-btn"
                          onClick={() => handleStartEditProfile('name', user?.name || '')}
                          title="Edit name"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#8da4ad',
                            cursor: 'pointer',
                            padding: 4,
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.35 }}>
                      This is not your username or PIN. This name will be visible to your ChatApp contacts.
                    </p>
                  </div>

                  {/* Field 2: About (Bio Edit Option) */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 14,
                      padding: '16px',
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: '#4ee3c5',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 6,
                      }}
                    >
                      About
                    </span>

                    {editProfileField === 'bio' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            id="edit-bio-input"
                            type="text"
                            maxLength={140}
                            value={editProfileValue}
                            onChange={(e) => setEditProfileValue(e.target.value)}
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid #4ee3c5',
                              background: 'var(--bg-hover)',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                              outline: 'none',
                            }}
                          />
                          <button
                            id="save-bio-btn"
                            onClick={() => handleSaveProfileField('bio')}
                            disabled={savingProfile}
                            title="Save about"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#164642',
                              border: 'none',
                              color: '#ffffff',
                              cursor: savingProfile ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEditProfile}
                            title="Cancel"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: user?.bio ? 'var(--text-primary)' : 'var(--text-muted)',
                            lineHeight: 1.4,
                          }}
                        >
                          {user?.bio || 'Hey there! I am using ChatApp.'}
                        </p>
                        <button
                          id="edit-bio-btn"
                          onClick={() =>
                            handleStartEditProfile('bio', user?.bio || 'Hey there! I am using ChatApp.')
                          }
                          title="Edit about"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#8da4ad',
                            cursor: 'pointer',
                            padding: 4,
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Field 3: Phone Number (With Copy & Edit Option) */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 14,
                      padding: '16px',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: '#4ee3c5',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 6,
                      }}
                    >
                      Phone Number
                    </span>

                    {editProfileField === 'phoneNumber' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            id="edit-phone-input"
                            type="tel"
                            value={editProfileValue}
                            onChange={(e) => setEditProfileValue(e.target.value)}
                            placeholder="+91 9876543210"
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid #4ee3c5',
                              background: 'var(--bg-hover)',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                              outline: 'none',
                            }}
                          />
                          <button
                            id="save-phone-btn"
                            onClick={() => handleSaveProfileField('phoneNumber')}
                            disabled={savingProfile}
                            title="Save phone"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#164642',
                              border: 'none',
                              color: '#ffffff',
                              cursor: savingProfile ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEditProfile}
                            title="Cancel"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: user?.phoneNumber ? 'var(--text-primary)' : 'var(--text-muted)',
                          }}
                        >
                          {user?.phoneNumber || 'No phone number set'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* Copy Mobile Number Button */}
                          <button
                            id="copy-phone-btn"
                            onClick={handleCopyPhone}
                            title="Copy mobile number"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 8,
                              border: '1px solid var(--border-subtle)',
                              background: phoneCopied ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-hover)',
                              color: phoneCopied ? '#4ade80' : '#4ee3c5',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {phoneCopied ? (
                              <>
                                <span>✓</span>
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Edit Phone Button */}
                          <button
                            onClick={() =>
                              handleStartEditProfile('phoneNumber', user?.phoneNumber || '')
                            }
                            title="Edit phone number"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#8da4ad',
                              cursor: 'pointer',
                              padding: 4,
                              fontSize: 15,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.35 }}>
                      Your phone number is used for contact matching on ChatApp.
                    </p>
                  </div>
                </div>
              </div>
            ) : settingsView === 'appearance' ? (
              <AppearanceSettings onBack={() => setSettingsView('main')} />
            ) : settingsView === 'privacy' ? (
              <PrivacySettings
                onBack={() => setSettingsView('main')}
                onLockApp={onLockApp}
              />
            ) : settingsView === 'account' ? (
              <AccountSettings onBack={() => setSettingsView('main')} />
            ) : settingsView === 'notifications' ? (
              <NotificationSettings onBack={() => setSettingsView('main')} />
            ) : settingsView === 'chats' ? (
              <ChatSettings
                onBack={() => setSettingsView('main')}
                onOpenTheme={() => setSettingsView('appearance')}
              />
            ) : settingsView === 'help' ? (
              <HelpSettings onBack={() => setSettingsView('main')} />
            ) : settingsView === 'admin' && isAdmin ? (
              <AdminPanel onBack={() => setSettingsView('main')} />
            ) : (
              /* MAIN SETTINGS VIEW */
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
                {/* 1. Top Header: User name & Settings title */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Settings
                    </h2>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#4ee3c5',
                        background: 'rgba(78, 227, 197, 0.1)',
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {user?.name}
                    </span>
                  </div>
                </div>

                {/* 2. Search Bar for Settings features */}
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 14,
                    }}
                  >
                    🔍
                  </span>
                  <input
                    id="settings-search-input"
                    type="text"
                    placeholder="Search settings..."
                    value={settingsSearch}
                    onChange={(e) => setSettingsSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 34px 9px 36px',
                      borderRadius: 12,
                      border: '1.5px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.86rem',
                      outline: 'none',
                    }}
                  />
                  {settingsSearch && (
                    <button
                      onClick={() => setSettingsSearch('')}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 2,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 3. User Profile Card (Photo, Name, About) -> Click to open profile sub-page */}
                {(!settingsSearch ||
                  user?.name?.toLowerCase().includes(settingsSearch.toLowerCase()) ||
                  user?.bio?.toLowerCase().includes(settingsSearch.toLowerCase()) ||
                  'profile'.includes(settingsSearch.toLowerCase())) && (
                  <div
                    id="settings-profile-card"
                    onClick={() => {
                      setSettingsView('profile');
                      setEditProfileField(null);
                    }}
                    title="Click to view and edit profile"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '16px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      marginBottom: 20,
                      transition: 'var(--transition)',
                      boxShadow: '0 2px 8px rgba(10, 46, 43, 0.08)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                  >
                    {/* User Photo with online badge */}
                    <div style={{ position: 'relative' }}>
                      <Avatar user={user} size={54} showOnline isOnline />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user?.name}
                      </p>
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          marginTop: 2,
                        }}
                      >
                        {user?.bio || 'Hey there! I am using ChatApp.'}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--online-color)', marginTop: 3 }}>
                        ● Active & Online
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#4ee3c5',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>Edit</span>
                      <span style={{ fontSize: 16 }}>›</span>
                    </div>
                  </div>
                )}

                {/* 4. Settings Categories List (Filterable via search bar) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    marginBottom: 20,
                  }}
                >
                  {[
                    {
                      id: 'account',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3.8 14.5A9.5 9.5 0 1 0 5.5 6.8" />
                          <circle cx="12" cy="9.5" r="3.2" />
                          <rect x="7" y="14.5" width="10" height="4.5" rx="2.25" />
                        </svg>
                      ),
                      label: 'Account',
                      desc: 'Security notifications, two-step verification, change number',
                      action: () => setSettingsView('account'),
                    },
                    {
                      id: 'privacy',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2.5l7 3v6c0 5-3.5 9.5-7 10.8-3.5-1.3-7-5.8-7-10.8V5.5l7-3z" />
                          <path d="M9.5 11.5V9.5a2.5 2.5 0 0 1 5 0v2" />
                          <rect x="8" y="11.5" width="8" height="5.5" rx="1.5" />
                          <circle cx="12" cy="14.2" r="0.75" fill="currentColor" />
                        </svg>
                      ),
                      label: 'Privacy',
                      desc: 'Last seen, profile photo, disappearing messages, app lock',
                      action: () => setSettingsView('privacy'),
                    },
                    {
                      id: 'chats',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          <line x1="7.5" y1="8.5" x2="16.5" y2="8.5" />
                          <line x1="7.5" y1="12.5" x2="13.5" y2="12.5" />
                        </svg>
                      ),
                      label: 'Chats',
                      desc: 'Enter is send, media auto-download, chat history',
                      action: () => setSettingsView('chats'),
                    },
                    {
                      id: 'notifications',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M10.3 21a2 2 0 0 0 3.4 0" />
                        </svg>
                      ),
                      label: 'Notifications',
                      desc: 'Message tones, previews, reaction notifications',
                      action: () => setSettingsView('notifications'),
                    },
                    {
                      id: 'appearance',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12c0 4.14 3.36 7.5 7.5 7.5 1 0 1.8-.8 1.8-1.8 0-.46-.17-.89-.44-1.23-.27-.35-.44-.8-.44-1.27 0-1.1.9-2 2-2h1.88c3.31 0 6-2.69 6-6 0-4.7-4.19-8.7-8.8-8.7z" />
                          <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor" />
                          <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
                          <circle cx="16.5" cy="8.5" r="1.2" fill="currentColor" />
                          <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                        </svg>
                      ),
                      label: 'Appearance',
                      desc: 'Theme, wallpapers, dark mode',
                      action: () => setSettingsView('appearance'),
                    },
                    {
                      id: 'shortcuts',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2.5" />
                          <line x1="6" y1="8" x2="6.01" y2="8" strokeWidth="2.5" />
                          <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth="2.5" />
                          <line x1="14" y1="8" x2="14.01" y2="8" strokeWidth="2.5" />
                          <line x1="18" y1="8" x2="18.01" y2="8" strokeWidth="2.5" />
                          <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="2.5" />
                          <line x1="18" y1="12" x2="18.01" y2="12" strokeWidth="2.5" />
                          <line x1="8" y1="16" x2="16" y2="16" />
                        </svg>
                      ),
                      label: 'Keyboard shortcuts',
                      desc: 'Quick keys for chats, search, archive',
                      action: () => setShowShortcutsModal(true),
                    },
                    {
                      id: 'starred',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ),
                      label: 'Starred Messages',
                      desc: 'View your starred messages',
                      action: () => setShowStarredModal(true),
                    },
                    {
                      id: 'help',
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9.5" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="16.5" x2="12.01" y2="16.5" strokeWidth="2.5" />
                        </svg>
                      ),
                      label: 'Help & Support',
                      desc: 'FAQs, contact us, privacy policy & terms',
                      action: () => setSettingsView('help'),
                    },
                    {
                      id: 'admin',
                      adminOnly: true,
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ee3c5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                      ),
                      label: 'Admin Panel',
                      desc: 'User management, bans, broadcasts & system settings',
                      badge: (user?.role || 'Admin').toUpperCase(),
                      action: () => setSettingsView('admin'),
                    },
                  ]
                    .filter(
                      (item) =>
                        (!item.adminOnly || isAdmin) &&
                        (!settingsSearch ||
                          item.label.toLowerCase().includes(settingsSearch.toLowerCase()) ||
                          item.desc.toLowerCase().includes(settingsSearch.toLowerCase()))
                    )
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        id={`settings-item-${item.id}`}
                        onClick={item.action}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '13px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.label}
                            </p>
                            {item.badge && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  fontWeight: 700,
                                  background: 'rgba(78, 227, 197, 0.16)',
                                  color: '#4ee3c5',
                                  padding: '1px 7px',
                                  borderRadius: 10,
                                  border: '1px solid rgba(78, 227, 197, 0.3)',
                                  letterSpacing: 0.5,
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                        </div>
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    ))}
                </div>

                {/* Logout Button */}
                {(!settingsSearch || 'logout'.includes(settingsSearch.toLowerCase())) && (
                  <button
                    id="settings-logout-btn"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 'auto',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Log Out ({user?.name})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW D: ADMIN PANEL (Direct Left Rail Tab) */}
        {navTab === 'admin' && isAdmin && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              background: 'var(--bg-primary)',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <AdminPanel onBack={() => setNavTab('chats')} />
          </div>
        )}

      </div>

      {/* Modals & Popups */}
      {(showUserList || showUserListModal) && (
        <UserList
          onClose={() => {
            setShowUserList(false);
            setShowUserListModal(false);
          }}
        />
      )}

      {showNewGroupModal && (
        <NewGroupModal onClose={() => setShowNewGroupModal(false)} />
      )}

      {showStarredModal && (
        <StarredMessagesModal
          onClose={() => setShowStarredModal(false)}
          onOpenChat={(conv) => handleConversationClick(conv)}
        />
      )}

      {showShortcutsModal && (
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {showAppLockModal && (
        <AppLockSetupModal
          onClose={() => setShowAppLockModal(false)}
          onLockNow={() => {
            if (onLockApp) onLockApp();
          }}
        />
      )}

      {/* Active Status Viewer Modal */}
      {activeViewingStatusGroup && (
        <StatusViewer
          statusGroup={activeViewingStatusGroup}
          onClose={() => setActiveViewingStatusGroup(null)}
        />
      )}

      {/* Create Status Modal */}
      {(showCreateStatusModal || showCreateStatusModalGlobal) && (
        <CreateStatusModal
          initialType={createStatusInitialType}
          onClose={() => {
            setShowCreateStatusModal(false);
            setShowCreateStatusModalGlobal(false);
          }}
        />
      )}

      {/* New Community Modal */}
      {(showNewCommunityModal || showNewCommunityModalGlobal) && (
        <NewCommunityModal
          onClose={() => {
            setShowNewCommunityModal(false);
            setShowNewCommunityModalGlobal(false);
          }}
          onCreated={(created) => setSelectedCommunityForDetail(created)}
        />
      )}

      {/* Community Detail / Settings Modal */}
      {selectedCommunityForDetail && (
        <CommunityDetailModal
          community={selectedCommunityForDetail}
          onClose={() => setSelectedCommunityForDetail(null)}
          onSelectConversation={handleConversationClick}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#164642',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: 20,
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)',
            fontSize: '0.82rem',
            fontWeight: 600,
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(78, 227, 197, 0.3)',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

