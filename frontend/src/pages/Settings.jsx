import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import AppearanceSettings from '../components/AppearanceSettings';
import PrivacySettings from '../components/PrivacySettings';
import api from '../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [settingsView, setSettingsView] = useState('main'); // 'main' | 'profile'
  const [searchQuery, setSearchQuery] = useState('');
  const [editField, setEditField] = useState(null); // 'name' | 'bio' | 'phoneNumber' | 'profilePicture' | null
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopyPhone = (e) => {
    e?.stopPropagation();
    const phone = user?.phoneNumber || '';
    if (!phone) {
      showToast('No phone number set to copy');
      return;
    }
    navigator.clipboard?.writeText(phone);
    setPhoneCopied(true);
    showToast('Mobile number copied to clipboard! ✓');
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  const handleStartEdit = (field, val) => {
    setEditField(field);
    setEditValue(val || '');
  };

  const handleSaveField = async (field) => {
    if (!editValue.trim() && field === 'name') return;
    try {
      setSaving(true);
      const updatePayload = { [field]: editValue.trim() };
      const { data } = await api.put('/users/profile', updatePayload);
      updateUser({ ...user, ...data });
      setEditField(null);
      showToast(`${field === 'bio' ? 'About' : field === 'phoneNumber' ? 'Phone number' : 'Profile'} updated!`);
    } catch (err) {
      console.error('Failed to update field:', err);
      showToast(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const settingFeatures = [
    {
      id: 'account',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.8 14.5A9.5 9.5 0 1 0 5.5 6.8" />
          <circle cx="12" cy="9.5" r="3.2" />
          <rect x="7" y="14.5" width="10" height="4.5" rx="2.25" />
        </svg>
      ),
      label: 'Account',
      desc: 'Security notifications, change number, email',
      action: () => {
        setSettingsView('profile');
        setEditField(null);
      },
    },
    {
      id: 'privacy',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.5l7 3v6c0 5-3.5 9.5-7 10.8-3.5-1.3-7-5.8-7-10.8V5.5l7-3z" />
          <path d="M9.5 11.5V9.5a2.5 2.5 0 0 1 5 0v2" />
          <rect x="8" y="11.5" width="8" height="5.5" rx="1.5" />
          <circle cx="12" cy="14.2" r="0.75" fill="currentColor" />
        </svg>
      ),
      label: 'Privacy',
      desc: 'Last seen, profile photo, disappearing messages',
      action: () => setSettingsView('privacy'),
    },
    {
      id: 'notifications',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M10.3 21a2 2 0 0 0 3.4 0" />
        </svg>
      ),
      label: 'Notifications',
      desc: 'Message tones, group alerts, call sounds',
      action: () => showToast('Desktop notifications enabled.'),
    },
    {
      id: 'chats',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="7.5" y1="8.5" x2="16.5" y2="8.5" />
          <line x1="7.5" y1="12.5" x2="13.5" y2="12.5" />
        </svg>
      ),
      label: 'Chats',
      desc: 'Theme, wallpapers, chat history, archive',
      action: () => navigate('/chat'),
    },
    {
      id: 'appearance',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12c0 4.14 3.36 7.5 7.5 7.5 1 0 1.8-.8 1.8-1.8 0-.46-.17-.89-.44-1.23-.27-.35-.44-.8-.44-1.27 0-1.1.9-2 2-2h1.88c3.31 0 6-2.69 6-6 0-4.7-4.19-8.7-8.8-8.7z" />
          <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor" />
          <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
          <circle cx="16.5" cy="8.5" r="1.2" fill="currentColor" />
          <circle cx="8" cy="13" r="1.2" fill="currentColor" />
        </svg>
      ),
      label: 'Appearance',
      desc: 'Theme, wallpapers, dark mode',
      action: () => setSettingsView('appearance'),
    },
    {
      id: 'storage',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      ),
      label: 'Storage and Data',
      desc: 'Network usage, auto-download preferences',
      action: () => showToast('Storage usage optimized.'),
    },
    {
      id: 'help',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="16.5" x2="12.01" y2="16.5" strokeWidth="2.5" />
        </svg>
      ),
      label: 'Help & Contact',
      desc: 'Help centre, contact us, privacy policy',
      action: () => showToast('ChatApp Help Center v1.0.0'),
    },
    {
      id: 'admin',
      adminOnly: true,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
      label: 'Admin Control Center',
      desc: 'Users, moderation, E2EE metadata & system settings',
      action: () => navigate('/admin'),
    },
  ];

  const filteredFeatures = settingFeatures.filter(
    (item) =>
      (!item.adminOnly || user?.role === 'superadmin') &&
      (item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '30px 16px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        {/* Navigation back */}
        <button
          id="settings-back-btn"
          onClick={() => {
            if (settingsView === 'profile' || settingsView === 'appearance' || settingsView === 'privacy') {
              setSettingsView('main');
              setEditField(null);
            } else {
              navigate('/chat');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            color: '#4ee3c5',
            cursor: 'pointer',
            marginBottom: 20,
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {settingsView !== 'main' ? '← Back to Settings' : '← Back to Chat'}
        </button>

        {toastMsg && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: 'rgba(22, 70, 66, 0.95)',
              border: '1px solid #4ee3c5',
              color: '#ffffff',
              fontSize: '0.85rem',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <span>{toastMsg}</span>
            <button
              onClick={() => setToastMsg('')}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </div>
        )}

        {settingsView === 'profile' ? (
          /* ================= SUB-PAGE: EDIT PROFILE ================= */
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 24px',
              boxShadow: '0 8px 30px rgba(10, 46, 43, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button
                id="profile-back-to-settings-btn"
                onClick={() => {
                  setSettingsView('main');
                  setEditField(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4ee3c5',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                  display: 'flex',
                }}
              >
                ←
              </button>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Profile
              </h1>
            </div>

            {/* Profile Photo Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <div
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  padding: 4,
                  background: 'linear-gradient(135deg, #4ee3c5 0%, #164642 100%)',
                }}
                onClick={() => handleStartEdit('profilePicture', user?.profilePicture || '')}
                title="Click to update photo URL"
              >
                <Avatar user={user} size={96} showOnline isOnline />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#164642',
                    border: '2px solid var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 14,
                  }}
                >
                  📷
                </div>
              </div>

              {editField === 'profilePicture' ? (
                <div style={{ marginTop: 14, width: '100%', maxWidth: 360 }}>
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="input-field"
                    style={{ marginBottom: 8, fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditField(null)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveField('profilePicture')}
                      disabled={saving}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#164642',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Photo'}
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  onClick={() => handleStartEdit('profilePicture', user?.profilePicture || '')}
                  style={{
                    fontSize: '0.8rem',
                    color: '#4ee3c5',
                    marginTop: 10,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Change profile photo
                </p>
              )}
            </div>

            {/* 1. Name Field with Inline Edit */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4ee3c5',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 6,
                }}
              >
                Your Name
              </span>

              {editField === 'name' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    id="settings-edit-name-input"
                    type="text"
                    maxLength={40}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="input-field"
                    style={{ flex: 1, padding: '8px 12px' }}
                  />
                  <button
                    onClick={() => handleSaveField('name')}
                    disabled={saving || !editValue.trim()}
                    title="Save name"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#164642',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditField(null)}
                    title="Cancel"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user?.name || 'Set name'}
                  </p>
                  <button
                    id="settings-edit-name-btn"
                    onClick={() => handleStartEdit('name', user?.name || '')}
                    title="Edit Name"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8da4ad',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 4,
                    }}
                  >
                    ✏️
                  </button>
                </div>
              )}
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8 }}>
                This is not your username or PIN. This name will be visible to your ChatApp contacts.
              </p>
            </div>

            {/* 2. About (Bio) Field with Inline Edit */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4ee3c5',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 6,
                }}
              >
                About
              </span>

              {editField === 'bio' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    id="settings-edit-bio-input"
                    type="text"
                    maxLength={140}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="input-field"
                    style={{ flex: 1, padding: '8px 12px' }}
                  />
                  <button
                    onClick={() => handleSaveField('bio')}
                    disabled={saving}
                    title="Save About"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#164642',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditField(null)}
                    title="Cancel"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '0.94rem', color: user?.bio ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {user?.bio || 'Hey there! I am using ChatApp.'}
                  </p>
                  <button
                    id="settings-edit-bio-btn"
                    onClick={() => handleStartEdit('bio', user?.bio || 'Hey there! I am using ChatApp.')}
                    title="Edit About"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8da4ad',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 4,
                    }}
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>

            {/* 3. Phone Number Field with Copy & Edit Options */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
                padding: '16px 18px',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4ee3c5',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 6,
                }}
              >
                Phone Number
              </span>

              {editField === 'phoneNumber' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    id="settings-edit-phone-input"
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="+91 9876543210"
                    autoFocus
                    className="input-field"
                    style={{ flex: 1, padding: '8px 12px' }}
                  />
                  <button
                    onClick={() => handleSaveField('phoneNumber')}
                    disabled={saving}
                    title="Save Phone"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#164642',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditField(null)}
                    title="Cancel"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 600,
                      color: user?.phoneNumber ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {user?.phoneNumber || 'No phone number set'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Copy Button */}
                    <button
                      id="settings-copy-phone-btn"
                      onClick={handleCopyPhone}
                      title="Copy phone number to clipboard"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        background: phoneCopied ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-hover)',
                        color: phoneCopied ? '#4ade80' : '#4ee3c5',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {phoneCopied ? '✓ Copied!' : '📋 Copy'}
                    </button>

                    {/* Edit Phone Button */}
                    <button
                      id="settings-edit-phone-btn"
                      onClick={() => handleStartEdit('phoneNumber', user?.phoneNumber || '')}
                      title="Edit phone number"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8da4ad',
                        cursor: 'pointer',
                        fontSize: 16,
                        padding: 4,
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              )}
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Your phone number is used for contact matching on ChatApp.
              </p>
            </div>
          </div>
        ) : settingsView === 'appearance' ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(10, 46, 43, 0.12)',
            }}
          >
            <AppearanceSettings onBack={() => setSettingsView('main')} />
          </div>
        ) : settingsView === 'privacy' ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(10, 46, 43, 0.12)',
            }}
          >
            <PrivacySettings onBack={() => setSettingsView('main')} />
          </div>
        ) : (
          /* ================= MAIN SETTINGS VIEW ================= */
          <div>
            {/* 1. Top Header: User Name & Settings Title */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Settings
                </h1>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#4ee3c5',
                    background: 'rgba(78, 227, 197, 0.12)',
                    padding: '4px 14px',
                    borderRadius: 20,
                    border: '1px solid rgba(78, 227, 197, 0.25)',
                  }}
                >
                  {user?.name}
                </span>
              </div>
            </div>

            {/* 2. Search Bar for Settings Features */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: 15,
                }}
              >
                🔍
              </span>
              <input
                id="settings-feature-search"
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{
                  paddingLeft: 40,
                  paddingRight: searchQuery ? 36 : 14,
                  paddingTop: 11,
                  paddingBottom: 11,
                  borderRadius: 14,
                  fontSize: '0.9rem',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* 3. User Photo Card (Click to open Profile Sub-page) */}
            {(!searchQuery ||
              user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user?.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              'profile'.includes(searchQuery.toLowerCase())) && (
              <div
                id="settings-user-photo-card"
                onClick={() => {
                  setSettingsView('profile');
                  setEditField(null);
                }}
                title="Click to view and edit your profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  marginBottom: 24,
                  boxShadow: '0 4px 16px rgba(10, 46, 43, 0.1)',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
              >
                {/* User Photo */}
                <div style={{ position: 'relative' }}>
                  <Avatar user={user} size={62} showOnline isOnline />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.name}
                  </p>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      marginTop: 3,
                    }}
                  >
                    {user?.bio || 'Hey there! I am using ChatApp.'}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--online-color)', marginTop: 4 }}>
                    ● Online & Active
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#4ee3c5',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                  }}
                >
                  <span>Edit Profile</span>
                  <span style={{ fontSize: 18 }}>›</span>
                </div>
              </div>
            )}

            {/* 4. Settings Features List */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              {filteredFeatures.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <p style={{ fontSize: '0.9rem' }}>No settings found matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredFeatures.map((item, idx) => (
                  <div
                    key={item.id}
                    id={`settings-item-${item.id}`}
                    onClick={item.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      borderBottom:
                        idx < filteredFeatures.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {item.label}
                      </p>
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          marginTop: 2,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Logout Option */}
            <button
              id="settings-logout-btn"
              onClick={logout}
              style={{
                width: '100%',
                padding: '13px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-lg)',
                color: '#fca5a5',
                cursor: 'pointer',
                fontSize: '0.92rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
            >
              <span>🚪</span>
              <span>Logout from ChatApp</span>
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ChatApp v1.0.0 • WhatsApp Style Interface
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
