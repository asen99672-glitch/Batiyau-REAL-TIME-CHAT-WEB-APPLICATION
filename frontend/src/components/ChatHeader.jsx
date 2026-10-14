import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';
import StarredMessagesModal from './StarredMessagesModal';
import ChatThemeModal from './ChatThemeModal';

const ChatHeader = ({ onBack }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    selectConversation,
    isUserOnline,
    typingUsers,
    startCall,
    clearCurrentChat,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    activeSearchIndex,
    searchMatches,
    goToNextSearchMatch,
    goToPrevSearchMatch,
    messages,
    setIsSelectMode,
    deleteConversation,
    showToast,
    sendMessage,
    allUsers,
    closeChat,
    blockUser,
    unblockUser,
    isUserBlocked,
    showContactInfo,
    setShowContactInfo,
    leaveGroup,
    addGroupMembers,
  } = useChat();

  const {
    themeMode,
    setThemeMode,
    wallpaper,
    setCustomWallpaper,
    removeWallpaper,
    wallpaperDim,
    setWallpaperDim,
    wallpaperBlur,
    setWallpaperBlur,
    presets,
  } = useTheme();

  // Menu and submenus state
  const [showMenu, setShowMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'mute' | 'list' | null

  // Modals state
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCallLinkModal, setShowCallLinkModal] = useState(false);
  const [showGroupCallModal, setShowGroupCallModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showExitGroupConfirm, setShowExitGroupConfirm] = useState(false);

  // Form states for modals
  const [newListName, setNewListName] = useState('');
  const [reportReason, setReportReason] = useState('spam');
  const [reportBlockAndClear, setReportBlockAndClear] = useState(false);
  const [clearMediaAlso, setClearMediaAlso] = useState(true);
  const [selectedGroupCallUsers, setSelectedGroupCallUsers] = useState([]);
  const [callLinkUrl, setCallLinkUrl] = useState('');
  const [newMemberSearch, setNewMemberSearch] = useState('');
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const submenuTimeoutRef = useRef(null);

  const convId = activeConversation?._id?.toString();

  // Mute state for active conversation (persisted in localStorage)
  const [muteUntil, setMuteUntil] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('chatapp_muted_chats') || '{}');
      return stored[convId] || null;
    } catch {
      return null;
    }
  });

  const isMuted = useMemo(() => {
    if (!muteUntil) return false;
    if (muteUntil === 'always') return true;
    return new Date(muteUntil).getTime() > Date.now();
  }, [muteUntil]);

  // Disappearing messages timer for active conversation
  const [disappearingTimer, setDisappearingTimer] = useState(() => {
    try {
      return localStorage.getItem(`chatapp_disappearing_${convId}`) || 'off';
    } catch {
      return 'off';
    }
  });

  // Favourites state
  const [isFavourite, setIsFavourite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('chatapp_favourite_chats') || '[]');
      return favs.includes(convId);
    } catch {
      return false;
    }
  });

  // Blocked users state
  const isGroup = activeConversation?.isGroup;
  const baseOtherUser = isGroup
    ? null
    : activeConversation?.participants?.find(
        (p) => (p?._id || p)?.toString() !== user?._id?.toString()
      );

  const otherUserId = (baseOtherUser?._id || baseOtherUser)?.toString();
  const fullOtherUser = allUsers?.find((u) => u._id?.toString() === otherUserId);
  const otherUser = fullOtherUser ? { ...baseOtherUser, ...fullOtherUser } : baseOtherUser;

  // Sync state when active conversation changes
  useEffect(() => {
    if (!convId) return;
    try {
      const stored = JSON.parse(localStorage.getItem('chatapp_muted_chats') || '{}');
      setMuteUntil(stored[convId] || null);

      const dt = localStorage.getItem(`chatapp_disappearing_${convId}`) || 'off';
      setDisappearingTimer(dt);

      const favs = JSON.parse(localStorage.getItem('chatapp_favourite_chats') || '[]');
      setIsFavourite(favs.includes(convId));
    } catch (e) {
      console.error('Error syncing conversation settings:', e);
    }
  }, [convId]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest('#header-menu-btn')
      ) {
        setShowMenu(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when search opens
  useEffect(() => {
    if (isSearching) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isSearching, setSearchQuery]);

  if (!activeConversation) return null;

  const displayName = isGroup ? activeConversation.groupName : otherUser?.contactName || otherUser?.name || 'User';
  const displayUser = isGroup
    ? { name: activeConversation.groupName, profilePicture: activeConversation.groupImage }
    : { ...otherUser, name: displayName };

  const isOfficialBatiyao = !!(
    otherUser?.isOfficial ||
    otherUser?.username === 'batiyao' ||
    otherUser?.email === 'official@batiyao.com' ||
    displayName?.toLowerCase().includes('batiyao') ||
    activeConversation?.isOfficial
  );

  const isBlocked = useMemo(() => {
    if (isGroup || !otherUser?._id) return false;
    if (isUserBlocked) return isUserBlocked(otherUser._id);
    const blocked = (user?.privacySettings?.blockedContacts || []).map((id) => (id?._id || id)?.toString());
    return blocked.includes(otherUser._id.toString());
  }, [isGroup, otherUser?._id, isUserBlocked, user?.privacySettings?.blockedContacts]);

  const isOnline = !isGroup && otherUser && !isBlocked && !otherUser.isBlockedByThem
    ? isUserOnline(otherUser._id)
    : false;

  const typingData = activeConversation ? typingUsers[activeConversation._id] : null;
  const isTyping = !!typingData;
  const typingLabel = isGroup && typingData?.userName
    ? `${typingData.userName} is typing...`
    : 'typing...';

  const groupMembersSubtitle = useMemo(() => {
    if (!isGroup || !activeConversation?.participants) return '';
    const currentUserId = user?._id?.toString();
    const names = ['You'];
    activeConversation.participants.forEach((p) => {
      const pId = (p?._id || p)?.toString();
      if (pId && pId !== currentUserId) {
        const pName =
          p?.contactName ||
          p?.name ||
          p?.phoneNumber ||
          (p?.username ? `@${p.username}` : 'Member');
        names.push(pName);
      }
    });
    return names.join(', ');
  }, [isGroup, activeConversation?.participants, user?._id]);

  const existingParticipantIds = useMemo(() => {
    if (!isGroup || !activeConversation?.participants) return new Set();
    return new Set(activeConversation.participants.map((p) => (p?._id || p)?.toString()));
  }, [isGroup, activeConversation?.participants]);

  const availableUsersToAdd = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter((u) => {
      const uId = (u?._id || u)?.toString();
      if (uId === user?._id?.toString() || existingParticipantIds.has(uId)) return false;
      if (!newMemberSearch.trim()) return true;
      const q = newMemberSearch.toLowerCase();
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(q);
      const userMatch = (u.username || '').toLowerCase().includes(q);
      return nameMatch || phoneMatch || userMatch;
    });
  }, [allUsers, user?._id, existingParticipantIds, newMemberSearch]);

  const handleAddMembersSubmit = async () => {
    if (!selectedNewMembers.length) return;
    setIsAddingMembers(true);
    try {
      await addGroupMembers(activeConversation._id, selectedNewMembers);
      showToast('Members added successfully', 'success', '👥');
      setShowAddMemberModal(false);
      setSelectedNewMembers([]);
      setNewMemberSearch('');
    } catch (err) {
      console.error('Failed to add members:', err);
      showToast(err.response?.data?.message || 'Failed to add members', 'error');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleExitGroupSubmit = async () => {
    setIsLeavingGroup(true);
    try {
      await leaveGroup(activeConversation._id);
      showToast('You left the group', 'success', '👋');
      setShowExitGroupConfirm(false);
      setShowMenu(false);
      if (onBack) onBack();
    } catch (err) {
      console.error('Failed to exit group:', err);
      showToast(err.response?.data?.message || 'Failed to exit group', 'error');
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const formatLastSeen = (dateStr) => {
    if (isBlocked || otherUser?.isBlockedByThem) return '';
    if (user?.privacySettings?.lastSeen === 'nobody') return '';
    if (!dateStr) return 'Offline';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Offline';

    const now = new Date();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check today
    if (date.toDateString() === now.toDateString()) {
      return `last seen today at ${timeStr}`;
    }
    // Check yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `last seen yesterday at ${timeStr}`;
    }
    // Older than yesterday
    const day = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `last seen ${day} at ${timeStr}`;
  };

  const pinnedMessage = messages?.find((m) => m.isPinned && !m.isDeleted);

  // Submenu hover helpers
  const handleSubmenuEnter = (type) => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    setActiveSubmenu(type);
  };

  const handleSubmenuLeave = () => {
    submenuTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 200);
  };

  // 1. Mute handler
  const handleMute = (duration) => {
    try {
      const stored = JSON.parse(localStorage.getItem('chatapp_muted_chats') || '{}');
      if (duration === 'unmute') {
        delete stored[convId];
        setMuteUntil(null);
        showToast('Notifications unmuted', 'success', '🔔');
      } else {
        let val;
        let label;
        if (duration === '8h') {
          val = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
          label = '8 hours';
        } else if (duration === '1w') {
          val = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          label = '1 week';
        } else {
          val = 'always';
          label = 'Always';
        }
        stored[convId] = val;
        setMuteUntil(val);
        showToast(`Notifications muted for ${label}`, 'success', '🔕');
      }
      localStorage.setItem('chatapp_muted_chats', JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to update mute status:', e);
    }
    setShowMenu(false);
    setActiveSubmenu(null);
  };

  // 2. Disappearing messages handler
  const handleSaveDisappearing = (timer) => {
    setDisappearingTimer(timer);
    try {
      localStorage.setItem(`chatapp_disappearing_${convId}`, timer);
      if (timer === 'off') {
        showToast('Disappearing messages turned off', 'info', '⏱');
      } else {
        showToast(`Disappearing messages set to ${timer}`, 'success', '⏱');
      }
    } catch (e) {
      console.error(e);
    }
    setShowDisappearingModal(false);
  };

  // 3. Favourites toggle
  const handleToggleFavourite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('chatapp_favourite_chats') || '[]');
      let updated;
      if (isFavourite) {
        updated = favs.filter((id) => id !== convId);
        setIsFavourite(false);
        showToast('Removed from favourites', 'info', '♡');
      } else {
        updated = [...favs, convId];
        setIsFavourite(true);
        showToast('Added to favourites', 'success', '❤️');
      }
      localStorage.setItem('chatapp_favourite_chats', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setShowMenu(false);
  };

  // 4. Add to list handler
  const handleAddToList = (listName) => {
    try {
      const lists = JSON.parse(localStorage.getItem('chatapp_chat_lists') || '{}');
      if (!lists[listName]) lists[listName] = [];
      if (!lists[listName].includes(convId)) {
        lists[listName].push(convId);
        localStorage.setItem('chatapp_chat_lists', JSON.stringify(lists));
        showToast(`Added to ${listName}`, 'success', '📋');
      } else {
        showToast(`Already in ${listName}`, 'info', 'ℹ️');
      }
    } catch (e) {
      console.error(e);
    }
    setShowMenu(false);
    setActiveSubmenu(null);
  };

  // 5. Create new list handler
  const handleCreateNewList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    handleAddToList(trimmed);
    setNewListName('');
    setShowNewListModal(false);
  };

  // 6. Export chat handler
  const handleExportChat = () => {
    try {
      const formatted = messages
        .map((m) => {
          const date = new Date(m.createdAt || Date.now()).toLocaleString();
          const isMe = (m.sender?._id || m.sender)?.toString() === user?._id?.toString();
          const senderName = isMe ? 'You' : m.sender?.name || displayName;
          const text = m.isDeleted
            ? '<This message was deleted>'
            : m.message || (m.attachments?.length ? `[Media: ${m.attachments[0].filename || m.messageType}]` : '');
          return `[${date}] ${senderName}: ${text}`;
        })
        .join('\n');

      const header = `========================================\nWhatsApp Chat Export with ${displayName}\nGenerated on: ${new Date().toLocaleString()}\nTotal messages: ${messages.length}\n========================================\n\n`;

      const blob = new Blob([header + formatted], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.download = `WhatsApp Chat with ${safeName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Chat exported successfully', 'success', '📥');
    } catch (e) {
      console.error('Failed to export chat:', e);
      showToast('Failed to export chat', 'error');
    }
    setShowMenu(false);
  };

  // 7. Close chat handler
  const handleCloseChat = () => {
    setShowMenu(false);
    closeChat();
    if (onBack) onBack();
  };

  // 8. Call link generator & opener
  const handleOpenCallLink = () => {
    const roomId = Math.random().toString(36).substring(2, 9);
    const link = `${window.location.origin}/call/${activeConversation._id}?room=${roomId}&type=video`;
    setCallLinkUrl(link);
    setShowMenu(false);
    setShowCallLinkModal(true);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        showToast('Call link copied to clipboard!', 'success', '🔗');
      });
    }
  };

  const handleShareCallLinkInChat = async () => {
    if (!callLinkUrl) return;
    try {
      if (sendMessage) {
        await sendMessage({
          message: `📹 BaatCheet Video Call Link: ${callLinkUrl}\nClick the link to join the video call.`,
          messageType: 'text',
        });
      }
      showToast('Call link shared in chat', 'success', '💬');
      setShowCallLinkModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  // 9. Start Group Call
  const handleStartGroupCall = (callType = 'audio') => {
    setShowGroupCallModal(false);
    if (isGroup) {
      // In group, start call with all group participants
      startCall(
        {
          _id: activeConversation._id,
          name: activeConversation.groupName || 'Group',
          groupName: activeConversation.groupName || 'Group',
          profilePicture: activeConversation.groupImage || '',
          groupImage: activeConversation.groupImage || '',
          isGroup: true,
          participants: activeConversation.participants,
        },
        callType
      );
    } else if (selectedGroupCallUsers.length > 0) {
      startCall(
        {
          _id: `group_call_${Date.now()}`,
          name: 'Group Call',
          isGroup: true,
          participants: selectedGroupCallUsers,
        },
        callType
      );
      showToast(`Group call initiated with ${selectedGroupCallUsers.length} participant(s)`, 'success', '👥');
    } else if (otherUser) {
      startCall(otherUser, callType);
    }
  };

  // 10. Block user handler
  const handleConfirmBlock = () => {
    if (!otherUserId) return;
    blockUser(otherUserId);
    showToast(`${displayName} blocked`, 'success', '⊘');
    setShowBlockModal(false);
  };

  const handleUnblock = () => {
    if (!otherUserId) return;
    unblockUser(otherUserId);
    showToast(`${displayName} unblocked`, 'success', '🔓');
    setShowMenu(false);
  };

  // 11. Report handler
  const handleConfirmReport = async () => {
    try {
      if (otherUserId) {
        blockUser(otherUserId);
      }
      if (reportBlockAndClear) {
        await clearCurrentChat();
      }
      showToast(`${displayName} reported and blocked`, 'success', '🛡️');
    } catch (e) {
      console.error(e);
      showToast('Report submitted', 'success', '🛡️');
    }
    setShowReportModal(false);
  };

  // 12. Clear chat
  const handleClearChat = async () => {
    try {
      await clearCurrentChat();
      setShowClearConfirm(false);
      setShowMenu(false);
      showToast('Chat cleared', 'success', '🧹');
    } catch (err) {
      console.error('Failed to clear chat:', err);
      showToast('Failed to clear chat', 'error');
    }
  };

  // 13. Delete chat
  const handleDeleteChat = async () => {
    try {
      await deleteConversation(activeConversation._id);
      setShowDeleteConfirm(false);
      setShowMenu(false);
      if (onBack) onBack();
      showToast('Chat deleted', 'success', '🗑️');
    } catch (err) {
      console.error('Failed to delete chat:', err);
      showToast('Failed to delete chat', 'error');
    }
  };

  // Style constants for WhatsApp-identical vertical menu
  const menuItemStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 18px',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary, #e9edef)',
    fontSize: '0.88rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease',
    position: 'relative',
    userSelect: 'none',
  };

  const menuIconStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary, #8696a0)',
    width: 20,
    height: 20,
    marginRight: 14,
    flexShrink: 0,
  };

  const dividerStyle = {
    height: 1,
    background: 'var(--border-subtle, rgba(255, 255, 255, 0.08))',
    margin: '6px 0',
  };

  const flyoutStyle = {
    position: 'absolute',
    top: 0,
    right: '100%',
    marginRight: 6,
    background: 'var(--bg-card, #17191e)',
    borderRadius: 14,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
    border: '1px solid var(--border-color, #272a31)',
    zIndex: 1002,
    minWidth: 190,
    padding: '6px 0',
    animation: 'fadeIn 0.15s ease',
  };

  return (
    <>
      {/* Starred messages modal */}
      {showStarredModal && (
        <StarredMessagesModal onClose={() => setShowStarredModal(false)} />
      )}

      {/* Add Member Modal (Group) */}
      {showAddMemberModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => {
            setShowAddMemberModal(false);
            setSelectedNewMembers([]);
            setNewMemberSearch('');
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 18,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Add members
              </h3>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedNewMembers([]);
                  setNewMemberSearch('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={newMemberSearch}
                onChange={(e) => setNewMemberSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color, #272a31)',
                  background: 'var(--bg-secondary, #111b21)',
                  color: 'var(--text-primary, #e9edef)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                🔍
              </span>
            </div>

            {/* User List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280 }}>
              {availableUsersToAdd.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No new contacts found to add.
                </div>
              ) : (
                availableUsersToAdd.map((u) => {
                  const isSelected = selectedNewMembers.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => {
                        setSelectedNewMembers((prev) =>
                          prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                        );
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(0, 168, 132, 0.12)' : 'transparent',
                        border: isSelected ? '1px solid rgba(0, 168, 132, 0.4)' : '1px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar user={u} size={36} />
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {u.phoneNumber || (u.username ? `@${u.username}` : '')}
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ accentColor: '#00a884', width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedNewMembers([]);
                  setNewMemberSearch('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembersSubmit}
                disabled={selectedNewMembers.length === 0 || isAddingMembers}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  background: selectedNewMembers.length > 0 ? '#00a884' : '#272a31',
                  border: 'none',
                  color: selectedNewMembers.length > 0 ? '#000' : 'var(--text-muted)',
                  fontWeight: 600,
                  cursor: selectedNewMembers.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {isAddingMembers ? 'Adding...' : `Add (${selectedNewMembers.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Group Confirm Modal */}
      {showExitGroupConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowExitGroupConfirm(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 18,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Exit "{displayName}" group?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              You will no longer be able to send or receive messages in this group.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowExitGroupConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExitGroupSubmit}
                disabled={isLeavingGroup}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isLeavingGroup ? 'Exiting...' : 'Exit group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
          onClick={() => setShowBlockModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 400,
              padding: 24,
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              Block {displayName}?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: 'var(--text-muted, #8b929d)', lineHeight: 1.5 }}>
              Blocked contacts will no longer be able to call you or send you messages. This contact will not be notified.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowBlockModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary, #1e2127)',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle, #272a31)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Disappearing Messages Modal */}
      {showDisappearingModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowDisappearingModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(78, 227, 197, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="2 3" />
                  <polyline points="12 6 12 12 15 15" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Disappearing messages
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Make new messages in this chat disappear
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '14px 0 18px 0' }}>
              For more privacy and storage, new messages will disappear from this chat for everyone after the selected duration.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: '24h', label: '24 hours' },
                { id: '7d', label: '7 days' },
                { id: '90d', label: '90 days' },
                { id: 'off', label: 'Off' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: disappearingTimer === opt.id ? 'rgba(78, 227, 197, 0.08)' : 'var(--bg-secondary, #131418)',
                    border: disappearingTimer === opt.id ? '1px solid var(--accent-secondary)' : '1px solid transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                  onClick={() => handleSaveDisappearing(opt.id)}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="disappearing-timer"
                    checked={disappearingTimer === opt.id}
                    onChange={() => handleSaveDisappearing(opt.id)}
                    style={{ accentColor: 'var(--accent-secondary)' }}
                  />
                </label>
              ))}
            </div>

            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDisappearingModal(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  background: 'var(--bg-hover)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. WhatsApp Style Chat Theme Modal */}
      {showThemeModal && (
        <ChatThemeModal onClose={() => setShowThemeModal(false)} />
      )}

      {/* 4. Send Call Link Modal */}
      {showCallLinkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowCallLinkModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(78, 227, 197, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Call link created
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Anyone with this link can join your call
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'var(--bg-secondary, #131418)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                margin: '16px 0',
              }}
            >
              <input
                type="text"
                readOnly
                value={callLinkUrl}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--accent-secondary)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(callLinkUrl);
                  showToast('Copied to clipboard!', 'success', '📋');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-hover)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Copy
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setShowCallLinkModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={handleShareCallLinkInChat}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: 'var(--accent-secondary)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Send in Chat</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. New Group Call Modal */}
      {showGroupCallModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowGroupCallModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(78, 227, 197, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  New group call
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {isGroup ? 'Call all members in this group' : 'Choose participants to start a call'}
                </p>
              </div>
            </div>

            {!isGroup && (
              <div style={{ maxHeight: 200, overflowY: 'auto', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allUsers?.filter((u) => u._id !== user?._id).map((u) => {
                  const isSelected = selectedGroupCallUsers.some((sel) => sel._id === u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => {
                        setSelectedGroupCallUsers((prev) =>
                          isSelected ? prev.filter((x) => x._id !== u._id) : [...prev, u]
                        );
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(78, 227, 197, 0.1)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--accent-secondary)' : '1px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar user={u} size={32} />
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--accent-secondary)' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => handleStartGroupCall('audio')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: '#144340',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>📞 Voice Call</span>
              </button>
              <button
                onClick={() => handleStartGroupCall('video')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'var(--accent-secondary)',
                  border: 'none',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>🎥 Video Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Report Modal */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Report {displayName}?
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              The last 5 messages from this contact will be forwarded to our review team. This contact will not be notified.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { id: 'spam', label: 'Spam' },
                { id: 'harassment', label: 'Harassment or offensive content' },
                { id: 'scam', label: 'Scam or fraud' },
                { id: 'other', label: 'Other' },
              ].map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: reportReason === r.id ? 'var(--bg-hover)' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reportReason === r.id}
                    onChange={() => setReportReason(r.id)}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: 'var(--text-primary)',
                marginBottom: 20,
              }}
            >
              <input
                type="checkbox"
                checked={reportBlockAndClear}
                onChange={(e) => setReportBlockAndClear(e.target.checked)}
                style={{ accentColor: '#ef4444' }}
              />
              <span>Block contact and clear chat history</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReport}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Block User Modal */}
      {showBlockModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowBlockModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Block {displayName}?
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Blocked contacts will no longer be able to call you or send you messages. They won't see your profile photo or online status.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowBlockModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Clear Chat Confirm Dialog */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Clear this chat?
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Messages in this chat will be cleared from your view. This action cannot be undone.
            </p>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: 'var(--text-primary)',
                marginBottom: 20,
              }}
            >
              <input
                type="checkbox"
                checked={clearMediaAlso}
                onChange={(e) => setClearMediaAlso(e.target.checked)}
                style={{ accentColor: '#ef4444' }}
              />
              <span>Also delete media received in this chat</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Delete Chat Confirm Dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Delete this chat?
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to delete this chat with <strong style={{ color: 'var(--text-primary)' }}>{displayName}</strong>? Chat messages and history will be permanently deleted.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. New List Modal */}
      {showNewListModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowNewListModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              border: '1px solid var(--border-color, #272a31)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
              New List
            </h3>
            <input
              type="text"
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name (e.g. Work, Family)"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                marginBottom: 18,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewList();
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowNewListModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewList}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: 'var(--accent-secondary)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div
        style={{
          padding: '10px 20px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Back button - mobile only */}
        {onBack && (
          <button
            id="chat-back-btn"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 20,
              padding: '4px 8px',
              marginLeft: -8,
            }}
          >
            ←
          </button>
        )}

        <div
          onClick={() => setShowContactInfo(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer', minWidth: 0 }}
          title="Click for contact info"
        >
          <Avatar user={displayUser} size={42} showOnline={!isGroup} isOnline={isOnline} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: '0.98rem',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </h3>
              {(otherUser?.isOfficial || otherUser?.username === 'batiyao' || displayName?.toLowerCase().includes('batiyao')) && (
                <span title="Official Batiyao Channel" style={{ color: '#10b981', fontSize: '0.85rem' }}>
                  🛡️
                </span>
              )}
              {isMuted && (
                <span title="Notifications muted" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  🔕
                </span>
              )}
              {isFavourite && (
                <span title="In favourites" style={{ fontSize: 12, color: '#ef4444' }}>
                  ❤️
                </span>
              )}
            </div>

            {isTyping ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.82rem', color: '#00a884', fontWeight: 600, letterSpacing: '0.2px' }}>
                  {typingLabel}
                </span>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span className="typing-dot" style={{ width: 5, height: 5, background: '#00a884' }} />
                  <span className="typing-dot" style={{ width: 5, height: 5, background: '#00a884' }} />
                  <span className="typing-dot" style={{ width: 5, height: 5, background: '#00a884' }} />
                </div>
              </div>
            ) : (
              <p
                style={{
                  fontSize: '0.78rem',
                  color: isOnline ? 'var(--online-color)' : 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {otherUser?.isOfficial || otherUser?.username === 'batiyao'
                  ? '🛡️ Official Batiyao Channel • System Announcements'
                  : isGroup
                  ? groupMembersSubtitle
                  : isBlocked
                  ? 'Blocked'
                  : isOnline
                  ? '● Online'
                  : formatLastSeen(otherUser?.lastSeen)}
              </p>
            )}
          </div>
        </div>

        {/* Action icons container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          {/* 1. Search Icon */}
          <button
            id="chat-search-btn"
            title="Search messages in chat"
            onClick={() => setIsSearching((prev) => !prev)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: isSearching ? 'var(--accent-secondary)' : '#144340',
              border: 'none',
              color: isSearching ? '#000000' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)',
              boxShadow: '0 2px 6px rgba(10, 46, 43, 0.25)',
            }}
            onMouseEnter={(e) => {
              if (!isSearching) e.currentTarget.style.background = '#1b5450';
            }}
            onMouseLeave={(e) => {
              if (!isSearching) e.currentTarget.style.background = '#144340';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* 2. Voice & Video Calls (Disabled for official Batiyao announcements channel) */}
          {isOfficialBatiyao ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.74rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                userSelect: 'none',
              }}
              title="Official Batiyau Channel - Voice & Video calls are disabled"
            >
              <span>🛡️ Official Notice Channel</span>
            </div>
          ) : (
            <>
              {/* 2. Voice Call (Group or 1-on-1) */}
              <button
                id="voice-call-btn"
                title={isGroup ? 'Start Group Voice Call' : 'Start Voice Call'}
                onClick={() => {
                  if (isGroup) {
                    startCall(
                      {
                        _id: activeConversation._id,
                        name: activeConversation.groupName,
                        profilePicture: activeConversation.groupImage,
                        isGroup: true,
                        participants: activeConversation.participants,
                      },
                      'audio'
                    );
                  } else if (otherUser) {
                    startCall(otherUser, 'audio');
                  }
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#144340',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition)',
                  boxShadow: '0 2px 6px rgba(10, 46, 43, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1b5450';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#144340';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>

              {/* 3. Video Call (Group or 1-on-1) */}
              <button
                id="video-call-btn"
                title={isGroup ? 'Start Group Video Call' : 'Start Video Call'}
                onClick={() => {
                  if (isGroup) {
                    startCall(
                      {
                        _id: activeConversation._id,
                        name: activeConversation.groupName,
                        profilePicture: activeConversation.groupImage,
                        isGroup: true,
                        participants: activeConversation.participants,
                      },
                      'video'
                    );
                  } else if (otherUser) {
                    startCall(otherUser, 'video');
                  }
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#144340',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition)',
                  boxShadow: '0 2px 6px rgba(10, 46, 43, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1b5450';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#144340';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="5" width="13" height="14" rx="3" />
                  <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z" />
                </svg>
              </button>
            </>
          )}

          {/* 4. Menu Vertical Button (Three Dots) */}
          <button
            id="header-menu-btn"
            title="Menu"
            onClick={() => {
              setShowMenu((prev) => !prev);
              setActiveSubmenu(null);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: showMenu ? 'var(--bg-hover)' : 'none',
              border: 'none',
              color: showMenu ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => {
              if (!showMenu) e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              <circle cx="12" cy="19" r="2.2" />
            </svg>
          </button>

          {/* WhatsApp Style Vertical Menu Dropdown (100% Matching Reference Image) */}
          {showMenu && (
            <div
              ref={menuRef}
              className="animate-fade-in"
              style={{
                position: 'absolute',
                top: 46,
                right: 0,
                background: 'var(--bg-card, #17191e)',
                borderRadius: 14,
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
                border: '1px solid var(--border-color, #272a31)',
                zIndex: 1000,
                minWidth: 235,
                padding: '6px 0',
                userSelect: 'none',
              }}
            >
              {isGroup ? (
                <>
                  {/* 1. Group info */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowContactInfo(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={menuIconStyle}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </span>
                      <span>Group info</span>
                    </div>
                  </button>

                  {/* 2. Add member */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowAddMemberModal(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={menuIconStyle}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                      </span>
                      <span>Add member</span>
                    </div>
                  </button>

                  {/* 3. Select messages */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsSelectMode(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={menuIconStyle}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      </span>
                      <span>Select messages</span>
                    </div>
                  </button>

                  {/* 4. Mute notifications */}
                  <div
                    style={{ position: 'relative' }}
                    onMouseEnter={() => handleSubmenuEnter('mute')}
                    onMouseLeave={handleSubmenuLeave}
                  >
                    <button
                      onClick={() => setActiveSubmenu((prev) => (prev === 'mute' ? null : 'mute'))}
                      style={{
                        ...menuItemStyle,
                        background: activeSubmenu === 'mute' ? 'var(--bg-hover)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={menuIconStyle}>
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                            <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                            <path d="M18 8a6 6 0 0 0-9.33-5" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        </span>
                        <span>Mute notifications</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </button>

                    {activeSubmenu === 'mute' && (
                      <div style={flyoutStyle}>
                        {isMuted && (
                          <button
                            onClick={() => handleMute('unmute')}
                            style={{ ...menuItemStyle, color: 'var(--accent-secondary)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            🔔 Unmute notifications
                          </button>
                        )}
                        <button
                          onClick={() => handleMute('8h')}
                          style={menuItemStyle}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          8 Hours
                        </button>
                        <button
                          onClick={() => handleMute('1w')}
                          style={menuItemStyle}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          1 Week
                        </button>
                        <button
                          onClick={() => handleMute('always')}
                          style={menuItemStyle}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          Always
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 5. Disappearing messages */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDisappearingModal(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={menuIconStyle}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeDasharray="2 3" />
                          <polyline points="12 6 12 12 15 15" />
                        </svg>
                      </span>
                      <span>Disappearing messages</span>
                    </div>
                  </button>

                  {/* 6. Chat theme */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowThemeModal(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={menuIconStyle}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3 0 5.6-2.5 5.6-5.5C22 6.0 17.5 2 12 2z" />
                          <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
                          <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" />
                          <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
                          <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" />
                        </svg>
                      </span>
                      <span>Chat theme</span>
                    </div>
                  </button>

                  {/* 7. Clear chat */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowClearConfirm(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={menuIconStyle}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </span>
                      <span>Clear chat</span>
                    </div>
                  </button>

                  <div style={dividerStyle} />

                  {/* 8. Exit group (Red) */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowExitGroupConfirm(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ ...menuIconStyle, color: '#ef4444' }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Exit group</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  {/* 1. Contact info */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowContactInfo(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={menuIconStyle}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </span>
                      <span>Contact info</span>
                    </div>
                  </button>

              {/* 2. Search */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsSearching(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <span>Search</span>
                </div>
              </button>

              {/* 3. Select messages */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsSelectMode(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </span>
                  <span>Select messages</span>
                </div>
              </button>

              {/* 4. Mute notifications (with flyout submenu) */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => handleSubmenuEnter('mute')}
                onMouseLeave={handleSubmenuLeave}
              >
                <button
                  onClick={() => setActiveSubmenu((prev) => (prev === 'mute' ? null : 'mute'))}
                  style={{
                    ...menuItemStyle,
                    background: activeSubmenu === 'mute' ? 'var(--bg-hover)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={menuIconStyle}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                        <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                        <path d="M18 8a6 6 0 0 0-9.33-5" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    </span>
                    <span>{isMuted ? 'Mute notifications' : 'Mute notifications'}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </button>

                {/* Submenu for Mute */}
                {activeSubmenu === 'mute' && (
                  <div style={flyoutStyle}>
                    {isMuted && (
                      <button
                        onClick={() => handleMute('unmute')}
                        style={{ ...menuItemStyle, color: 'var(--accent-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        🔔 Unmute notifications
                      </button>
                    )}
                    <button
                      onClick={() => handleMute('8h')}
                      style={menuItemStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      8 Hours
                    </button>
                    <button
                      onClick={() => handleMute('1w')}
                      style={menuItemStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      1 Week
                    </button>
                    <button
                      onClick={() => handleMute('always')}
                      style={menuItemStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      Always
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Disappearing messages */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDisappearingModal(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="2 3" />
                      <polyline points="12 6 12 12 15 15" />
                    </svg>
                  </span>
                  <span>Disappearing messages</span>
                </div>
              </button>

              {/* 6. Chat theme */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowThemeModal(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3 0 5.6-2.5 5.6-5.5C22 6.0 17.5 2 12 2z" />
                      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
                      <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" />
                      <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
                      <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" />
                    </svg>
                  </span>
                  <span>Chat theme</span>
                </div>
              </button>

              {/* 7. Add to favourites / Remove from favourites */}
              <button
                onClick={handleToggleFavourite}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill={isFavourite ? '#ef4444' : 'none'}
                      stroke={isFavourite ? '#ef4444' : 'currentColor'}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </span>
                  <span>{isFavourite ? 'Remove from favourites' : 'Add to favourites'}</span>
                </div>
              </button>

              {/* 8. Add to list (with flyout submenu) */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => handleSubmenuEnter('list')}
                onMouseLeave={handleSubmenuLeave}
              >
                <button
                  onClick={() => setActiveSubmenu((prev) => (prev === 'list' ? null : 'list'))}
                  style={{
                    ...menuItemStyle,
                    background: activeSubmenu === 'list' ? 'var(--bg-hover)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={menuIconStyle}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </span>
                    <span>Add to list</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </button>

                {/* Submenu for Add to list */}
                {activeSubmenu === 'list' && (
                  <div style={flyoutStyle}>
                    {['Unread', 'Favorites', 'Work', 'Family', 'Friends'].map((lname) => (
                      <button
                        key={lname}
                        onClick={() => handleAddToList(lname)}
                        style={menuItemStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        {lname}
                      </button>
                    ))}
                    <div style={dividerStyle} />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setActiveSubmenu(null);
                        setShowNewListModal(true);
                      }}
                      style={{ ...menuItemStyle, color: 'var(--accent-secondary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      ➕ New list...
                    </button>
                  </div>
                )}
              </div>

              {/* 9. Export chat */}
              <button
                onClick={handleExportChat}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </span>
                  <span>Export chat</span>
                </div>
              </button>

              {/* 10. Close chat */}
              <button
                onClick={handleCloseChat}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </span>
                  <span>Close chat</span>
                </div>
              </button>

              {/* Divider 1 */}
              <div style={dividerStyle} />

              {/* 11. Send call link */}
              <button
                onClick={handleOpenCallLink}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </span>
                  <span>Send call link</span>
                </div>
              </button>

              {/* 12. New group call */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowGroupCallModal(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </span>
                  <span>New group call</span>
                </div>
              </button>

              {/* Divider 2 */}
              <div style={dividerStyle} />

              {/* 13. Report */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                  </span>
                  <span>Report</span>
                </div>
              </button>

              {/* 14. Block / Unblock */}
              <button
                onClick={() => {
                  if (isBlocked) {
                    handleUnblock();
                  } else {
                    setShowMenu(false);
                    setShowBlockModal(true);
                  }
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  </span>
                  <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                </div>
              </button>

              {/* 15. Clear chat */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowClearConfirm(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={menuIconStyle}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </span>
                  <span>Clear chat</span>
                </div>
              </button>

              {/* 16. Delete chat */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ ...menuIconStyle, color: '#ef4444' }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </span>
                  <span style={{ color: '#ef4444' }}>Delete chat</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}
        </div>
      </div>

      {/* Message Search Bar Sub-header (WhatsApp Style) */}
      {isSearching && (
        <div
          className="animate-fade-in"
          style={{
            padding: '8px 16px',
            background: 'var(--bg-card, #17191e)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />

          {searchQuery && (
            <span
              style={{
                fontSize: '0.78rem',
                color: searchMatches.length > 0 ? 'var(--text-muted)' : '#ef4444',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {searchMatches.length > 0
                ? `${activeSearchIndex + 1} of ${searchMatches.length}`
                : 'No matches'}
            </span>
          )}

          {/* Prev / Next navigation */}
          {searchMatches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={goToPrevSearchMatch}
                title="Previous match"
                style={{
                  background: 'var(--bg-hover)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ▲
              </button>
              <button
                onClick={goToNextSearchMatch}
                title="Next match"
                style={{
                  background: 'var(--bg-hover)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ▼
              </button>
            </div>
          )}

          {/* Close search button */}
          <button
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            title="Close search"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 18,
              padding: 4,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* WhatsApp-style Pinned Message Banner */}
      {pinnedMessage && (
        <div
          onClick={() => {
            const el = document.getElementById(`message-${pinnedMessage._id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.style.transition = 'background-color 0.3s ease';
              el.style.backgroundColor = 'rgba(78, 227, 197, 0.25)';
              setTimeout(() => {
                el.style.backgroundColor = 'transparent';
              }, 1200);
            }
          }}
          style={{
            padding: '7px 20px',
            background: 'var(--bg-secondary, #131418)',
            borderBottom: '1px solid var(--border-color, #272a31)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: '0.84rem',
            animation: 'fadeIn 0.2s ease',
            zIndex: 10,
          }}
          title="Click to jump to pinned message"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '85%',
            }}
          >
            <span style={{ fontSize: 14 }}>📌</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-secondary, #4ee3c5)' }}>
              Pinned message:
            </span>
            <span
              style={{
                color: 'var(--text-secondary, #cbd5e1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pinnedMessage.message ||
                (pinnedMessage.messageType === 'image'
                  ? '📷 Photo'
                  : pinnedMessage.messageType === 'video'
                  ? '🎥 Video'
                  : '📎 Media')}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-secondary, #4ee3c5)',
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(78, 227, 197, 0.1)',
            }}
          >
            Jump
          </span>
        </div>
      )}
    </>
  );
};

export default ChatHeader;
