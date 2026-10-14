import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DOODLE_PATTERN_DATA_URL from '../assets/doodlePattern';
import Message from './Message';

// Message list - auto scroll to bottom
const MessageList = () => {
  const {
    messages,
    messagesLoading,
    typingUsers,
    activeConversation,
    searchMatches,
    activeSearchIndex,
    isSearching,
  } = useChat();
  const { user } = useAuth();
  const {
    wallpaper,
    wallpaperDim,
    wallpaperBlur,
    solidColor,
    doodlesEnabled,
    effectiveTheme,
  } = useTheme();
  const bottomRef = useRef(null);

  const isTyping = activeConversation ? !!typingUsers[activeConversation._id] : false;

  // New message ya typing aane par neeche scroll karo (jab search active na ho)
  useEffect(() => {
    if (!isSearching) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isSearching]);

  // Scroll to active search match
  useEffect(() => {
    if (isSearching && searchMatches && searchMatches.length > 0) {
      const matchId = searchMatches[activeSearchIndex];
      if (matchId) {
        const el = document.getElementById(`message-${matchId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeSearchIndex, searchMatches, isSearching]);

  // Date separator dikhao
  const formatDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Messages ko date groups mein organize karo
  const groupedMessages = messages.reduce((groups, message, index) => {
    const date = new Date(message.createdAt).toDateString();
    const prevMessage = messages[index - 1];
    const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;

    if (date !== prevDate) {
      groups.push({ type: 'date', date: message.createdAt });
    }

    // Same sender ke consecutive messages mein avatar sirf first pe dikhao
    const nextMessage = messages[index + 1];
    const showAvatar =
      !nextMessage ||
      nextMessage.sender?._id !== message.sender?._id ||
      nextMessage.sender !== message.sender;

    groups.push({ type: 'message', message, showAvatar });
    return groups;
  }, []);

  if (messagesLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      id="message-list"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        position: 'relative',
        backgroundColor: solidColor || 'var(--bg-primary)',
        backgroundImage: wallpaper ? `url("${wallpaper}")` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* BaatCheet Doodles Pattern Overlay */}
      {doodlesEnabled && (
        <div
          className="baatcheet-doodles-pattern"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${DOODLE_PATTERN_DATA_URL}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '420px 420px',
            opacity: effectiveTheme === 'dark' ? 0.08 : 0.06,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Dim / Blur Overlay when wallpaper is set */}
      {wallpaper && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0, 0, 0, ${wallpaperDim})`,
            backdropFilter: wallpaperBlur > 0 ? `blur(${wallpaperBlur}px)` : 'none',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>👋</div>
            <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No messages yet</p>
            <p style={{ fontSize: '0.82rem', marginTop: 6 }}>Say hello to start the conversation!</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((item, i) =>
              item.type === 'date' ? (
                // Date separator
                <div
                  key={`date-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '20px 0 12px',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--date-divider)' }} />
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      color: 'var(--date-badge-color)',
                      background: 'var(--date-badge-bg)',
                      border: '1px solid var(--border-subtle)',
                      padding: '3px 16px',
                      borderRadius: 20,
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {formatDateSeparator(item.date)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--date-divider)' }} />
                </div>
              ) : (
                <Message
                  key={item.message._id}
                  message={item.message}
                  showAvatar={item.showAvatar}
                />
              )
            )}

          {/* Typing indicator bubble */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 4 }}>
              <div
                style={{
                  background: 'var(--message-received, #ffffff)',
                  border: '1px solid var(--border-subtle, #e9edef)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '10px 16px',
                  display: 'flex',
                  gap: 5,
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                }}
              >
                <span className="typing-dot" style={{ width: 7, height: 7, background: '#00a884' }} />
                <span className="typing-dot" style={{ width: 7, height: 7, background: '#00a884' }} />
                <span className="typing-dot" style={{ width: 7, height: 7, background: '#00a884' }} />
              </div>
            </div>
          )}
        </>
      )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
