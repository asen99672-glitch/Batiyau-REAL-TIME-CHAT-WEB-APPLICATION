import React from 'react';

const BatiyauLogo = ({ size = 44, animated = false, idPrefix = 'batiyau' }) => {
  const bgGradId = `${idPrefix}-bgGrad`;
  const primaryBubbleId = `${idPrefix}-primaryBubble`;
  const accentBubbleId = `${idPrefix}-accentBubble`;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          display: 'block',
          overflow: 'visible',
          filter: animated ? 'drop-shadow(0 8px 24px rgba(5, 150, 105, 0.35))' : 'none',
        }}
      >
        <defs>
          {/* Background subtle dark forest/slate gradient */}
          <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#041F17" />
            <stop offset="100%" stopColor="#0F2F24" />
          </linearGradient>

          {/* Primary Message Bubble Green Gradient */}
          <linearGradient id={primaryBubbleId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Secondary Overlapping Bubble Mint/Lime Accent */}
          <linearGradient id={accentBubbleId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {animated && (
            <style>
              {`
                @keyframes batiyauSquircle {
                  0%, 100% {
                    transform: scale(1);
                  }
                  50% {
                    transform: scale(1.025);
                  }
                }
                @keyframes batiyauFloat {
                  0%, 100% {
                    transform: translateY(0px) scale(1);
                  }
                  50% {
                    transform: translateY(-3px) scale(1.04);
                  }
                }
                @keyframes batiyauAccentPulse {
                  0%, 100% {
                    opacity: 0.35;
                    transform: scale(1) translate(0, 0);
                  }
                  50% {
                    opacity: 0.75;
                    transform: scale(1.08) translate(2px, -2px);
                  }
                }
                @keyframes batiyauGlyphShine {
                  0%, 100% {
                    opacity: 0.75;
                    transform: scaleX(1);
                  }
                  50% {
                    opacity: 1;
                    transform: scaleX(1.04);
                  }
                }
                @keyframes batiyauDotGlow {
                  0%, 100% {
                    transform: scale(1);
                    opacity: 0.8;
                    filter: drop-shadow(0 0 0px #6EE7B7);
                  }
                  50% {
                    transform: scale(1.4);
                    opacity: 1;
                    filter: drop-shadow(0 0 4px #6EE7B7);
                  }
                }
                .batiyau-squircle-base {
                  transform-origin: 50px 50px;
                  animation: batiyauSquircle 2.4s ease-in-out infinite;
                }
                .batiyau-front-bubble {
                  transform-origin: 47px 49px;
                  animation: batiyauFloat 2s ease-in-out infinite;
                }
                .batiyau-accent-bubble {
                  transform-origin: 62px 48px;
                  animation: batiyauAccentPulse 2s ease-in-out infinite;
                }
                .batiyau-glyph {
                  transform-origin: 33px 45px;
                  animation: batiyauGlyphShine 2s ease-in-out infinite;
                }
                .batiyau-dot {
                  transform-origin: 55px 43px;
                  animation: batiyauDotGlow 1.4s ease-in-out infinite;
                }
              `}
            </style>
          )}
        </defs>

        {/* App Rounded Squircle Base */}
        <rect
          className={animated ? 'batiyau-squircle-base' : undefined}
          width="100"
          height="100"
          rx="26"
          fill={`url(#${bgGradId})`}
        />

        {/* Back/Accent Bubble (Incoming/Dialogue layer) */}
        <path
          className={animated ? 'batiyau-accent-bubble' : undefined}
          d="M42 26 H64 C73.9 26 82 34.1 82 44 C82 53.9 73.9 62 64 62 H60 L50 70 V61.5 C45.3 59.8 42 55.3 42 50 Z"
          fill={`url(#${accentBubbleId})`}
          opacity="0.35"
        />

        {/* Front/Main Bubble (Sleek message geometry) */}
        <path
          className={animated ? 'batiyau-front-bubble' : undefined}
          d="M22 36 C22 28.27 28.27 22 36 22 H58 C65.73 22 72 28.27 72 36 V52 C72 59.73 65.73 66 58 66 H40 L26 76 V64.2 C23.5 61.5 22 57 22 52 Z"
          fill={`url(#${primaryBubbleId})`}
        />

        {/* Professional Message Glyphs */}
        <g className={animated ? 'batiyau-front-bubble' : undefined}>
          <rect className={animated ? 'batiyau-glyph' : undefined} x="33" y="41" width="16" height="4" rx="2" fill="#FFFFFF" />
          <rect className={animated ? 'batiyau-glyph' : undefined} x="33" y="49" width="26" height="4" rx="2" fill="#FFFFFF" opacity="0.85" />
          <circle className={animated ? 'batiyau-dot' : undefined} cx="55" cy="43" r="2.5" fill="#6EE7B7" />
        </g>
      </svg>
    </div>
  );
};

export default BatiyauLogo;
