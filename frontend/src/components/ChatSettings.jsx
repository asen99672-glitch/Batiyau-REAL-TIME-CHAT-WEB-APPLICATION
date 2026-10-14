import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { getSocket } from '../services/socket';
import api from '../services/api';

const ChatSettings = ({ onBack, onOpenTheme, onOpenWallpaper }) => {
  const { user, updateUser } = useAuth();
  const {
    showToast,
    fetchConversations,
    setMessages,
    setConversations,
    closeChat,
    setArchivedChatIds,
  } = useChat();
  const { themeMode, setThemeMode } = useTheme();

  const initialPrefs = user?.chatsPreferences || {};
  const [enterIsSend, setEnterIsSend] = useState(initialPrefs.enterIsSend || false);
  const [fontSize, setFontSize] = useState(initialPrefs.fontSize || 'medium');
  const [keepChatsArchived, setKeepChatsArchived] = useState(
    initialPrefs.keepChatsArchived ?? true
  );
  const [mediaAutoDownload, setMediaAutoDownload] = useState(
    initialPrefs.mediaAutoDownload || {
      photos: true,
      audio: true,
      videos: false,
      documents: true,
    }
  );

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedThemeChoice, setSelectedThemeChoice] = useState(themeMode || 'default');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updatePreference = async (key, val) => {
    try {
      const updated = {
        enterIsSend,
        fontSize,
        keepChatsArchived,
        mediaAutoDownload,
        [key]: val,
      };

      if (key === 'enterIsSend') setEnterIsSend(val);
      if (key === 'fontSize') {
        setFontSize(val);
        const fontSizes = { small: '0.80rem', medium: '0.92rem', large: '1.08rem' };
        document.documentElement.style.setProperty('--chat-message-font-size', fontSizes[val] || '0.92rem');
        document.documentElement.setAttribute('data-chat-font-size', val);
      }
      if (key === 'keepChatsArchived') setKeepChatsArchived(val);
      if (key === 'mediaAutoDownload') setMediaAutoDownload(val);

      const { data } = await api.put('/users/chats-preferences', updated);
      if (updateUser) {
        updateUser({
          ...user,
          chatsPreferences: data.chatsPreferences,
        });
      }
      showToast('Chat settings saved ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    }
  };

  const handleApplyTheme = () => {
    setThemeMode(selectedThemeChoice);
    setShowThemeModal(false);
    showToast(
      `Theme changed to ${
        selectedThemeChoice === 'dark'
          ? 'Dark'
          : selectedThemeChoice === 'light'
          ? 'Light'
          : 'System default'
      } ✓`,
      'success'
    );
  };

  const handleClearAllChats = async () => {
    try {
      setClearing(true);
      // Real-time optimistic UI update immediately
      if (setMessages) setMessages([]);
      if (setConversations) {
        setConversations((prev) =>
          prev.map((c) => ({
            ...c,
            lastMessage: null,
            lastMessageAt: null,
            unreadCount: 0,
          }))
        );
      }
      setShowClearConfirm(false);

      // Emit socket notification for real-time multi-tab sync
      try {
        const socket = getSocket();
        if (socket) socket.emit('clearAllChats');
      } catch (sockErr) {
        console.warn('Socket clearAllChats error:', sockErr);
      }

      await api.post('/users/clear-all-chats');
      if (fetchConversations) await fetchConversations();
      showToast('All chat messages cleared ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to clear chats', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteAllChats = async () => {
    try {
      setDeleting(true);
      // Real-time optimistic UI update immediately
      if (closeChat) closeChat();
      if (setMessages) setMessages([]);
      if (setConversations) setConversations([]);
      if (setArchivedChatIds) setArchivedChatIds([]);
      try {
        localStorage.removeItem('chatapp_archived_chats');
      } catch (e) {}
      setShowDeleteConfirm(false);

      // Emit socket notification for real-time multi-tab sync
      try {
        const socket = getSocket();
        if (socket) socket.emit('deleteAllChats');
      } catch (sockErr) {
        console.warn('Socket deleteAllChats error:', sockErr);
      }

      await api.post('/users/delete-all-chats');
      if (fetchConversations) await fetchConversations();
      showToast('All chats deleted ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete chats', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    borderBottom: '1px solid var(--border-subtle, #1e2127)',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '0.94rem',
    fontWeight: 500,
    color: 'var(--text-primary, #ffffff)',
  };

  const descStyle = {
    margin: '3px 0 0',
    fontSize: '0.78rem',
    color: 'var(--text-muted, #8b929d)',
    lineHeight: 1.4,
  };

  const Switch = ({ checked }) => (
    <div
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: checked ? '#00a884' : '#374151',
        position: 'relative',
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
          left: checked ? 21 : 3,
          transition: 'left 0.2s ease',
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100%',
        background: 'var(--bg-primary, #111215)',
        color: 'var(--text-primary, #f3f4f6)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          background: 'var(--bg-card, #17191e)',
          borderBottom: '1px solid var(--border-subtle, #1e2127)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#4ee3c5',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Chats</h2>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* DISPLAY SECTION */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Display & Input
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {/* Theme Shortcut with Interactive Choose Theme Dialog */}
            <div
              onClick={() => {
                setSelectedThemeChoice(themeMode || 'default');
                setShowThemeModal(true);
              }}
              style={rowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <p style={titleStyle}>Theme</p>
                <p style={descStyle}>
                  {themeMode === 'dark' ? 'Dark' : themeMode === 'light' ? 'Light' : 'System default'}
                </p>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
            </div>

            {onOpenWallpaper && (
              <div
                onClick={onOpenWallpaper}
                style={rowStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <p style={titleStyle}>Wallpaper</p>
                  <p style={descStyle}>Change chat background wallpaper and doodle pattern</p>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </div>
            )}

            {/* Enter is send */}
            <div
              onClick={() => updatePreference('enterIsSend', !enterIsSend)}
              style={rowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Enter is send</p>
                <p style={descStyle}>Pressing Enter key will send your message immediately.</p>
              </div>
              <Switch checked={enterIsSend} />
            </div>

            {/* Font size */}
            <div
              style={{
                ...rowStyle,
                borderBottom: 'none',
              }}
            >
              <div>
                <p style={titleStyle}>Font size</p>
                <p style={descStyle}>Adjust text display size in messages.</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['small', 'medium', 'large'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updatePreference('fontSize', sz)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: fontSize === sz ? '1px solid #00a884' : '1px solid var(--border-subtle)',
                      background: fontSize === sz ? 'rgba(0, 168, 132, 0.2)' : 'var(--bg-secondary)',
                      color: fontSize === sz ? '#00a884' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Font Size Preview Bubble */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.22)',
                borderTop: '1px solid var(--border-subtle, #1e2127)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#00a884',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Live Preview ({fontSize})
              </span>
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--message-sent, #005c4b)',
                  color: '#ffffff',
                  padding: '7px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  fontSize:
                    fontSize === 'small'
                      ? '0.80rem'
                      : fontSize === 'large'
                      ? '1.08rem'
                      : '0.92rem',
                  transition: 'font-size 0.2s ease',
                  maxWidth: '90%',
                  lineHeight: 1.45,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
              >
                This is how your chat messages will look. ✨
              </div>
            </div>
          </div>
        </div>

        {/* MEDIA AUTO DOWNLOAD */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Media Auto-Download
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {[
              { id: 'photos', label: 'Photos' },
              { id: 'audio', label: 'Audio' },
              { id: 'videos', label: 'Videos' },
              { id: 'documents', label: 'Documents' },
            ].map((media, idx) => (
              <div
                key={media.id}
                onClick={() => {
                  const updated = { ...mediaAutoDownload, [media.id]: !mediaAutoDownload[media.id] };
                  updatePreference('mediaAutoDownload', updated);
                }}
                style={{
                  ...rowStyle,
                  borderBottom: idx === 3 ? 'none' : '1px solid var(--border-subtle, #1e2127)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <p style={titleStyle}>{media.label}</p>
                <Switch checked={!!mediaAutoDownload[media.id]} />
              </div>
            ))}
          </div>
        </div>

        {/* ARCHIVE CHATS */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Archived Chats
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => updatePreference('keepChatsArchived', !keepChatsArchived)}
              style={{ ...rowStyle, borderBottom: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Keep chats archived</p>
                <p style={descStyle}>
                  Archived chats will remain archived when you receive a new message.
                </p>
              </div>
              <Switch checked={keepChatsArchived} />
            </div>
          </div>
        </div>

        {/* CHAT HISTORY ACTIONS */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Chat History
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {/* Clear all messages */}
            <div
              onClick={() => setShowClearConfirm(true)}
              style={rowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <p style={{ ...titleStyle, color: '#f59e0b' }}>Clear all messages</p>
                <p style={descStyle}>Delete message contents inside all chats.</p>
              </div>
              <span style={{ fontSize: 18 }}>🧹</span>
            </div>

            {/* Delete all chats */}
            <div
              onClick={() => setShowDeleteConfirm(true)}
              style={{ ...rowStyle, borderBottom: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <p style={{ ...titleStyle, color: '#ef4444' }}>Delete all chats</p>
                <p style={descStyle}>Remove all conversations from your chat list.</p>
              </div>
              <span style={{ fontSize: 18 }}>🗑️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowThemeModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              background: 'var(--bg-secondary, #131418)',
              borderRadius: 18,
              border: '1px solid var(--border-color)',
              padding: 24,
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', color: '#ffffff', fontWeight: 600 }}>
              Choose theme
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[
                { id: 'default', label: 'System default' },
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ].map((t) => (
                <label
                  key={t.id}
                  onClick={() => setSelectedThemeChoice(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                  }}
                >
                  <input
                    type="radio"
                    name="themeOption"
                    checked={selectedThemeChoice === t.id}
                    onChange={() => setSelectedThemeChoice(t.id)}
                    style={{
                      accentColor: '#00a884',
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                    }}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>

            {onOpenTheme && (
              <div
                onClick={() => {
                  setShowThemeModal(false);
                  onOpenTheme();
                }}
                style={{
                  marginBottom: 20,
                  padding: '10px 12px',
                  background: 'var(--bg-card, #17191e)',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: '#00a884',
                }}
              >
                <span>Wallpapers & Custom Themes</span>
                <span>›</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowThemeModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  color: '#00a884',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTheme}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: '#00a884',
                  border: 'none',
                  color: '#0d2825',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Chats Dialog */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 380,
              background: 'var(--bg-secondary, #131418)',
              borderRadius: 18,
              border: '1px solid var(--border-color)',
              padding: 24,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#ffffff' }}>
              Clear all messages?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Messages in all individual and group chats will be cleared. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  background: 'var(--bg-hover)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllChats}
                disabled={clearing}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  background: '#f59e0b',
                  border: 'none',
                  color: '#000000',
                  fontWeight: 600,
                  cursor: clearing ? 'not-allowed' : 'pointer',
                }}
              >
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Chats Dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 380,
              background: 'var(--bg-secondary, #131418)',
              borderRadius: 18,
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: 24,
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#ef4444' }}>
              Delete all chats?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              All chats and messages will be permanently deleted from your chat list.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  background: 'var(--bg-hover)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllChats}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSettings;
