import { useState, useRef, useCallback, useEffect } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import CameraCaptureModal from './CameraCaptureModal';
import MediaPreviewModal from './MediaPreviewModal';

const MessageInput = () => {
  const { user } = useAuth();
  const {
    sendMessage,
    uploadMediaFile,
    emitTyping,
    emitStopTyping,
    activeConversation,
    replyingTo,
    setReplyingTo,
    isUserBlocked,
    unblockUser,
    showToast,
  } = useChat();
  const { themeMode } = useTheme();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [mediaForPreview, setMediaForPreview] = useState(null);

  const typingTimeoutRef = useRef(null);
  const lastTypingEmittedRef = useRef(0);
  const inputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Hidden inputs for file types
  const docInputRef = useRef(null);
  const photoVideoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Focus input when replyingTo is set
  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  // Stop typing on unmount or when conversation changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitStopTyping();
    };
  }, [activeConversation?._id, emitStopTyping]);

  // Click outside listener for attachment menu and emoji picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target) &&
        !e.target.closest('#attach-btn')
      ) {
        setShowAttachMenu(false);
      }

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest('#emoji-btn')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || sending || !activeConversation) return;

    setSending(true);
    setMessage('');
    clearTimeout(typingTimeoutRef.current);
    emitStopTyping();
    lastTypingEmittedRef.current = 0;

    try {
      await sendMessage({ message: trimmed, messageType: 'text' });
    } catch (error) {
      setMessage(trimmed); // Error pe message wapas laao
      console.error('Send failed:', error);
    } finally {
      setSending(false);
    }

    inputRef.current?.focus();
  }, [message, sending, activeConversation, sendMessage, emitStopTyping]);

  const handleKeyDown = (e) => {
    const enterIsSend = !!user?.chatsPreferences?.enterIsSend;
    if (enterIsSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Send message immediately
        handleSend();
      }
    } else {
      // Enter is send is OFF: Enter creates new line, Ctrl+Enter or Cmd+Enter sends
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    setMessage(val);

    if (!val.trim()) {
      clearTimeout(typingTimeoutRef.current);
      emitStopTyping();
      lastTypingEmittedRef.current = 0;
      return;
    }

    const now = Date.now();
    if (now - lastTypingEmittedRef.current > 1200) {
      emitTyping();
      lastTypingEmittedRef.current = now;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
      lastTypingEmittedRef.current = 0;
    }, 1500);
  };

  // Emoji select callback
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || message.length;
      const end = input.selectionEnd || message.length;
      const updated = message.substring(0, start) + emoji + message.substring(end);
      setMessage(updated);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  // Handle file chosen from system inputs
  const handleFileChange = (e, defaultMediaType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so same file can be selected again
    e.target.value = '';
    setShowAttachMenu(false);

    // Auto-detect actual media type from file MIME type and extension
    let detectedType = defaultMediaType;
    const nameLower = (file.name || '').toLowerCase();
    if (
      file.type.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].some((ext) => nameLower.endsWith(ext))
    ) {
      detectedType = 'image';
    } else if (
      file.type.startsWith('video/') ||
      ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.3gp'].some((ext) => nameLower.endsWith(ext))
    ) {
      detectedType = 'video';
    } else if (
      file.type.startsWith('audio/') ||
      ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].some((ext) => nameLower.endsWith(ext))
    ) {
      detectedType = 'audio';
    } else {
      detectedType = 'document';
    }

    const previewUrl = URL.createObjectURL(file);
    setMediaForPreview({
      file,
      previewUrl,
      mediaType: detectedType,
      filename: file.name,
      size: file.size,
      mimetype: file.type || (detectedType === 'image' ? 'image/jpeg' : 'application/octet-stream'),
    });
  };

  // Handle camera photo capture
  const handleCameraCapture = (file, previewUrl) => {
    setMediaForPreview({
      file,
      previewUrl,
      mediaType: 'image',
      filename: file.name,
      size: file.size,
    });
  };

  // Send media after preview confirmation
  const handleSendMedia = async ({ file, caption, mediaType, filename, size, mimetype }) => {
    if (!activeConversation) return;

    try {
      // 1. Upload to server
      const uploadRes = await uploadMediaFile(file);

      // 2. Send message with attachment
      await sendMessage({
        message: caption || '',
        messageType: mediaType,
        attachments: [
          {
            url: uploadRes.url,
            filename: uploadRes.filename || filename,
            size: uploadRes.size || size,
            mimetype: uploadRes.mimetype || mimetype,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send media attachment:', error);
      alert('Failed to upload and send media. Please try again.');
    }
  };

  const isDarkMode = themeMode === 'dark';

  const otherParticipant = !activeConversation?.isGroup
    ? activeConversation?.participants?.find((p) => (p?._id || p)?.toString() !== user?._id?.toString())
    : null;
  const otherUserId = (otherParticipant?._id || otherParticipant)?.toString();
  const isBlocked = otherUserId ? isUserBlocked(otherUserId) : false;

  if (isBlocked) {
    return (
      <div
        id="blocked-contact-banner"
        style={{
          padding: '16px 20px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
            You blocked this contact. Tap to unblock.
          </span>
        </div>
        <button
          id="unblock-input-banner-btn"
          onClick={() => {
            if (otherUserId) {
              unblockUser(otherUserId);
              showToast('Contact unblocked', 'success', '🔓');
            }
          }}
          style={{
            background: 'var(--accent-secondary, #4ee3c5)',
            color: '#0d2825',
            border: 'none',
            borderRadius: 20,
            padding: '7px 24px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'var(--transition)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          Unblock
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Hidden file pickers */}
      <input
        type="file"
        ref={docInputRef}
        style={{ display: 'none' }}
        accept="*/*"
        onChange={(e) => handleFileChange(e, 'document')}
      />
      <input
        type="file"
        ref={photoVideoInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const type = file?.type?.startsWith('video/') ? 'video' : 'image';
          handleFileChange(e, type);
        }}
      />
      <input
        type="file"
        ref={audioInputRef}
        style={{ display: 'none' }}
        accept="audio/*"
        onChange={(e) => handleFileChange(e, 'audio')}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={!!mediaForPreview}
        mediaItem={mediaForPreview}
        onClose={() => {
          if (mediaForPreview?.previewUrl) {
            URL.revokeObjectURL(mediaForPreview.previewUrl);
          }
          setMediaForPreview(null);
        }}
        onSend={handleSendMedia}
      />

      {/* Quoted Reply Preview Bar (WhatsApp style) */}
      {replyingTo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 18px',
            background: 'var(--bg-tertiary, #14171d)',
            borderTop: '1px solid var(--border-color, #272a31)',
            borderLeft: '4px solid var(--accent-secondary, #4ee3c5)',
            gap: 12,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--accent-secondary, #4ee3c5)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 2,
              }}
            >
              <span>↩</span>
              <span>Replying to {replyingTo.sender?.name || replyingTo.sender?.username || 'User'}</span>
            </div>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary, #94a3b8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {replyingTo.message ||
                (replyingTo.messageType === 'image'
                  ? '📷 Photo'
                  : replyingTo.messageType === 'video'
                  ? '🎥 Video'
                  : replyingTo.messageType === 'audio'
                  ? '🎧 Audio clip'
                  : '📎 Attachment')}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            title="Cancel reply"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #94a3b8)')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Message Input Container */}
      <div
        style={{
          padding: '12px 20px',
          background: 'var(--bg-secondary)',
          borderTop: replyingTo ? 'none' : '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
        }}
      >
        {/* WhatsApp-style Attachment Popup Menu */}
        {showAttachMenu && (
          <div
            ref={attachMenuRef}
            className="animate-fade-in"
            style={{
              position: 'absolute',
              bottom: 68,
              left: 18,
              background: 'var(--bg-card, #17191e)',
              borderRadius: 18,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
              border: '1px solid var(--border-color, #272a31)',
              zIndex: 1000,
              minWidth: 190,
            }}
          >
            {/* Document */}
            <button
              id="attach-doc-btn"
              onClick={() => {
                setShowAttachMenu(false);
                docInputRef.current?.click();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
                }}
              >
                📄
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Document</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PDF, Word, Excel</div>
              </div>
            </button>

            {/* Photos & Videos */}
            <button
              id="attach-media-btn"
              onClick={() => {
                setShowAttachMenu(false);
                photoVideoInputRef.current?.click();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #065f46, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                }}
              >
                🖼️
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Photos & Videos</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Images, Videos</div>
              </div>
            </button>

            {/* Camera */}
            <button
              id="attach-camera-btn"
              onClick={() => {
                setShowAttachMenu(false);
                setShowCameraModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9d174d, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.35)',
                }}
              >
                📷
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Camera</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Take a photo</div>
              </div>
            </button>

            {/* Audio */}
            <button
              id="attach-audio-btn"
              onClick={() => {
                setShowAttachMenu(false);
                audioInputRef.current?.click();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9a3412, #f97316)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: '0 2px 8px rgba(249, 115, 22, 0.35)',
                }}
              >
                🎧
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Audio</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Share songs, voice</div>
              </div>
            </button>
          </div>
        )}

        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="animate-fade-in"
            style={{
              position: 'absolute',
              bottom: 68,
              left: 48,
              zIndex: 1000,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
              width={340}
              height={420}
              searchPlaceHolder="Search emoji..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        {/* Attachment button */}
        <button
          id="attach-btn"
          title="Attach Document, Photo, Video, Audio, Camera"
          onClick={() => {
            setShowAttachMenu((prev) => !prev);
            setShowEmojiPicker(false);
          }}
          style={{
            background: showAttachMenu ? 'var(--bg-hover)' : 'none',
            border: 'none',
            color: showAttachMenu ? 'var(--accent-secondary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 22,
            padding: '6px',
            borderRadius: '50%',
            transition: 'var(--transition)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => {
            if (!showAttachMenu) e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Emoji Button (Right side of attach icon) */}
        <button
          id="emoji-btn"
          title="Choose Emoji"
          onClick={() => {
            setShowEmojiPicker((prev) => !prev);
            setShowAttachMenu(false);
          }}
          style={{
            background: showEmojiPicker ? 'var(--bg-hover)' : 'none',
            border: 'none',
            color: showEmojiPicker ? '#fbbf24' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 21,
            padding: '6px',
            borderRadius: '50%',
            transition: 'var(--transition)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            if (!showEmojiPicker) e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            if (!showEmojiPicker) e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {/* Text input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            id="message-input"
            ref={inputRef}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={
              user?.chatsPreferences?.enterIsSend
                ? 'Type a message (Enter to send)...'
                : 'Type a message...'
            }
            rows={1}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '10px 18px',
              borderRadius: 26,
              fontSize: '0.9rem',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: 'auto',
              transition: 'var(--transition)',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-secondary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(78, 227, 197, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
            // Auto resize
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Send button */}
        <button
          id="send-message-btn"
          onClick={handleSend}
          disabled={!message.trim() || sending}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: message.trim() ? 'var(--accent-secondary)' : 'var(--bg-hover)',
            border: message.trim() ? 'none' : '1px solid var(--border-subtle)',
            color: message.trim() ? '#ffffff' : 'var(--text-muted)',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            fontSize: 17,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)',
            flexShrink: 0,
            transform: message.trim() ? 'scale(1)' : 'scale(0.95)',
            boxShadow: message.trim() ? '0 2px 8px rgba(10, 46, 43, 0.3)' : 'none',
          }}
        >
          {sending ? (
            <div
              className="spinner"
              style={{ width: 16, height: 16, borderWidth: 2 }}
            />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

export default MessageInput;
