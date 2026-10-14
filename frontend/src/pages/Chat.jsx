import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import MessageSelectionBar from '../components/MessageSelectionBar';
import ContactInfoSidebar from '../components/ContactInfoSidebar';
import { AppLockScreen } from '../components/AppLock';
import BatiyauLogo from '../components/BatiyauLogo';

const Chat = () => {
  const { user } = useAuth();
  const {
    activeConversation,
    isSelectMode,
    showContactInfo,
    setShowContactInfo,
    setSidebarNavTab,
    setShowUserListModal,
    setShowCreateStatusModalGlobal,
  } = useChat();
  const { wallpaper, wallpaperDim, wallpaperBlur } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showChat, setShowChat] = useState(false); // Mobile: sidebar ya chat
  const [isAppLocked, setIsAppLocked] = useState(() => {
    try {
      const rawUser = localStorage.getItem('chatUser') || localStorage.getItem('user') || '{}';
      const u = JSON.parse(rawUser);
      return u?._id ? sessionStorage.getItem(`chatapp_locked_${u._id}`) === 'true' : false;
    } catch {
      return false;
    }
  });

  // Sync locked state once user is loaded
  useEffect(() => {
    if (user?._id) {
      const locked = sessionStorage.getItem(`chatapp_locked_${user._id}`) === 'true';
      if (locked) {
        setIsAppLocked(true);
      }
    }
  }, [user?._id]);

  const handleLockApp = () => {
    if (user?._id) {
      sessionStorage.setItem(`chatapp_locked_${user._id}`, 'true');
    }
    setIsAppLocked(true);
  };

  const handleUnlockApp = () => {
    if (user?._id) {
      sessionStorage.removeItem(`chatapp_locked_${user._id}`);
    }
    setIsAppLocked(false);
  };

  // WhatsApp-standard Auto App-Lock based on privacySettings.appLock ('immediately', '1min', '15min', '30min', 'off')
  useEffect(() => {
    if (!user?._id) return;
    const lockSetting = user?.privacySettings?.appLock || 'off';
    const pin = localStorage.getItem(`chatapp_pin_${user._id}`);
    if (lockSetting === 'off' || !pin) return;

    const timeoutMap = {
      immediately: 0,
      '1min': 60 * 1000,
      '15min': 15 * 60 * 1000,
      '30min': 30 * 60 * 1000,
    };

    const timeoutMs = timeoutMap[lockSetting];
    let lastActive = Date.now();

    const updateActivity = () => {
      lastActive = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (lockSetting === 'immediately') {
          handleLockApp();
        }
      } else {
        if (timeoutMs !== undefined && timeoutMs > 0) {
          if (Date.now() - lastActive >= timeoutMs) {
            handleLockApp();
          }
        }
      }
    };

    const checkInterval = setInterval(() => {
      if (timeoutMs !== undefined && timeoutMs > 0) {
        if (Date.now() - lastActive >= timeoutMs) {
          handleLockApp();
        }
      }
    }, 10000);

    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('click', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?._id, user?.privacySettings?.appLock]);

  // Screen size monitor karo
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowChat(false); // Desktop pe dono dikhao
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConversationSelect = () => {
    if (isMobile) setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      {/* App Lock Screen Overlay */}
      <AppLockScreen isLocked={isAppLocked} onUnlock={handleUnlockApp} />
      {/* Sidebar - Mobile pe sirf tab dikhao jab chat nahi khula */}
      {(!isMobile || !showChat) && (
        <Sidebar
          onConversationSelect={handleConversationSelect}
          isMobile={isMobile}
          onClose={() => setShowChat(true)}
          onLockApp={handleLockApp}
        />
      )}

      {/* Chat Area */}
      {(!isMobile || showChat) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minWidth: 0, height: '100%', overflow: 'hidden' }}>
          {activeConversation ? (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
                <ChatHeader onBack={isMobile ? handleBack : null} />
                <MessageList />
                {isSelectMode ? <MessageSelectionBar /> : <MessageInput />}
              </div>
              {showContactInfo && (
                <ContactInfoSidebar onClose={() => setShowContactInfo(false)} />
              )}
            </>
          ) : (
            // Empty state - Fourth Image Batiyau Welcome Card
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: wallpaper ? `url("${wallpaper}")` : 'var(--bg-primary)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                padding: '24px 16px',
                overflow: 'hidden',
              }}
            >
              {wallpaper && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `rgba(0, 0, 0, ${wallpaperDim})`,
                    backdropFilter: wallpaperBlur > 0 ? `blur(${wallpaperBlur}px)` : 'none',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Card matching Fourth Image */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '2px solid #0284c7',
                  borderRadius: 24,
                  padding: '36px 28px 28px',
                  maxWidth: 390,
                  width: '100%',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
                  textAlign: 'center',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                {/* Batiyau Brand Logo matching Fourth Image */}
                <div style={{ marginBottom: 14 }}>
                  <BatiyauLogo size={88} animated={true} idPrefix="empty-state" />
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: 6,
                    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
                  }}
                >
                  Batiyau
                </h2>

                {/* Subtitle */}
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: 10,
                    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
                  }}
                >
                  Simple and secure messaging
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.94rem',
                    fontWeight: 500,
                    color: '#334155',
                    lineHeight: 1.45,
                    maxWidth: 320,
                    marginBottom: 28,
                    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
                  }}
                >
                  Every great conversation starts with a simple message.
                </p>

                {/* 4 Clickable Action Icons Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 6,
                  }}
                >
                  {/* 1. Add Story */}
                  <button
                    id="empty-state-add-story-btn"
                    onClick={() => {
                      setSidebarNavTab('status');
                      setShowCreateStatusModalGlobal(true);
                    }}
                    title="Add Story"
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: '#041F17',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(4, 31, 23, 0.25)',
                        transition: 'transform 0.15s ease, background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.background = '#063527';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = '#041F17';
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round">
                        <line x1="12" y1="2" x2="12" y2="5" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="5" y2="12" />
                        <line x1="19" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
                        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
                        <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
                        <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginTop: 8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Add Story
                    </span>
                  </button>

                  {/* 2. Communities */}
                  <button
                    id="empty-state-communities-btn"
                    onClick={() => {
                      setSidebarNavTab('communities');
                    }}
                    title="Communities"
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: '#041F17',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(4, 31, 23, 0.25)',
                        transition: 'transform 0.15s ease, background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.background = '#063527';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = '#041F17';
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2h5a2 2 0 0 1 2 2v2l2 2v-4a2 2 0 0 0-2-2h-7z" />
                        <circle cx="12" cy="11.5" r="3.2" />
                        <path d="M6.5 21v-2a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v2" />
                        <path d="M4 20.5v-1.5a3.5 3.5 0 0 1 2.5-3.3" />
                        <circle cx="6" cy="11" r="2.3" />
                        <path d="M17.5 15.7a3.5 3.5 0 0 1 2.5 3.3v1.5" />
                        <circle cx="18" cy="11" r="2.3" />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginTop: 8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Communities
                    </span>
                  </button>

                  {/* 3. New Call */}
                  <button
                    id="empty-state-new-call-btn"
                    onClick={() => {
                      setSidebarNavTab('calls');
                    }}
                    title="New Call"
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: '#041F17',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(4, 31, 23, 0.25)',
                        transition: 'transform 0.15s ease, background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.background = '#063527';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = '#041F17';
                      }}
                    >
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginTop: 8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      New Call
                    </span>
                  </button>

                  {/* 4. Chat */}
                  <button
                    id="empty-state-chat-btn"
                    onClick={() => {
                      setSidebarNavTab('chats');
                      setShowUserListModal(true);
                    }}
                    title="Chat"
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: '#041F17',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(4, 31, 23, 0.25)',
                        transition: 'transform 0.15s ease, background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.background = '#063527';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = '#041F17';
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 14.5a3.5 3.5 0 0 1-3.5 3.5H8.2L4.5 21.5V6A3.5 3.5 0 0 1 8 2.5h9.5A3.5 3.5 0 0 1 21 6v8.5z" />
                        <line x1="8.5" y1="8" x2="16.5" y2="8" />
                        <line x1="8.5" y1="11.5" x2="16.5" y2="11.5" />
                        <line x1="8.5" y1="15" x2="13" y2="15" />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginTop: 8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Chat
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
