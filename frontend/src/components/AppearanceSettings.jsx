import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const AppearanceSettings = ({ onBack }) => {
  const {
    themeMode,
    setThemeMode,
    effectiveTheme,
    wallpaper,
    setCustomWallpaper,
    removeWallpaper,
    wallpaperDim,
    setWallpaperDim,
    wallpaperBlur,
    setWallpaperBlur,
    presets,
  } = useTheme();

  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef(null);

  // File upload handler with canvas compression to ensure localStorage safety
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxW = 1600;
        const maxH = 1200;
        if (width > maxW || height > maxH) {
          if (width / height > maxW / maxH) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setCustomWallpaper(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      setCustomWallpaper(trimmed);
      setUrlInput('');
      setShowUrlField(false);
    }
  };

  const modeOptions = [
    {
      id: 'dark',
      name: 'Dark Mode (First Theme)',
      desc: 'Sleek dark theme matching Image 1',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    {
      id: 'light',
      name: 'Light Mode (Second Theme)',
      desc: 'Crisp green & white theme matching Image 2',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ),
    },
    {
      id: 'default',
      name: 'Default Mode',
      desc: 'Standard light theme (Second Theme)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '20px 18px',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Header with Back button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          id="appearance-back-btn"
          onClick={onBack}
          title="Back to Settings"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-secondary, #4ee3c5)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Appearance
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Theme mode & custom photo wallpaper
          </p>
        </div>
      </div>

      {/* SECTION 1: THEME MODE */}
      <div style={{ marginBottom: 26 }}>
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'var(--accent-secondary, #4ee3c5)',
            marginBottom: 10,
          }}
        >
          Theme Mode
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {modeOptions.map((opt) => {
            const isSelected = themeMode === opt.id;
            return (
              <div
                key={opt.id}
                id={`theme-mode-${opt.id}`}
                onClick={() => setThemeMode(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)',
                  border: isSelected ? '2px solid var(--accent-secondary, #4ee3c5)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: isSelected ? 'rgba(78, 227, 197, 0.15)' : 'rgba(128, 128, 128, 0.08)',
                    color: isSelected ? 'var(--accent-secondary, #4ee3c5)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {opt.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {opt.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {opt.desc}
                  </p>
                </div>

                {/* Radio circle indicator */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: isSelected ? '5px solid var(--accent-secondary, #4ee3c5)' : '2px solid var(--border-color)',
                    background: isSelected ? '#ffffff' : 'transparent',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PHOTO WALLPAPER THEME */}
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'var(--accent-secondary, #4ee3c5)',
            marginBottom: 10,
          }}
        >
          Photo Theme & Wallpaper
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Set your favorite photo or custom wallpaper as chat background (as shown in Image 2).
        </p>

        {/* Live Mini Preview Box */}
        <div
          style={{
            height: 150,
            borderRadius: 16,
            position: 'relative',
            overflow: 'hidden',
            border: '1.5px solid var(--border-color)',
            marginBottom: 14,
            backgroundImage: wallpaper ? `url("${wallpaper}")` : 'none',
            backgroundColor: 'var(--bg-primary)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '12px 16px',
            gap: 8,
          }}
        >
          {/* Dim Overlay in preview */}
          {wallpaper && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(0, 0, 0, ${wallpaperDim})`,
                backdropFilter: wallpaperBlur > 0 ? `blur(${wallpaperBlur}px)` : 'none',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Sample received bubble */}
          <div
            style={{
              position: 'relative',
              alignSelf: 'flex-start',
              padding: '6px 12px',
              borderRadius: '12px 12px 12px 2px',
              background: 'var(--message-received)',
              color: '#ffffff',
              fontSize: '0.78rem',
              maxWidth: '75%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            }}
          >
            hi! how is this photo wallpaper looking?
          </div>

          {/* Sample sent bubble */}
          <div
            style={{
              position: 'relative',
              alignSelf: 'flex-end',
              padding: '6px 12px',
              borderRadius: '12px 12px 2px 12px',
              background: 'var(--message-sent)',
              color: '#ffffff',
              fontSize: '0.78rem',
              maxWidth: '75%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            }}
          >
            looks stunning, just like Image 2! ✨
          </div>
        </div>

        {/* Photo Upload Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {/* Button: Upload Custom Photo */}
          <button
            id="upload-custom-photo-btn"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(10, 46, 43, 0.3)',
              transition: 'var(--transition)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Apni Photo Chunein (Upload Custom Photo)</span>
          </button>

          {/* Toggle URL input or reset button */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowUrlField((prev) => !prev)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔗 Photo URL Add Karein
            </button>

            {wallpaper && (
              <button
                id="remove-wallpaper-btn"
                onClick={removeWallpaper}
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✕ Photo Hatayein
              </button>
            )}
          </div>

          {/* URL Input Box */}
          {showUrlField && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                placeholder="Paste image link (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="input-field"
                style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem' }}
              />
              <button
                onClick={handleApplyUrl}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  background: 'var(--accent-secondary, #4ee3c5)',
                  border: 'none',
                  color: '#0d2825',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Preset Wallpapers (including Golden Palace like Image 2) */}
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Preset Themes (Golden Palace & Landscapes):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {presets.map((preset) => {
              const isSelected = wallpaper === preset.url;
              return (
                <div
                  key={preset.id}
                  onClick={() => setCustomWallpaper(preset.url)}
                  style={{
                    position: 'relative',
                    height: 72,
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isSelected ? '2.5px solid var(--accent-secondary, #4ee3c5)' : '1px solid var(--border-subtle)',
                    backgroundImage: `url("${preset.thumbnail}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: isSelected ? '0 0 12px rgba(78, 227, 197, 0.4)' : 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '6px 8px',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#ffffff', fontWeight: 600 }}>
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span style={{ marginLeft: 'auto', color: '#4ee3c5', fontSize: '0.8rem', fontWeight: 800 }}>
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sliders: Dimming & Blur when wallpaper is active */}
        {wallpaper && (
          <div
            style={{
              marginTop: 18,
              padding: '14px',
              borderRadius: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Dimming slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Darken Photo (Dim):
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {Math.round(wallpaperDim * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.75"
                step="0.05"
                value={wallpaperDim}
                onChange={(e) => setWallpaperDim(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-secondary, #4ee3c5)', cursor: 'pointer' }}
              />
            </div>

            {/* Blur slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Blur Effect:
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {wallpaperBlur}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={wallpaperBlur}
                onChange={(e) => setWallpaperBlur(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent-secondary, #4ee3c5)', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppearanceSettings;
