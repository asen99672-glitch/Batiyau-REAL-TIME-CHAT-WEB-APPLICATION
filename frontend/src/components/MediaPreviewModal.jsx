import { useState, useRef, useEffect } from 'react';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getDocumentIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return { icon: '📄', color: '#ef4444', label: 'PDF' };
  if (['doc', 'docx'].includes(ext)) return { icon: '📝', color: '#3b82f6', label: 'DOC' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: '📊', color: '#10b981', label: 'SHEET' };
  if (['ppt', 'pptx'].includes(ext)) return { icon: '📽️', color: '#f97316', label: 'PRESENTATION' };
  if (['zip', 'rar', '7z'].includes(ext)) return { icon: '📦', color: '#8b5cf6', label: 'ARCHIVE' };
  if (['txt'].includes(ext)) return { icon: '📃', color: '#64748b', label: 'TXT' };
  return { icon: '📎', color: '#4ee3c5', label: ext?.toUpperCase() || 'FILE' };
};

const FILTER_PRESETS = [
  { id: 'none', name: 'Original', css: 'none' },
  { id: 'vivid', name: 'Vivid', css: 'contrast(1.25) saturate(1.3)' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.35) saturate(1.2) hue-rotate(-15deg)' },
  { id: 'cool', name: 'Cool', css: 'saturate(1.1) hue-rotate(25deg) brightness(1.05)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(100%) contrast(1.15)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.6) contrast(1.1) brightness(0.95)' },
];

const DRAW_COLORS = [
  '#ffffff',
  '#00a884',
  '#ef4444',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#000000',
];

const STICKER_LIST = ['🔥', '❤️', '😂', '👍', '🎉', '💯', '✨', '😍', '😎', '🙏'];

const MediaPreviewModal = ({ isOpen, mediaItem, onClose, onSend }) => {
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Image editing states
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [showFilters, setShowFilters] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#00a884');
  const [drawWidth, setDrawWidth] = useState(4);
  const [drawingHistory, setDrawingHistory] = useState([]); // array of stroke paths
  const [currentStroke, setCurrentStroke] = useState(null);
  const [textOverlays, setTextOverlays] = useState([]); // array of { id, text, color, x, y }
  const [showTextInput, setShowTextInput] = useState(false);
  const [newTextValue, setNewTextValue] = useState('');
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [stickers, setStickers] = useState([]); // array of { id, emoji, x, y }
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Reset edit state when a new media item opens
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setFlipH(false);
      setActiveFilter('none');
      setShowFilters(false);
      setIsDrawingMode(false);
      setDrawingHistory([]);
      setCurrentStroke(null);
      setTextOverlays([]);
      setShowTextInput(false);
      setNewTextValue('');
      setStickers([]);
      setShowStickerPicker(false);
      setCaption('');
    }
  }, [isOpen, mediaItem?.previewUrl]);

  // Redraw canvas whenever drawingHistory changes (called unconditionally at top level)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawingHistory.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [drawingHistory]);

  const file = mediaItem?.file;
  const previewUrl = mediaItem?.previewUrl;
  const mediaType = mediaItem?.mediaType;
  const filename = mediaItem?.filename || file?.name;
  const size = mediaItem?.size || file?.size;
  const docMeta = getDocumentIcon(filename);

  const isModified =
    rotation !== 0 ||
    flipH ||
    activeFilter !== 'none' ||
    drawingHistory.length > 0 ||
    textOverlays.length > 0 ||
    stickers.length > 0;

  // Rotate image 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Flip horizontal
  const handleFlip = () => {
    setFlipH((prev) => !prev);
  };

  // Undo last drawn stroke
  const handleUndoDraw = () => {
    setDrawingHistory((prev) => prev.slice(0, -1));
  };

  // Clear all drawings
  const handleClearDrawings = () => {
    setDrawingHistory([]);
  };

  // Drawing mouse handlers
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    if (!isDrawingMode) return;
    const pos = getCanvasPos(e);
    setCurrentStroke({
      color: drawColor,
      width: drawWidth,
      points: [pos],
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawingMode || !currentStroke) return;
    const pos = getCanvasPos(e);
    const updated = {
      ...currentStroke,
      points: [...currentStroke.points, pos],
    };
    setCurrentStroke(updated);

    // Live preview stroke
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = updated.color;
    ctx.lineWidth = updated.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pts = updated.points;
    if (pts.length >= 2) {
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingMode || !currentStroke) return;
    if (currentStroke.points.length > 1) {
      setDrawingHistory((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  // Add text overlay
  const handleAddText = () => {
    const trimmed = newTextValue.trim();
    if (!trimmed) return;
    setTextOverlays((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: trimmed,
        color: newTextColor,
        x: 50,
        y: 40 + prev.length * 15,
      },
    ]);
    setNewTextValue('');
    setShowTextInput(false);
  };

  // Add sticker emoji
  const handleAddSticker = (emoji) => {
    setStickers((prev) => [
      ...prev,
      {
        id: Date.now(),
        emoji,
        x: 40 + Math.random() * 20,
        y: 35 + Math.random() * 20,
      },
    ]);
    setShowStickerPicker(false);
  };

  // Reset all modifications
  const handleResetAll = () => {
    setRotation(0);
    setFlipH(false);
    setActiveFilter('none');
    setDrawingHistory([]);
    setTextOverlays([]);
    setStickers([]);
  };

  // Export modified image onto canvas and produce a File/Blob
  const generateModifiedImageFile = async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        const isRotated90or270 = rotation === 90 || rotation === 270;
        const w = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
        const h = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

        offCanvas.width = w;
        offCanvas.height = h;
        const ctx = offCanvas.getContext('2d');

        // Apply filters
        const selectedFilter = FILTER_PRESETS.find((f) => f.id === activeFilter);
        if (selectedFilter && selectedFilter.css !== 'none') {
          ctx.filter = selectedFilter.css;
        }

        // Apply rotation & flip transform
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        if (flipH) ctx.scale(-1, 1);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();
        ctx.filter = 'none';

        // Draw drawing strokes scaled to original image dimensions
        const previewCanvas = canvasRef.current;
        if (previewCanvas && drawingHistory.length > 0) {
          const scaleX = w / previewCanvas.width;
          const scaleY = h / previewCanvas.height;

          drawingHistory.forEach((stroke) => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width * Math.max(scaleX, scaleY);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
            for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
            }
            ctx.stroke();
          });
        }

        // Draw text overlays
        textOverlays.forEach((t) => {
          const fontSize = Math.round(w * 0.045);
          ctx.font = `bold ${fontSize}px sans-serif`;
          const posX = (t.x / 100) * w;
          const posY = (t.y / 100) * h;

          // Draw dark background badge
          const metrics = ctx.measureText(t.text);
          const bgPadding = fontSize * 0.3;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.beginPath();
          ctx.roundRect(
            posX - bgPadding,
            posY - fontSize + bgPadding,
            metrics.width + bgPadding * 2,
            fontSize + bgPadding * 0.8,
            8
          );
          ctx.fill();

          ctx.fillStyle = t.color;
          ctx.fillText(t.text, posX, posY);
        });

        // Draw stickers
        stickers.forEach((s) => {
          const stickerSize = Math.round(w * 0.08);
          ctx.font = `${stickerSize}px sans-serif`;
          ctx.fillText(s.emoji, (s.x / 100) * w, (s.y / 100) * h);
        });

        // Convert to Blob
        offCanvas.toBlob(
          (blob) => {
            if (blob) {
              const baseName = (filename || file?.name || 'photo').replace(/\.[^/.]+$/, '');
              const editedFile = new File([blob], `${baseName}_edited.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(editedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.92
        );
      };

      img.onerror = () => resolve(file);
      img.src = previewUrl;
    });
  };

  const handleSend = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      let fileToSend = file;

      // If user modified the image, render the modifications into a new file
      if (mediaType === 'image' && isModified) {
        fileToSend = await generateModifiedImageFile();
      }

      await onSend({
        file: fileToSend,
        previewUrl,
        mediaType,
        caption: caption.trim(),
        filename: fileToSend.name || filename || 'attachment',
        size: fileToSend.size || size || 0,
        mimetype: fileToSend.type || file?.type || 'application/octet-stream',
      });

      setCaption('');
      onClose();
    } catch (error) {
      console.error('Failed to send media:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Current CSS filter
  const currentFilterCss = FILTER_PRESETS.find((f) => f.id === activeFilter)?.css || 'none';

  if (!isOpen || !mediaItem) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          background: 'var(--bg-card, #17191e)',
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          border: '1px solid var(--border-color, #272a31)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* TOP TOOLBAR: WhatsApp Style Image Editing Tools */}
        <div
          style={{
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle, #1e2127)',
            background: 'var(--bg-secondary, #131418)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Left: Close button */}
          <button
            id="close-media-modal-btn"
            onClick={onClose}
            disabled={isSending}
            title="Cancel"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: isSending ? 'not-allowed' : 'pointer',
              padding: 6,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Center: Image Modification Tools (WhatsApp Style) */}
          {mediaType === 'image' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* 1. Crop / Rotate 90° */}
              <button
                id="edit-rotate-btn"
                onClick={handleRotate}
                title="Rotate 90°"
                style={{
                  background: rotation !== 0 ? 'rgba(0, 168, 132, 0.2)' : 'none',
                  border: 'none',
                  color: rotation !== 0 ? '#4ee3c5' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </button>

              {/* 2. Flip Horizontal */}
              <button
                id="edit-flip-btn"
                onClick={handleFlip}
                title="Flip Horizontal"
                style={{
                  background: flipH ? 'rgba(0, 168, 132, 0.2)' : 'none',
                  border: 'none',
                  color: flipH ? '#4ee3c5' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 8 21 12 17 16" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <polyline points="7 16 3 12 7 8" />
                </svg>
              </button>

              {/* 3. Filters */}
              <button
                id="edit-filter-btn"
                onClick={() => {
                  setShowFilters((prev) => !prev);
                  setIsDrawingMode(false);
                  setShowTextInput(false);
                  setShowStickerPicker(false);
                }}
                title="Filters"
                style={{
                  background: activeFilter !== 'none' || showFilters ? 'rgba(0, 168, 132, 0.2)' : 'none',
                  border: 'none',
                  color: activeFilter !== 'none' || showFilters ? '#4ee3c5' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 0 20z" />
                </svg>
              </button>

              {/* 4. Draw / Pen */}
              <button
                id="edit-pen-btn"
                onClick={() => {
                  setIsDrawingMode((prev) => !prev);
                  setShowFilters(false);
                  setShowTextInput(false);
                  setShowStickerPicker(false);
                }}
                title="Draw on photo"
                style={{
                  background: isDrawingMode ? 'rgba(0, 168, 132, 0.25)' : 'none',
                  border: 'none',
                  color: isDrawingMode ? '#4ee3c5' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </button>

              {/* 5. Text (T) */}
              <button
                id="edit-text-btn"
                onClick={() => {
                  setShowTextInput((prev) => !prev);
                  setIsDrawingMode(false);
                  setShowFilters(false);
                  setShowStickerPicker(false);
                }}
                title="Add text"
                style={{
                  background: showTextInput || textOverlays.length > 0 ? 'rgba(0, 168, 132, 0.2)' : 'none',
                  border: 'none',
                  color: showTextInput || textOverlays.length > 0 ? '#4ee3c5' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  transition: 'all 0.15s ease',
                }}
              >
                T
              </button>

              {/* 6. Stickers / Emoji */}
              <button
                id="edit-sticker-btn"
                onClick={() => {
                  setShowStickerPicker((prev) => !prev);
                  setIsDrawingMode(false);
                  setShowFilters(false);
                  setShowTextInput(false);
                }}
                title="Add sticker"
                style={{
                  background: showStickerPicker || stickers.length > 0 ? 'rgba(0, 168, 132, 0.2)' : 'none',
                  border: 'none',
                  color: showStickerPicker || stickers.length > 0 ? '#4ee3c5' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  width: 36,
                  height: 36,
                  transition: 'all 0.15s ease',
                }}
              >
                😊
              </button>

              {/* 7. Reset all modifications */}
              {isModified && (
                <button
                  id="edit-reset-btn"
                  onClick={handleResetAll}
                  title="Reset to original"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    marginLeft: 4,
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* Right: Media Type Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--accent-secondary, #4ee3c5)' }}>
              {mediaType.toUpperCase()}
            </span>
          </div>
        </div>

        {/* SUB-TOOLBAR: Drawing Pen Tools */}
        {isDrawingMode && (
          <div
            style={{
              padding: '8px 16px',
              background: '#0d1015',
              borderBottom: '1px solid var(--border-subtle, #1e2127)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {/* Color Swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {DRAW_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setDrawColor(c)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: c,
                    border: drawColor === c ? '2.5px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: drawColor === c ? '0 0 6px rgba(255,255,255,0.6)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Brush Width & Undo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {[2, 5, 10].map((w) => (
                <button
                  key={w}
                  onClick={() => setDrawWidth(w)}
                  style={{
                    background: drawWidth === w ? 'rgba(255,255,255,0.2)' : 'none',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.74rem',
                    fontWeight: drawWidth === w ? 700 : 400,
                  }}
                >
                  {w === 2 ? 'Thin' : w === 5 ? 'Medium' : 'Thick'}
                </button>
              ))}

              {drawingHistory.length > 0 && (
                <button
                  onClick={handleUndoDraw}
                  title="Undo stroke"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '2px 6px',
                  }}
                >
                  ↺
                </button>
              )}

              {drawingHistory.length > 0 && (
                <button
                  onClick={handleClearDrawings}
                  title="Clear drawing"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* SUB-TOOLBAR: Filters Bar */}
        {showFilters && (
          <div
            style={{
              padding: '8px 16px',
              background: '#0d1015',
              borderBottom: '1px solid var(--border-subtle, #1e2127)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              overflowX: 'auto',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {FILTER_PRESETS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 16,
                  border: activeFilter === f.id ? '1.5px solid #4ee3c5' : '1px solid rgba(255,255,255,0.15)',
                  background: activeFilter === f.id ? 'rgba(78, 227, 197, 0.2)' : 'rgba(255,255,255,0.06)',
                  color: activeFilter === f.id ? '#4ee3c5' : '#e2e8f0',
                  fontSize: '0.8rem',
                  fontWeight: activeFilter === f.id ? 700 : 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* SUB-TOOLBAR: Text on Photo Input */}
        {showTextInput && (
          <div
            style={{
              padding: '10px 16px',
              background: '#0d1015',
              borderBottom: '1px solid var(--border-subtle, #1e2127)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <input
              type="text"
              placeholder="Enter text to add to photo..."
              value={newTextValue}
              onChange={(e) => setNewTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddText();
              }}
              autoFocus
              style={{
                flex: 1,
                padding: '7px 14px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />

            {/* Color for text */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ffffff', '#00a884', '#ef4444', '#f59e0b', '#3b82f6'].map((c) => (
                <button
                  key={c}
                  onClick={() => setNewTextColor(c)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: c,
                    border: newTextColor === c ? '2px solid #ffffff' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleAddText}
              style={{
                padding: '6px 14px',
                borderRadius: 14,
                background: '#00a884',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>
        )}

        {/* SUB-TOOLBAR: Stickers / Emojis */}
        {showStickerPicker && (
          <div
            style={{
              padding: '8px 16px',
              background: '#0d1015',
              borderBottom: '1px solid var(--border-subtle, #1e2127)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              overflowX: 'auto',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tap to add:</span>
            {STICKER_LIST.map((em) => (
              <button
                key={em}
                onClick={() => handleAddSticker(em)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* MAIN PREVIEW AREA */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: 280,
            maxHeight: 440,
            background: '#0a0a0c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            padding: 16,
            userSelect: 'none',
          }}
        >
          {/* IMAGE PREVIEW & CANVAS LAYER */}
          {mediaType === 'image' && (
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '100%',
                maxHeight: 400,
              }}
            >
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Preview"
                onLoad={(e) => {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    canvas.width = e.currentTarget.naturalWidth || e.currentTarget.clientWidth;
                    canvas.height = e.currentTarget.naturalHeight || e.currentTarget.clientHeight;
                  }
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: 380,
                  objectFit: 'contain',
                  borderRadius: 10,
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                  filter: currentFilterCss,
                  transition: 'transform 0.2s ease, filter 0.2s ease',
                  display: 'block',
                }}
              />

              {/* Interactive Drawing Canvas Layer Overlay */}
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  cursor: isDrawingMode ? 'crosshair' : 'default',
                  pointerEvents: isDrawingMode ? 'auto' : 'none',
                  zIndex: 10,
                }}
              />

              {/* Text Overlays rendered on photo */}
              {textOverlays.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    top: `${item.y}%`,
                    left: `${item.x}%`,
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.65)',
                    color: item.color,
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    zIndex: 15,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'move',
                  }}
                >
                  <span>{item.text}</span>
                  <button
                    onClick={() => setTextOverlays((prev) => prev.filter((t) => t.id !== item.id))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: 0,
                      lineHeight: 1,
                    }}
                    title="Remove text"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Stickers / Emojis rendered on photo */}
              {stickers.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    top: `${item.y}%`,
                    left: `${item.x}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: 34,
                    zIndex: 15,
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{item.emoji}</span>
                  <button
                    onClick={() => setStickers((prev) => prev.filter((s) => s.id !== item.id))}
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 10,
                      borderRadius: '50%',
                      width: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    title="Remove sticker"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {mediaType === 'video' && (
            <video
              src={previewUrl}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: 380,
                borderRadius: 12,
                outline: 'none',
              }}
            />
          )}

          {/* AUDIO PREVIEW */}
          {mediaType === 'audio' && (
            <div
              style={{
                width: '100%',
                maxWidth: 440,
                background: 'var(--bg-secondary, #131418)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                border: '1px solid var(--border-color, #272a31)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(249, 115, 22, 0.15)',
                  border: '1.5px solid #f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                }}
              >
                🎧
              </div>
              <div style={{ textAlign: 'center', maxWidth: '100%' }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    wordBreak: 'break-all',
                  }}
                >
                  {filename || file?.name}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {formatFileSize(size || file?.size)}
                </p>
              </div>
              <audio src={previewUrl} controls style={{ width: '100%', marginTop: 6 }} />
            </div>
          )}

          {/* DOCUMENT / PDF PREVIEW */}
          {mediaType === 'document' && (
            <div
              style={{
                width: '100%',
                maxWidth: 440,
                background: 'var(--bg-secondary, #131418)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                border: '1px solid var(--border-color, #272a31)',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 12,
                  background: `${docMeta.color}22`,
                  border: `1.5px solid ${docMeta.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  flexShrink: 0,
                }}
              >
                {docMeta.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={filename || file?.name}
                >
                  {filename || file?.name}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: docMeta.color,
                      background: `${docMeta.color}18`,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {docMeta.label}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {formatFileSize(size || file?.size)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CAPTION & SEND BAR (WhatsApp Style) */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--bg-secondary, #131418)',
            borderTop: '1px solid var(--border-subtle, #1e2127)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              id="media-caption-input"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a caption..."
              disabled={isSending}
              style={{
                width: '100%',
                background: 'var(--bg-card, #17191e)',
                border: '1.5px solid var(--border-color, #272a31)',
                color: 'var(--text-primary)',
                padding: '11px 18px',
                borderRadius: 24,
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'var(--transition)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-secondary, #4ee3c5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(78, 227, 197, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color, #272a31)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            id="send-media-btn"
            onClick={handleSend}
            disabled={isSending}
            title="Send"
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: '#00a884',
              border: 'none',
              color: '#ffffff',
              cursor: isSending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0, 168, 132, 0.4)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isSending ? (
              <div
                className="spinner"
                style={{ width: 20, height: 20, borderWidth: 2.5, borderColor: '#fff #fff transparent transparent' }}
              />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewModal;
