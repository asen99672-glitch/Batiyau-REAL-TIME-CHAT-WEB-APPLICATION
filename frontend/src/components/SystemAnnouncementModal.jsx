import React from 'react';
import { useChat } from '../context/ChatContext';
import BatiyauLogo from './BatiyauLogo';

const CATEGORY_CONFIG = {
  announcement: {
    label: 'OFFICIAL ANNOUNCEMENT',
    icon: '📢',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  warning: {
    label: 'SYSTEM WARNING',
    icon: '⚠️',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  maintenance: {
    label: 'SOFTWARE MAINTENANCE',
    icon: '🛠️',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.35)',
    glow: 'rgba(139, 92, 246, 0.25)',
  },
  critical: {
    label: 'CRITICAL SECURITY ALERT',
    icon: '🚨',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239, 68, 68, 0.25)',
  },
  update: {
    label: 'NEW FEATURE UPDATE',
    icon: '🚀',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    glow: 'rgba(6, 182, 212, 0.25)',
  },
};

const SystemAnnouncementModal = () => {
  const { systemAnnouncement, dismissSystemAnnouncement, openBatiyaoChat } = useChat();

  if (!systemAnnouncement) return null;

  const category = systemAnnouncement.category || (
    systemAnnouncement.level === 'warning' ? 'warning' :
    systemAnnouncement.level === 'critical' ? 'critical' :
    'announcement'
  );

  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.announcement;

  const handleOpenChat = () => {
    if (openBatiyaoChat) {
      openBatiyaoChat();
    }
    dismissSystemAnnouncement();
  };

  const formattedDate = systemAnnouncement.createdAt
    ? new Date(systemAnnouncement.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 12, 10, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 16,
        animation: 'fadeInModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={dismissSystemAnnouncement}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'linear-gradient(145deg, #131d1a 0%, #0d1513 100%)',
          borderRadius: 20,
          border: `1.5px solid ${config.borderColor}`,
          boxShadow: `0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px ${config.glow}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div
          style={{
            height: 4,
            width: '100%',
            background: `linear-gradient(90deg, ${config.color}, #34d399, ${config.color})`,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 14px ${config.glow}`,
              }}
            >
              <BatiyauLogo size={34} animated={true} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: config.color,
                    background: config.bgColor,
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: `1px solid ${config.borderColor}`,
                  }}
                >
                  {config.icon} {config.label}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: '0.72rem',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '3px 7px',
                    borderRadius: 6,
                    fontWeight: 700,
                  }}
                >
                  🛡️ Batiyao Verified
                </span>
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.3,
                }}
              >
                {systemAnnouncement.title || 'Official Announcement'}
              </h3>
            </div>
          </div>

          <button
            onClick={dismissSystemAnnouncement}
            title="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 18,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', maxHeight: '55vh', overflowY: 'auto' }}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.28)',
              borderRadius: 12,
              padding: '16px 18px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#e2e8f0',
              fontSize: '0.92rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {systemAnnouncement.content}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 14,
              fontSize: '0.76rem',
              color: '#64748b',
            }}
          >
            <span>From: <strong>{systemAnnouncement.senderName || 'Batiyao Official Team'}</strong></span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Actions Footer */}
        <div
          style={{
            padding: '14px 24px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            background: 'rgba(0, 0, 0, 0.18)',
          }}
        >
          <button
            onClick={dismissSystemAnnouncement}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            Dismiss
          </button>

          <button
            onClick={handleOpenChat}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
            }}
          >
            <span>💬 View in Batiyao Chat</span>
            <span style={{ fontSize: '1.1rem' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemAnnouncementModal;
