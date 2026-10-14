import React from 'react';

const KeyboardShortcutsModal = ({ onClose }) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const shortcuts = [
    { label: 'Mark as unread', keys: [modKey, 'Shift', 'U'] },
    { label: 'Mute chat', keys: [modKey, 'Shift', 'M'] },
    { label: 'Archive chat', keys: [modKey, 'Shift', 'E'] },
    { label: 'Pin / unpin chat', keys: [modKey, 'Shift', 'P'] },
    { label: 'Search in chat', keys: [modKey, 'Shift', 'F'] },
    { label: 'Search all chats', keys: [modKey, 'Alt', '/'] },
    { label: 'New chat', keys: [modKey, 'Alt', 'N'] },
    { label: 'Next chat', keys: [modKey, 'Alt', ']'] },
    { label: 'Previous chat', keys: [modKey, 'Alt', '['] },
    { label: 'Close active chat', keys: ['Escape'] },
    { label: 'New group', keys: [modKey, 'Alt', 'Shift', 'N'] },
    { label: 'Profile & Status', keys: [modKey, 'Alt', 'P'] },
    { label: 'Settings', keys: [modKey, 'Alt', ','] },
    { label: 'Emoji picker', keys: [modKey, 'Alt', 'E'] },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 500,
          background: 'var(--bg-secondary, #131418)',
          borderRadius: 20,
          border: '1px solid var(--border-color, #272a31)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle, #1e2127)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⌨️</span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
              Keyboard shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #8b929d)',
              fontSize: 18,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Shortcuts list */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '0.88rem', color: 'var(--text-primary, #ffffff)' }}>
                {sc.label}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {sc.keys.map((k, kidx) => (
                  <kbd
                    key={kidx}
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#4ee3c5',
                      background: 'rgba(78, 227, 197, 0.08)',
                      border: '1px solid rgba(78, 227, 197, 0.25)',
                      borderRadius: 6,
                      boxShadow: '0 2px 0 rgba(0,0,0,0.4)',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle, #1e2127)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              background: '#00a884',
              border: 'none',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
