import { useState, useRef, useEffect, useCallback } from 'react';

const CameraCaptureModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [loadingCamera, setLoadingCamera] = useState(false);

  const startCamera = useCallback(async () => {
    setLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or device not found. Please allow camera permissions.');
    } finally {
      setLoadingCamera(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, capturedImage, startCamera]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror image
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedImage({ file, previewUrl });

        // Stop camera stream while previewing captured photo
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage?.file) {
      onCapture(capturedImage.file, capturedImage.previewUrl);
      setCapturedImage(null);
      onClose();
    }
  };

  const handleClose = () => {
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--bg-card, #17191e)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--border-color, #272a31)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle, #1e2127)',
            background: 'var(--bg-secondary, #131418)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📷</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {capturedImage ? 'Preview Photo' : 'Take Photo'}
            </h3>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            ✕
          </button>
        </div>

        {/* Viewport */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 380,
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {cameraError ? (
            <div
              style={{
                color: '#f87171',
                textAlign: 'center',
                padding: 30,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 36 }}>⚠️</span>
              <p style={{ fontSize: '0.92rem', maxWidth: 360 }}>{cameraError}</p>
              <button
                onClick={startCamera}
                style={{
                  marginTop: 10,
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: 'var(--accent-secondary, #4ee3c5)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage.previewUrl}
              alt="Captured"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
              />
              {loadingCamera && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <div className="spinner" style={{ width: 32, height: 32 }} />
                </div>
              )}
            </>
          )}

          {/* Switch camera button (if live) */}
          {!capturedImage && !cameraError && (
            <button
              onClick={toggleFacingMode}
              title="Flip camera"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              🔄
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-secondary, #131418)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
          }}
        >
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                style={{
                  padding: '10px 22px',
                  borderRadius: 12,
                  background: 'var(--bg-hover, #1b1d23)',
                  border: '1px solid var(--border-subtle, #1e2127)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🔄</span> Retake
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '10px 26px',
                  borderRadius: 12,
                  background: 'var(--accent-secondary, #4ee3c5)',
                  border: 'none',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(78, 227, 197, 0.3)',
                }}
              >
                <span>✓</span> Use Photo
              </button>
            </>
          ) : (
            <button
              onClick={handleCapture}
              disabled={!!cameraError || loadingCamera}
              title="Click to take photo"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ffffff',
                border: '4px solid var(--accent-secondary, #4ee3c5)',
                cursor: cameraError || loadingCamera ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                opacity: cameraError || loadingCamera ? 0.5 : 1,
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent-secondary, #4ee3c5)',
                }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
