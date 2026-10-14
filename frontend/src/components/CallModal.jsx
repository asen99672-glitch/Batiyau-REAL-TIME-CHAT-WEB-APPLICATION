import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import { PhoneIcon } from './CallIcons';

const CallModal = () => {
  const {
    activeCall,
    endCall,
    answerCall,
    rejectCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
  } = useChat();

  const [seconds, setSeconds] = useState(0);
  const [ringingSeconds, setRingingSeconds] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Call duration counter
  useEffect(() => {
    let timer;
    if (activeCall?.status === 'connected') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  // Ringing timeout countdown (60s = 1 min limit)
  useEffect(() => {
    let rTimer;
    if (activeCall && activeCall.status !== 'connected' && activeCall.status !== 'ended') {
      setRingingSeconds(0);
      rTimer = setInterval(() => {
        setRingingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRingingSeconds(0);
    }
    return () => clearInterval(rTimer);
  }, [activeCall?.callId, activeCall?.status]);

  // Bind local camera stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Bind remote peer stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const { otherUser, type, status, isIncoming } = activeCall;
  const isVideo = type === 'video';
  const isConnected = status === 'connected';

  // Format seconds to mm:ss
  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 8, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        animation: 'fadeIn 0.25s ease',
      }}
    >
      {/* Hidden audio element for audio stream playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div
        style={{
          width: '100%',
          maxWidth: isVideo && isConnected ? 540 : 380,
          minHeight: isVideo && isConnected ? 460 : 360,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 28,
          boxShadow: '0 25px 50px -12px rgba(10, 46, 43, 0.4)',
          padding: isVideo && isConnected ? '20px' : '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Top Header Tag */}
        <div
          style={{
            padding: '5px 16px',
            borderRadius: 20,
            background: 'rgba(20, 66, 62, 0.12)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            marginBottom: isVideo && isConnected ? 12 : 24,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 10,
          }}
        >
          <span>
            {isVideo
              ? otherUser?.isGroup
                ? '📹 WebRTC Group Video Call'
                : '📹 WebRTC Video Call'
              : otherUser?.isGroup
              ? '📞 WebRTC Group Voice Call'
              : '📞 WebRTC Voice Call'}
          </span>
        </div>

        {/* 1. Video Call Connected View: Live Remote Video + Local Camera PiP */}
        {isVideo && isConnected ? (
          <div
            style={{
              width: '100%',
              flex: 1,
              minHeight: 320,
              background: '#090914',
              borderRadius: 20,
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
              marginBottom: 16,
            }}
          >
            {/* Remote Live Video */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Avatar user={otherUser} size={80} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {otherUser?.isGroup ? 'Waiting for group members to join video...' : 'Waiting for remote video...'}
                </p>
              </div>
            )}

            {/* Local Camera Picture-in-Picture (PiP) */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 110,
                height: 140,
                borderRadius: 14,
                overflow: 'hidden',
                background: '#16162a',
                border: '2px solid rgba(20, 66, 62, 0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                zIndex: 20,
              }}
            >
              {!isVideoOff && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // Mirror local preview
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1a1a2e',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Camera off
                </div>
              )}
            </div>

            {/* Name and Duration Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                padding: '4px 12px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.8rem',
                color: '#fff',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{otherUser?.connectedName ? `${otherUser.name} (${otherUser.connectedName})` : (otherUser?.displayName || otherUser?.name)}</span>
              <span style={{ color: 'var(--online-color)' }}>• {formatDuration(seconds)}</span>
            </div>
          </div>
        ) : (
          /* 2. Audio Call or Calling/Ringing State */
          <>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div
                className="call-pulse-ring"
                style={{
                  position: 'absolute',
                  inset: -14,
                  borderRadius: '50%',
                  border: '2px solid rgba(20, 66, 62, 0.45)',
                  animation: 'pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
                }}
              />
              <Avatar user={otherUser} size={96} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 4 }}>
              {otherUser?.displayName || otherUser?.name || (otherUser?.isGroup ? 'Group Call' : 'User')}
            </h2>

            <p
              style={{
                fontSize: '0.88rem',
                color: isConnected ? 'var(--online-color)' : 'var(--text-secondary)',
                fontWeight: 500,
                marginBottom: 28,
              }}
            >
              {isConnected
                ? `Connected ${otherUser?.isGroup && otherUser?.connectedName ? `with ${otherUser.connectedName}` : ''} • ${formatDuration(seconds)}`
                : isIncoming
                ? (otherUser?.isGroup
                    ? `Incoming group ${isVideo ? 'video' : 'voice'} call from ${otherUser?.callerName || 'member'} • Auto-declines in ${Math.max(0, 60 - ringingSeconds)}s`
                    : `Incoming WebRTC ${isVideo ? 'video' : 'voice'} call • Auto-declines in ${Math.max(0, 60 - ringingSeconds)}s`)
                : (otherUser?.isGroup
                    ? `Ringing group members via WebRTC • Auto-ends in ${Math.max(0, 60 - ringingSeconds)}s`
                    : `Calling via WebRTC • Auto-ends in ${Math.max(0, 60 - ringingSeconds)}s`)}
            </p>
          </>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
          {/* Mute toggle */}
          {isConnected && (
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: isMuted ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                color: isMuted ? '#fca5a5' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
              }}
            >
              {isMuted ? '🔇' : '🎙️'}
            </button>
          )}

          {/* Video camera toggle */}
          {isVideo && isConnected && (
            <button
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: isVideoOff ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: isVideoOff ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                color: isVideoOff ? '#fca5a5' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
              }}
            >
              {isVideoOff ? '🚫' : '📹'}
            </button>
          )}

          {/* Incoming: Answer or Reject */}
          {isIncoming && status === 'ringing' ? (
            <>
              <button
                id="reject-call-btn"
                onClick={rejectCall}
                title="Decline"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  transition: 'var(--transition)',
                }}
              >
                ✕
              </button>
              <button
                id="answer-call-btn"
                onClick={answerCall}
                title="Answer"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                  transition: 'var(--transition)',
                }}
              >
                <PhoneIcon size={24} color="#fff" />
              </button>
            </>
          ) : (
            /* End Call Button */
            <button
              id="end-call-btn"
              onClick={endCall}
              title="End Call"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#ef4444',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                transition: 'var(--transition)',
              }}
            >
              <PhoneIcon size={24} color="#fff" style={{ transform: 'rotate(135deg)' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
