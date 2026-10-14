const DeleteMessageModal = ({ isSent, count = 1, canDeleteForEveryone, onClose, onDelete }) => {
  const allowEveryone = canDeleteForEveryone !== undefined ? canDeleteForEveryone : !!isSent;

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
        animation: 'fadeInModal 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card, #1c1f26)',
          border: '1px solid var(--border-color, #2d323e)',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          padding: '24px 24px 20px',
          color: 'var(--text-primary, #fff)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            marginBottom: 12,
            color: 'var(--text-primary, #ffffff)',
          }}
        >
          {count > 1 ? `Delete ${count} messages?` : 'Delete message?'}
        </h3>
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary, #a0a6b5)',
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          {allowEveryone
            ? count > 1
              ? 'You can delete these messages for everyone or delete them just for yourself.'
              : 'You can delete this message for everyone or delete it just for yourself.'
            : count > 1
            ? 'You can delete these messages for yourself.'
            : 'You can delete this message for yourself.'}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {allowEveryone && (
            <button
              onClick={() => onDelete('everyone')}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
            >
              <span>🗑️</span> Delete for everyone
            </button>
          )}

          <button
            onClick={() => onDelete('me')}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 10,
              border: '1px solid var(--border-color, #2d323e)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary, #ffffff)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
          >
            Delete for me
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted, #7e8596)',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary, #ffffff)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #7e8596)')}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
