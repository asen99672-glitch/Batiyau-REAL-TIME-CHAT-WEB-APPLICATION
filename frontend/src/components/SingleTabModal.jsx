import React from 'react';
import { useAuth } from '../context/AuthContext';

const SingleTabModal = () => {
  const { isTabConflict, claimActiveTab } = useAuth();

  if (!isTabConflict) return null;

  const handleClose = () => {
    window.close();
    // Fallback if browser blocks script close
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0c1b1a',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        fontFamily: 'inherit',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#142a28',
          border: '1px solid rgba(37, 211, 102, 0.2)',
          borderRadius: '24px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(20, 66, 62, 0.3)',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Device / Multi-window Icon */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: 'rgba(37, 211, 102, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '2px solid rgba(37, 211, 102, 0.3)',
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#25D366"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <path d="M12 7v4" />
            <line x1="12" y1="13" x2="12.01" y2="13" />
          </svg>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '12px',
            letterSpacing: '-0.3px',
          }}
        >
          Chat is open in another window
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '0.92rem',
            color: '#a0bcba',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          You have Chat open in another tab or window. Click{' '}
          <strong style={{ color: '#25D366' }}>&quot;Use Here&quot;</strong> to use Chat in this
          window.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            id="use-here-btn"
            onClick={claimActiveTab}
            style={{
              width: '100%',
              padding: '13px 20px',
              backgroundColor: '#00a884',
              color: '#ffffff',
              border: 'none',
              borderRadius: '26px',
              fontSize: '0.96rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(0, 168, 132, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#029071';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#00a884';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Use Here
          </button>

          <button
            id="close-tab-btn"
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: 'transparent',
              color: '#8696a0',
              border: '1px solid rgba(134, 150, 160, 0.3)',
              borderRadius: '26px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8696a0';
              e.currentTarget.style.borderColor = 'rgba(134, 150, 160, 0.3)';
            }}
          >
            Close Tab
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleTabModal;
