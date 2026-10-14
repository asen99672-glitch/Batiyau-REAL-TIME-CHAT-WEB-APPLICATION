import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export const AppLockScreen = ({ isLocked, onUnlock }) => {
  const { user, logout } = useAuth();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isLocked) {
      setPin(['', '', '', '']);
      setError('');
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 100);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const storedPin = user?._id ? localStorage.getItem(`chatapp_pin_${user._id}`) : null;

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when 4 digits are entered
    if (digit && index === 3) {
      const fullPin = [...newPin.slice(0, 3), digit].join('');
      verifyPin(fullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = (enteredPin) => {
    if (enteredPin === storedPin) {
      onUnlock();
    } else {
      setError('Incorrect PIN. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResetLock = () => {
    if (window.confirm('Resetting App Lock will log you out. Continue?')) {
      if (user?._id) {
        localStorage.removeItem(`chatapp_pin_${user._id}`);
        localStorage.removeItem(`chatapp_lock_enabled_${user._id}`);
      }
      logout();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0c1618',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          animation: isShaking ? 'shake 0.4s ease' : 'none',
        }}
      >
        {/* Lock Icon */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #164642 0%, #0d2825 100%)',
            border: '2px solid rgba(78, 227, 197, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            boxShadow: '0 10px 30px rgba(78, 227, 197, 0.15)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ee3c5" strokeWidth="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          ChatApp is Locked
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#9fc2cf', marginBottom: 28 }}>
          Enter your 4-digit PIN to access your conversations
        </p>

        {/* 4 Digit PIN inputs */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 20 }}>
          {[0, 1, 2, 3].map((idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[idx]}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: 52,
                height: 56,
                borderRadius: 14,
                border: error
                  ? '2px solid #ef4444'
                  : pin[idx]
                  ? '2px solid #4ee3c5'
                  : '1.5px solid rgba(255, 255, 255, 0.15)',
                background: pin[idx] ? 'rgba(78, 227, 197, 0.08)' : '#162228',
                color: '#ffffff',
                fontSize: '1.6rem',
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.84rem', marginBottom: 16 }}>
            {error}
          </p>
        )}

        {/* Unlock Button */}
        <button
          onClick={() => verifyPin(pin.join(''))}
          disabled={pin.join('').length < 4}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: 'none',
            background: pin.join('').length === 4 ? '#164642' : '#1f2e33',
            color: pin.join('').length === 4 ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: pin.join('').length === 4 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            marginBottom: 16,
          }}
        >
          Unlock
        </button>

        {/* Forgot PIN / Logout */}
        <button
          onClick={handleResetLock}
          style={{
            background: 'none',
            border: 'none',
            color: '#8da4ad',
            fontSize: '0.82rem',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Forgot PIN? Reset & Log out
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};

export const AppLockSetupModal = ({ onClose, onLockNow }) => {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    if (user?._id) {
      const existing = localStorage.getItem(`chatapp_pin_${user._id}`);
      setHasExisting(!!existing);
    }
  }, [user]);

  const handleSavePin = (e) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('Please enter a 4-digit numeric PIN');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (user?._id) {
      localStorage.setItem(`chatapp_pin_${user._id}`, pin);
      localStorage.setItem(`chatapp_lock_enabled_${user._id}`, 'true');
    }
    onLockNow();
    onClose();
  };

  const handleRemovePin = () => {
    if (user?._id) {
      localStorage.removeItem(`chatapp_pin_${user._id}`);
      localStorage.removeItem(`chatapp_lock_enabled_${user._id}`);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {hasExisting ? 'App Lock Settings' : 'Set Up App Lock'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSavePin} style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.4 }}>
            Protect your messages by locking ChatApp with a 4-digit PIN.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {hasExisting ? 'New 4-digit PIN' : 'Enter 4-digit PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-hover)',
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                letterSpacing: 4,
                textAlign: 'center',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-hover)',
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                letterSpacing: 4,
                textAlign: 'center',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 12 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
            <button
              type="submit"
              disabled={pin.length !== 4 || confirmPin.length !== 4}
              style={{
                padding: '11px',
                borderRadius: 10,
                border: 'none',
                background: '#164642',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: pin.length === 4 && confirmPin.length === 4 ? 'pointer' : 'not-allowed',
                opacity: pin.length === 4 && confirmPin.length === 4 ? 1 : 0.6,
              }}
            >
              {hasExisting ? 'Update PIN & Lock' : 'Set PIN & Lock Now'}
            </button>

            {hasExisting && (
              <button
                type="button"
                onClick={handleRemovePin}
                style={{
                  padding: '9px',
                  borderRadius: 10,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#f87171',
                  fontWeight: 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Disable App Lock
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
