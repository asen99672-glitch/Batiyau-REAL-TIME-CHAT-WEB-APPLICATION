import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import DOODLE_PATTERN_DATA_URL from '../assets/doodlePattern';

// 8 Curated Theme Presets matching Image 1
const THEME_PRESETS = [
  {
    id: 'classic',
    name: 'BaatCheet Classic',
    solidColor: '#111b21',
    wallpaper: '',
    bubbleColor: '#005c4b',
    doodlesEnabled: true,
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    solidColor: '#0a2e2b',
    wallpaper: '',
    bubbleColor: '#0f766e',
    doodlesEnabled: true,
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    solidColor: '#0d1b2a',
    wallpaper: '',
    bubbleColor: '#1d4ed8',
    doodlesEnabled: false,
  },
  {
    id: 'charcoal',
    name: 'Dark Charcoal',
    solidColor: '#18191c',
    wallpaper: '',
    bubbleColor: '#475569',
    doodlesEnabled: false,
  },
  {
    id: 'amethyst',
    name: 'Amethyst Silk',
    solidColor: '',
    wallpaper: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    bubbleColor: '#7c3aed',
    doodlesEnabled: false,
  },
  {
    id: 'rose',
    name: 'Floral Rose',
    solidColor: '',
    wallpaper: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80',
    bubbleColor: '#9333ea',
    doodlesEnabled: false,
  },
  {
    id: 'amber',
    name: 'Amber Sunset',
    solidColor: '',
    wallpaper: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    bubbleColor: '#c2410c',
    doodlesEnabled: false,
  },
  {
    id: 'ocean',
    name: 'Ocean Beach',
    solidColor: '',
    wallpaper: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bubbleColor: '#0d9488',
    doodlesEnabled: false,
  },
];

// 37 Authentic WhatsApp Solid Colors matching Images 3 & 4
export const SOLID_COLORS = [
  '#1e5b56', '#4b6f65', '#2d6a4f', '#0e5e54', '#0b5351',
  '#1b6b7a', '#2a7a4c', '#2b7239', '#597334', '#697829',
  '#595e34', '#8c7918', '#78720e', '#9c4930', '#964234',
  '#963254', '#5256a3', '#3766a6', '#7a328f', '#733246',
  '#612630', '#591118', '#5e1d18', '#591828', '#592611',
  '#32283b', '#29292b', '#2e3438', '#282c54', '#142b47',
  '#0f4052', '#0a3d38', '#1d2833', '#4a4e52', '#6b7075',
  '#1a232a', '#111b21',
];

// Curated Message Bubble Colors for "BaatCheet bubble" customize
const BUBBLE_COLORS = [
  '#005c4b', '#00a884', '#056162', '#1d4ed8', '#2563eb',
  '#0284c7', '#0d9488', '#059669', '#16a34a', '#65a30d',
  '#d97706', '#ea580c', '#dc2626', '#e11d48', '#db2777',
  '#c026d3', '#9333ea', '#7c3aed', '#4f46e5', '#475569',
  '#334155', '#262626',
];

const ChatThemeModal = ({ onClose }) => {
  const {
    wallpaper,
    setCustomWallpaper,
    removeWallpaper,
    solidColor,
    setSolidColor,
    bubbleColor,
    setBubbleColor,
    resetBubbleColor,
    doodlesEnabled,
    setDoodlesEnabled,
    activeThemeId,
    applyTheme,
    resetAllThemeCustomizations,
    presets,
  } = useTheme();

  const { showToast } = useChat();

  // Navigation screen: 'main' (Image 1) | 'wallpaper' (Image 2) | 'solid' (Images 3 & 4) | 'bubble'
  const [view, setView] = useState('main');
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [customHex, setCustomHex] = useState(bubbleColor || '#005c4b');

  const handleReset = () => {
    resetAllThemeCustomizations();
    showToast('Theme reset to default', 'info', '↻');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          background: '#111b21',
          border: '1px solid #222e35',
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e9edef',
          userSelect: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* SCREEN 1: MAIN "Chat theme" VIEW (Image 1)                  */}
        {/* ============================================================ */}
        {view === 'main' && (
          <>
            {/* Top Navigation Bar */}
            <div
              style={{
                height: 56,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #222e35',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e9edef',
                    cursor: 'pointer',
                    fontSize: 20,
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Close"
                >
                  ←
                </button>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 600, color: '#e9edef' }}>
                  Chat theme
                </h3>
              </div>

              <button
                onClick={handleReset}
                title="Reset theme"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8696a0',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 6,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ↻
              </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
              {/* Section: Themes */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#e9edef' }}>
                    Themes
                  </h4>
                  <button
                    onClick={() => setShowAllThemes((prev) => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-secondary, #4ee3c5)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {showAllThemes ? 'Show less' : 'See all'}
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#8696a0', marginBottom: 14 }}>
                  The chat color and wallpaper will both change.
                </p>

                {/* Themes Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                  }}
                >
                  {(showAllThemes ? THEME_PRESETS : THEME_PRESETS.slice(0, 8)).map((preset) => {
                    const isSelected = activeThemeId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => applyTheme(preset)}
                        title={preset.name}
                        style={{
                          height: 72,
                          borderRadius: 14,
                          position: 'relative',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          backgroundColor: preset.solidColor || '#1f2c34',
                          backgroundImage: preset.wallpaper
                            ? `url("${preset.wallpaper}")`
                            : preset.doodlesEnabled
                            ? `url("${DOODLE_PATTERN_DATA_URL}")`
                            : 'none',
                          backgroundSize: preset.wallpaper ? 'cover' : '180px 180px',
                          backgroundPosition: 'center',
                          border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: isSelected ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          padding: '6px 8px',
                          transition: 'transform 0.12s ease',
                        }}
                      >
                        {/* Overlay with subtle dimming for readability */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.2)',
                            pointerEvents: 'none',
                          }}
                        />

                        {/* Left incoming bubble */}
                        <div
                          style={{
                            width: '46%',
                            height: 12,
                            borderRadius: '5px 5px 5px 2px',
                            background: '#202c33',
                            marginBottom: 6,
                            position: 'relative',
                            zIndex: 1,
                          }}
                        />

                        {/* Right outgoing colored bubble */}
                        <div
                          style={{
                            width: '54%',
                            height: 13,
                            borderRadius: '5px 5px 2px 5px',
                            background: preset.bubbleColor,
                            alignSelf: 'flex-end',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        />

                        {/* Selection Checkmark Badge */}
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              margin: 'auto',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#ffffff',
                              color: '#111b21',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              zIndex: 3,
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BaatCheet Doodles Toggle Row (matching user request & Image 1) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 4px',
                  cursor: 'pointer',
                }}
                onClick={() => setDoodlesEnabled(!doodlesEnabled)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ color: '#8696a0', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v3m6.366 1.634l-2.12 2.12M21 12h-3m-1.634 6.366l-2.12-2.12M12 21v-3m-6.366-1.634l2.12-2.12M3 12h3m1.634-6.366l2.12 2.12" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </span>
                  <span style={{ fontSize: '0.94rem', fontWeight: 500, color: '#e9edef' }}>
                    BaatCheet doodles
                  </span>
                </div>

                {/* Green Toggle Switch */}
                <div
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: doodlesEnabled ? '#00a884' : '#374248',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: doodlesEnabled ? 23 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                    }}
                  />
                </div>
              </div>

              {/* Divider Line */}
              <div style={{ height: 1, background: '#222e35', margin: '14px 0 16px' }} />

              {/* Section: Customize */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#e9edef', marginBottom: 12 }}>
                  Customize
                </h4>

                {/* 1. BaatCheet Bubble Row */}
                <div
                  onClick={() => setView('bubble')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 6px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ color: '#8696a0', display: 'flex', alignItems: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <line x1="8" y1="9" x2="16" y2="9" />
                        <line x1="8" y1="13" x2="13" y2="13" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '0.94rem', fontWeight: 500, color: '#e9edef' }}>
                      BaatCheet bubble
                    </span>
                  </div>

                  {/* Bubble color indicator preview circle */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: bubbleColor || '#005c4b',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                </div>

                {/* 2. Wallpaper Row */}
                <div
                  onClick={() => setView('wallpaper')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 6px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ color: '#8696a0', display: 'flex', alignItems: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '0.94rem', fontWeight: 500, color: '#e9edef' }}>
                      Wallpaper
                    </span>
                  </div>

                  {/* Thumbnail of current wallpaper */}
                  <div
                    style={{
                      width: 40,
                      height: 26,
                      borderRadius: 6,
                      backgroundColor: solidColor || '#111b21',
                      backgroundImage: wallpaper
                        ? `url("${wallpaper}")`
                        : doodlesEnabled
                        ? `url("${DOODLE_PATTERN_DATA_URL}")`
                        : 'none',
                      backgroundSize: wallpaper ? 'cover' : '80px 80px',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* SCREEN 2: "Wallpaper" VIEW (Image 2)                         */}
        {/* ============================================================ */}
        {view === 'wallpaper' && (
          <>
            {/* Top Navigation Bar */}
            <div
              style={{
                height: 56,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #222e35',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setView('main')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e9edef',
                    cursor: 'pointer',
                    fontSize: 20,
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  ←
                </button>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 600, color: '#e9edef' }}>
                  Wallpaper
                </h3>
              </div>

              <button
                onClick={handleReset}
                title="Reset"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8696a0',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 6,
                }}
              >
                ↻
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {/* Solid colour button */}
              <div
                onClick={() => setView('solid')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 4px 18px 4px',
                  cursor: 'pointer',
                  color: '#e9edef',
                }}
              >
                <span style={{ color: '#8696a0', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <circle cx="11" cy="11" r="2" />
                  </svg>
                </span>
                <span style={{ fontSize: '0.94rem', fontWeight: 600, color: '#e9edef', flex: 1 }}>
                  Solid colour
                </span>
                <span style={{ color: '#8696a0', fontSize: 16 }}>›</span>
              </div>

              {/* Wallpaper Photos Grid (Image 2) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 8,
                }}
              >
                {presets?.map((p) => {
                  const isSelected = wallpaper === p.url;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setCustomWallpaper(p.url);
                        showToast(`Wallpaper applied`, 'success', '🖼️');
                      }}
                      title={p.name}
                      style={{
                        aspectRatio: '1.4 / 1',
                        borderRadius: 10,
                        backgroundImage: `url("${p.thumbnail || p.url}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #ffffff' : '1px solid transparent',
                        position: 'relative',
                        transition: 'transform 0.12s ease',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            margin: 'auto',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#ffffff',
                            color: '#111b21',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* SCREEN 3: "Solid colour" VIEW (Images 3 & 4)                 */}
        {/* ============================================================ */}
        {view === 'solid' && (
          <>
            {/* Top Navigation Bar */}
            <div
              style={{
                height: 56,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #222e35',
                gap: 14,
              }}
            >
              <button
                onClick={() => setView('wallpaper')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e9edef',
                  cursor: 'pointer',
                  fontSize: 20,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ←
              </button>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 600, color: '#e9edef' }}>
                Solid colour
              </h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {/* BaatCheet doodles Toggle Row (Images 3 & 4) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 4px 18px 4px',
                  cursor: 'pointer',
                }}
                onClick={() => setDoodlesEnabled(!doodlesEnabled)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ color: '#8696a0', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v3m6.366 1.634l-2.12 2.12M21 12h-3m-1.634 6.366l-2.12-2.12M12 21v-3m-6.366-1.634l2.12-2.12M3 12h3m1.634-6.366l2.12 2.12" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </span>
                  <span style={{ fontSize: '0.94rem', fontWeight: 500, color: '#e9edef' }}>
                    BaatCheet doodles
                  </span>
                </div>

                {/* Green Toggle Switch */}
                <div
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: doodlesEnabled ? '#00a884' : '#374248',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: doodlesEnabled ? 23 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                    }}
                  />
                </div>
              </div>

              {/* Grid of 37 Solid Colors (Images 3 & 4) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 10,
                }}
              >
                {SOLID_COLORS.map((hex) => {
                  const isSelected = !wallpaper && solidColor?.toLowerCase() === hex.toLowerCase();
                  return (
                    <div
                      key={hex}
                      onClick={() => {
                        setSolidColor(hex);
                        showToast('Solid colour set', 'success', '🎨');
                      }}
                      style={{
                        aspectRatio: '1.4 / 1',
                        borderRadius: 12,
                        backgroundColor: hex,
                        backgroundImage: doodlesEnabled ? `url("${DOODLE_PATTERN_DATA_URL}")` : 'none',
                        backgroundSize: '160px 160px',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #ffffff' : '1px solid transparent',
                        position: 'relative',
                        boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                        transition: 'transform 0.12s ease',
                      }}
                    >
                      {/* Selection checkmark */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            margin: 'auto',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#ffffff',
                            color: '#111b21',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 800,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* SCREEN 4: "BaatCheet bubble" COLOR PICKER VIEW               */}
        {/* ============================================================ */}
        {view === 'bubble' && (
          <>
            {/* Top Navigation Bar */}
            <div
              style={{
                height: 56,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #222e35',
                gap: 14,
              }}
            >
              <button
                onClick={() => setView('main')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e9edef',
                  cursor: 'pointer',
                  fontSize: 20,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ←
              </button>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 600, color: '#e9edef' }}>
                BaatCheet bubble
              </h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
              {/* Live Preview Bubble */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: 14,
                  background: solidColor || '#111b21',
                  backgroundImage: doodlesEnabled ? `url("${DOODLE_PATTERN_DATA_URL}")` : 'none',
                  backgroundSize: '200px 200px',
                  marginBottom: 20,
                  border: '1px solid #222e35',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ alignSelf: 'flex-start', background: '#202c33', padding: '8px 14px', borderRadius: '14px 14px 14px 4px', fontSize: '0.86rem', color: '#e9edef' }}>
                  Hello! How does this look? 👋
                </div>
                <div
                  style={{
                    alignSelf: 'flex-end',
                    background: bubbleColor || '#005c4b',
                    padding: '8px 14px',
                    borderRadius: '14px 14px 4px 14px',
                    fontSize: '0.86rem',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span>This is my custom BaatCheet bubble! ✨</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>10:30 ✓✓</span>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#8696a0', marginBottom: 14 }}>
                Choose your favourite message bubble color:
              </p>

              {/* Bubble Colors Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {BUBBLE_COLORS.map((hex) => {
                  const isSelected = bubbleColor?.toLowerCase() === hex.toLowerCase();
                  return (
                    <div
                      key={hex}
                      onClick={() => {
                        setBubbleColor(hex);
                        setCustomHex(hex);
                        showToast('Bubble color updated', 'success', '💬');
                      }}
                      style={{
                        height: 44,
                        borderRadius: 12,
                        background: hex,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected ? '2.5px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                        transition: 'transform 0.12s ease',
                      }}
                    >
                      {isSelected && <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 14 }}>✓</span>}
                    </div>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  border: '1px solid #222e35',
                }}
              >
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    setBubbleColor(e.target.value);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e9edef' }}>
                    Custom Colour
                  </p>
                  <p style={{ fontSize: '0.76rem', color: '#8696a0', fontFamily: 'monospace' }}>
                    {bubbleColor || '#005c4b'}
                  </p>
                </div>
                <button
                  onClick={resetBubbleColor}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#e9edef',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Default
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatThemeModal;
