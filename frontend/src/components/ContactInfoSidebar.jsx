import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../services/api';
import Avatar from './Avatar';
import StarredMessagesModal from './StarredMessagesModal';
import ChatThemeModal from './ChatThemeModal';
import SecurityCodeModal from './SecurityCodeModal';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'IN +91' },
  { code: '+1', country: 'US', label: 'US +1' },
  { code: '+44', country: 'GB', label: 'UK +44' },
  { code: '+971', country: 'AE', label: 'AE +971' },
  { code: '+61', country: 'AU', label: 'AU +61' },
  { code: '+49', country: 'DE', label: 'DE +49' },
  { code: '+33', country: 'FR', label: 'FR +33' },
  { code: '+92', country: 'PK', label: 'PK +92' },
  { code: '+880', country: 'BD', label: 'BD +880' },
  { code: '+966', country: 'SA', label: 'SA +966' },
  { code: '+65', country: 'SG', label: 'SG +65' },
];

const ContactInfoSidebar = ({ onClose }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    startCall,
    setIsSearching,
    clearCurrentChat,
    deleteConversation,
    blockUser,
    unblockUser,
    isUserBlocked,
    showToast,
    isUserOnline,
    updateContact,
    deletePhoneContact,
    allUsers,
    createGroup,
    startDirectConversation,
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
    updateGroupPermissions,
    toggleGroupAdmin,
    getGroupInviteLink,
    resetGroupInviteLink,
    selectConversation,
  } = useChat();

  // Modals & subview state
  const [currentView, setCurrentView] = useState('info'); // 'info' | 'edit'
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState(null); // null | 'media' | 'docs' | 'links'
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState('off');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteContactConfirm, setShowDeleteContactConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const mutedList = JSON.parse(localStorage.getItem('chatapp_muted_conversations') || '[]');
      return activeConversation?._id ? mutedList.includes(activeConversation._id) : false;
    } catch {
      return false;
    }
  });
  const [isFavourite, setIsFavourite] = useState(() => {
    try {
      const favList = JSON.parse(localStorage.getItem('chatapp_fav_conversations') || '[]');
      return activeConversation?._id ? favList.includes(activeConversation._id) : false;
    } catch {
      return false;
    }
  });

  const [showAvatarLightbox, setShowAvatarLightbox] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(1);

  // Edit contact form states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('+91');
  const [editPhone, setEditPhone] = useState('');
  const [syncToPhone, setSyncToPhone] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Group-specific states
  const [selectedMemberForContact, setSelectedMemberForContact] = useState(null);
  const [memberActionMenu, setMemberActionMenu] = useState(null); // { member, top, right }
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [showCreateSimilarGroupModal, setShowCreateSimilarGroupModal] = useState(false);
  const [showExitGroupConfirm, setShowExitGroupConfirm] = useState(false);
  const [memberFilterQuery, setMemberFilterQuery] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editingGroupDesc, setEditingGroupDesc] = useState(false);
  const [groupDescText, setGroupDescText] = useState('');
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameText, setGroupNameText] = useState('');
  const [similarGroupName, setSimilarGroupName] = useState('');
  const [newMemberSearch, setNewMemberSearch] = useState('');
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  if (!activeConversation) return null;

  const isGroup = !!activeConversation.isGroup;
  const otherUser = !isGroup
    ? activeConversation.participants?.find(
        (p) => (p?._id || p)?.toString() !== user?._id?.toString()
      )
    : null;

  const displayName = isGroup
    ? activeConversation.groupName || 'Group'
    : otherUser?.contactName || otherUser?.name || 'Contact';

  const otherUserId = (otherUser?._id || otherUser)?.toString();
  const isBlocked = otherUserId ? isUserBlocked(otherUserId) : false;
  const isOnline = otherUserId ? isUserOnline(otherUserId) : false;

  const displayPhone = otherUser?.phoneNumber || (otherUser?.username ? `@${otherUser.username}` : '');
  const displayBio = otherUser?.bio || (isGroup ? activeConversation.groupDescription : 'Available on BaatCheet');

  // WhatsApp E2EE Security Code Verification state
  const [isContactVerified, setIsContactVerified] = useState(false);

  useEffect(() => {
    if (user?._id && otherUserId) {
      try {
        const verified = localStorage.getItem(`whatsapp_e2ee_verified_${user._id}_${otherUserId}`) === 'true';
        setIsContactVerified(verified);
      } catch {
        setIsContactVerified(false);
      }
    }
  }, [user?._id, otherUserId]);

  const handleToggleVerifyContact = (newStatus) => {
    if (!user?._id || !otherUserId) return;
    const updated = typeof newStatus === 'boolean' ? newStatus : !isContactVerified;
    try {
      localStorage.setItem(`whatsapp_e2ee_verified_${user._id}_${otherUserId}`, updated ? 'true' : 'false');
      setIsContactVerified(updated);
      showToast(updated ? 'Security code marked as verified ✓' : 'Security code unverified', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // Sync group details into state
  useEffect(() => {
    if (activeConversation?.isGroup) {
      setGroupDescText(activeConversation.groupDescription || '');
      setGroupNameText(activeConversation.groupName || '');
    }
  }, [activeConversation?._id, activeConversation?.groupDescription, activeConversation?.groupName, activeConversation?.isGroup]);

  // Group Admin Calculations
  const groupAdminsList = useMemo(() => {
    if (!isGroup || !activeConversation) return [];
    const list = [];
    const mainAdmin = activeConversation.groupAdmin?._id || activeConversation.groupAdmin;
    if (mainAdmin) list.push(mainAdmin.toString());
    if (Array.isArray(activeConversation.groupAdmins)) {
      activeConversation.groupAdmins.forEach((a) => {
        const aId = (a?._id || a)?.toString();
        if (aId && !list.includes(aId)) list.push(aId);
      });
    }
    return list;
  }, [isGroup, activeConversation]);

  const isCurrentUserAdmin = useMemo(() => {
    if (!isGroup) return false;
    const curId = user?._id?.toString();
    return groupAdminsList.includes(curId);
  }, [isGroup, user?._id, groupAdminsList]);

  const isMemberAdmin = useCallback(
    (memberId) => {
      if (!memberId) return false;
      return groupAdminsList.includes(memberId.toString());
    },
    [groupAdminsList]
  );

  const currentPermissions = useMemo(() => {
    const defaultPerms = {
      editGroupSettings: true,
      sendMessages: true,
      addMembers: true,
      sendMessageHistory: false,
      approveNewMembers: false,
    };
    return {
      ...defaultPerms,
      ...(activeConversation?.groupPermissions || {}),
    };
  }, [activeConversation?.groupPermissions]);

  const adminNamesText = useMemo(() => {
    if (!isGroup || !activeConversation?.participants) return '';
    const curId = user?._id?.toString();
    const names = [];
    activeConversation.participants.forEach((p) => {
      const pId = (p?._id || p)?.toString();
      if (groupAdminsList.includes(pId)) {
        names.push(pId === curId ? 'You' : (p.contactName || p.name || 'Admin'));
      }
    });
    return names.join(', ');
  }, [isGroup, activeConversation?.participants, groupAdminsList, user?._id]);

  const handleTogglePermission = async (permKey) => {
    if (!isCurrentUserAdmin) {
      showToast('Only group admins can change permissions', 'error');
      return;
    }
    const updated = {
      ...currentPermissions,
      [permKey]: !currentPermissions[permKey],
    };
    try {
      await updateGroupPermissions(activeConversation._id, updated);
      showToast('Group permissions updated', 'success', '🛡️');
    } catch (err) {
      console.error('Failed to update permission:', err);
      showToast(err.response?.data?.message || 'Failed to update permission', 'error');
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!isGroup || !activeConversation?.participants) return [];
    if (!memberFilterQuery.trim()) return activeConversation.participants;
    const q = memberFilterQuery.toLowerCase();
    return activeConversation.participants.filter((p) => {
      const name = (p.contactName || p.name || '').toLowerCase();
      const phone = (p.phoneNumber || '').toLowerCase();
      const username = (p.username || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || username.includes(q);
    });
  }, [isGroup, activeConversation?.participants, memberFilterQuery]);

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

  const handleOpenInviteModal = async () => {
    setShowInviteLinkModal(true);
    setInviteLoading(true);
    try {
      const data = await getGroupInviteLink(activeConversation._id);
      setInviteData(data);
    } catch (err) {
      console.error('Failed to get invite:', err);
      showToast('Failed to load invite link', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResetInvite = async () => {
    setInviteLoading(true);
    try {
      const data = await resetGroupInviteLink(activeConversation._id);
      setInviteData(data);
      showToast('Invite link revoked and regenerated', 'success', '🔄');
    } catch (err) {
      console.error('Failed to reset invite:', err);
      showToast('Failed to reset invite link', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!groupNameText.trim()) return;
    try {
      await api.put(`/conversations/${activeConversation._id}`, { groupName: groupNameText.trim() });
      setEditingGroupName(false);
      showToast('Group name updated', 'success');
    } catch (err) {
      console.error('Failed to update group name:', err);
      showToast(err.response?.data?.message || 'Failed to update group name', 'error');
    }
  };

  const handleSaveGroupDesc = async () => {
    try {
      await api.put(`/conversations/${activeConversation._id}`, { groupDescription: groupDescText.trim() });
      setEditingGroupDesc(false);
      showToast('Group description updated', 'success');
    } catch (err) {
      console.error('Failed to update group description:', err);
      showToast(err.response?.data?.message || 'Failed to update group description', 'error');
    }
  };

  const handleCreateSimilarGroup = async () => {
    if (!similarGroupName.trim()) return;
    try {
      const curId = user?._id?.toString();
      const memberIds = (activeConversation.participants || [])
        .map((p) => (p?._id || p)?.toString())
        .filter((id) => id && id !== curId);
      const newGroup = await createGroup(
        similarGroupName.trim(),
        memberIds,
        activeConversation.groupImage || ''
      );
      showToast('Similar group created!', 'success', '👥');
      setShowCreateSimilarGroupModal(false);
      if (newGroup) {
        selectConversation(newGroup);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create similar group:', err);
      showToast(err.response?.data?.message || 'Failed to create group', 'error');
    }
  };

  const handleExitGroup = async () => {
    try {
      await leaveGroup(activeConversation._id);
      showToast('You left the group', 'success', '👋');
      setShowExitGroupConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to leave group:', err);
      showToast(err.response?.data?.message || 'Failed to leave group', 'error');
    }
  };

  // Sync contact details into edit state
  useEffect(() => {
    if (otherUser) {
      const full = otherUser.contactName || otherUser.name || '';
      const parts = full.trim().split(' ');
      setEditFirstName(parts[0] || '');
      setEditLastName(parts.slice(1).join(' ') || '');
      setEditUsername(otherUser.username ? otherUser.username.replace(/^@/, '') : '');

      const p = (otherUser.phoneNumber || '').trim();
      if (p.startsWith('+91')) {
        setEditCountryCode('+91');
        setEditPhone(p.slice(3).trim());
      } else if (p.startsWith('+1')) {
        setEditCountryCode('+1');
        setEditPhone(p.slice(2).trim());
      } else if (p.startsWith('+44')) {
        setEditCountryCode('+44');
        setEditPhone(p.slice(3).trim());
      } else if (p.startsWith('+971')) {
        setEditCountryCode('+971');
        setEditPhone(p.slice(4).trim());
      } else if (p.startsWith('+')) {
        const m = p.match(/^(\+\d{1,4})(.*)$/);
        if (m) {
          setEditCountryCode(m[1]);
          setEditPhone(m[2].trim());
        } else {
          setEditCountryCode('+91');
          setEditPhone(p);
        }
      } else {
        setEditCountryCode('+91');
        setEditPhone(p);
      }
    }
  }, [
    otherUser?._id,
    otherUser?.name,
    otherUser?.contactName,
    otherUser?.phoneNumber,
    otherUser?.username,
  ]);

  // Handle saving edited contact (first name, last name, username, mobile number)
  const handleSaveContact = async () => {
    if (!editFirstName.trim()) {
      showToast('First name is required', 'error');
      return;
    }

    const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
    const cleanNumberOnly = editPhone.replace(/[^\d]/g, '');
    if (!cleanNumberOnly) {
      showToast('Phone number is required', 'error');
      return;
    }

    const fullPhoneNumber = `${editCountryCode}${cleanNumberOnly}`;
    const cleanUsername = editUsername.trim().toLowerCase().replace(/^@/, '');

    setSavingContact(true);
    try {
      if (updateContact) {
        await updateContact({
          targetUserId: otherUserId,
          name: fullName,
          phoneNumber: fullPhoneNumber,
          username: cleanUsername,
          oldPhoneNumber: otherUser?.phoneNumber,
        });
      }
      showToast('Contact updated successfully ✓', 'success', '✓');
      setCurrentView('info');
    } catch (err) {
      console.error('Failed to update contact:', err);
      showToast(err?.response?.data?.message || 'Failed to update contact', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  // Handle deleting contact from phone contacts
  const handleDeleteContact = async () => {
    setShowDeleteContactConfirm(false);
    try {
      if (deletePhoneContact && (otherUser?.phoneNumber || editPhone)) {
        await deletePhoneContact(otherUser?.phoneNumber || editPhone);
      }
      showToast('Contact removed from contacts', 'info', '🗑️');
      setCurrentView('info');
    } catch (err) {
      console.error('Failed to delete contact:', err);
      showToast('Failed to remove contact', 'error');
    }
  };

  // Extract media, links, and documents from messages
  const mediaList = useMemo(() => {
    return messages.filter(
      (m) =>
        !m.isDeleted &&
        (m.messageType === 'image' || m.messageType === 'video') &&
        m.attachments?.length > 0
    );
  }, [messages]);

  const docList = useMemo(() => {
    return messages.filter(
      (m) =>
        !m.isDeleted &&
        (m.messageType === 'document' || m.messageType === 'file') &&
        m.attachments?.length > 0
    );
  }, [messages]);

  const linkList = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = [];
    messages.forEach((m) => {
      if (!m.isDeleted && m.message) {
        const matches = m.message.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            links.push({ url, createdAt: m.createdAt, sender: m.sender });
          });
        }
      }
    });
    return links;
  }, [messages]);

  const totalMediaLinksDocs = mediaList.length + docList.length + linkList.length;

  // Toggle Mute
  const handleToggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    try {
      const mutedList = JSON.parse(localStorage.getItem('chatapp_muted_conversations') || '[]');
      const updated = nextState
        ? [...new Set([...mutedList, activeConversation._id])]
        : mutedList.filter((id) => id !== activeConversation._id);
      localStorage.setItem('chatapp_muted_conversations', JSON.stringify(updated));
      showToast(nextState ? 'Notifications muted' : 'Notifications unmuted', 'info', nextState ? '🔕' : '🔔');
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Favourite
  const handleToggleFavourite = () => {
    const nextState = !isFavourite;
    setIsFavourite(nextState);
    try {
      const favList = JSON.parse(localStorage.getItem('chatapp_fav_conversations') || '[]');
      const updated = nextState
        ? [...new Set([...favList, activeConversation._id])]
        : favList.filter((id) => id !== activeConversation._id);
      localStorage.setItem('chatapp_fav_conversations', JSON.stringify(updated));
      showToast(nextState ? 'Added to favourites ❤️' : 'Removed from favourites', 'success', nextState ? '❤️' : '🤍');
    } catch (e) {
      console.error(e);
    }
  };

  // Export Chat
  const handleExportChat = () => {
    try {
      const header = `========================================\nBaatCheet Chat Transcript\nWith: ${displayName}\nExported: ${new Date().toLocaleString()}\n========================================\n\n`;
      const body = messages
        .map((m) => {
          const time = new Date(m.createdAt).toLocaleString();
          const senderName =
            (m.sender?._id || m.sender)?.toString() === user?._id?.toString()
              ? 'You'
              : m.sender?.name || displayName;
          const text = m.isDeleted
            ? '<This message was deleted>'
            : m.message ||
              (m.attachments?.length
                ? `[Attachment: ${m.attachments[0].filename || m.messageType}]`
                : '');
          return `[${time}] ${senderName}: ${text}`;
        })
        .join('\n');

      const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BaatCheet_Chat_${displayName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Chat exported successfully ✓', 'success', '📥');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export chat', 'error');
    }
  };

  // Block / Unblock Toggle
  const handleToggleBlock = () => {
    if (!otherUserId) return;
    if (isBlocked) {
      unblockUser(otherUserId);
      showToast(`${displayName} unblocked ✓`, 'success', '🔓');
    } else {
      blockUser(otherUserId);
      showToast(`${displayName} blocked ⊘`, 'error', '⊘');
    }
  };

  // Clear Chat
  const handleConfirmClear = async () => {
    setShowClearConfirm(false);
    try {
      await clearCurrentChat();
      showToast('Chat cleared ✓', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to clear chat', 'error');
    }
  };

  // Delete Chat
  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteConversation(activeConversation._id);
      onClose();
      showToast('Chat deleted ✓', 'info', '🗑️');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete chat', 'error');
    }
  };

  const handleCopyPhone = () => {
    if (!displayPhone) return;
    navigator.clipboard.writeText(displayPhone);
    showToast('Phone number copied! 📋', 'success');
  };

  // Row Item Helper Component
  const MenuRowItem = ({ icon, label, subtitle, rightElement, onClick, isRed = false, id }) => (
    <div
      id={id}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
        gap: 18,
        color: isRed ? '#ef4444' : 'var(--text-primary, #e9edef)',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.background = 'transparent')}
    >
      <div
        style={{
          width: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: isRed ? '#ef4444' : 'var(--text-secondary, #8696a0)',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.96rem', fontWeight: 400 }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8696a0)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );

  return (
    <div
      id="contact-info-panel"
      className="animate-fade-in"
      style={{
        width: 420,
        maxWidth: '100%',
        height: '100%',
        background: 'var(--bg-secondary, #111b21)',
        borderLeft: '1px solid var(--border-color, #222d34)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* 1. TOP HEADER (WhatsApp Web Style) */}
      <div
        style={{
          height: 60,
          padding: '0 20px',
          background: 'var(--bg-secondary, #111b21)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid var(--border-subtle, #222d34)',
          flexShrink: 0,
        }}
      >
        {currentView === 'edit' ? (
          <>
            <button
              id="back-from-edit-btn"
              onClick={() => setCurrentView('info')}
              title="Back"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #aebac1)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary, #e9edef)', margin: 0, flex: 1 }}>
              Edit contact
            </h3>
            <button
              id="delete-contact-btn"
              title="Delete contact"
              onClick={() => setShowDeleteContactConfirm(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #aebac1)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </>
        ) : currentView === 'permissions' ? (
          <>
            <button
              id="back-from-permissions-btn"
              onClick={() => setCurrentView('info')}
              title="Back"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #aebac1)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary, #e9edef)', margin: 0, flex: 1 }}>
              Group permissions
            </h3>
          </>
        ) : currentView === 'edit_admins' ? (
          <>
            <button
              id="back-from-edit-admins-btn"
              onClick={() => setCurrentView('permissions')}
              title="Back"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #aebac1)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary, #e9edef)', margin: 0, flex: 1 }}>
              Edit group admins
            </h3>
          </>
        ) : currentView === 'member_contact' ? (
          <>
            <button
              id="back-from-member-contact-btn"
              onClick={() => setCurrentView('info')}
              title="Back"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #aebac1)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary, #e9edef)', margin: 0, flex: 1 }}>
              Contact info
            </h3>
          </>
        ) : (
          <>
            <button
              id="close-contact-info-btn"
              onClick={onClose}
              title="Close"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #aebac1)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary, #e9edef)', margin: 0, flex: 1 }}>
              {isGroup ? 'Group info' : 'Contact info'}
            </h3>

            {!isGroup && (
              <button
                id="edit-contact-info-btn"
                title="Edit"
                onClick={() => setCurrentView('edit')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #aebac1)',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* SCROLLABLE BODY */}
      {currentView === 'edit' ? (
        <div
          id="edit-contact-scroll-view"
          className="animate-fade-in"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: 'var(--bg-secondary, #111b21)',
            padding: '24px 20px 100px 20px',
            scrollbarWidth: 'thin',
          }}
        >
          {/* 1. Person: First name & Last name */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 28, alignItems: 'flex-start' }}>
            <div style={{ color: '#8696a0', marginTop: 14, flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              {/* First name */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: '0.8rem', color: focusedInput === 'firstName' ? '#00a884' : '#8696a0', marginBottom: 4, transition: 'color 0.2s' }}>
                  First name
                </div>
                <input
                  id="edit-first-name-input"
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  onFocus={() => setFocusedInput('firstName')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: focusedInput === 'firstName' ? '2px solid #00a884' : '1px solid #3b444b',
                    padding: '6px 0',
                    fontSize: '1.05rem',
                    color: '#e9edef',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  placeholder="First name"
                />
              </div>

              {/* Last name */}
              <div>
                <div style={{ fontSize: '0.8rem', color: focusedInput === 'lastName' ? '#00a884' : '#8696a0', marginBottom: 4, transition: 'color 0.2s' }}>
                  Last name
                </div>
                <input
                  id="edit-last-name-input"
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  onFocus={() => setFocusedInput('lastName')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: focusedInput === 'lastName' ? '2px solid #00a884' : '1px solid #3b444b',
                    padding: '6px 0',
                    fontSize: '1.05rem',
                    color: '#e9edef',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          {/* 2. Username */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 28, alignItems: 'flex-start' }}>
            <div style={{ color: '#8696a0', marginTop: 14, flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: focusedInput === 'username' ? '#00a884' : '#8696a0', marginBottom: 4, transition: 'color 0.2s' }}>
                Username
              </div>
              <input
                id="edit-username-input"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: focusedInput === 'username' ? '2px solid #00a884' : '1px solid #3b444b',
                  padding: '6px 0',
                  fontSize: '1.05rem',
                  color: '#e9edef',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                placeholder="Username"
              />
            </div>
          </div>

          {/* 3. Country & Phone */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 28, alignItems: 'flex-start' }}>
            <div style={{ color: '#8696a0', marginTop: 14, flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {/* Country selector */}
                <div style={{ width: 110, flexShrink: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: '#8696a0', marginBottom: 4 }}>
                    Country
                  </div>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="edit-country-select"
                      value={editCountryCode}
                      onChange={(e) => setEditCountryCode(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #3b444b',
                        padding: '6px 18px 6px 0',
                        fontSize: '0.98rem',
                        color: '#e9edef',
                        outline: 'none',
                        appearance: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} style={{ background: '#111b21', color: '#e9edef' }}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        position: 'absolute',
                        right: 2,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#8696a0',
                        pointerEvents: 'none',
                        fontSize: '0.72rem',
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: focusedInput === 'phone' ? '#00a884' : '#8696a0', marginBottom: 4, transition: 'color 0.2s' }}>
                    Phone
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid #00a884',
                      paddingBottom: 2,
                    }}
                  >
                    <input
                      id="edit-phone-input"
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      onFocus={() => setFocusedInput('phone')}
                      onBlur={() => setFocusedInput(null)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '6px 0',
                        fontSize: '1.05rem',
                        color: '#e9edef',
                        outline: 'none',
                      }}
                      placeholder="Phone number"
                    />
                    <span style={{ color: '#00a884', marginLeft: 8, display: 'flex', alignItems: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtitle helper note */}
              <div style={{ fontSize: '0.82rem', color: '#8696a0', marginTop: 8 }}>
                This phone number is on BaatCheet.
              </div>
            </div>
          </div>

          {/* 4. Sync contact to phone */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 32, alignItems: 'center' }}>
            <div style={{ color: '#8696a0', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.98rem', color: '#e9edef', fontWeight: 500 }}>
                Sync contact to phone
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8696a0', marginTop: 2 }}>
                This contact will be added to your phone's address book.
              </div>
            </div>
            {/* Toggle switch */}
            <div
              id="sync-contact-toggle"
              onClick={() => setSyncToPhone((prev) => !prev)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 24,
                background: syncToPhone ? '#00a884' : '#374248',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: syncToPhone ? 23 : 3,
                  transition: 'left 0.2s ease',
                }}
              />
            </div>
          </div>

          {/* 5. Floating Bottom Center Save Button */}
          <div
            style={{
              position: 'sticky',
              bottom: 12,
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              marginTop: 'auto',
              pointerEvents: 'none',
            }}
          >
            <button
              id="save-contact-btn"
              onClick={handleSaveContact}
              disabled={savingContact}
              title="Save contact"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#00a884',
                border: 'none',
                color: '#111b21',
                cursor: savingContact ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 168, 132, 0.45)',
                transition: 'transform 0.15s ease, background 0.2s ease',
                pointerEvents: 'auto',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {savingContact ? (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    border: '3px solid #111b21',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : currentView === 'permissions' ? (
        <div
          id="group-permissions-view"
          className="animate-fade-in"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary, #111b21)',
            scrollbarWidth: 'thin',
          }}
        >
          <div style={{ padding: '16px 24px 8px 24px', color: 'var(--text-muted, #8696a0)', fontSize: '0.88rem' }}>
            Control what members can do in this group
          </div>

          {/* Section: Members can: */}
          <div style={{ padding: '12px 24px 6px 24px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted, #8696a0)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Members can:
          </div>
          <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
            {/* Edit group settings */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                  Edit group settings
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8696a0', marginTop: 4, lineHeight: 1.4 }}>
                  This includes the name, icon, description, disappearing message timer and keeping or unkeeping messages
                </div>
              </div>
              <div
                onClick={() => handleTogglePermission('editGroupSettings')}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 24,
                  background: currentPermissions.editGroupSettings ? '#00a884' : '#374248',
                  position: 'relative',
                  cursor: isCurrentUserAdmin ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                  opacity: isCurrentUserAdmin ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: 3,
                    left: currentPermissions.editGroupSettings ? 23 : 3,
                    transition: 'left 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Send new messages */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                  Send new messages
                </div>
              </div>
              <div
                onClick={() => handleTogglePermission('sendMessages')}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 24,
                  background: currentPermissions.sendMessages ? '#00a884' : '#374248',
                  position: 'relative',
                  cursor: isCurrentUserAdmin ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                  opacity: isCurrentUserAdmin ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: 3,
                    left: currentPermissions.sendMessages ? 23 : 3,
                    transition: 'left 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Add other members */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                  Add other members
                </div>
              </div>
              <div
                onClick={() => handleTogglePermission('addMembers')}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 24,
                  background: currentPermissions.addMembers ? '#00a884' : '#374248',
                  position: 'relative',
                  cursor: isCurrentUserAdmin ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                  opacity: isCurrentUserAdmin ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: 3,
                    left: currentPermissions.addMembers ? 23 : 3,
                    transition: 'left 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Send message history */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                  Send message history
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8696a0', marginTop: 4, lineHeight: 1.4 }}>
                  Send recent chat history to new members when they are added to the group.
                </div>
              </div>
              <div
                onClick={() => handleTogglePermission('sendMessageHistory')}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 24,
                  background: currentPermissions.sendMessageHistory ? '#00a884' : '#374248',
                  position: 'relative',
                  cursor: isCurrentUserAdmin ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                  opacity: isCurrentUserAdmin ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: 3,
                    left: currentPermissions.sendMessageHistory ? 23 : 3,
                    transition: 'left 0.2s ease',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

          {/* Section: Admins can: */}
          <div style={{ padding: '16px 24px 6px 24px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted, #8696a0)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Admins can:
          </div>
          <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                  Approve new members
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8696a0', marginTop: 4, lineHeight: 1.4 }}>
                  When turned on, admins must approve anyone who wants to join this group.
                </div>
              </div>
              <div
                onClick={() => handleTogglePermission('approveNewMembers')}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 24,
                  background: currentPermissions.approveNewMembers ? '#00a884' : '#374248',
                  position: 'relative',
                  cursor: isCurrentUserAdmin ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                  opacity: isCurrentUserAdmin ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: 3,
                    left: currentPermissions.approveNewMembers ? 23 : 3,
                    transition: 'left 0.2s ease',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

          {/* Section: Group admins */}
          <div style={{ padding: '16px 24px 6px 24px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted, #8696a0)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Group admins
          </div>
          <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
            <div
              onClick={() => setCurrentView('edit_admins')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 24px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                  Edit group admins
                </div>
                <div style={{ fontSize: '0.82rem', color: '#8696a0', marginTop: 3 }}>
                  {adminNamesText || 'No admins assigned'}
                </div>
              </div>
              <div style={{ color: '#8696a0' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : currentView === 'edit_admins' ? (
        <div
          id="edit-group-admins-view"
          className="animate-fade-in"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary, #111b21)',
            scrollbarWidth: 'thin',
          }}
        >
          <div style={{ padding: '16px 24px', color: '#8696a0', fontSize: '0.88rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            Select members to make them group admins. Group admins can edit group settings, manage members, and change permissions.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(activeConversation?.participants || []).map((p) => {
              const pId = (p?._id || p)?.toString();
              const isAdmin = isMemberAdmin(pId);
              const isMe = pId === user?._id?.toString();
              const pName = p.contactName || p.name || p.phoneNumber || 'User';

              return (
                <div
                  key={pId}
                  onClick={() => {
                    if (!isCurrentUserAdmin) {
                      showToast('Only group admins can change admins', 'error');
                      return;
                    }
                    toggleGroupAdmin(activeConversation._id, pId, !isAdmin);
                    showToast(
                      isAdmin ? `${pName} dismissed as admin` : `${pName} made group admin`,
                      'success',
                      '🛡️'
                    );
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: isCurrentUserAdmin ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar user={p} size={42} />
                    <div>
                      <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                        {isMe ? 'You' : pName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#8696a0', marginTop: 2 }}>
                        {p.phoneNumber || (p.username ? `@${p.username}` : '')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isAdmin && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'rgba(0, 168, 132, 0.15)',
                          color: '#00a884',
                          border: '1px solid rgba(0, 168, 132, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        Group Admin
                      </span>
                    )}
                    {isCurrentUserAdmin && (
                      <input
                        type="checkbox"
                        checked={isAdmin}
                        onChange={() => {}}
                        style={{ accentColor: '#00a884', width: 18, height: 18, cursor: 'pointer' }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : currentView === 'member_contact' && selectedMemberForContact ? (
        <div
          id="member-contact-view"
          className="animate-fade-in"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary, #111b21)',
            scrollbarWidth: 'thin',
          }}
        >
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <Avatar user={selectedMemberForContact} size={110} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#e9edef', margin: '0 0 6px 0' }}>
              {selectedMemberForContact.contactName || selectedMemberForContact.name || 'Member'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#8696a0', margin: 0 }}>
              {selectedMemberForContact.phoneNumber || (selectedMemberForContact.username ? `@${selectedMemberForContact.username}` : '')}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 20 }}>
              {/* Chat */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    startDirectConversation(selectedMemberForContact._id);
                    onClose();
                  }}
                  title="Chat"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: '#202c33',
                    border: '1px solid #2a3942',
                    color: '#00a884',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <span style={{ fontSize: '0.8rem', color: '#8696a0' }}>Message</span>
              </div>

              {/* Audio & Video - Hidden for official Batiyau channel */}
              {!selectedMemberForContact?.isOfficial && selectedMemberForContact?.username !== 'batiyao' && (
                <>
                  {/* Audio */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => {
                        startCall(selectedMemberForContact, 'audio');
                        onClose();
                      }}
                      title="Audio call"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: '#202c33',
                        border: '1px solid #2a3942',
                        color: '#00a884',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.8rem', color: '#8696a0' }}>Audio</span>
                  </div>

                  {/* Video */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => {
                        startCall(selectedMemberForContact, 'video');
                        onClose();
                      }}
                      title="Video call"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: '#202c33',
                        border: '1px solid #2a3942',
                        color: '#00a884',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="2" y="5" width="13" height="14" rx="3" />
                        <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.8rem', color: '#8696a0' }}>Video</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ height: 10, background: '#0c1317' }} />

          {/* Bio / About */}
          <div style={{ padding: '16px 24px', background: '#111b21' }}>
            <div style={{ fontSize: '0.84rem', color: '#8696a0', marginBottom: 6, fontWeight: 500 }}>
              About
            </div>
            <div style={{ fontSize: '0.96rem', color: '#e9edef' }}>
              {selectedMemberForContact.bio || 'Available on BaatCheet'}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
          }}
        >
          {isGroup ? (
            /* ========================================================
               GROUP INFO VIEW (WHATSAPP IDENTICAL)
               ======================================================== */
            <>
              {/* 1. HERO SECTION */}
              <div
                style={{
                  padding: '24px 20px 20px 20px',
                  background: 'var(--bg-secondary, #111b21)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Large Group Avatar */}
                <div
                  style={{ position: 'relative', cursor: 'pointer', marginBottom: 16 }}
                  onClick={() => {
                    setPhotoZoom(1);
                    setShowAvatarLightbox(true);
                  }}
                  title="Click to view group photo"
                >
                  <Avatar user={activeConversation} size={120} />
                </div>

                {/* Group Name & Inline Edit */}
                {editingGroupName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={groupNameText}
                      onChange={(e) => setGroupNameText(e.target.value)}
                      style={{
                        background: '#202c33',
                        border: '1px solid #00a884',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: '#e9edef',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleSaveGroupName}
                      style={{ padding: '6px 12px', background: '#00a884', border: 'none', color: '#000', fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGroupName(false)}
                      style={{ padding: '6px 10px', background: 'none', border: '1px solid #374248', color: '#e9edef', borderRadius: 8, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 0 4px 0' }}>
                    <h2
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 600,
                        color: 'var(--text-primary, #e9edef)',
                        margin: 0,
                        wordBreak: 'break-word',
                      }}
                    >
                      {displayName}
                    </h2>
                    {(isCurrentUserAdmin || currentPermissions.editGroupSettings) && (
                      <button
                        onClick={() => setEditingGroupName(true)}
                        title="Edit group name"
                        style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 4 }}
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}

                {/* Subtitle */}
                <p style={{ fontSize: '0.9rem', color: '#8696a0', margin: '0 0 18px 0' }}>
                  Group · {activeConversation.participants?.length || 0} members
                </p>

                {/* 3 Action Buttons: Voice, Video, Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 6 }}>
                  {/* Group Voice Call */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      id="group-info-voice-btn"
                      onClick={() => {
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
                        onClose();
                      }}
                      title="Group Voice Call"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: '#202c33',
                        border: '1px solid #2a3942',
                        color: '#00a884',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3942')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#202c33')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8696a0)' }}>Audio</span>
                  </div>

                  {/* Group Video Call */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      id="group-info-video-btn"
                      onClick={() => {
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
                        onClose();
                      }}
                      title="Group Video Call"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: '#202c33',
                        border: '1px solid #2a3942',
                        color: '#00a884',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3942')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#202c33')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8696a0)' }}>Video</span>
                  </div>

                  {/* Search in Chat */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      id="group-info-search-btn"
                      onClick={() => {
                        onClose();
                        setIsSearching(true);
                      }}
                      title="Search"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: '#202c33',
                        border: '1px solid #2a3942',
                        color: '#00a884',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3942')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#202c33')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8696a0)' }}>Search</span>
                  </div>
                </div>
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 2. GROUP DESCRIPTION */}
              <div style={{ padding: '16px 24px', background: 'var(--bg-secondary, #111b21)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted, #8696a0)', fontWeight: 500 }}>
                    Group description
                  </div>
                  {(isCurrentUserAdmin || currentPermissions.editGroupSettings) && !editingGroupDesc && (
                    <button
                      onClick={() => setEditingGroupDesc(true)}
                      style={{ background: 'none', border: 'none', color: '#00a884', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingGroupDesc ? (
                  <div>
                    <textarea
                      value={groupDescText}
                      onChange={(e) => setGroupDescText(e.target.value)}
                      placeholder="Add a group description..."
                      style={{
                        width: '100%',
                        background: '#202c33',
                        border: '1px solid #00a884',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: '#e9edef',
                        fontSize: '0.94rem',
                        outline: 'none',
                        minHeight: 70,
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => setEditingGroupDesc(false)}
                        style={{ padding: '4px 12px', background: 'none', border: '1px solid #374248', color: '#e9edef', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveGroupDesc}
                        style={{ padding: '4px 14px', background: '#00a884', border: 'none', color: '#000', fontWeight: 600, borderRadius: 6, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.96rem', color: 'var(--text-primary, #e9edef)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {activeConversation.groupDescription || (
                      <span style={{ color: '#8696a0', fontStyle: 'italic' }}>
                        {(isCurrentUserAdmin || currentPermissions.editGroupSettings) ? 'Add group description' : 'No description added'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 3. MEDIA, LINKS, DOCS & SETTINGS */}
              <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
                <MenuRowItem
                  id="row-media-links-docs"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  }
                  label="Media, links and docs"
                  rightElement={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted, #8696a0)', fontSize: '0.9rem' }}>
                      <span>{totalMediaLinksDocs}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  }
                  onClick={() => setActiveMediaTab((prev) => (prev ? null : 'media'))}
                />

                {activeMediaTab && (
                  <div className="animate-fade-in" style={{ padding: '0 24px 16px 24px', background: 'rgba(0, 0, 0, 0.2)' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #222d34', marginBottom: 12 }}>
                      {[
                        { key: 'media', label: `Media (${mediaList.length})` },
                        { key: 'docs', label: `Docs (${docList.length})` },
                        { key: 'links', label: `Links (${linkList.length})` },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setActiveMediaTab(t.key)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeMediaTab === t.key ? '2px solid #00a884' : '2px solid transparent',
                            color: activeMediaTab === t.key ? '#00a884' : 'var(--text-muted, #8696a0)',
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {/* Media list */}
                    {activeMediaTab === 'media' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {mediaList.length === 0 ? (
                          <div style={{ gridColumn: 'span 3', padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No media shared yet</div>
                        ) : (
                          mediaList.map((m) => {
                            const att = m.attachments?.[0];
                            const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
                            const src = att?.url?.startsWith('http') ? att.url : `${backendBase}${att.url}`;
                            return (
                              <div key={m._id} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#000', cursor: 'pointer' }} onClick={() => window.open(src, '_blank')}>
                                <img src={src} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Starred Messages */}
                <MenuRowItem
                  id="row-starred-messages"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  }
                  label="Starred messages"
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="#8696a0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setShowStarredModal(true)}
                />

                {/* Mute Notifications */}
                <MenuRowItem
                  id="row-mute-notifications"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  }
                  label="Mute notifications"
                  rightElement={
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMute();
                      }}
                      style={{
                        width: 38,
                        height: 20,
                        borderRadius: 20,
                        background: isMuted ? '#00a884' : '#374248',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: 3,
                          left: isMuted ? 21 : 3,
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </div>
                  }
                  onClick={handleToggleMute}
                />

                {/* Disappearing Messages */}
                <MenuRowItem
                  id="row-disappearing-messages"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  }
                  label="Disappearing messages"
                  subtitle={disappearingDuration}
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="#8696a0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setShowDisappearingModal(true)}
                />

                {/* Chat theme */}
                <MenuRowItem
                  id="row-chat-theme"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3 0 5.6-2.5 5.6-5.5C22 6.0 17.5 2 12 2z" />
                      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
                      <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" />
                      <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
                      <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" />
                    </svg>
                  }
                  label="Chat theme"
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="#8696a0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setShowThemeModal(true)}
                />
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 4. GROUP PERMISSIONS ROW (Matches Screenshot) */}
              <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
                <MenuRowItem
                  id="row-group-permissions"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                  label="Group permissions"
                  subtitle="Control what members can do in this group"
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="#8696a0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setCurrentView('permissions')}
                />
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 5. MEMBERS SECTION */}
              <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
                {/* Header count */}
                <div style={{ padding: '16px 24px 10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 600 }}>
                    {activeConversation.participants?.length || 0} members
                  </span>
                </div>

                {/* Search members by name or mobile number */}
                <div style={{ padding: '0 24px 12px 24px' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search members by name or phone..."
                      value={memberFilterQuery}
                      onChange={(e) => setMemberFilterQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        borderRadius: 8,
                        border: '1px solid #2a3942',
                        background: '#202c33',
                        color: '#e9edef',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8696a0' }}>
                      🔍
                    </span>
                    {memberFilterQuery && (
                      <button
                        onClick={() => setMemberFilterQuery('')}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#8696a0',
                          cursor: 'pointer',
                          fontSize: 14,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Add member row */}
                {(isCurrentUserAdmin || currentPermissions.addMembers) && (
                  <div
                    onClick={() => setShowAddMemberModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 24px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: '#00a884',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#111b21',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                      Add member
                    </div>
                  </div>
                )}

                {/* Invite to group via link row */}
                {(isCurrentUserAdmin || currentPermissions.addMembers) && (
                  <div
                    onClick={handleOpenInviteModal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 24px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: '#202c33',
                        border: '1px solid #2a3942',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00a884',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.96rem', color: '#e9edef', fontWeight: 500 }}>
                      Invite to group via link
                    </div>
                  </div>
                )}

                {/* Member items */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredParticipants.map((p) => {
                    const pId = (p?._id || p)?.toString();
                    const isMe = pId === user?._id?.toString();
                    const isAdmin = isMemberAdmin(pId);
                    const pName = isMe ? 'You' : (p.contactName || p.name || 'Member');
                    const pBio = p.bio || (isMe ? 'Message yourself' : 'Available');

                    return (
                      <div
                        key={pId}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMemberActionMenu({ member: p, top: rect.top, right: 20 });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 24px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                          <Avatar user={p} size={42} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.94rem', color: '#e9edef', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {pName}
                              </span>
                              {isAdmin && (
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 7px',
                                    borderRadius: 5,
                                    background: 'rgba(0, 168, 132, 0.15)',
                                    color: '#00a884',
                                    border: '1px solid rgba(0, 168, 132, 0.25)',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Group Admin
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#8696a0', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.phoneNumber || pBio}
                            </div>
                          </div>
                        </div>

                        <div style={{ color: '#8696a0', padding: 4 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 6. CREATE SIMILAR GROUP & EXIT GROUP */}
              <div style={{ background: 'var(--bg-secondary, #111b21)', paddingBottom: 24 }}>
                {/* Create a similar group */}
                <MenuRowItem
                  id="row-create-similar-group"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  }
                  label="Create a similar group"
                  onClick={() => {
                    setSimilarGroupName(`${activeConversation.groupName || 'Group'} 2`);
                    setShowCreateSimilarGroupModal(true);
                  }}
                />

                {/* Exit group */}
                <MenuRowItem
                  id="row-exit-group"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  }
                  label="Exit group"
                  isRed
                  onClick={() => setShowExitGroupConfirm(true)}
                />

                {/* Report group */}
                <MenuRowItem
                  id="row-report-group"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                  }
                  label="Report group"
                  isRed
                  onClick={() => setShowReportModal(true)}
                />
              </div>
            </>
          ) : (
            /* ========================================================
               1-ON-1 CONTACT INFO VIEW
               ======================================================== */
            <>
              {/* 2. PROFILE HERO SECTION (Large Avatar, Name, Phone, Action Buttons) */}
              <div
                style={{
                  padding: '24px 20px 20px 20px',
                  background: 'var(--bg-secondary, #111b21)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Large Avatar */}
                <div
                  style={{ position: 'relative', cursor: 'pointer', marginBottom: 16 }}
                  onClick={() => {
                    setPhotoZoom(1);
                    setShowAvatarLightbox(true);
                  }}
                  title="Click to view photo"
                >
                  <Avatar user={otherUser} size={120} showOnline isOnline={isOnline} />
                </div>

                {/* Contact Name */}
                <h2
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--text-primary, #e9edef)',
                    margin: '0 0 4px 0',
                    wordBreak: 'break-word',
                  }}
                >
                  {displayName}
                </h2>

                {/* Phone Number / Username */}
                {displayPhone && (
                  <p
                    onClick={handleCopyPhone}
                    title="Click to copy"
                    style={{
                      fontSize: '0.94rem',
                      color: 'var(--text-muted, #8696a0)',
                      margin: '0 0 18px 0',
                      cursor: 'pointer',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#53bdeb')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #8696a0)')}
                  >
                    {displayPhone}
                  </p>
                )}

                {/* 3 Action Buttons: Voice, Video, Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 6 }}>
                  {otherUser?.isOfficial || otherUser?.username === 'batiyao' || displayName?.toLowerCase().includes('batiyao') ? (
                    <div
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        userSelect: 'none',
                      }}
                      title="Official Batiyau Notice Channel - Voice & Video calls are disabled"
                    >
                      <span>🛡️ Official Notice Channel (Calls Disabled)</span>
                    </div>
                  ) : (
                    <>
                      {/* Voice */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <button
                          id="contact-voice-btn"
                          onClick={() => {
                            if (otherUser) startCall(otherUser, 'audio');
                            else showToast('Voice call not supported in this chat', 'error');
                          }}
                          title="Voice call"
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: '50%',
                            background: '#202c33',
                            border: '1px solid #2a3942',
                            color: '#00a884',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3942')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#202c33')}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8696a0)' }}>Voice</span>
                      </div>

                      {/* Video */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <button
                          id="contact-video-btn"
                          onClick={() => {
                            if (otherUser) startCall(otherUser, 'video');
                            else showToast('Video call not supported in this chat', 'error');
                          }}
                          title="Video call"
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: '50%',
                            background: '#202c33',
                            border: '1px solid #2a3942',
                            color: '#00a884',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3942')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#202c33')}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                        </button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8696a0)' }}>Video</span>
                      </div>
                    </>
                  )}

                  {/* Search */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <button
                      id="contact-search-btn"
                      onClick={() => {
                        onClose();
                        setIsSearching(true);
                      }}
                      title="Search"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: '#202c33',
                        border: '1px solid #2a3942',
                        color: '#00a884',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a3942')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#202c33')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8696a0)' }}>Search</span>
                  </div>
                </div>
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 3. ABOUT SECTION */}
              <div style={{ padding: '16px 24px', background: 'var(--bg-secondary, #111b21)' }}>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted, #8696a0)', marginBottom: 6, fontWeight: 500 }}>
                  About
                </div>
                <div
                  style={{
                    fontSize: '0.96rem',
                    color: 'var(--text-primary, #e9edef)',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}
                >
                  {displayBio}
                </div>
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 4. MEDIA, LINKS, DOCS & SETTINGS */}
              <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
                {/* Media, links and docs */}
                <MenuRowItem
                  id="row-media-links-docs"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  }
                  label="Media, links and docs"
                  rightElement={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted, #8696a0)', fontSize: '0.9rem' }}>
                      <span>{totalMediaLinksDocs}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  }
                  onClick={() => setActiveMediaTab((prev) => (prev ? null : 'media'))}
                />

                {/* Subview of Media / Links / Docs when opened */}
                {activeMediaTab && (
                  <div
                    className="animate-fade-in"
                    style={{
                      padding: '0 24px 16px 24px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #222d34', marginBottom: 12 }}>
                      {[
                        { key: 'media', label: `Media (${mediaList.length})` },
                        { key: 'docs', label: `Docs (${docList.length})` },
                        { key: 'links', label: `Links (${linkList.length})` },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setActiveMediaTab(t.key)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeMediaTab === t.key ? '2px solid #00a884' : '2px solid transparent',
                            color: activeMediaTab === t.key ? '#00a884' : 'var(--text-muted, #8696a0)',
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {activeMediaTab === 'media' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {mediaList.length === 0 ? (
                          <div style={{ gridColumn: 'span 3', padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No media shared yet
                          </div>
                        ) : (
                          mediaList.map((m) => {
                            const att = m.attachments?.[0];
                            const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
                            const src = att?.url?.startsWith('http') ? att.url : `${backendBase}${att.url}`;
                            return (
                              <div
                                key={m._id}
                                style={{
                                  aspectRatio: '1',
                                  borderRadius: 6,
                                  overflow: 'hidden',
                                  background: '#000',
                                  cursor: 'pointer',
                                }}
                                onClick={() => window.open(src, '_blank')}
                              >
                                <img src={src} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {activeMediaTab === 'docs' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {docList.length === 0 ? (
                          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No documents shared yet
                          </div>
                        ) : (
                          docList.map((m) => {
                            const att = m.attachments?.[0];
                            const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
                            const src = att?.url?.startsWith('http') ? att.url : `${backendBase}${att.url}`;
                            return (
                              <a
                                key={m._id}
                                href={src}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 10px',
                                  background: '#202c33',
                                  borderRadius: 8,
                                  color: '#fff',
                                  textDecoration: 'none',
                                  fontSize: '0.85rem',
                                }}
                              >
                                <span style={{ fontSize: 18 }}>📄</span>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {att.filename || 'Document'}
                                </span>
                                <span>⬇</span>
                              </a>
                            );
                          })
                        )}
                      </div>
                    )}

                    {activeMediaTab === 'links' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {linkList.length === 0 ? (
                          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No links shared yet
                          </div>
                        ) : (
                          linkList.map((l, i) => (
                            <a
                              key={i}
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '8px 10px',
                                background: '#202c33',
                                borderRadius: 8,
                                color: '#53bdeb',
                                textDecoration: 'underline',
                                fontSize: '0.85rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {l.url}
                            </a>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Starred Messages */}
                <MenuRowItem
                  id="row-starred-messages"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  }
                  label="Starred messages"
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--text-muted, #8696a0)">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setShowStarredModal(true)}
                />

                {/* Mute Notifications (with WhatsApp slider switch) */}
                <MenuRowItem
                  id="row-mute-notifications"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  }
                  label="Mute notifications"
                  rightElement={
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMute();
                      }}
                      style={{
                        width: 38,
                        height: 20,
                        borderRadius: 20,
                        background: isMuted ? '#00a884' : '#374248',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: 3,
                          left: isMuted ? 21 : 3,
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </div>
                  }
                  onClick={handleToggleMute}
                />

                {/* Disappearing Messages */}
                <MenuRowItem
                  id="row-disappearing-messages"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  }
                  label="Disappearing messages"
                  subtitle={disappearingDuration}
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--text-muted, #8696a0)">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setShowDisappearingModal(true)}
                />

                {/* Advanced chat privacy */}
                <MenuRowItem
                  id="row-advanced-privacy"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  }
                  label="Advanced chat privacy"
                  subtitle="off"
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--text-muted, #8696a0)">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setShowPrivacyModal(true)}
                />

                {/* Chat theme */}
                <MenuRowItem
                  id="row-chat-theme"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3 0 5.6-2.5 5.6-5.5C22 6.0 17.5 2 12 2z" />
                      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
                      <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" />
                      <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
                      <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" />
                    </svg>
                  }
                  label="Chat theme"
                  rightElement={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--text-muted, #8696a0)">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  }
                  onClick={() => setShowThemeModal(true)}
                />

                {/* Encryption (WhatsApp-style E2EE Verify modal on click) */}
                <MenuRowItem
                  id="row-encryption"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isContactVerified ? '#00a884' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isContactVerified ? (
                        <>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </>
                      ) : (
                        <>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </>
                      )}
                    </svg>
                  }
                  label="Encryption"
                  subtitle={
                    isContactVerified
                      ? "Messages and calls are end-to-end encrypted. (Verified ✓)"
                      : "Messages and calls are end-to-end encrypted. Tap to verify."
                  }
                  rightElement={
                    isContactVerified ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.78rem',
                          color: '#00a884',
                          fontWeight: 600,
                          background: 'rgba(0, 168, 132, 0.12)',
                          padding: '3px 8px',
                          borderRadius: 12,
                        }}
                      >
                        <span>✓</span>
                        <span>Verified</span>
                      </div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--text-muted, #8696a0)">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )
                  }
                  onClick={() => setShowEncryptionModal(true)}
                />
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 5. FAVOURITES, LIST & EXPORT */}
              <div style={{ background: 'var(--bg-secondary, #111b21)' }}>
                {/* Add to favourites */}
                <MenuRowItem
                  id="row-favourites"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavourite ? '#ef4444' : 'none'} stroke={isFavourite ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  }
                  label={isFavourite ? 'Added to favourites ❤️' : 'Add to favourites'}
                  onClick={handleToggleFavourite}
                />

                {/* Add to list */}
                <MenuRowItem
                  id="row-add-to-list"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  }
                  label="Add to list"
                  onClick={() => showToast('List assignment opened', 'info', '📋')}
                />

                {/* Export chat */}
                <MenuRowItem
                  id="row-export-chat"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  }
                  label="Export chat"
                  onClick={handleExportChat}
                />
              </div>

              {/* SECTION DIVIDER */}
              <div style={{ height: 10, background: 'var(--bg-primary, #0c1317)' }} />

              {/* 6. DANGER ACTIONS IN RED (Clear, Block, Report, Delete) */}
              <div style={{ background: 'var(--bg-secondary, #111b21)', paddingBottom: 20 }}>
                {/* Clear chat */}
                <MenuRowItem
                  id="row-clear-chat"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  }
                  label="Clear chat"
                  isRed
                  onClick={() => setShowClearConfirm(true)}
                />

                {/* Block / Unblock Contact */}
                {!isGroup && otherUser && (
                  <MenuRowItem
                    id="row-block-contact"
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                    }
                    label={isBlocked ? `Unblock ${displayName}` : `Block ${displayName}`}
                    isRed
                    onClick={handleToggleBlock}
                  />
                )}

                {/* Report Contact */}
                <MenuRowItem
                  id="row-report-contact"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                  }
                  label={`Report ${displayName}`}
                  isRed
                  onClick={() => setShowReportModal(true)}
                />

                {/* Delete chat */}
                <MenuRowItem
                  id="row-delete-chat"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  }
                  label="Delete chat"
                  isRed
                  onClick={() => setShowDeleteConfirm(true)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: Starred Messages */}
      {showStarredModal && <StarredMessagesModal onClose={() => setShowStarredModal(false)} />}

      {/* MODAL 2: Disappearing Messages */}
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
              background: '#222e35',
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>⏱️</span>
              <h3 style={{ fontSize: '1.15rem', color: '#e9edef', margin: 0 }}>Disappearing messages</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#8696a0', marginBottom: 20, lineHeight: 1.45 }}>
              For more privacy and storage, new messages will disappear from this chat for everyone after the selected duration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { id: '24 hours', label: '24 hours' },
                { id: '7 days', label: '7 days' },
                { id: '90 days', label: '90 days' },
                { id: 'off', label: 'Off' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: disappearingDuration === opt.id ? 'rgba(0, 168, 132, 0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    color: disappearingDuration === opt.id ? '#00a884' : '#e9edef',
                    fontWeight: disappearingDuration === opt.id ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="disappearingOpt"
                    checked={disappearingDuration === opt.id}
                    onChange={() => {
                      setDisappearingDuration(opt.id);
                      showToast(`Disappearing messages set to: ${opt.label}`, 'success', '⏱️');
                      setShowDisappearingModal(false);
                    }}
                    style={{ accentColor: '#00a884' }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowDisappearingModal(false)}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '10px 0',
                background: '#00a884',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Advanced Chat Privacy */}
      {showPrivacyModal && (
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
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            style={{
              background: '#222e35',
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🌐</span>
              <h3 style={{ fontSize: '1.15rem', color: '#e9edef', margin: 0 }}>Advanced chat privacy</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#8696a0', marginBottom: 20, lineHeight: 1.45 }}>
              Protect your IP address in calls and prevent other participants from relaying your connection.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ color: '#e9edef', fontSize: '0.94rem' }}>Protect IP address in calls</span>
              <input type="checkbox" style={{ accentColor: '#00a884', transform: 'scale(1.2)' }} defaultChecked />
            </div>
            <button
              onClick={() => {
                setShowPrivacyModal(false);
                showToast('Privacy settings saved ✓', 'success');
              }}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '10px 0',
                background: '#00a884',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Encryption Verification (WhatsApp 60-digit E2EE Security Code - only opens on clicking Encryption row) */}
      {showEncryptionModal && (
        <SecurityCodeModal
          isOpen={showEncryptionModal}
          onClose={() => setShowEncryptionModal(false)}
          otherUser={otherUser}
          currentUser={user}
          isVerified={isContactVerified}
          onToggleVerify={handleToggleVerifyContact}
        />
      )}

      {/* MODAL 5: Clear Chat Confirmation */}
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
              background: '#222e35',
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', color: '#e9edef', margin: '0 0 12px 0' }}>Clear this chat?</h3>
            <p style={{ fontSize: '0.88rem', color: '#8696a0', lineHeight: 1.45, marginBottom: 24 }}>
              Messages will be removed from this conversation for you. Starred messages will be kept.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: '1px solid #374248',
                  background: 'none',
                  color: '#00a884',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                id="confirm-clear-chat-btn"
                onClick={handleConfirmClear}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Delete Chat Confirmation */}
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
              background: '#222e35',
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', color: '#e9edef', margin: '0 0 12px 0' }}>Delete this chat?</h3>
            <p style={{ fontSize: '0.88rem', color: '#8696a0', lineHeight: 1.45, marginBottom: 24 }}>
              Are you sure you want to delete this chat with {displayName}? Messages and media will be permanently deleted.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: '1px solid #374248',
                  background: 'none',
                  color: '#00a884',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                id="confirm-delete-chat-btn"
                onClick={handleConfirmDelete}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Report Contact */}
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
              background: '#222e35',
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', color: '#e9edef', margin: '0 0 12px 0' }}>Report {displayName}?</h3>
            <p style={{ fontSize: '0.88rem', color: '#8696a0', lineHeight: 1.45, marginBottom: 16 }}>
              The last 5 messages from this contact will be forwarded to BaatCheet. This contact will not be notified.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'spam', label: 'Spam' },
                { id: 'harassment', label: 'Harassment or hate speech' },
                { id: 'inappropriate', label: 'Inappropriate content' },
                { id: 'other', label: 'Other' },
              ].map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: '0.9rem',
                    color: '#e9edef',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reportReason === r.id}
                    onChange={() => setReportReason(r.id)}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: '1px solid #374248',
                  background: 'none',
                  color: '#00a884',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  if (otherUserId) blockUser(otherUserId);
                  showToast(`${displayName} reported and blocked ✓`, 'info', '👎');
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: 'none',
                  background: '#ef4444',
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

      {/* Lightbox for full avatar view (Centered Full Photo) */}
      {showAvatarLightbox && (
        <div
          id="photo-lightbox-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 20, 26, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 100000,
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => {
            setShowAvatarLightbox(false);
            setPhotoZoom(1);
          }}
        >
          {/* Top Bar with Avatar thumbnail, contact name, download & close */}
          <div
            style={{
              height: 64,
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.45)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              zIndex: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar user={isGroup ? activeConversation : otherUser} size={42} showOnline={false} />
              <div>
                <div style={{ color: '#e9edef', fontSize: '1rem', fontWeight: 600 }}>
                  {displayName}
                </div>
                <div style={{ color: '#8696a0', fontSize: '0.8rem' }}>
                  {displayPhone || (isGroup ? 'Group photo' : 'Profile photo')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Zoom Out */}
              <button
                onClick={() => setPhotoZoom((prev) => Math.max(0.6, prev - 0.2))}
                title="Zoom out"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 38,
                  height: 38,
                  color: '#e9edef',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>

              {/* Zoom In */}
              <button
                onClick={() => setPhotoZoom((prev) => Math.min(2.5, prev + 0.2))}
                title="Zoom in"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 38,
                  height: 38,
                  color: '#e9edef',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>

              {/* Download / Open full photo */}
              {(otherUser?.profilePicture || activeConversation.groupImage) && (
                <button
                  onClick={() => {
                    const src = otherUser?.profilePicture || activeConversation.groupImage;
                    const a = document.createElement('a');
                    a.href = src;
                    a.download = `${displayName.replace(/\s+/g, '_')}_photo.jpg`;
                    a.target = '_blank';
                    a.click();
                  }}
                  title="Download photo"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 38,
                    height: 38,
                    color: '#e9edef',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              )}

              {/* Close (X) button */}
              <button
                onClick={() => {
                  setShowAvatarLightbox(false);
                  setPhotoZoom(1);
                }}
                title="Close"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 38,
                  height: 38,
                  color: '#e9edef',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Photo Center Canvas */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease-out',
                transform: `scale(${photoZoom})`,
              }}
            >
              {otherUser?.profilePicture || activeConversation.groupImage ? (
                <img
                  src={otherUser?.profilePicture || activeConversation.groupImage}
                  alt={displayName}
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '78vh',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: 12,
                    boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    objectFit: 'contain',
                    background: '#0c1317',
                    userSelect: 'none',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 320,
                    height: 320,
                    borderRadius: 16,
                    background: '#182229',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      background: '#2a3942',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 54,
                      fontWeight: 600,
                      color: '#00a884',
                      marginBottom: 18,
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ color: '#e9edef', margin: '0 0 6px 0', fontSize: '1.25rem' }}>{displayName}</h3>
                  <p style={{ color: '#8696a0', margin: 0, fontSize: '0.9rem' }}>No profile photo set</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Contact Confirm Modal */}
      {showDeleteContactConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(3px)',
            zIndex: 100001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowDeleteContactConfirm(false)}
        >
          <div
            style={{
              background: '#222e35',
              borderRadius: 14,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#e9edef', fontSize: '1.15rem' }}>
              Delete contact?
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#8696a0', fontSize: '0.92rem', lineHeight: 1.45 }}>
              Are you sure you want to remove <strong>{displayName}</strong> from your phone contacts?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowDeleteContactConfirm(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: '1px solid #374248',
                  background: 'none',
                  color: '#00a884',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContact}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Theme Customizer Modal */}
      {showThemeModal && <ChatThemeModal onClose={() => setShowThemeModal(false)} />}

      {/* Member Action Context Menu Popover */}
      {memberActionMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100010,
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setMemberActionMenu(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: Math.min(memberActionMenu.top, window.innerHeight - 250),
              right: 20,
              width: 220,
              background: '#233138',
              borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '6px 0',
              zIndex: 100011,
            }}
          >
            {/* Header with member name */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.84rem', color: '#8696a0', fontWeight: 600 }}>
              {memberActionMenu.member.contactName || memberActionMenu.member.name || 'Member'}
            </div>

            {/* Message [Name] */}
            {((memberActionMenu.member._id || memberActionMenu.member)?.toString() !== user?._id?.toString()) && (
              <div
                onClick={() => {
                  const mId = (memberActionMenu.member._id || memberActionMenu.member)?.toString();
                  setMemberActionMenu(null);
                  startDirectConversation(mId);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  color: '#e9edef',
                  fontSize: '0.9rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: '#00a884', fontSize: '1.1rem' }}>💬</span>
                <span>Message {memberActionMenu.member.contactName || memberActionMenu.member.name || 'Member'}</span>
              </div>
            )}

            {/* View [Name] */}
            <div
              onClick={() => {
                const mem = memberActionMenu.member;
                setMemberActionMenu(null);
                setSelectedMemberForContact(mem);
                setCurrentView('member_contact');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                cursor: 'pointer',
                color: '#e9edef',
                fontSize: '0.9rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '1.1rem' }}>👤</span>
              <span>View {memberActionMenu.member.contactName || memberActionMenu.member.name || 'Member'}</span>
            </div>

            {/* Admin actions if current user is admin and target is not current user */}
            {isCurrentUserAdmin && ((memberActionMenu.member._id || memberActionMenu.member)?.toString() !== user?._id?.toString()) && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                {/* Make group admin / Dismiss as admin */}
                {(() => {
                  const mId = (memberActionMenu.member._id || memberActionMenu.member)?.toString();
                  const targetIsAdmin = isMemberAdmin(mId);
                  return (
                    <div
                      onClick={() => {
                        setMemberActionMenu(null);
                        toggleGroupAdmin(activeConversation._id, mId, !targetIsAdmin);
                        showToast(
                          targetIsAdmin ? 'Dismissed as admin' : 'Made group admin',
                          'success',
                          '🛡️'
                        );
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        cursor: 'pointer',
                        color: '#e9edef',
                        fontSize: '0.9rem',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                      <span>{targetIsAdmin ? 'Dismiss as admin' : 'Make group admin'}</span>
                    </div>
                  );
                })()}

                {/* Remove from group */}
                <div
                  onClick={() => {
                    const mId = (memberActionMenu.member._id || memberActionMenu.member)?.toString();
                    setMemberActionMenu(null);
                    removeGroupMember(activeConversation._id, mId);
                    showToast('Member removed from group', 'info', '👋');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '1.1rem' }}>🚪</span>
                  <span>Remove {memberActionMenu.member.contactName || memberActionMenu.member.name || 'Member'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100010,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowAddMemberModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#222e35',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>👥</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#e9edef', fontWeight: 600 }}>Add members</h3>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                style={{ background: 'none', border: 'none', color: '#8696a0', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search name or mobile number..."
                  value={newMemberSearch}
                  onChange={(e) => setNewMemberSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px 9px 36px',
                    borderRadius: 8,
                    border: '1px solid #2a3942',
                    background: '#111b21',
                    color: '#e9edef',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8696a0' }}>
                  🔍
                </span>
              </div>
            </div>

            {/* Selected Chips */}
            {selectedNewMembers.length > 0 && (
              <div style={{ padding: '8px 20px', display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 80, overflowY: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {selectedNewMembers.map((id) => {
                  const u = allUsers?.find((userObj) => (userObj._id || userObj).toString() === id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#00a884',
                        color: '#111b21',
                        borderRadius: 16,
                        padding: '3px 10px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>{u?.name || 'User'}</span>
                      <button
                        onClick={() => setSelectedNewMembers((prev) => prev.filter((m) => m !== id))}
                        style={{ background: 'none', border: 'none', color: '#111b21', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Scrollable user list */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320, scrollbarWidth: 'thin' }}>
              {availableUsersToAdd.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: '#8696a0', fontSize: '0.9rem' }}>
                  {newMemberSearch ? 'No contacts found matching search' : 'All contacts are already in this group'}
                </div>
              ) : (
                availableUsersToAdd.map((u) => {
                  const uId = (u._id || u).toString();
                  const isSelected = selectedNewMembers.includes(uId);
                  return (
                    <div
                      key={uId}
                      onClick={() => {
                        setSelectedNewMembers((prev) =>
                          isSelected ? prev.filter((id) => id !== uId) : [...prev, uId]
                        );
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: isSelected ? 'rgba(0, 168, 132, 0.1)' : 'transparent',
                      }}
                      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar user={u} size={40} />
                        <div>
                          <div style={{ fontSize: '0.94rem', color: '#e9edef', fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#8696a0' }}>{u.phoneNumber || (u.username ? `@${u.username}` : '')}</div>
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

            {/* Bottom Actions */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowAddMemberModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: '1px solid #374248',
                  background: 'none',
                  color: '#e9edef',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembersSubmit}
                disabled={!selectedNewMembers.length || isAddingMembers}
                style={{
                  padding: '9px 22px',
                  borderRadius: 24,
                  border: 'none',
                  background: selectedNewMembers.length ? '#00a884' : '#202c33',
                  color: selectedNewMembers.length ? '#fff' : '#8696a0',
                  fontWeight: 600,
                  cursor: selectedNewMembers.length ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isAddingMembers ? 'Adding...' : `Add ${selectedNewMembers.length ? `(${selectedNewMembers.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite to Group via Link Modal */}
      {showInviteLinkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100010,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowInviteLinkModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#222e35',
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🔗</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#e9edef', fontWeight: 600 }}>Invite to group via link</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: '#111b21', borderRadius: 12, marginBottom: 16 }}>
              <Avatar user={activeConversation} size={46} />
              <div>
                <div style={{ fontSize: '1rem', color: '#e9edef', fontWeight: 600 }}>{displayName}</div>
                <div style={{ fontSize: '0.8rem', color: '#8696a0' }}>{activeConversation.participants?.length || 0} members</div>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#8696a0', lineHeight: 1.45, marginBottom: 16 }}>
              Anyone with BaatCheet can follow this link to join this group. Only share it with people you trust.
            </p>

            {/* Link Box */}
            <div style={{ background: '#111b21', padding: '12px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20 }}>
              <span style={{ color: '#00a884', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {inviteLoading ? 'Generating link...' : (inviteData?.inviteUrl || `${window.location.origin}/join/${activeConversation.inviteCode || '...'}`)}
              </span>
              <button
                onClick={() => {
                  const url = inviteData?.inviteUrl || `${window.location.origin}/join/${activeConversation.inviteCode || ''}`;
                  navigator.clipboard.writeText(url);
                  showToast('Invite link copied to clipboard! 📋', 'success');
                }}
                title="Copy Link"
                style={{
                  background: '#00a884',
                  border: 'none',
                  color: '#111b21',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Copy
              </button>
            </div>

            {/* Action rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {/* Reset link */}
              {isCurrentUserAdmin && (
                <button
                  onClick={handleResetInvite}
                  disabled={inviteLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.06)',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>🔄</span>
                  <span>Reset invite link</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInviteLinkModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 24,
                  border: 'none',
                  background: '#00a884',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Similar Group Modal */}
      {showCreateSimilarGroupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100010,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowCreateSimilarGroupModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#222e35',
              borderRadius: 16,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              padding: 24,
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#e9edef', fontWeight: 600 }}>
              Create similar group
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#8696a0', lineHeight: 1.45, marginBottom: 18 }}>
              This will create a new group with the same {activeConversation.participants?.length || 0} members from this group.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.82rem', color: '#8696a0', display: 'block', marginBottom: 6 }}>Group name</label>
              <input
                type="text"
                value={similarGroupName}
                onChange={(e) => setSimilarGroupName(e.target.value)}
                placeholder="Enter group name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #00a884',
                  background: '#111b21',
                  color: '#e9edef',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowCreateSimilarGroupModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: '1px solid #374248',
                  background: 'none',
                  color: '#e9edef',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSimilarGroup}
                disabled={!similarGroupName.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: 24,
                  border: 'none',
                  background: similarGroupName.trim() ? '#00a884' : '#374248',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: similarGroupName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Group Confirmation Modal */}
      {showExitGroupConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100010,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowExitGroupConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#222e35',
              borderRadius: 16,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              padding: 24,
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: '#e9edef', fontWeight: 600 }}>
              Exit "{displayName}" group?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#8696a0', lineHeight: 1.45, marginBottom: 24 }}>
              Only group admins will be notified that you left the group.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowExitGroupConfirm(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 24,
                  border: '1px solid #374248',
                  background: 'none',
                  color: '#00a884',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExitGroup}
                style={{
                  padding: '9px 20px',
                  borderRadius: 24,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Exit group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfoSidebar;
