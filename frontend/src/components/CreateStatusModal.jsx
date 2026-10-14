import { useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { PencilIcon, CameraIcon } from './CallIcons';

const BACKGROUND_COLORS = [
  '#128c7e',
  '#075e54',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#d97706',
  '#2563eb',
  '#059669',
  '#1e293b',
];

const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive'];

const CreateStatusModal = ({ initialType = 'text', onClose }) => {
  const { createStatus, showToast } = useChat();
  const [tab, setTab] = useState(initialType); // 'text' | 'media'

  // Text Status States
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_COLORS[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);

  // Media Status States
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('File size must be under 50MB', 'error');
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handlePublishTextStatus = async () => {
    if (!textContent.trim()) {
      showToast('Please enter some text for your status', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createStatus({
        type: 'text',
        content: textContent.trim(),
        backgroundColor: selectedBg,
        fontFamily: selectedFont,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishMediaStatus = async () => {
    if (!mediaFile) {
      showToast('Please select a photo or video', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('caption', mediaCaption.trim());
      await createStatus(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
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
          maxWidth: 480,
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header with Tabs */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setTab('text')}
              style={{
                background: tab === 'text' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: tab === 'text' ? '#ffffff' : 'var(--text-secondary)',
                border: tab === 'text' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'var(--transition)',
              }}
            >
              <PencilIcon size={15} color={tab === 'text' ? '#ffffff' : 'var(--text-secondary)'} />
              <span>Text Status</span>
            </button>
            <button
              onClick={() => setTab('media')}
              style={{
                background: tab === 'media' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: tab === 'media' ? '#ffffff' : 'var(--text-secondary)',
                border: tab === 'media' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'var(--transition)',
              }}
            >
              <CameraIcon size={16} color={tab === 'media' ? '#ffffff' : 'var(--text-secondary)'} />
              <span>Photo / Video</span>
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab 1: Text Status Form */}
        {tab === 'text' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
            {/* Live Canvas Preview */}
            <div
              style={{
                height: 240,
                borderRadius: 14,
                background: selectedBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                marginBottom: 16,
              }}
            >
              <textarea
                placeholder="Type a status..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                maxLength={300}
                autoFocus
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '1.35rem',
                  fontWeight: 600,
                  fontFamily: selectedFont,
                  textAlign: 'center',
                  resize: 'none',
                  lineHeight: 1.4,
                }}
                rows={4}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 12,
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.72rem',
                }}
              >
                {textContent.length}/300
              </span>
            </div>

            {/* Background Color Palette */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Choose Background Color:
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {BACKGROUND_COLORS.map((color) => (
                  <div
                    key={color}
                    onClick={() => setSelectedBg(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: color,
                      cursor: 'pointer',
                      border: selectedBg === color ? '3px solid #ffffff' : '2px solid transparent',
                      boxShadow: selectedBg === color ? '0 0 8px rgba(255, 255, 255, 0.4)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Font Family Selector */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Font Style:
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {FONTS.map((font) => (
                  <button
                    key={font}
                    onClick={() => setSelectedFont(font)}
                    style={{
                      flex: 1,
                      background: selectedFont === font ? '#184b47' : 'var(--bg-tertiary)',
                      border: selectedFont === font ? '1.5px solid #4ee3c5' : '1px solid var(--border-subtle)',
                      color: selectedFont === font ? '#4ee3c5' : 'var(--text-primary)',
                      borderRadius: 8,
                      padding: '6px 0',
                      fontSize: '0.85rem',
                      fontFamily: font,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublishTextStatus}
              disabled={!textContent.trim() || isSubmitting}
              style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 0',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: !textContent.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: !textContent.trim() || isSubmitting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isSubmitting ? 'Posting...' : 'Share Status ✓'}
            </button>
          </div>
        )}

        {/* Tab 2: Media Status Form */}
        {tab === 'media' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Media Box / Upload Zone */}
            {mediaPreview ? (
              <div
                style={{
                  position: 'relative',
                  height: 240,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#000',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {mediaFile?.type?.startsWith('video') ? (
                  <video
                    src={mediaPreview}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
                <button
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview('');
                  }}
                  title="Remove"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: 200,
                  borderRadius: 14,
                  border: '2px dashed var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: '#184b47',
                    color: '#4ee3c5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  📁
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Click to select Photo or Video
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supports JPG, PNG, MP4 (up to 50MB)
                  </p>
                </div>
              </div>
            )}

            {/* Optional Caption */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Add a caption..."
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                maxLength={120}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublishMediaStatus}
              disabled={!mediaFile || isSubmitting}
              style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 0',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: !mediaFile || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: !mediaFile || isSubmitting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isSubmitting ? 'Uploading & Posting...' : 'Share Status ✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStatusModal;
