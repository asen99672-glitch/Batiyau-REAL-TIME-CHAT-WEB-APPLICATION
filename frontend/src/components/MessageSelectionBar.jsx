import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import DeleteMessageModal from './DeleteMessageModal';
import ForwardModal from './ForwardModal';

const MessageSelectionBar = () => {
  const {
    messages,
    selectedMessageIds,
    clearSelection,
    selectAllMessages,
    deleteSelectedMessages,
    toggleStarMessage,
    forwardMessage,
    showToast,
  } = useChat();
  const { user } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const selectedCount = selectedMessageIds.length;
  const allSelected = messages.length > 0 && selectedCount === messages.length;

  const selectedMessages = messages.filter((m) =>
    selectedMessageIds.some((id) => id?.toString() === m._id?.toString())
  );

  // Check if all selected messages can be deleted for everyone
  const canDeleteForEveryone =
    selectedCount > 0 &&
    selectedMessages.every(
      (m) =>
        (m.sender?._id || m.sender)?.toString() === user?._id?.toString() &&
        !m.isDeleted
    );

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        } else if (showForwardModal) {
          setShowForwardModal(false);
        } else {
          clearSelection();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, showDeleteModal, showForwardModal]);

  // 1. Handle Delete
  const handleDelete = async (deleteType) => {
    setShowDeleteModal(false);
    await deleteSelectedMessages(deleteType);
  };

  // 2. Handle Save (Star / Bookmark)
  const handleSaveSelected = async () => {
    if (selectedCount === 0) return;
    try {
      for (const msgId of selectedMessageIds) {
        await toggleStarMessage(msgId);
      }
      showToast(`${selectedCount} message(s) saved / starred`, 'success', '🔖');
      clearSelection();
    } catch (err) {
      console.error('Failed to save selected messages:', err);
      showToast('Failed to save messages', 'error');
    }
  };

  // 3. Handle Forward
  const handleForwardSelected = async (targetIds) => {
    if (selectedCount === 0 || !targetIds.length) return;
    try {
      for (const msgId of selectedMessageIds) {
        await forwardMessage(msgId, targetIds);
      }
      showToast(`${selectedCount} message(s) forwarded successfully`, 'success', '↪');
      setShowForwardModal(false);
      clearSelection();
    } catch (err) {
      console.error('Failed to forward messages:', err);
      showToast('Failed to forward messages', 'error');
    }
  };

  // 4. Handle Download
  const handleDownloadSelected = () => {
    if (selectedCount === 0) return;
    try {
      let downloadedMediaCount = 0;

      // 1. Download media files if any attachment exists
      const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
      selectedMessages.forEach(async (m) => {
        if (m.attachments && m.attachments.length > 0) {
          m.attachments.forEach(async (att) => {
            if (att.url) {
              downloadedMediaCount++;
              const fileUrl = att.url.startsWith('http')
                ? att.url
                : `${backendBase}${att.url.startsWith('/') ? '' : '/'}${att.url}`;
              try {
                const res = await fetch(fileUrl);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = att.filename || `media_${Date.now()}`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
              } catch (err) {
                window.open(fileUrl, '_blank');
              }
            }
          });
        }
      });

      // 2. Also export the formatted text of selected messages
      const formattedText = selectedMessages
        .map((m) => {
          const time = new Date(m.createdAt || Date.now()).toLocaleString();
          const senderName =
            (m.sender?._id || m.sender)?.toString() === user?._id?.toString()
              ? 'You'
              : m.sender?.name || 'User';
          const content = m.isDeleted
            ? '<This message was deleted>'
            : m.message || (m.attachments?.length ? `[Media: ${m.attachments[0].filename || m.messageType}]` : '');
          return `[${time}] ${senderName}: ${content}`;
        })
        .join('\n');

      const header = `========================================\nWhatsApp Selected Messages (${selectedCount})\nExported on: ${new Date().toLocaleString()}\n========================================\n\n`;

      const blob = new Blob([header + formattedText], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const txtLink = document.createElement('a');
      txtLink.href = blobUrl;
      txtLink.download = `WhatsApp_selected_messages_${Date.now()}.txt`;
      document.body.appendChild(txtLink);
      txtLink.click();
      document.body.removeChild(txtLink);
      URL.revokeObjectURL(blobUrl);

      showToast(
        downloadedMediaCount > 0
          ? `${selectedCount} message(s) & ${downloadedMediaCount} media file(s) downloaded`
          : `${selectedCount} message(s) downloaded as text`,
        'success',
        '📥'
      );
      clearSelection();
    } catch (err) {
      console.error('Download failed:', err);
      showToast('Failed to download selected messages', 'error');
    }
  };

  const actionButtonStyle = (enabled = true) => ({
    background: 'transparent',
    border: 'none',
    color: enabled ? '#e9edef' : '#535d64',
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    padding: 0,
    transition: 'all 0.15s ease',
  });

  return (
    <>
      <div
        className="animate-fade-in"
        style={{
          height: 62,
          minHeight: 62,
          backgroundColor: 'var(--bg-secondary, #202c33)',
          borderTop: '1px solid var(--border-color, #272a31)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.25)',
          zIndex: 40,
        }}
      >
        {/* Left: Close ✕ button + Selected count + Select All */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={clearSelection}
            title="Cancel selection (Esc)"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696a0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#e9edef';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8696a0';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <span
            style={{
              fontSize: '0.96rem',
              fontWeight: 500,
              color: '#e9edef',
              userSelect: 'none',
            }}
          >
            {selectedCount} selected
          </span>

          {messages.length > 1 && (
            <button
              onClick={allSelected ? clearSelection : selectAllMessages}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#aebac1',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 14,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#aebac1';
              }}
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>

        {/* Right: 4 Action Icons matching WhatsApp Image 5: Save (Star/Bookmark), Delete, Forward, Download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 1. Save (Star / Bookmark ribbon) */}
          <button
            onClick={handleSaveSelected}
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? 'Select messages to save' : 'Save / Star selected messages'}
            style={actionButtonStyle(selectedCount > 0)}
            onMouseEnter={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#fbbf24';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#e9edef';
              }
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* 2. Delete (Trash) */}
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? 'Select messages to delete' : 'Delete selected messages'}
            style={actionButtonStyle(selectedCount > 0)}
            onMouseEnter={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ef4444';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#e9edef';
              }
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>

          {/* 3. Forward */}
          <button
            onClick={() => setShowForwardModal(true)}
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? 'Select messages to forward' : 'Forward selected messages'}
            style={actionButtonStyle(selectedCount > 0)}
            onMouseEnter={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = 'var(--accent-secondary, #4ee3c5)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#e9edef';
              }
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
          </button>

          {/* 4. Download */}
          <button
            onClick={handleDownloadSelected}
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? 'Select messages to download' : 'Download selected messages'}
            style={actionButtonStyle(selectedCount > 0)}
            onMouseEnter={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#38bdf8';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#e9edef';
              }
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteMessageModal
          count={selectedCount}
          canDeleteForEveryone={canDeleteForEveryone}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <ForwardModal
          messages={selectedMessages}
          onClose={() => setShowForwardModal(false)}
          onForward={handleForwardSelected}
        />
      )}
    </>
  );
};

export default MessageSelectionBar;
