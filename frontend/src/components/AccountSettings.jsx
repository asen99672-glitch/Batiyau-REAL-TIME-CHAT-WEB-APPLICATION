import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../services/api';

const AccountSettings = ({ onBack }) => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useChat();

  const [activeSubModal, setActiveSubModal] = useState(null); // 'twoStep' | 'changeNumber' | 'deleteAccount'
  const [securityNotifications, setSecurityNotifications] = useState(
    user?.accountSecurity?.securityNotifications ?? true
  );
  const [twoStepPin, setTwoStepPin] = useState(
    user?.accountSecurity?.twoStepVerification?.pin || ''
  );
  const [isTwoStepEnabled, setIsTwoStepEnabled] = useState(
    user?.accountSecurity?.twoStepVerification?.enabled || false
  );

  // Change Number state
  const [oldPhone, setOldPhone] = useState(user?.phoneNumber || '');
  const [newPhone, setNewPhone] = useState('');
  const [changingPhone, setChangingPhone] = useState(false);

  // Delete Account state
  const [deleteConfirmPhone, setDeleteConfirmPhone] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Request Data state
  const [requestingData, setRequestingData] = useState(false);

  // Toggle Security Notifications
  const handleToggleSecurityNotifications = async () => {
    const nextVal = !securityNotifications;
    setSecurityNotifications(nextVal);
    try {
      const { data } = await api.put('/users/security', {
        securityNotifications: nextVal,
      });
      if (updateUser) {
        updateUser({
          ...user,
          accountSecurity: data.accountSecurity,
        });
      }
      showToast('Security notification preference updated', 'success');
    } catch (err) {
      console.error(err);
      setSecurityNotifications(!nextVal);
      showToast('Failed to update preference', 'error');
    }
  };

  // Save Two Step PIN
  const handleSaveTwoStepPin = async (enabled, pin) => {
    try {
      const { data } = await api.put('/users/security', {
        twoStepVerification: { enabled, pin },
      });
      setIsTwoStepEnabled(enabled);
      setTwoStepPin(pin);
      if (updateUser) {
        updateUser({
          ...user,
          accountSecurity: data.accountSecurity,
        });
      }
      setActiveSubModal(null);
      showToast(enabled ? 'Two-step verification enabled ✓' : 'Two-step verification disabled', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update Two-step verification', 'error');
    }
  };

  // Change phone number
  const handleChangeNumberSubmit = async (e) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      showToast('Please enter your new phone number', 'error');
      return;
    }
    try {
      setChangingPhone(true);
      const { data } = await api.put('/users/profile', {
        phoneNumber: newPhone.trim(),
      });
      if (updateUser) {
        updateUser({ ...user, ...data });
      }
      setActiveSubModal(null);
      setNewPhone('');
      showToast('Phone number successfully updated ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to change phone number', 'error');
    } finally {
      setChangingPhone(false);
    }
  };

  // Request Account Data Report (WhatsApp Export)
  const handleRequestAccountData = async () => {
    try {
      setRequestingData(true);
      const { data } = await api.get('/users/account-data');
      // Download report as formatted JSON/HTML file
      const blob = new Blob([JSON.stringify(data.report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Batiyau_Account_Report_${user?.username || 'user'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Account report generated & downloaded ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate account report', 'error');
    } finally {
      setRequestingData(false);
    }
  };

  // Delete Account
  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (user?.phoneNumber && deleteConfirmPhone.trim() !== user.phoneNumber.trim()) {
      showToast('Phone number does not match', 'error');
      return;
    }
    if (!window.confirm('Are you ABSOLUTELY sure? This will permanently delete your chats, profile, and account.')) {
      return;
    }
    try {
      setDeleting(true);
      await api.delete('/users/account');
      showToast('Account deleted successfully', 'info');
      logout();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    borderBottom: '1px solid var(--border-subtle, #1e2127)',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '0.94rem',
    fontWeight: 500,
    color: 'var(--text-primary, #ffffff)',
  };

  const descStyle = {
    margin: '3px 0 0',
    fontSize: '0.78rem',
    color: 'var(--text-muted, #8b929d)',
    lineHeight: 1.4,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100%',
        background: 'var(--bg-primary, #111215)',
        color: 'var(--text-primary, #f3f4f6)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          background: 'var(--bg-card, #17191e)',
          borderBottom: '1px solid var(--border-subtle, #1e2127)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#4ee3c5',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Account</h2>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            background: 'var(--bg-card, #17191e)',
            borderRadius: 14,
            border: '1px solid var(--border-subtle, #1e2127)',
            overflow: 'hidden',
          }}
        >
          {/* 1. Security Notifications */}
          <div
            onClick={handleToggleSecurityNotifications}
            style={rowStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ flex: 1, paddingRight: 16 }}>
              <p style={titleStyle}>Security notifications</p>
              <p style={descStyle}>
                Show notifications on this device when a contact's security code changes.
              </p>
            </div>
            <div
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: securityNotifications ? '#00a884' : '#374151',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
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
                  left: securityNotifications ? 21 : 3,
                  transition: 'left 0.2s ease',
                }}
              />
            </div>
          </div>

          {/* 2. Two-step verification */}
          <div
            onClick={() => setActiveSubModal('twoStep')}
            style={rowStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p style={titleStyle}>Two-step verification</p>
              <p style={descStyle}>
                {isTwoStepEnabled ? 'Enabled (PIN active)' : 'For extra security, require a 6-digit PIN.'}
              </p>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
          </div>

          {/* 3. Change number */}
          <div
            onClick={() => setActiveSubModal('changeNumber')}
            style={rowStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p style={titleStyle}>Change number</p>
              <p style={descStyle}>Migrate your account, groups, and settings to a new number.</p>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
          </div>

          {/* 4. Request account info */}
          <div
            onClick={handleRequestAccountData}
            style={rowStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p style={titleStyle}>Request account info</p>
              <p style={descStyle}>Create and download a report of your account settings and profile.</p>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#00a884', fontWeight: 600 }}>
              {requestingData ? 'Generating...' : 'Download'}
            </span>
          </div>

          {/* 5. Delete my account */}
          <div
            onClick={() => setActiveSubModal('deleteAccount')}
            style={{ ...rowStyle, borderBottom: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p style={{ ...titleStyle, color: '#ef4444' }}>Delete my account</p>
              <p style={descStyle}>Permanently delete your account and erase all your messages.</p>
            </div>
            <span style={{ color: '#ef4444' }}>›</span>
          </div>
        </div>
      </div>

      {/* Two-step Verification Modal */}
      {activeSubModal === 'twoStep' && (
        <TwoStepModal
          isEnabled={isTwoStepEnabled}
          currentPin={twoStepPin}
          onSave={handleSaveTwoStepPin}
          onClose={() => setActiveSubModal(null)}
        />
      )}

      {/* Change Number Modal */}
      {activeSubModal === 'changeNumber' && (
        <ChangeNumberModal
          currentPhone={user?.phoneNumber || ''}
          newPhone={newPhone}
          setNewPhone={setNewPhone}
          onSubmit={handleChangeNumberSubmit}
          loading={changingPhone}
          onClose={() => setActiveSubModal(null)}
        />
      )}

      {/* Delete Account Modal */}
      {activeSubModal === 'deleteAccount' && (
        <DeleteAccountModal
          currentPhone={user?.phoneNumber || ''}
          confirmPhone={deleteConfirmPhone}
          setConfirmPhone={setDeleteConfirmPhone}
          onSubmit={handleDeleteAccountSubmit}
          loading={deleting}
          onClose={() => setActiveSubModal(null)}
        />
      )}
    </div>
  );
};

// Sub-Modal: Two Step Verification
const TwoStepModal = ({ isEnabled, currentPin, onSave, onClose }) => {
  const [pin, setPin] = useState(currentPin || '');
  const [confirmPin, setConfirmPin] = useState(currentPin || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    onSave(true, pin);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
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
          maxWidth: 400,
          background: 'var(--bg-secondary, #131418)',
          borderRadius: 18,
          border: '1px solid var(--border-color, #272a31)',
          padding: 24,
          boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
          Two-step verification
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          Enter a 6-digit PIN that you'll be asked for when registering your phone number with WhatsApp.
        </p>

        {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0 0 12px' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            maxLength={6}
            placeholder="6-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            style={{
              padding: '11px 14px',
              borderRadius: 10,
              background: 'var(--bg-primary, #111215)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              fontSize: '1.1rem',
              letterSpacing: '4px',
              textAlign: 'center',
              outline: 'none',
            }}
          />

          <input
            type="password"
            maxLength={6}
            placeholder="Confirm 6-digit PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            style={{
              padding: '11px 14px',
              borderRadius: 10,
              background: 'var(--bg-primary, #111215)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              fontSize: '1.1rem',
              letterSpacing: '4px',
              textAlign: 'center',
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            {isEnabled && (
              <button
                type="button"
                onClick={() => onSave(false, '')}
                style={{
                  padding: '10px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Disable
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                background: 'var(--bg-hover)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                background: '#00a884',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sub-Modal: Change Number
const ChangeNumberModal = ({ currentPhone, newPhone, setNewPhone, onSubmit, loading, onClose }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0,0,0,0.75)',
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
        maxWidth: 420,
        background: 'var(--bg-secondary, #131418)',
        borderRadius: 18,
        border: '1px solid var(--border-color, #272a31)',
        padding: 24,
        boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
        Change phone number
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
        Changing your phone number will migrate your account info, groups, and settings.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            CURRENT PHONE NUMBER
          </label>
          <input
            type="text"
            disabled
            value={currentPhone || 'No number set'}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: '#00a884', marginBottom: 6, fontWeight: 600 }}>
            NEW PHONE NUMBER
          </label>
          <input
            type="tel"
            placeholder="+91 9876543210"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--bg-primary, #111215)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              background: 'var(--bg-hover)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              background: '#00a884',
              border: 'none',
              color: '#ffffff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Updating...' : 'Change Number'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Sub-Modal: Delete Account
const DeleteAccountModal = ({ currentPhone, confirmPhone, setConfirmPhone, onSubmit, loading, onClose }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0,0,0,0.75)',
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
        maxWidth: 420,
        background: 'var(--bg-secondary, #131418)',
        borderRadius: 18,
        border: '1px solid rgba(239, 68, 68, 0.4)',
        padding: 24,
        boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ef4444' }}>
          Delete this account?
        </h3>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Deleting your account will:
        <br />• Erase your message history
        <br />• Delete you from all of your WhatsApp groups
        <br />• Delete your account info and profile picture
      </p>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {currentPhone && (
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              TO CONFIRM, ENTER YOUR PHONE NUMBER ({currentPhone})
            </label>
            <input
              type="tel"
              placeholder={currentPhone}
              value={confirmPhone}
              onChange={(e) => setConfirmPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg-primary, #111215)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              background: 'var(--bg-hover)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AccountSettings;
