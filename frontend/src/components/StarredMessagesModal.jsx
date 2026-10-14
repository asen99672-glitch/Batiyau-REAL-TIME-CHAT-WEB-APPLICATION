import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';

const StarredMessagesModal = ({ onClose, onOpenChat }) => {
  const { getStarredMessages, toggleStarMessage, selectConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStarred = async () => {
      setLoading(true);
      try {
        const data = await getStarredMessages();
        setMessages(data || []);
      } catch (err) {
        console.error('Failed to load starred messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStarred();
  }, [getStarredMessages]);

  const handleUnstar = async (msgId, e) => {
    e.stopPropagation();
    try {
      await toggleStarMessage(msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      console.error('Failed to unstar:', err);
    }
  };

  const handleSelectMessage = async (msg) => {
    if (msg.conversation) {
      await selectConversation(msg.conversation);
      if (onOpenChat) onOpenChat(msg.conversation);
      onClose();
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const text = (m.message || '').toLowerCase();
    const sender = (m.sender?.name || '').toLowerCase();
    const convName = (m.conversation?.groupName || '').toLowerCase();
    return text.includes(q) || sender.includes(q) || convName.includes(q);
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ★
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Starred Messages
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {messages.length} saved {messages.length === 1 ? 'message' : 'messages'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        {messages.length > 0 && (
          <div style={{ padding: '10px 16px 6px' }}>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search starred messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Messages List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading starred messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div
                style={{
                  fontSize: 38,
                  marginBottom: 12,
                  filter: 'grayscale(0.6)',
                }}
              >
                ⭐
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                No Starred Messages
              </p>
              <p style={{ fontSize: '0.82rem', maxWidth: 280, margin: '0 auto', lineHeight: 1.4 }}>
                Hover over any chat message and tap the star icon to save important messages here for quick access.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => handleSelectMessage(msg)}
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(78, 227, 197, 0.4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  {/* Top row: sender + conversation tag + unstar btn */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar user={msg.sender} size={24} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4ee3c5' }}>
                        {msg.sender?.name || 'Unknown'}
                      </span>
                      {msg.conversation?.isGroup && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(255,255,255,0.08)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            color: 'var(--text-muted)',
                          }}
                        >
                          👥 {msg.conversation?.groupName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      <button
                        title="Remove from starred"
                        onClick={(e) => handleUnstar(msg._id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fbbf24',
                          cursor: 'pointer',
                          fontSize: 15,
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  {/* Message content */}
                  {msg.messageType === 'image' && msg.attachments?.length > 0 ? (
                    <img
                      src={msg.attachments[0].url}
                      alt="attachment"
                      style={{ maxHeight: 140, borderRadius: 8, display: 'block', marginBottom: 6 }}
                    />
                  ) : (
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                        margin: 0,
                      }}
                    >
                      {msg.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StarredMessagesModal;
