import { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const ForwardModal = ({ message, messages = [], onClose, onForward }) => {
  const { conversations, allUsers } = useChat();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Combine active conversations and contacts
  const targetList = useMemo(() => {
    const list = [];
    const convUserIds = new Set();

    // 1. Existing conversations
    conversations.forEach((c) => {
      const isGroup = c.isGroup;
      const otherUser = isGroup
        ? null
        : c.participants?.find((p) => (p._id || p)?.toString() !== user?._id?.toString());
      if (!isGroup && otherUser) {
        convUserIds.add((otherUser._id || otherUser)?.toString());
      }
      list.push({
        id: c._id,
        name: isGroup ? c.groupName : otherUser?.name || otherUser?.username || 'Chat',
        isGroup,
        user: otherUser,
        image: isGroup ? c.groupImage : otherUser?.profilePicture,
        type: 'conversation',
      });
    });

    // 2. All users who do not already have an active conversation listed
    allUsers.forEach((u) => {
      const uId = u._id?.toString();
      if (uId !== user?._id?.toString() && !convUserIds.has(uId)) {
        list.push({
          id: `user-${uId}`,
          name: u.name || u.username,
          isGroup: false,
          user: u,
          image: u.profilePicture,
          type: 'user',
          userId: uId,
        });
      }
    });

    if (!search.trim()) return list;

    const q = search.toLowerCase().trim();
    return list.filter((item) => item.name?.toLowerCase().includes(q));
  }, [conversations, allUsers, user?._id, search]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSendForward = async () => {
    if (selectedIds.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onForward(selectedIds);
      onClose();
    } catch (err) {
      console.error('Failed to forward message:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '82vh',
          background: 'var(--bg-card, #17191e)',
          border: '1px solid var(--border-color, #272a31)',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #fff)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #272a31)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>↪</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
              Forward message to
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #8b929d)',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Message snippet or count being forwarded */}
        {(message || (messages && messages.length > 0)) && (
          <div
            style={{
              padding: '10px 20px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderBottom: '1px solid var(--border-color, #272a31)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary, #cbd5e1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {messages && messages.length > 1 ? (
              <span style={{ fontWeight: 600, color: 'var(--accent-secondary, #4ee3c5)' }}>
                Forwarding {messages.length} messages
              </span>
            ) : (
              <>
                <span style={{ opacity: 0.7 }}>Message:</span>
                <span
                  style={{
                    fontWeight: 500,
                    color: '#ffffff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(message || messages[0])?.message ||
                    ((message || messages[0])?.messageType === 'image'
                      ? '📷 Photo'
                      : (message || messages[0])?.messageType === 'video'
                      ? '🎥 Video'
                      : '📎 Attachment')}
                </span>
              </>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '12px 20px 8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 10,
              padding: '8px 14px',
              border: '1px solid var(--border-subtle, #272a31)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search contacts or groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '0.9rem',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {targetList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px 20px',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
              }}
            >
              No chats found
            </div>
          ) : (
            targetList.map((target) => {
              const isSelected = selectedIds.includes(target.id);
              return (
                <div
                  key={target.id}
                  onClick={() => toggleSelect(target.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(78, 227, 197, 0.12)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: isSelected ? 'none' : '2px solid var(--border-color, #4a5162)',
                      background: isSelected ? 'var(--accent-secondary, #4ee3c5)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </div>

                  {/* Avatar */}
                  <Avatar user={target.user || { name: target.name, profilePicture: target.image }} size={38} />

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {target.name}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {target.isGroup ? 'Group' : 'Contact'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color, #272a31)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary, #131418)',
          }}
        >
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {selectedIds.length > 0
              ? `${selectedIds.length} chat${selectedIds.length > 1 ? 's' : ''} selected`
              : 'Select chats to forward'}
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-color, #272a31)',
                background: 'transparent',
                color: 'var(--text-secondary, #d1d5db)',
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSendForward}
              disabled={selectedIds.length === 0 || submitting}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background:
                  selectedIds.length > 0 ? 'var(--accent-secondary, #4ee3c5)' : 'rgba(255, 255, 255, 0.1)',
                color: selectedIds.length > 0 ? '#0b1e1b' : '#6b7280',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: selectedIds.length > 0 && !submitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>↪</span> {submitting ? 'Forwarding...' : 'Forward'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
