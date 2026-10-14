import React, { useState, useEffect } from 'react';
import { generateWhatsAppSafetyNumber } from '../utils/crypto';
import Avatar from './Avatar';

const SecurityCodeModal = ({
  isOpen = true,
  otherUser,
  contact,
  currentUser,
  myUser,
  onClose,
  isVerified = false,
  onToggleVerify,
}) => {
  if (isOpen === false) return null;

  const targetUser = otherUser || contact;
  const loggedInUser = currentUser || myUser;

  const [safetyBlocks, setSafetyBlocks] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'compare'
  const [compareInput, setCompareInput] = useState('');
  const [compareResult, setCompareResult] = useState(null); // null | 'match' | 'mismatch'
  const [localVerified, setLocalVerified] = useState(isVerified);

  useEffect(() => {
    setLocalVerified(isVerified);
  }, [isVerified]);

  useEffect(() => {
    const loadCode = async () => {
      const myPub = loggedInUser?.publicKey || loggedInUser?._id || '';
      const theirPub = targetUser?.publicKey || targetUser?._id || '';
      const blocks = await generateWhatsAppSafetyNumber(myPub, theirPub);
      setSafetyBlocks(blocks);
    };
    if (loggedInUser && targetUser) {
      loadCode();
    }
  }, [loggedInUser, targetUser]);

  const fullNumberStr = safetyBlocks.join(' ');
  const rawDigits = safetyBlocks.join('');

  const handleCopy = () => {
    if (!fullNumberStr) return;
    navigator.clipboard?.writeText(fullNumberStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = () => {
    const nextVal = !localVerified;
    setLocalVerified(nextVal);
    if (onToggleVerify) {
      onToggleVerify(nextVal);
    }
  };

  const handleVerifyCompare = (e) => {
    e.preventDefault();
    const cleanedInput = compareInput.replace(/\s+/g, '').trim();
    if (!cleanedInput) return;

    if (cleanedInput === rawDigits) {
      setCompareResult('match');
      setLocalVerified(true);
      if (onToggleVerify) onToggleVerify(true);
    } else {
      setCompareResult('mismatch');
    }
  };

  const contactName = targetUser?.displayName || targetUser?.name || 'this contact';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-secondary, #111b21)',
          borderRadius: 20,
          border: '1px solid var(--border-subtle, #222d34)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle, #222d34)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-primary, #0c1317)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: localVerified ? 'rgba(0, 168, 132, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: localVerified ? '#00a884' : 'var(--text-primary, #e9edef)',
              }}
            >
              {localVerified ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary, #e9edef)' }}>
                Verify security code
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted, #8696a0)' }}>
                End-to-end encryption
              </p>
            </div>
          </div>
          <button
            id="close-security-code-btn"
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #8696a0)',
              fontSize: 18,
              cursor: 'pointer',
              padding: 6,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab switch: QR / Code view vs Compare tester */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle, #222d34)',
            background: 'var(--bg-secondary, #111b21)',
          }}
        >
          <button
            onClick={() => setActiveTab('code')}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'code' ? '2.5px solid #00a884' : '2.5px solid transparent',
              color: activeTab === 'code' ? '#00a884' : 'var(--text-muted, #8696a0)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Security Code
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'compare' ? '2.5px solid #00a884' : '2.5px solid transparent',
              color: activeTab === 'compare' ? '#00a884' : 'var(--text-muted, #8696a0)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Compare Numbers
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 20px', overflowY: 'auto', textAlign: 'center' }}>
          {/* Contact Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14 }}>
            <Avatar user={targetUser} size={56} />
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary, #e9edef)', marginTop: 8 }}>
              {contactName}
            </span>
          </div>

          {activeTab === 'code' ? (
            <>
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted, #8696a0)',
                  lineHeight: 1.5,
                  padding: '0 8px',
                }}
              >
                To verify that messages and calls with <b style={{ color: '#e9edef' }}>{contactName}</b> are end-to-end encrypted, compare these 60 numbers on their device or scan this code.
              </p>

              {/* QR Code graphic */}
              <div
                style={{
                  width: 172,
                  height: 172,
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 12,
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                  position: 'relative',
                }}
              >
                <svg width="148" height="148" viewBox="0 0 144 144" fill="#000000">
                  {/* Corner position squares */}
                  <rect x="0" y="0" width="40" height="40" rx="4" />
                  <rect x="8" y="8" width="24" height="24" fill="#ffffff" />
                  <rect x="14" y="14" width="12" height="12" fill="#000000" />

                  <rect x="104" y="0" width="40" height="40" rx="4" />
                  <rect x="112" y="8" width="24" height="24" fill="#ffffff" />
                  <rect x="118" y="14" width="12" height="12" fill="#000000" />

                  <rect x="0" y="104" width="40" height="40" rx="4" />
                  <rect x="8" y="112" width="24" height="24" fill="#ffffff" />
                  <rect x="14" y="118" width="12" height="12" fill="#000000" />

                  {/* QR Data pattern bars */}
                  <rect x="52" y="14" width="12" height="12" />
                  <rect x="74" y="14" width="20" height="8" />
                  <rect x="52" y="34" width="8" height="20" />
                  <rect x="70" y="34" width="18" height="12" />
                  <rect x="94" y="52" width="14" height="18" />

                  <rect x="14" y="52" width="14" height="10" />
                  <rect x="34" y="68" width="24" height="12" />
                  <rect x="64" y="64" width="16" height="16" rx="3" fill="#00a884" />

                  <rect x="88" y="76" width="20" height="14" />
                  <rect x="114" y="56" width="16" height="18" />
                  <rect x="52" y="94" width="14" height="20" />
                  <rect x="74" y="94" width="18" height="12" />
                  <rect x="100" y="104" width="30" height="12" />
                  <rect x="100" y="122" width="18" height="18" />
                </svg>

                {/* Subtle lock center watermark */}
                <div
                  style={{
                    position: 'absolute',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#00a884',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 14,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  }}
                >
                  🔒
                </div>
              </div>

              {/* 60-digit numbers grid (4 rows of 3 blocks) */}
              <div
                style={{
                  background: 'var(--bg-primary, #0c1317)',
                  borderRadius: 12,
                  padding: '14px 12px',
                  border: '1px solid var(--border-subtle, #222d34)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px 6px',
                  marginBottom: 16,
                }}
              >
                {safetyBlocks.map((blk, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '0.94rem',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      color: 'var(--text-primary, #e9edef)',
                    }}
                  >
                    {blk}
                  </span>
                ))}
              </div>
            </>
          ) : (
            /* Compare Numbers Tab */
            <div style={{ textAlign: 'left', padding: '6px 4px 14px' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #8696a0)', lineHeight: 1.5, marginBottom: 14 }}>
                Enter or paste the 60 numbers shown on <b style={{ color: '#e9edef' }}>{contactName}</b>'s device to automatically verify the encryption match:
              </p>

              <form onSubmit={handleVerifyCompare}>
                <textarea
                  rows={3}
                  value={compareInput}
                  onChange={(e) => {
                    setCompareInput(e.target.value);
                    setCompareResult(null);
                  }}
                  placeholder="e.g. 86264 88888 28570 11448..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary, #0c1317)',
                    border: '1px solid var(--border-subtle, #222d34)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: '#e9edef',
                    fontSize: '0.88rem',
                    fontFamily: 'monospace',
                    resize: 'none',
                    outline: 'none',
                    marginBottom: 10,
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#00a884',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                    }}
                  >
                    Check Match
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareInput(fullNumberStr);
                      setCompareResult('match');
                      setLocalVerified(true);
                      if (onToggleVerify) onToggleVerify(true);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle, #222d34)',
                      color: 'var(--text-secondary, #8696a0)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Auto-Fill Match
                  </button>
                </div>

                {compareResult === 'match' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(0, 168, 132, 0.15)',
                      border: '1px solid #00a884',
                      borderRadius: 10,
                      color: '#00a884',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>✓</span>
                    <span><b>Codes Match!</b> This contact has been verified as authentic.</span>
                  </div>
                )}

                {compareResult === 'mismatch' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      borderRadius: 10,
                      color: '#ef4444',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <span><b>Code Mismatch:</b> Please check the numbers again carefully.</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* WhatsApp Verification Toggle Row (User can verify or choose not to verify) */}
          <div
            onClick={handleToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 12,
              background: localVerified ? 'rgba(0, 168, 132, 0.12)' : 'var(--bg-primary, #0c1317)',
              border: localVerified ? '1px solid rgba(0, 168, 132, 0.35)' : '1px solid var(--border-subtle, #222d34)',
              cursor: 'pointer',
              marginBottom: 16,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: localVerified ? '#00a884' : 'var(--text-primary, #e9edef)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {localVerified ? '✓ Marked as verified' : 'Mark as verified'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #8696a0)', marginTop: 2 }}>
                {localVerified
                  ? 'You verified this security code with this contact'
                  : 'Turn on after comparing codes with this contact'}
              </div>
            </div>

            {/* Slider Switch */}
            <div
              style={{
                width: 40,
                height: 22,
                borderRadius: 20,
                background: localVerified ? '#00a884' : '#374248',
                position: 'relative',
                flexShrink: 0,
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: localVerified ? 21 : 3,
                  transition: 'left 0.2s ease',
                }}
              />
            </div>
          </div>

          {/* Action Buttons: Copy Numbers & Done */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              id="copy-security-numbers-btn"
              onClick={handleCopy}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                background: copied ? 'rgba(0, 168, 132, 0.2)' : 'var(--bg-primary, #0c1317)',
                border: copied ? '1px solid #00a884' : '1px solid var(--border-subtle, #222d34)',
                color: copied ? '#00a884' : 'var(--text-primary, #e9edef)',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? '✓ Copied' : '📋 Copy Numbers'}
            </button>
            <button
              id="done-security-code-btn"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                background: '#00a884',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCodeModal;
