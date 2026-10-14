import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import DeleteMessageModal from './DeleteMessageModal';
import ReportMessageModal from './ReportMessageModal';
import ForwardModal from './ForwardModal';

// WhatsApp style double checkmark component
const DoubleCheck = ({ isRead }) => {
  const color = isRead ? '#53bdeb' : '#9fc2cf';

  return (
    <svg
      width="16"
      height="11"
      viewBox="0 0 16 11"
      fill="none"
      title={isRead ? 'Seen' : 'Sent'}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        marginLeft: 2,
        flexShrink: 0,
        filter: isRead ? 'drop-shadow(0 0 2px rgba(83, 189, 235, 0.5))' : 'none',
      }}
    >
      <path
        d="M1 5.5L4 8.5L10.5 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 5.5L8.5 8.5L15 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getDocumentMeta = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return { icon: '📄', color: '#ef4444', label: 'PDF' };
  if (['doc', 'docx'].includes(ext)) return { icon: '📝', color: '#3b82f6', label: 'DOC' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: '📊', color: '#10b981', label: 'EXCEL' };
  if (['ppt', 'pptx'].includes(ext)) return { icon: '📽️', color: '#f97316', label: 'PPT' };
  if (['zip', 'rar', '7z'].includes(ext)) return { icon: '📦', color: '#8b5cf6', label: 'ZIP' };
  if (['txt'].includes(ext)) return { icon: '📃', color: '#64748b', label: 'TXT' };
  return { icon: '📎', color: '#4ee3c5', label: ext?.toUpperCase() || 'FILE' };
};

// WhatsApp quick reactions list
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const Message = ({ message, showAvatar = true }) => {
  const { user } = useAuth();
  const {
    toggleStarMessage,
    reactToMessage,
    searchQuery,
    searchMatches,
    activeSearchIndex,
    setReplyingTo,
    showToast,
    togglePinMessage,
    deleteMessage,
    forwardMessage,
    reportMessage,
    isSelectMode,
    setIsSelectMode,
    selectedMessageIds,
    setSelectedMessageIds,
    toggleSelectMessage,
    startCall,
    activeConversation,
  } = useChat();

  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const reactionPickerRef = useRef(null);
  const menuRef = useRef(null);

  const isSent = message.sender?._id === user?._id || message.sender === user?._id;

  const isSelected =
    isSelectMode &&
    selectedMessageIds.some((id) => id?.toString() === message._id?.toString());

  const isStarred =
    Array.isArray(message.starredBy) &&
    message.starredBy.some(
      (id) => (id?._id || id)?.toString() === user?._id?.toString()
    );

  // Check if message is in active search matches
  const isSearchMatch = searchQuery && message.message?.toLowerCase().includes(searchQuery.toLowerCase().trim());
  const isActiveMatch =
    isSearchMatch &&
    searchMatches &&
    searchMatches[activeSearchIndex] === message._id;

  // Close reaction picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(e.target) &&
        !e.target.closest('.reaction-trigger-btn')
      ) {
        setShowReactionPicker(false);
      }
    };
    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactionPicker]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest(`.msg-chevron-${message._id}`) &&
        !e.target.closest(`#msg-chevron-${message._id}`)
      ) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, message._id]);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!showMenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 340 && rect.top > 340);
    }
    setShowMenu((prev) => !prev);
  };

  const handleToggleStar = async (e) => {
    e?.stopPropagation();
    try {
      if (toggleStarMessage) {
        await toggleStarMessage(message._id);
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleDeleteMessage = async (deleteType) => {
    setShowDeleteModal(false);
    try {
      await deleteMessage(message._id, deleteType);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleReportMessage = async ({ category, reason } = {}) => {
    setShowReportModal(false);
    try {
      await reportMessage(message._id, { category, reason });
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  const handleForwardMessage = async (targetIds) => {
    setShowForwardModal(false);
    try {
      await forwardMessage(message._id, targetIds);
    } catch (err) {
      console.error('Forward error:', err);
    }
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '9px 16px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary, #e2e8f0)',
    fontSize: '0.86rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.12s ease',
  };

  const handleItemHover = (e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
  };

  const handleItemLeave = (e) => {
    e.currentTarget.style.background = 'transparent';
  };

  const handleReact = async (emoji, e) => {
    e?.stopPropagation();
    setShowReactionPicker(false);
    try {
      if (reactToMessage) {
        await reactToMessage(message._id, emoji);
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleDownloadAttachment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fileUrl) return;
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment?.filename || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      window.open(fileUrl, '_blank');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    if (!isSent) return null;
    return <DoubleCheck isRead={message.isRead} />;
  };

  // Group reactions: { [emoji]: { count, users: [], hasUserReacted } }
  const groupedReactions = Array.isArray(message.reactions)
    ? message.reactions.reduce((acc, r) => {
        if (!r.emoji) return acc;
        if (!acc[r.emoji]) {
          acc[r.emoji] = { count: 0, users: [], hasUserReacted: false };
        }
        acc[r.emoji].count += 1;
        const uName = r.user?.name || r.user?.username || 'Someone';
        acc[r.emoji].users.push(uName);
        if ((r.user?._id || r.user)?.toString() === user?._id?.toString()) {
          acc[r.emoji].hasUserReacted = true;
        }
        return acc;
      }, {})
    : {};

  // Highlight search matches within message text
  const renderHighlightedText = (text) => {
    if (!searchQuery || !searchQuery.trim() || !text) return text;

    const query = searchQuery.trim();
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            backgroundColor: isActiveMatch ? '#f59e0b' : '#fbbf24',
            color: '#000000',
            padding: '1px 3px',
            borderRadius: 3,
            fontWeight: 700,
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Detect BaatCheet Call Links in message
  const callLinkMatch = message.message?.match(/(https?:\/\/[^\s]+\/call\/[^\s]+)/i);
  const callLink = callLinkMatch ? callLinkMatch[1] : null;

  const handleJoinCallLink = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Determine the participant to call
    const otherParticipant = !activeConversation?.isGroup
      ? activeConversation?.participants?.find((p) => (p?._id || p)?.toString() !== user?._id?.toString())
      : null;
    const targetUser = !isSent
      ? message.sender || otherParticipant
      : otherParticipant || (activeConversation?.participants?.[0]);

    if (!targetUser) {
      showToast('Cannot identify user to connect call', 'error');
      return;
    }

    showToast(`Connecting to video call with ${targetUser.name || 'contact'}...`, 'info', '📹');
    startCall(targetUser, 'video');
  };

  // Format message text: turn URLs into clickable links and preserve search highlighting
  const renderFormattedMessage = (text) => {
    if (!text) return null;

    // Matches http://, https://, www., or popular web domains (e.g. google.com, youtu.be, etc.)
    const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|io|co|in|ai|app|dev|me|info|biz|xyz|tech|online|tv|live|cc|to|be|so|site)(?:\/[^\s<]*)?)/gi;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      const isMatch = /^(?:https?:\/\/|www\.)[^\s<]+|^[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|io|co|in|ai|app|dev|me|info|biz|xyz|tech|online|tv|live|cc|to|be|so|site)(?:\/[^\s<]*)?$/i.test(part);

      if (isMatch) {
        // Strip trailing punctuation like .,!?:;)]}"'
        let cleanUrl = part;
        let trailingPunct = '';
        const punctMatch = cleanUrl.match(/[.,!?:;)>\]"']+$/);
        if (punctMatch) {
          trailingPunct = punctMatch[0];
          cleanUrl = cleanUrl.slice(0, -trailingPunct.length);
        }

        const isCallUrl = cleanUrl.includes('/call/') || cleanUrl.includes('room=');
        const href = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
          ? cleanUrl
          : `https://${cleanUrl}`;

        return (
          <span key={`link-wrap-${index}`}>
            <a
              href={href}
              onClick={(e) => {
                e.stopPropagation();
                if (isCallUrl) {
                  handleJoinCallLink(e);
                }
              }}
              target={isCallUrl ? '_self' : '_blank'}
              rel="noopener noreferrer"
              style={{
                color: '#53bdeb',
                textDecoration: 'underline',
                wordBreak: 'break-all',
                cursor: 'pointer',
                fontWeight: isCallUrl ? 600 : 400,
                padding: '0 2px',
                borderRadius: 3,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7dd3fc')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#53bdeb')}
              title={isCallUrl ? 'Click to connect to video call' : href}
            >
              {cleanUrl}
            </a>
            {trailingPunct && renderHighlightedText(trailingPunct)}
          </span>
        );
      }

      return renderHighlightedText(part);
    });
  };

  const attachment = message.attachments?.[0];
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  const fileUrl = attachment?.url?.startsWith('http')
    ? attachment.url
    : attachment?.url
    ? `${backendBase}${attachment.url.startsWith('/') ? '' : '/'}${attachment.url}`
    : null;

  // Check if attachment is an image (even if sent as document)
  const isImageAttachment =
    message.messageType === 'image' ||
    (attachment &&
      (attachment.mimetype?.startsWith('image/') ||
        ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].some((ext) =>
          (attachment.filename || '').toLowerCase().endsWith(ext)
        )));

  // Media Auto-Download preferences
  const [downloadedMediaMap, setDownloadedMediaMap] = useState({});
  const autoDownloadPrefs = user?.chatsPreferences?.mediaAutoDownload || {
    photos: true,
    audio: true,
    videos: false,
    documents: true,
  };

  const isAutoDownloadAllowed = () => {
    if (isSent) return true;
    if (isImageAttachment) return autoDownloadPrefs.photos !== false;
    if (message.messageType === 'video') return autoDownloadPrefs.videos === true;
    if (message.messageType === 'audio') return autoDownloadPrefs.audio !== false;
    if (message.messageType === 'document' || message.messageType === 'file') return autoDownloadPrefs.documents !== false;
    return true;
  };

  const isMediaDownloaded = isSent || isAutoDownloadAllowed() || !!downloadedMediaMap[message._id];
  const handleTriggerDownload = (e) => {
    e?.stopPropagation();
    setDownloadedMediaMap((prev) => ({ ...prev, [message._id]: true }));
  };

  return (
    <div
      id={`message-${message._id}`}
      className="animate-fade-in"
      onClick={() => {
        if (isSelectMode) {
          toggleSelectMessage(message._id);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      style={{
        display: 'flex',
        justifyContent: isSent ? 'flex-end' : 'flex-start',
        alignItems: 'center',
        gap: 8,
        marginBottom: groupedReactions && Object.keys(groupedReactions).length > 0 ? 14 : 4,
        position: 'relative',
        zIndex: showMenu || showReactionPicker ? 100 : isHovered ? 15 : 1,
        cursor: isSelectMode ? 'pointer' : 'default',
        padding: isSelectMode ? '4px 8px' : 0,
        borderRadius: 8,
        backgroundColor: isSelected ? 'rgba(0, 168, 132, 0.12)' : 'transparent',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* WhatsApp Web Style Checkbox on Left (Image 1) */}
      {isSelectMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectMessage(message._id);
          }}
          title={isSelected ? 'Deselect message' : 'Select message'}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.45)',
            background: isSelected ? '#00a884' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            marginRight: isSent ? 'auto' : 4,
            order: -1,
            zIndex: 10,
          }}
        >
          {isSelected && (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
      {/* Lightbox for full image preview */}
      {showLightbox && fileUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={fileUrl}
            alt="Full view"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
          />
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 12 }}>
            <button
              onClick={handleDownloadAttachment}
              title="Download image"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                fontSize: 18,
                borderRadius: '50%',
                width: 44,
                height: 44,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >
              ⬇
            </button>
            <button
              onClick={() => setShowLightbox(false)}
              title="Close"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                fontSize: 22,
                borderRadius: '50%',
                width: 44,
                height: 44,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Received message avatar */}
      {!isSent && showAvatar && <Avatar user={message.sender} size={28} />}
      {!isSent && !showAvatar && <div style={{ width: 28, flexShrink: 0 }} />}

      <div
        style={{
          maxWidth: '72%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSent ? 'flex-end' : 'flex-start',
          position: 'relative',
          zIndex: showMenu || showReactionPicker ? 100 : 'auto',
        }}
      >
        {/* Sender name */}
        {!isSent && showAvatar && (
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 3,
              marginLeft: 4,
            }}
          >
            {message.sender?.name}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={isSent ? 'message-sent' : 'message-received'}
          style={{
            padding: message.messageType === 'image' || message.messageType === 'video' ? 6 : '8px 14px',
            minWidth: 72,
            position: 'relative',
            borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            boxShadow: isActiveMatch
              ? '0 0 0 3px #fbbf24, 0 4px 12px rgba(251, 191, 36, 0.4)'
              : isSent
              ? '0 3px 8px rgba(25, 60, 75, 0.25)'
              : '0 3px 8px rgba(10, 35, 38, 0.3)',
            transition: 'box-shadow 0.2s ease',
            zIndex: showMenu || showReactionPicker ? 100 : 'auto',
          }}
        >
          {/* Deleted message */}
          {message.isDeleted ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}>
              {/* WhatsApp Down Arrow Chevron Button on Hover for Deleted Message */}
              {(isHovered || showMenu) && !isSelectMode && (
                <button
                  id={`msg-chevron-${message._id}`}
                  className={`message-chevron-btn msg-chevron-${message._id}`}
                  onClick={handleToggleMenu}
                  title="Message options"
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: showMenu ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    zIndex: 25,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = showMenu
                      ? 'rgba(0, 0, 0, 0.55)'
                      : 'rgba(0, 0, 0, 0.3)')
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}

              {/* Options Menu for Deleted Message */}
              {showMenu && !isSelectMode && (
                <div
                  ref={menuRef}
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: openUpwards ? 'auto' : 24,
                    bottom: openUpwards ? 'calc(100% + 4px)' : 'auto',
                    right: isSent ? 0 : 'auto',
                    left: isSent ? 'auto' : 0,
                    background: 'var(--bg-card, #17191e)',
                    border: '1px solid var(--border-color, #272a31)',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                    padding: '6px 0',
                    minWidth: 160,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setIsSelectMode(true);
                      setSelectedMessageIds([message._id]);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>Select</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setIsSelectMode(true);
                      setSelectedMessageIds([message._id]);
                    }}
                    style={{
                      ...menuItemStyle,
                      color: '#ef4444',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span>Delete for me</span>
                  </button>
                </div>
              )}

              <p style={{ fontStyle: 'italic', opacity: 0.75, fontSize: '0.875rem', margin: 0, paddingRight: 16 }}>
                🚫 This message was deleted
              </p>
            </div>
          ) : (
            <>
              {/* WhatsApp Down Arrow Chevron Button on Hover (Image 1) */}
              {(isHovered || showMenu) && !isSelectMode && (
                <button
                  id={`msg-chevron-${message._id}`}
                  className={`message-chevron-btn msg-chevron-${message._id}`}
                  onClick={handleToggleMenu}
                  title="Message options"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: showMenu ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    zIndex: 25,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = showMenu
                      ? 'rgba(0, 0, 0, 0.55)'
                      : 'rgba(0, 0, 0, 0.3)')
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}

              {/* WhatsApp Message Options Dropdown Menu (Image 2) */}
              {showMenu && (
                <div
                  ref={menuRef}
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: openUpwards ? 'auto' : 28,
                    bottom: openUpwards ? 'calc(100% + 4px)' : 'auto',
                    right: isSent ? 4 : 'auto',
                    left: isSent ? 'auto' : 4,
                    background: 'var(--bg-card, #17191e)',
                    border: '1px solid var(--border-color, #272a31)',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                    padding: '6px 0',
                    minWidth: 170,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 1. Reply */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setReplyingTo(message);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 14 4 9 9 4" />
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                    </svg>
                    <span>Reply</span>
                  </button>

                  {/* 2. Copy */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      const textToCopy = message.message || attachment?.url || '';
                      if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy);
                        showToast('Message copied to clipboard', 'success', '📋');
                      }
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                  </button>

                  {/* 3. React */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowReactionPicker(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                    <span>React</span>
                  </button>

                  {/* 4. Forward */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowForwardModal(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 14 20 9 15 4" />
                      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
                    </svg>
                    <span>Forward</span>
                  </button>

                  {/* 5. Pin / Unpin */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      togglePinMessage(message._id);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24V17z" />
                    </svg>
                    <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  {/* 6. Star / Unstar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      handleToggleStar(e);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={isStarred ? '#fbbf24' : 'none'}
                      stroke={isStarred ? '#fbbf24' : 'currentColor'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{isStarred ? 'Unstar' : 'Star'}</span>
                  </button>

                  {/* 7. Report */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4.33v6.34a2.31 2.31 0 0 1-2.33 2.33H17" />
                    </svg>
                    <span>Report</span>
                  </button>

                  {/* Select */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setIsSelectMode(true);
                      setSelectedMessageIds([message._id]);
                    }}
                    style={menuItemStyle}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemLeave}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>Select</span>
                  </button>

                  <div style={{ height: 1, background: 'var(--border-color, #272a31)', margin: '4px 0' }} />

                  {/* 8. Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setIsSelectMode(true);
                      setSelectedMessageIds([message._id]);
                    }}
                    style={{
                      ...menuItemStyle,
                      color: '#ef4444',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}

              {/* Quoted Reply inside Message Bubble */}
              {message.replyTo && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetId = message.replyTo._id || message.replyTo;
                    const el = document.getElementById(`message-${targetId}`);
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
                    padding: '6px 10px',
                    background: 'rgba(0, 0, 0, 0.24)',
                    borderRadius: 8,
                    borderLeft: '4px solid var(--accent-secondary, #4ee3c5)',
                    marginBottom: 6,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.38)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.24)')}
                  title="Click to view original message"
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--accent-secondary, #4ee3c5)',
                      fontSize: '0.78rem',
                      marginBottom: 2,
                    }}
                  >
                    {message.replyTo.sender?.name || message.replyTo.sender?.username || 'User'}
                  </div>
                  <div
                    style={{
                      color: '#d1d5db',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8rem',
                    }}
                  >
                    {message.replyTo.isDeleted
                      ? '🚫 This message was deleted'
                      : message.replyTo.message ||
                        (message.replyTo.messageType === 'image'
                          ? '📷 Photo'
                          : message.replyTo.messageType === 'video'
                          ? '🎥 Video'
                          : message.replyTo.messageType === 'audio'
                          ? '🎧 Audio clip'
                          : '📎 Attachment')}
                  </div>
                </div>
              )}

              {/* Image message */}
              {isImageAttachment && attachment && (
                !isMediaDownloaded ? (
                  <div
                    onClick={handleTriggerDownload}
                    style={{
                      width: 260,
                      height: 180,
                      borderRadius: 10,
                      background: 'rgba(0, 0, 0, 0.55)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      gap: 10,
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.55)')}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#00a884',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        boxShadow: '0 4px 12px rgba(0, 168, 132, 0.4)',
                      }}
                    >
                      ⬇
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                      Download Photo {attachment.size ? `• ${formatFileSize(attachment.size)}` : ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 10 }}>
                    <img
                      src={fileUrl}
                      alt={attachment.filename || 'image'}
                      onClick={() => setShowLightbox(true)}
                      style={{
                        maxWidth: '100%',
                        maxHeight: 320,
                        borderRadius: 10,
                        display: 'block',
                        cursor: 'pointer',
                        objectFit: 'cover',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    />
                  </div>
                )
              )}

              {/* Video message */}
              {message.messageType === 'video' && attachment && (
                !isMediaDownloaded ? (
                  <div
                    onClick={handleTriggerDownload}
                    style={{
                      width: 280,
                      height: 190,
                      borderRadius: 10,
                      background: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      gap: 10,
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.82)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)')}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: '#00a884',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        boxShadow: '0 4px 14px rgba(0, 168, 132, 0.45)',
                      }}
                    >
                      ⬇
                    </div>
                    <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600 }}>
                      Download Video {attachment.size ? `• ${formatFileSize(attachment.size)}` : ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ maxWidth: 360, overflow: 'hidden', borderRadius: 10 }}>
                    <video
                      src={fileUrl}
                      controls
                      preload="metadata"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 10,
                        display: 'block',
                        backgroundColor: '#000',
                      }}
                    />
                  </div>
                )
              )}

              {/* Audio message */}
              {message.messageType === 'audio' && attachment && (
                !isMediaDownloaded ? (
                  <div
                    onClick={handleTriggerDownload}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      minWidth: 260,
                      cursor: 'pointer',
                      background: 'rgba(0, 0, 0, 0.35)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#00a884',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      ⬇
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, color: '#fff' }}>
                        Download Audio
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {attachment.size ? formatFileSize(attachment.size) : 'Audio clip'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 260,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🎧</span>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 180,
                        }}
                      >
                        {attachment.filename || 'Audio clip'}
                      </span>
                    </div>
                    <audio
                      src={fileUrl}
                      controls
                      style={{ width: '100%', height: 36, outline: 'none' }}
                    />
                  </div>
                )
              )}

              {/* Document / File message */}
              {!isImageAttachment && (message.messageType === 'document' || message.messageType === 'file') && attachment && (
                <a
                  href={fileUrl}
                  download={attachment.filename || 'document'}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 12,
                    margin: '2px 0 6px 0',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minWidth: 240,
                    maxWidth: 320,
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)')}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      background: `${getDocumentMeta(attachment.filename).color}25`,
                      border: `1px solid ${getDocumentMeta(attachment.filename).color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {getDocumentMeta(attachment.filename).icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {attachment.filename || 'Document'}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>
                      {formatFileSize(attachment.size)} • {getDocumentMeta(attachment.filename).label}
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Download file"
                    onClick={handleDownloadAttachment}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 14,
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                  >
                    ⬇
                  </button>
                </a>
              )}

              {/* Text caption or message content */}
              {message.message && (
                <div>
                  <p
                    style={{
                      fontSize: 'var(--chat-message-font-size, 0.92rem)',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                      color: '#ffffff',
                      marginTop:
                        (message.messageType === 'image' ||
                          message.messageType === 'video' ||
                          message.messageType === 'document' ||
                          message.messageType === 'audio') &&
                        attachment
                          ? 6
                          : 0,
                      padding:
                        message.messageType === 'image' || message.messageType === 'video'
                          ? '4px 6px'
                          : 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {renderFormattedMessage(message.message)}
                  </p>

                  {/* WhatsApp Video Call Card */}
                  {callLink && (
                    <div
                      id={`join-call-card-${message._id}`}
                      onClick={handleJoinCallLink}
                      style={{
                        marginTop: 8,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(0, 0, 0, 0.28)',
                        border: '1px solid rgba(78, 227, 197, 0.35)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.28)')}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: '#00a884',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0, 168, 132, 0.4)',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <rect x="2" y="5" width="13" height="14" rx="3" />
                          <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#ffffff' }}>
                          BaatCheet Video Call
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#4ee3c5', marginTop: 1 }}>
                          Click to join video call
                        </div>
                      </div>
                      <button
                        id={`join-call-btn-${message._id}`}
                        onClick={handleJoinCallLink}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 18,
                          background: '#4ee3c5',
                          color: '#0a2e2b',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        Join Call
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Quick Reaction Pill (WhatsApp style) */}
          {showReactionPicker && (
            <div
              ref={reactionPickerRef}
              className="animate-fade-in"
              style={{
                position: 'absolute',
                top: -46,
                right: isSent ? 'auto' : 0,
                left: isSent ? 0 : 'auto',
                background: 'var(--bg-card, #17191e)',
                border: '1px solid var(--border-color, #272a31)',
                padding: '4px 8px',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                zIndex: 20,
              }}
            >
              {QUICK_REACTIONS.map((em) => (
                <button
                  key={em}
                  onClick={(e) => handleReact(em, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 20,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '50%',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp + status + pin + inline hover chevron */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              marginTop: 3,
              padding: message.messageType === 'image' || message.messageType === 'video' ? '0 4px 2px' : 0,
            }}
          >
            {message.isPinned && (
              <span
                title="Pinned message"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  marginRight: 2,
                }}
              >
                📌
              </span>
            )}
            {isStarred && (
              <span
                title="Starred message"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                  marginRight: 2,
                }}
              >
                ★
              </span>
            )}
            {message.isEncrypted && (
              <span
                title="End-to-end encrypted message"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.62rem',
                  color: isSent ? '#9fc2cf' : '#88a8a5',
                  opacity: 0.85,
                  marginRight: 1,
                }}
              >
                🔒
              </span>
            )}
            <span style={{ fontSize: '0.68rem', color: isSent ? '#9fc2cf' : '#88a8a5' }}>
              {formatTime(message.createdAt)}
            </span>
            {getStatusIcon()}

            {/* Inline down arrow chevron beside timestamp (Image 1: "Hmm 8:50 ∨") */}
            {!message.isDeleted && isHovered && !isSelectMode && (
              <span
                className={`msg-chevron-${message._id}`}
                onClick={handleToggleMenu}
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: 2,
                  color: isSent ? '#9fc2cf' : '#88a8a5',
                  opacity: 0.9,
                }}
                title="Options"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Reaction badges on bottom of message */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginTop: -8,
              marginLeft: isSent ? 0 : 8,
              marginRight: isSent ? 8 : 0,
              zIndex: 5,
            }}
          >
            {Object.entries(groupedReactions).map(([em, data]) => (
              <button
                key={em}
                onClick={(e) => handleReact(em, e)}
                title={`${data.users.join(', ')}`}
                style={{
                  background: data.hasUserReacted ? 'var(--bg-card, #17191e)' : 'rgba(19, 20, 24, 0.9)',
                  border: data.hasUserReacted
                    ? '1.5px solid var(--accent-secondary, #4ee3c5)'
                    : '1px solid var(--border-subtle, #272a31)',
                  borderRadius: 14,
                  padding: '2px 7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'var(--transition)',
                }}
              >
                <span>{em}</span>
                {data.count > 1 && (
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {data.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteMessageModal
          isSent={isSent}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDeleteMessage}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportMessageModal
          message={message}
          onClose={() => setShowReportModal(false)}
          onReport={handleReportMessage}
        />
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <ForwardModal
          message={message}
          onClose={() => setShowForwardModal(false)}
          onForward={handleForwardMessage}
        />
      )}
    </div>
  );
};

export default Message;
