import React, { useState, useEffect } from 'react';
import BatiyauLogo from './BatiyauLogo';

const SplashScreen = ({ duration = 2000 }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Start gentle fade out 250ms before duration ends
    const timer = setTimeout(() => {
      setFadingOut(true);
    }, Math.max(0, duration - 250));

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#B4E2D1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 20px 48px',
        animation: 'splashFadeIn 0.25s ease-out',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.25s ease-in-out',
        userSelect: 'none',
        pointerEvents: 'all',
      }}
    >
      <style>
        {`
          @keyframes splashFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes splashPop {
            0% { transform: scale(0.9); opacity: 0; }
            55% { transform: scale(1.03); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      {/* Top spacing */}
      <div style={{ height: 20 }} />

      {/* Center: Animated Batiyau Logo + Title */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'splashPop 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <BatiyauLogo size={148} animated={true} idPrefix="splash-main" />

        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#041F17',
            letterSpacing: '-0.5px',
            marginTop: 26,
            fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          Batiyau
        </h1>
      </div>

      {/* Bottom: "from Baghelkhand in india" matching the provided image */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#041F17',
          fontSize: '1.05rem',
          fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <span style={{ fontWeight: 400 }}>from</span>
        <span style={{ fontWeight: 800 }}>Baghelkhand in india</span>
      </div>
    </div>
  );
};

export default SplashScreen;

