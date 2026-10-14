import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';

const SLIDE_DURATION = 5000; // 5 seconds per slide

const StatusViewer = ({ statusGroup, onClose, onNextGroup, onPrevGroup }) => {
  const { user: currentUser } = useAuth();
  const { viewStatus, deleteStatus, startConversation, selectConversation, sendMessage, showToast } = useChat();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const statuses = statusGroup?.statuses || [];
  const currentStatus = statuses[currentIndex];
  const isOwnStatus =
    (statusGroup?.user?._id || statusGroup?.user)?.toString() === currentUser?._id?.toString();

  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const pausedAtProgressRef = useRef(0);

  // Format status timestamp
  const formatStatusTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today at ${timeString}` : `Yesterday at ${timeString}`;
  };

  // Mark current status as viewed if not own
  useEffect(() => {
    if (currentStatus && !isOwnStatus && viewStatus) {
      viewStatus(currentStatus._id);
    }
  }, [currentStatus, isOwnStatus, viewStatus]);

  // Navigate to next status or next group
  const handleNext = useCallback(() => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      pausedAtProgressRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      if (onNextGroup) {
        onNextGroup();
      } else {
        onClose();
      }
    }
  }, [currentIndex, statuses.length, onNextGroup, onClose]);

  // Navigate to previous status or previous group
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      pausedAtProgressRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      if (onPrevGroup) {
        onPrevGroup();
      }
    }
  }, [currentIndex, onPrevGroup]);

  // Timer loop for progress bar
  useEffect(() => {
    if (isPaused || showViewersModal || !currentStatus) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now() - (pausedAtProgressRef.current / 100) * SLIDE_DURATION;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / SLIDE_DURATION) * 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(progressIntervalRef.current);
        handleNext();
      }
    }, 40);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, isPaused, showViewersModal, currentStatus, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Pause on touch/mouse hold
  const handlePointerDown = () => {
    pausedAtProgressRef.current = progress;
    setIsPaused(true);
  };

  const handlePointerUp = () => {
    setIsPaused(false);
  };

  // Delete status
  const handleDeleteCurrentStatus = async () => {
    if (!currentStatus) return;
    if (window.confirm('Delete this status update?')) {
      await deleteStatus(currentStatus._id);
      if (statuses.length <= 1) {
        onClose();
      } else {
        handleNext();
      }
    }
  };

  // Reply to status
  const handleSendReply = async (textToSend) => {
    const text = (textToSend || replyText).trim();
    if (!text || sendingReply || !statusGroup?.user) return;
    setSendingReply(true);
    try {
      // 1. Start or find direct conversation with status owner
      const conv = await startConversation(statusGroup.user._id);
      if (conv) {
        await selectConversation(conv);
        // 2. Send message quoting the status
        const quotePrefix = currentStatus.type === 'text'
          ? `[Replying to Status: "${currentStatus.content.slice(0, 30)}..."]\n`
          : `[Replying to Status: 📷 Photo]\n`;

        await sendMessage({
          message: `${quotePrefix}${text}`,
          messageType: 'text',
        });
        showToast('Reply sent to chat ✓', 'success', '💬');
        setReplyText('');
        onClose();
      }
    } catch (err) {
      console.error('Failed to reply to status:', err);
      showToast('Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  if (!currentStatus) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#0c1317',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* Background backdrop blur */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            currentStatus.type === 'text'
              ? currentStatus.backgroundColor || '#128c7e'
              : 'rgba(0, 0, 0, 0.95)',
          opacity: currentStatus.type === 'text' ? 0.35 : 0.9,
          filter: 'blur(30px)',
          zIndex: 1,
        }}
      />

      {/* Main Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '480px',
          height: '100vh',
          maxHeight: '920px',
          display: 'flex',
          flexDirection: 'column',
          background:
            currentStatus.type === 'text'
              ? currentStatus.backgroundColor || '#128c7e'
              : '#000000',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* 1. Progress Bar Segments */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            gap: 6,
            zIndex: 10,
          }}
        >
          {statuses.map((s, idx) => {
            let width = '0%';
            if (idx < currentIndex) width = '100%';
            else if (idx === currentIndex) width = `${progress}%`;

            return (
              <div
                key={s._id || idx}
                style={{
                  flex: 1,
                  height: 3.5,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.35)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width,
                    height: '100%',
                    background: '#ffffff',
                    transition: idx === currentIndex && !isPaused ? 'width 0.05s linear' : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 2. Top Header Bar */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            padding: '8px 4px',
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Back / Close button */}
            <button
              onClick={onClose}
              title="Close"
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            <Avatar user={statusGroup.user} size={38} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem' }}>
                {isOwnStatus ? 'My Status' : statusGroup.user?.name || 'Contact'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {formatStatusTime(currentStatus.createdAt)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Play/Pause toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((p) => !p);
              }}
              title={isPaused ? 'Resume' : 'Pause'}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPaused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>

            {/* If own status: Delete button */}
            {isOwnStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCurrentStatus();
                }}
                title="Delete Status"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}

            {/* Close ✕ button */}
            <button
              onClick={onClose}
              title="Close"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 3. Navigation Click Zones (Left & Right halves) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 70,
            bottom: 80,
            width: '35%',
            zIndex: 5,
            cursor: 'pointer',
          }}
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: 70,
            bottom: 80,
            width: '65%',
            zIndex: 5,
            cursor: 'pointer',
          }}
        />

        {/* 4. Status Content Canvas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: currentStatus.type === 'text' ? '32px' : 0,
          }}
        >
          {currentStatus.type === 'text' ? (
            <div
              style={{
                textAlign: 'center',
                color: '#ffffff',
                fontSize: '1.75rem',
                fontWeight: 600,
                lineHeight: 1.4,
                fontFamily: currentStatus.fontFamily || 'sans-serif',
                wordBreak: 'break-word',
                maxHeight: '80%',
                overflowY: 'auto',
                padding: '0 12px',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              {currentStatus.content}
            </div>
          ) : currentStatus.type === 'video' ? (
            <video
              src={currentStatus.content}
              autoPlay
              playsInline
              muted={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <img
              src={currentStatus.content}
              alt="Status"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}

          {/* Caption overlay for media */}
          {currentStatus.type !== 'text' && currentStatus.caption && (
            <div
              style={{
                position: 'absolute',
                bottom: 85,
                left: 16,
                right: 16,
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: 14,
                fontSize: '0.95rem',
                textAlign: 'center',
                zIndex: 8,
              }}
            >
              {currentStatus.caption}
            </div>
          )}
        </div>

        {/* 5. Bottom Action Bar */}
        <div
          style={{
            padding: '12px 16px 18px',
            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isOwnStatus ? (
            /* Own status viewer stats toggle */
            <div
              onClick={() => setShowViewersModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                margin: '0 auto',
                transition: 'background 0.2s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{currentStatus.viewers?.length || 0} views</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>▲ Swipe up</span>
            </div>
          ) : (
            /* Reply input to contact's status */
            <div>
              {/* Quick emoji reaction bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginBottom: 8,
                  padding: '2px 0',
                }}
              >
                {['❤️', '😂', '😮', '😢', '🙏', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReply(emoji)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      fontSize: 18,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 24,
                  padding: '4px 6px 4px 16px',
                }}
              >
                <input
                  type="text"
                  placeholder={`Reply to ${statusGroup.user?.name || 'status'}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: replyText.trim() ? '#00a884' : 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: replyText.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: replyText.trim() ? 1 : 0.4,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 6. Viewers Bottom Sheet Modal (For own status) */}
        {showViewersModal && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '65%',
              background: '#111b21',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.7)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 20px',
              animation: 'slideUp 0.25s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
                  Viewed by {currentStatus.viewers?.length || 0}
                </span>
              </div>
              <button
                onClick={() => setShowViewersModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* List of Viewers */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {currentStatus.viewers && currentStatus.viewers.length > 0 ? (
                currentStatus.viewers.map((v, i) => (
                  <div
                    key={v._id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar user={v.user} size={40} />
                      <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>
                        {v.user?.name || 'User'}
                      </span>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                      {v.viewedAt ? formatStatusTime(v.viewedAt) : 'Recently'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255, 255, 255, 0.5)' }}>
                  <p style={{ fontSize: '0.9rem' }}>No views yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusViewer;
