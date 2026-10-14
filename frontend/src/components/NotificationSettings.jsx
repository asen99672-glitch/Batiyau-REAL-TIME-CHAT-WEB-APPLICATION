import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../services/api';

const NotificationSettings = ({ onBack }) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useChat();

  const initialNotifs = user?.notificationPreferences || {};
  const [conversationTones, setConversationTones] = useState(
    initialNotifs.conversationTones ?? true
  );
  const [showPreviews, setShowPreviews] = useState(
    initialNotifs.showPreviews ?? true
  );
  const [reactionNotifications, setReactionNotifications] = useState(
    initialNotifs.reactionNotifications ?? true
  );
  const [sound, setSound] = useState(initialNotifs.sound || 'default');
  const [muteDuration, setMuteDuration] = useState('off'); // 'off' | '8h' | '1w' | 'always'

  const soundsList = [
    { id: 'default', label: 'Default (WhatsApp Bell)' },
    { id: 'chime', label: 'Chime' },
    { id: 'ding', label: 'Classic Ding' },
    { id: 'pop', label: 'Subtle Pop' },
    { id: 'ripple', label: 'Soft Ripple' },
  ];

  const updatePreference = async (key, val) => {
    try {
      const updated = {
        conversationTones,
        showPreviews,
        reactionNotifications,
        sound,
        [key]: val,
      };

      if (key === 'conversationTones') setConversationTones(val);
      if (key === 'showPreviews') setShowPreviews(val);
      if (key === 'reactionNotifications') setReactionNotifications(val);
      if (key === 'sound') setSound(val);

      const { data } = await api.put('/users/notification-preferences', updated);
      if (updateUser) {
        updateUser({
          ...user,
          notificationPreferences: data.notificationPreferences,
        });
      }
      showToast('Notification preference saved', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save preference', 'error');
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

  const Switch = ({ checked }) => (
    <div
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: checked ? '#00a884' : '#374151',
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
          left: checked ? 21 : 3,
          transition: 'left 0.2s ease',
        }}
      />
    </div>
  );

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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Notifications</h2>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* MESSAGES SECTION */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Messages
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {/* Conversation tones */}
            <div
              onClick={() => updatePreference('conversationTones', !conversationTones)}
              style={rowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Conversation tones</p>
                <p style={descStyle}>Play sounds for incoming and outgoing messages.</p>
              </div>
              <Switch checked={conversationTones} />
            </div>

            {/* Show previews */}
            <div
              onClick={() => updatePreference('showPreviews', !showPreviews)}
              style={rowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Show previews</p>
                <p style={descStyle}>Display preview text inside new message alerts.</p>
              </div>
              <Switch checked={showPreviews} />
            </div>

            {/* Reaction notifications */}
            <div
              onClick={() => updatePreference('reactionNotifications', !reactionNotifications)}
              style={{ ...rowStyle, borderBottom: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Reaction notifications</p>
                <p style={descStyle}>Show notifications for reactions to messages you send.</p>
              </div>
              <Switch checked={reactionNotifications} />
            </div>
          </div>
        </div>

        {/* NOTIFICATION TONES SECTION */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Notification Tone
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {soundsList.map((item, idx) => {
              const isSelected = sound === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => updatePreference('sound', item.id)}
                  style={{
                    ...rowStyle,
                    borderBottom: idx === soundsList.length - 1 ? 'none' : '1px solid var(--border-subtle, #1e2127)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '0.92rem', color: isSelected ? '#00a884' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                    {item.label}
                  </span>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: isSelected ? '5px solid #00a884' : '2px solid var(--text-muted)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* MUTE NOTIFICATIONS SECTION */}
        <div>
          <h4 style={{ margin: '0 0 10px 4px', fontSize: '0.8rem', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mute All Notifications
          </h4>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {[
              { id: 'off', label: 'Unmuted' },
              { id: '8h', label: 'Mute for 8 hours' },
              { id: '1w', label: 'Mute for 1 week' },
              { id: 'always', label: 'Always mute' },
            ].map((opt, idx) => (
              <div
                key={opt.id}
                onClick={() => {
                  setMuteDuration(opt.id);
                  showToast(opt.id === 'off' ? 'Notifications unmuted' : `Notifications muted (${opt.label})`, 'info');
                }}
                style={{
                  ...rowStyle,
                  borderBottom: idx === 3 ? 'none' : '1px solid var(--border-subtle, #1e2127)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '0.92rem', color: muteDuration === opt.id ? '#00a884' : 'var(--text-primary)', fontWeight: muteDuration === opt.id ? 600 : 400 }}>
                  {opt.label}
                </span>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: muteDuration === opt.id ? '5px solid #00a884' : '2px solid var(--text-muted)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
