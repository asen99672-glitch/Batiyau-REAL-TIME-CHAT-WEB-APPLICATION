import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../services/api';
import Avatar from './Avatar';
import { AppLockSetupModal } from './AppLock';

/**
 * WhatsApp-identical Privacy Settings View
 * Complete, 100% functional privacy features matching WhatsApp.
 */
const PrivacySettings = ({ onBack, onOpenAppLock, onLockApp }) => {
  const { user, updateUser } = useAuth();
  const { allUsers = [], showToast } = useChat();

  const [activeModal, setActiveModal] = useState(null); // 'lastSeen', 'profilePicture', 'about', 'status', 'defaultMessageTimer', 'groups', 'blockedContacts', 'appLock'
  const [contactPickerConfig, setContactPickerConfig] = useState(null); // { title, mode: 'exclude' | 'include' | 'single_block', field, selectedIds: [] }
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local state initialized from user's privacySettings
  const initialPrivacy = user?.privacySettings || {};
  const [privacy, setPrivacy] = useState({
    lastSeen: initialPrivacy.lastSeen || 'nobody',
    lastSeenExcluded: initialPrivacy.lastSeenExcluded || [],
    online: initialPrivacy.online || 'everyone',
    profilePicture: initialPrivacy.profilePicture || 'everyone',
    profilePictureExcluded: initialPrivacy.profilePictureExcluded || [],
    about: initialPrivacy.about || 'everyone',
    aboutExcluded: initialPrivacy.aboutExcluded || [],
    status: initialPrivacy.status || 'contacts_except',
    statusExcluded: initialPrivacy.statusExcluded || [],
    statusOnlyWith: initialPrivacy.statusOnlyWith || [],
    readReceipts: initialPrivacy.readReceipts !== undefined ? initialPrivacy.readReceipts : true,
    defaultMessageTimer: initialPrivacy.defaultMessageTimer || 'off',
    groups: initialPrivacy.groups || 'everyone',
    groupsExcluded: initialPrivacy.groupsExcluded || [],
    blockedContacts: initialPrivacy.blockedContacts || [],
    appLock: initialPrivacy.appLock || '15min',
    blockUnknownMessages: initialPrivacy.blockUnknownMessages || false,
    protectIpInCalls: initialPrivacy.protectIpInCalls !== undefined ? initialPrivacy.protectIpInCalls : true,
    turnOffLinkPreviews: initialPrivacy.turnOffLinkPreviews || false,
  });

  // Sync when user prop updates
  useEffect(() => {
    if (user?.privacySettings) {
      setPrivacy((prev) => ({
        ...prev,
        ...user.privacySettings,
      }));
    }
  }, [user]);

  // Fetch populated blocked users from backend
  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const { data } = await api.get('/users/blocked');
      setBlockedUsersList(data || []);
      // Sync count
      setPrivacy((prev) => ({
        ...prev,
        blockedContacts: (data || []).map((u) => u._id),
      }));
    } catch (err) {
      console.error('Failed to load blocked contacts:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  // Save changes to backend
  const updatePrivacyField = async (field, value, extraFields = {}) => {
    const updated = { ...privacy, [field]: value, ...extraFields };
    setPrivacy(updated);

    try {
      setSaving(true);
      const { data } = await api.put('/users/profile', {
        privacySettings: updated,
      });
      if (updateUser) {
        updateUser(data);
      }
      showToast('Privacy updated ✓', 'success');
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
      showToast('Failed to update privacy setting', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Block a user via API
  const handleBlockUser = async (targetUser) => {
    try {
      const { data } = await api.post(`/users/block/${targetUser._id}`);
      showToast(`${targetUser.name || 'Contact'} blocked`, 'info');
      await fetchBlockedUsers();
      if (user && updateUser) {
        updateUser({
          ...user,
          privacySettings: {
            ...(user.privacySettings || {}),
            blockedContacts: data.blockedContacts,
          },
        });
      }
    } catch (err) {
      console.error('Failed to block user:', err);
      showToast(err.response?.data?.message || 'Failed to block contact', 'error');
    }
  };

  // Unblock a user via API
  const handleUnblockUser = async (targetUserId, targetName) => {
    try {
      const { data } = await api.post(`/users/unblock/${targetUserId}`);
      showToast(`${targetName || 'Contact'} unblocked`, 'success');
      await fetchBlockedUsers();
      if (user && updateUser) {
        updateUser({
          ...user,
          privacySettings: {
            ...(user.privacySettings || {}),
            blockedContacts: data.blockedContacts,
          },
        });
      }
    } catch (err) {
      console.error('Failed to unblock user:', err);
      showToast(err.response?.data?.message || 'Failed to unblock contact', 'error');
    }
  };

  // Open contact picker for exclusions/inclusions
  const openExclusionPicker = (audienceField, listField, title) => {
    setActiveModal(null);
    setContactPickerConfig({
      title,
      mode: audienceField === 'status' && listField === 'statusOnlyWith' ? 'include' : 'exclude',
      audienceField,
      listField,
      selectedIds: (privacy[listField] || []).map((id) => (id?._id || id).toString()),
    });
  };

  // Label formatters
  const formatAudienceLabel = (field, val, excludedCount = 0) => {
    switch (val) {
      case 'everyone':
        return 'Everyone';
      case 'contacts':
        return 'My contacts';
      case 'contacts_except':
        return excludedCount > 0 ? `My contacts except (${excludedCount})` : 'My contacts except...';
      case 'nobody':
        return 'Nobody';
      case 'only_share_with':
        return excludedCount > 0 ? `Only share with (${excludedCount})` : 'Only share with...';
      default:
        return 'Everyone';
    }
  };

  const formatTimerLabel = (val) => {
    switch (val) {
      case 'off':
        return 'Off';
      case '24h':
        return '24 hours';
      case '7d':
        return '7 days';
      case '90d':
        return '90 days';
      default:
        return 'Off';
    }
  };

  const formatAppLockLabel = (val) => {
    const isPinSet = user?._id ? !!localStorage.getItem(`chatapp_pin_${user._id}`) : false;
    if (!isPinSet || val === 'off') return 'Disabled';
    switch (val) {
      case 'immediately':
        return 'Immediately';
      case '1min':
        return 'After 1 minute';
      case '15min':
        return 'After 15 minutes';
      case '30min':
        return 'After 30 minutes';
      default:
        return 'After 15 minutes';
    }
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
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg-secondary, #131418)',
          borderBottom: '1px solid var(--border-subtle, #1e2127)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          id="privacy-back-btn"
          onClick={onBack}
          title="Back to Settings"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary, #ffffff)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #ffffff)' }}>
          Privacy
        </h2>
      </div>

      {/* Main List */}
      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column' }}>

        {/* SECTION 1: Who can see my personal info */}
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted, #8b929d)',
              marginBottom: 12,
              letterSpacing: '0.2px',
            }}
          >
            Who can see my personal info
          </h3>

          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {/* Last seen and online */}
            <div
              id="privacy-row-lastseen"
              onClick={() => setActiveModal('lastSeen')}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>Last seen and online</p>
                <p style={subtitleStyle}>
                  {formatAudienceLabel('lastSeen', privacy.lastSeen, privacy.lastSeenExcluded?.length)}
                </p>
              </div>
              <ChevronIcon />
            </div>

            {/* Profile picture */}
            <div
              id="privacy-row-profilepic"
              onClick={() => setActiveModal('profilePicture')}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>Profile picture</p>
                <p style={subtitleStyle}>
                  {formatAudienceLabel('profilePicture', privacy.profilePicture, privacy.profilePictureExcluded?.length)}
                </p>
              </div>
              <ChevronIcon />
            </div>

            {/* About */}
            <div
              id="privacy-row-about"
              onClick={() => setActiveModal('about')}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>About</p>
                <p style={subtitleStyle}>
                  {formatAudienceLabel('about', privacy.about, privacy.aboutExcluded?.length)}
                </p>
              </div>
              <ChevronIcon />
            </div>

            {/* Status */}
            <div
              id="privacy-row-status"
              onClick={() => setActiveModal('status')}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>Status</p>
                <p style={subtitleStyle}>
                  {privacy.status === 'contacts_except'
                    ? `${privacy.statusExcluded?.length || 0} contacts excluded`
                    : privacy.status === 'only_share_with'
                    ? `${privacy.statusOnlyWith?.length || 0} contacts selected`
                    : 'My contacts'}
                </p>
              </div>
              <ChevronIcon />
            </div>

            {/* Read receipts (Toggle Switch) */}
            <div
              id="privacy-row-readreceipts"
              onClick={() => updatePrivacyField('readReceipts', !privacy.readReceipts)}
              style={{ ...rowStyle, borderBottom: 'none', cursor: 'pointer' }}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Read receipts</p>
                <p style={{ ...subtitleStyle, marginTop: 4, lineHeight: 1.4, color: 'var(--text-muted, #8b929d)' }}>
                  If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
                </p>
              </div>
              <Switch checked={privacy.readReceipts} />
            </div>
          </div>
        </div>

        {/* SECTION 2: Disappearing messages */}
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted, #8b929d)',
              marginBottom: 12,
              letterSpacing: '0.2px',
            }}
          >
            Disappearing messages
          </h3>

          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {/* Default message timer */}
            <div
              id="privacy-row-timer"
              onClick={() => setActiveModal('defaultMessageTimer')}
              style={{ ...rowStyle, borderBottom: 'none' }}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>Default message timer</p>
                <p style={subtitleStyle}>{formatTimerLabel(privacy.defaultMessageTimer)}</p>
              </div>
              <ChevronIcon />
            </div>
          </div>
        </div>

        {/* SECTION 3: Groups, Blocked contacts & App lock */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {/* Groups */}
            <div
              id="privacy-row-groups"
              onClick={() => setActiveModal('groups')}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>Groups</p>
                <p style={subtitleStyle}>
                  {formatAudienceLabel('groups', privacy.groups, privacy.groupsExcluded?.length)}
                </p>
              </div>
              <ChevronIcon />
            </div>

            {/* Blocked contacts */}
            <div
              id="privacy-row-blocked"
              onClick={() => setActiveModal('blockedContacts')}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>Blocked contacts</p>
                <p style={subtitleStyle}>
                  {blockedUsersList.length === 0
                    ? 'None'
                    : `${blockedUsersList.length} contact${blockedUsersList.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <ChevronIcon />
            </div>

            {/* App lock */}
            <div
              id="privacy-row-applock"
              onClick={() => setActiveModal('appLock')}
              style={{ ...rowStyle, borderBottom: 'none' }}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1 }}>
                <p style={titleStyle}>App lock</p>
                <p style={subtitleStyle}>{formatAppLockLabel(privacy.appLock)}</p>
              </div>
              <ChevronIcon />
            </div>
          </div>
        </div>

        {/* SECTION 4: Advanced */}
        <div style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted, #8b929d)',
              marginBottom: 12,
              letterSpacing: '0.2px',
            }}
          >
            Advanced
          </h3>

          <div
            style={{
              background: 'var(--bg-card, #17191e)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle, #1e2127)',
              overflow: 'hidden',
            }}
          >
            {/* Block unknown account messages */}
            <div
              id="privacy-row-blockunknown"
              onClick={() => updatePrivacyField('blockUnknownMessages', !privacy.blockUnknownMessages)}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Block unknown account messages</p>
                <p style={{ ...subtitleStyle, marginTop: 4, lineHeight: 1.45 }}>
                  To protect your account and improve device performance, messages from unknown accounts will be blocked if they exceed spam thresholds.{' '}
                  <span style={learnMoreStyle} onClick={(e) => { e.stopPropagation(); showToast('WhatsApp spam protection stops unsolicited messages from unknown numbers.'); }}>Learn more</span>
                </p>
              </div>
              <Switch checked={privacy.blockUnknownMessages} />
            </div>

            {/* Protect IP address in calls */}
            <div
              id="privacy-row-protectip"
              onClick={() => updatePrivacyField('protectIpInCalls', !privacy.protectIpInCalls)}
              style={rowStyle}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Protect IP address in calls</p>
                <p style={{ ...subtitleStyle, marginTop: 4, lineHeight: 1.45 }}>
                  To make it harder for people to infer your location, calls on this device will be securely relayed through server relays. Peer-to-peer IP leaks will be blocked.{' '}
                  <span style={learnMoreStyle} onClick={(e) => { e.stopPropagation(); showToast('Call relaying masks your IP address by disabling direct peer-to-peer WebRTC connections.'); }}>Learn more</span>
                </p>
              </div>
              <Switch checked={privacy.protectIpInCalls} />
            </div>

            {/* Turn off link previews */}
            <div
              id="privacy-row-linkpreviews"
              onClick={() => updatePrivacyField('turnOffLinkPreviews', !privacy.turnOffLinkPreviews)}
              style={{ ...rowStyle, borderBottom: 'none' }}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={titleStyle}>Turn off link previews</p>
                <p style={{ ...subtitleStyle, marginTop: 4, lineHeight: 1.45 }}>
                  To help protect your IP address from being inferred by third-party websites, previews for the links you share in chats will no longer be generated.{' '}
                  <span style={learnMoreStyle} onClick={(e) => { e.stopPropagation(); showToast('Disabling link previews prevents automatic fetch requests to external websites.'); }}>Learn more</span>
                </p>
              </div>
              <Switch checked={privacy.turnOffLinkPreviews} />
            </div>
          </div>
        </div>

      </div>

      {/* 1. LAST SEEN & ONLINE MODAL */}
      {activeModal === 'lastSeen' && (
        <LastSeenModal
          privacy={privacy}
          onSelectAudience={(val) => {
            updatePrivacyField('lastSeen', val);
          }}
          onSelectOnline={(val) => {
            updatePrivacyField('online', val);
          }}
          onOpenExclusions={() => {
            openExclusionPicker('lastSeen', 'lastSeenExcluded', 'Hide last seen from...');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 2. PROFILE PICTURE MODAL */}
      {activeModal === 'profilePicture' && (
        <AudiencePickerModal
          title="Profile picture"
          subtitleHeader="WHO CAN SEE MY PROFILE PHOTO"
          currentValue={privacy.profilePicture}
          excludedCount={privacy.profilePictureExcluded?.length || 0}
          options={[
            { label: 'Everyone', value: 'everyone' },
            { label: 'My contacts', value: 'contacts' },
            { label: 'My contacts except...', value: 'contacts_except' },
            { label: 'Nobody', value: 'nobody' },
          ]}
          onSelect={(val) => updatePrivacyField('profilePicture', val)}
          onOpenExclusions={() => openExclusionPicker('profilePicture', 'profilePictureExcluded', 'Hide profile photo from...')}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 3. ABOUT MODAL */}
      {activeModal === 'about' && (
        <AudiencePickerModal
          title="About"
          subtitleHeader="WHO CAN SEE MY ABOUT"
          currentValue={privacy.about}
          excludedCount={privacy.aboutExcluded?.length || 0}
          options={[
            { label: 'Everyone', value: 'everyone' },
            { label: 'My contacts', value: 'contacts' },
            { label: 'My contacts except...', value: 'contacts_except' },
            { label: 'Nobody', value: 'nobody' },
          ]}
          onSelect={(val) => updatePrivacyField('about', val)}
          onOpenExclusions={() => openExclusionPicker('about', 'aboutExcluded', 'Hide About from...')}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 4. STATUS MODAL */}
      {activeModal === 'status' && (
        <AudiencePickerModal
          title="Status privacy"
          subtitleHeader="WHO CAN SEE MY STATUS UPDATES"
          currentValue={privacy.status}
          excludedCount={privacy.status === 'only_share_with' ? privacy.statusOnlyWith?.length || 0 : privacy.statusExcluded?.length || 0}
          footnote="Changes to your privacy settings won't affect status updates that you've sent already."
          options={[
            { label: 'My contacts', value: 'contacts' },
            { label: 'My contacts except...', value: 'contacts_except' },
            { label: 'Only share with...', value: 'only_share_with' },
          ]}
          onSelect={(val) => updatePrivacyField('status', val)}
          onOpenExclusions={() => {
            if (privacy.status === 'only_share_with') {
              openExclusionPicker('status', 'statusOnlyWith', 'Only share status with...');
            } else {
              openExclusionPicker('status', 'statusExcluded', 'Hide status from...');
            }
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 5. DEFAULT MESSAGE TIMER MODAL */}
      {activeModal === 'defaultMessageTimer' && (
        <AudiencePickerModal
          title="Default message timer"
          subtitleHeader="START NEW CHATS WITH DISAPPEARING MESSAGES"
          currentValue={privacy.defaultMessageTimer}
          footnote="When turned on, all new individual chats will start with disappearing messages set to the duration you select. This setting will not affect your existing chats."
          options={[
            { label: '24 hours', value: '24h' },
            { label: '7 days', value: '7d' },
            { label: '90 days', value: '90d' },
            { label: 'Off', value: 'off' },
          ]}
          onSelect={(val) => updatePrivacyField('defaultMessageTimer', val)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 6. GROUPS MODAL */}
      {activeModal === 'groups' && (
        <AudiencePickerModal
          title="Groups"
          subtitleHeader="WHO CAN ADD ME TO GROUPS"
          currentValue={privacy.groups}
          excludedCount={privacy.groupsExcluded?.length || 0}
          footnote="Admins who can't add you to a group will have the option of inviting you privately instead."
          options={[
            { label: 'Everyone', value: 'everyone' },
            { label: 'My contacts', value: 'contacts' },
            { label: 'My contacts except...', value: 'contacts_except' },
          ]}
          onSelect={(val) => updatePrivacyField('groups', val)}
          onOpenExclusions={() => openExclusionPicker('groups', 'groupsExcluded', 'Who cannot add me to groups...')}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 7. BLOCKED CONTACTS MANAGER SCREEN/MODAL */}
      {activeModal === 'blockedContacts' && (
        <BlockedContactsModal
          blockedUsers={blockedUsersList}
          loading={loadingBlocked}
          onUnblock={handleUnblockUser}
          onAddNewBlock={() => {
            setContactPickerConfig({
              title: 'Block contact',
              mode: 'single_block',
              field: 'blockedContacts',
              selectedIds: blockedUsersList.map((u) => u._id),
            });
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 8. APP LOCK CONFIG MODAL */}
      {activeModal === 'appLock' && (
        <AppLockConfigModal
          privacy={privacy}
          user={user}
          onUpdateLock={(timerVal) => updatePrivacyField('appLock', timerVal)}
          onOpenSetup={() => setShowPinSetup(true)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* CONTACT PICKER (EXCLUSION / INCLUSION / BLOCK) */}
      {contactPickerConfig && (
        <ContactPickerModal
          title={contactPickerConfig.title}
          mode={contactPickerConfig.mode}
          allUsers={allUsers.filter((u) => u._id !== user?._id)}
          initialSelectedIds={contactPickerConfig.selectedIds}
          onSave={async (newIds) => {
            if (contactPickerConfig.mode === 'single_block') {
              const target = allUsers.find((u) => u._id === newIds[0]);
              if (target) {
                await handleBlockUser(target);
              }
            } else {
              const targetAudienceValue =
                contactPickerConfig.mode === 'include' ? 'only_share_with' : 'contacts_except';
              await updatePrivacyField(contactPickerConfig.listField, newIds, {
                [contactPickerConfig.audienceField]: targetAudienceValue,
              });
            }
            setContactPickerConfig(null);
          }}
          onClose={() => setContactPickerConfig(null)}
        />
      )}

      {/* PIN SETUP MODAL */}
      {showPinSetup && (
        <AppLockSetupModal
          onClose={() => setShowPinSetup(false)}
          onLockNow={() => {
            setShowPinSetup(false);
            showToast('PIN set up successfully', 'success');
            updatePrivacyField('appLock', privacy.appLock === 'off' ? 'immediately' : privacy.appLock);
          }}
        />
      )}
    </div>
  );
};

/* ================= SUBCOMPONENTS ================= */

// 1. WhatsApp Last Seen & Online Modal
const LastSeenModal = ({ privacy, onSelectAudience, onSelectOnline, onOpenExclusions, onClose }) => {
  const lastSeenOptions = [
    { label: 'Everyone', value: 'everyone' },
    { label: 'My contacts', value: 'contacts' },
    { label: 'My contacts except...', value: 'contacts_except' },
    { label: 'Nobody', value: 'nobody' },
  ];

  const onlineOptions = [
    { label: 'Everyone', value: 'everyone' },
    { label: 'Same as last seen', value: 'same_as_last_seen' },
  ];

  return (
    <ModalContainer title="Last seen and online" onClose={onClose}>
      <div style={{ padding: '16px 20px' }}>
        {/* SECTION 1 */}
        <p style={sectionHeaderStyle}>WHO CAN SEE MY LAST SEEN</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          {lastSeenOptions.map((opt) => {
            const isSelected = privacy.lastSeen === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => onSelectAudience(opt.value)}
                style={pickerItemStyle(isSelected)}
              >
                <div>
                  <span style={{ fontSize: '0.95rem', color: isSelected ? '#00a884' : 'var(--text-primary, #f3f4f6)', fontWeight: isSelected ? 600 : 400 }}>
                    {opt.label}
                  </span>
                  {opt.value === 'contacts_except' && isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExclusions();
                      }}
                      style={smallActionButtonStyle}
                    >
                      {privacy.lastSeenExcluded?.length > 0
                        ? `${privacy.lastSeenExcluded.length} contacts excluded >`
                        : 'Choose contacts to exclude >'}
                    </button>
                  )}
                </div>
                <RadioCircle isSelected={isSelected} />
              </div>
            );
          })}
        </div>

        {/* SECTION 2 */}
        <p style={{ ...sectionHeaderStyle, marginTop: 20 }}>WHO CAN SEE WHEN I'M ONLINE</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          {onlineOptions.map((opt) => {
            const isSelected = privacy.online === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => onSelectOnline(opt.value)}
                style={pickerItemStyle(isSelected)}
              >
                <span style={{ fontSize: '0.95rem', color: isSelected ? '#00a884' : 'var(--text-primary, #f3f4f6)', fontWeight: isSelected ? 600 : 400 }}>
                  {opt.label}
                </span>
                <RadioCircle isSelected={isSelected} />
              </div>
            );
          })}
        </div>

        {/* FOOTNOTE */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8b929d)', lineHeight: 1.45, marginTop: 12 }}>
          If you don't share when you were last seen or online, you won't be able to see when other people were last seen or online.
        </p>

        <button onClick={onClose} style={fullPrimaryBtn}>
          Done
        </button>
      </div>
    </ModalContainer>
  );
};

// 2. Generic Audience / Option Picker Modal
const AudiencePickerModal = ({
  title,
  subtitleHeader,
  currentValue,
  options,
  excludedCount = 0,
  footnote,
  onSelect,
  onOpenExclusions,
  onClose,
}) => {
  return (
    <ModalContainer title={title} onClose={onClose}>
      <div style={{ padding: '16px 20px' }}>
        {subtitleHeader && <p style={sectionHeaderStyle}>{subtitleHeader}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          {options.map((opt) => {
            const isSelected = currentValue === opt.value;
            const isExcept = opt.value === 'contacts_except' || opt.value === 'only_share_with';
            return (
              <div
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                style={pickerItemStyle(isSelected)}
              >
                <div>
                  <span style={{ fontSize: '0.95rem', color: isSelected ? '#00a884' : 'var(--text-primary, #f3f4f6)', fontWeight: isSelected ? 600 : 400 }}>
                    {opt.label}
                  </span>
                  {isExcept && isSelected && onOpenExclusions && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExclusions();
                      }}
                      style={smallActionButtonStyle}
                    >
                      {excludedCount > 0
                        ? `${excludedCount} contacts selected >`
                        : 'Choose contacts >'}
                    </button>
                  )}
                </div>
                <RadioCircle isSelected={isSelected} />
              </div>
            );
          })}
        </div>

        {footnote && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8b929d)', lineHeight: 1.45, marginTop: 8 }}>
            {footnote}
          </p>
        )}

        <button onClick={onClose} style={fullPrimaryBtn}>
          Done
        </button>
      </div>
    </ModalContainer>
  );
};

// 3. WhatsApp Blocked Contacts Manager Modal
const BlockedContactsModal = ({ blockedUsers, loading, onUnblock, onAddNewBlock, onClose }) => {
  const [search, setSearch] = useState('');
  const [unblockingId, setUnblockingId] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return blockedUsers;
    const q = search.toLowerCase();
    return blockedUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q)
    );
  }, [blockedUsers, search]);

  return (
    <ModalContainer
      title={`Blocked contacts (${blockedUsers.length})`}
      onClose={onClose}
      headerRight={
        <button
          onClick={onAddNewBlock}
          title="Block a contact"
          style={{
            background: 'none',
            border: 'none',
            color: '#00a884',
            cursor: 'pointer',
            fontSize: '1.25rem',
            fontWeight: 700,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>+</span> Add
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '70vh' }}>
        {/* Search Bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle, #1e2127)' }}>
          <input
            type="text"
            placeholder="Search blocked contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-primary, #111215)',
              border: '1px solid var(--border-color, #272a31)',
              color: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading blocked contacts...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((u) => (
              <div
                key={u._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 20px',
                  borderBottom: '1px solid var(--border-subtle, #1e2127)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar user={u} size={42} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem', color: '#ffffff' }}>
                      {u.name || u.username || 'Contact'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #8b929d)' }}>
                      {u.phoneNumber || (u.username ? `@${u.username}` : 'Blocked')}
                    </p>
                  </div>
                </div>

                <button
                  disabled={unblockingId === u._id}
                  onClick={async () => {
                    setUnblockingId(u._id);
                    await onUnblock(u._id, u.name);
                    setUnblockingId(null);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  {unblockingId === u._id ? 'Unblocking...' : 'Unblock'}
                </button>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted, #8b929d)' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(78, 227, 197, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#00a884',
                  fontSize: 28,
                }}
              >
                🛡️
              </div>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#f3f4f6', fontSize: '1rem' }}>
                No blocked contacts
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45 }}>
                Blocked contacts will no longer be able to call you or send you messages. Tap <b>+ Add</b> above to block a contact.
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalContainer>
  );
};

// 4. Contact Picker Modal (Select Multiple for Exclusion/Inclusion, or Single to Block)
const ContactPickerModal = ({ title, mode, allUsers, initialSelectedIds = [], onSave, onClose }) => {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q)
    );
  }, [allUsers, search]);

  const toggleSelect = (userId) => {
    if (mode === 'single_block') {
      setSelectedIds([userId]);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((u) => u._id));
    }
  };

  return (
    <ModalContainer
      title={title}
      onClose={onClose}
      headerRight={
        mode !== 'single_block' && (
          <button
            onClick={handleSelectAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#00a884',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {selectedIds.length === filteredUsers.length ? 'Deselect all' : 'Select all'}
          </button>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '72vh' }}>
        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle, #1e2127)' }}>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-primary, #111215)',
              border: '1px solid var(--border-color, #272a31)',
              color: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => {
              const isChecked = selectedIds.includes(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleSelect(u._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    background: isChecked ? 'rgba(0, 168, 132, 0.08)' : 'transparent',
                    borderBottom: '1px solid var(--border-subtle, #1e2127)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.background = 'var(--bg-hover, #1b1d23)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar user={u} size={40} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                        {u.name || u.username}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #8b929d)' }}>
                        {u.phoneNumber || (u.username ? `@${u.username}` : '')}
                      </p>
                    </div>
                  </div>

                  {/* Checkbox / selection indicator */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: mode === 'single_block' ? '50%' : 6,
                      border: isChecked ? 'none' : '2px solid var(--text-muted, #667781)',
                      background: isChecked ? (mode === 'single_block' ? '#ef4444' : '#00a884') : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChecked && '✓'}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              No contacts found
            </div>
          )}
        </div>

        {/* Footer save */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle, #1e2127)', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              background: 'var(--bg-secondary, #1e2127)',
              color: 'var(--text-primary, #ffffff)',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selectedIds)}
            style={{
              flex: 2,
              padding: '10px 16px',
              borderRadius: 10,
              background: '#00a884',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {mode === 'single_block'
              ? 'Block selected'
              : `Apply (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

// 5. App Lock Configuration Modal
const AppLockConfigModal = ({ privacy, user, onUpdateLock, onOpenSetup, onClose }) => {
  const isPinSet = user?._id ? !!localStorage.getItem(`chatapp_pin_${user._id}`) : false;
  const isLockEnabled = isPinSet && privacy.appLock !== 'off';

  const timeoutOptions = [
    { label: 'Immediately', value: 'immediately' },
    { label: 'After 1 minute', value: '1min' },
    { label: 'After 15 minutes', value: '15min' },
    { label: 'After 30 minutes', value: '30min' },
  ];

  return (
    <ModalContainer title="App lock" onClose={onClose}>
      <div style={{ padding: '16px 20px' }}>
        {/* Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid var(--border-subtle, #1e2127)',
          }}
        >
          <div style={{ flex: 1, paddingRight: 16 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
              Unlock with PIN / Biometrics
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #8b929d)', lineHeight: 1.4 }}>
              When enabled, you'll need to enter your PIN to open WhatsApp.
            </p>
          </div>
          <div
            onClick={() => {
              if (!isPinSet) {
                onOpenSetup();
              } else {
                onUpdateLock(isLockEnabled ? 'off' : 'immediately');
              }
            }}
          >
            <Switch checked={isLockEnabled} />
          </div>
        </div>

        {/* Timeout Options (Visible only if enabled) */}
        {isLockEnabled ? (
          <div style={{ marginTop: 16 }}>
            <p style={sectionHeaderStyle}>AUTOMATICALLY LOCK</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {timeoutOptions.map((opt) => {
                const isSelected = privacy.appLock === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => onUpdateLock(opt.value)}
                    style={pickerItemStyle(isSelected)}
                  >
                    <span style={{ fontSize: '0.92rem', color: isSelected ? '#00a884' : 'var(--text-primary, #f3f4f6)', fontWeight: isSelected ? 600 : 400 }}>
                      {opt.label}
                    </span>
                    <RadioCircle isSelected={isSelected} />
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button
                onClick={() => onOpenSetup()}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle, #1e2127)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Change PIN
              </button>
              <button
                onClick={() => {
                  if (user?._id) {
                    sessionStorage.setItem(`chatapp_locked_${user._id}`, 'true');
                  }
                  if (onLockApp) {
                    onLockApp();
                  } else {
                    window.location.reload();
                  }
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'rgba(0, 168, 132, 0.15)',
                  color: '#00a884',
                  border: '1px solid rgba(0, 168, 132, 0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔒 Lock App Now
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              onClick={() => onOpenSetup()}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                background: '#00a884',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Set up 4-digit PIN
            </button>
          </div>
        )}

        <button onClick={onClose} style={{ ...fullPrimaryBtn, marginTop: 20 }}>
          Close
        </button>
      </div>
    </ModalContainer>
  );
};

// Reusable Modal Container
const ModalContainer = ({ title, headerRight, onClose, children }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.7)',
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
        borderRadius: 16,
        border: '1px solid var(--border-color, #272a31)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.55)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle, #1e2127)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
          {title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {headerRight}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #8b929d)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {children}
    </div>
  </div>
);

// Sleek WhatsApp Radio Circle
const RadioCircle = ({ isSelected }) => (
  <div
    style={{
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: isSelected ? '6px solid #00a884' : '2px solid var(--text-muted, #667781)',
      boxSizing: 'border-box',
      transition: 'all 0.15s ease',
      flexShrink: 0,
    }}
  />
);

// Sleek WhatsApp Toggle Switch
const Switch = ({ checked }) => (
  <div
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      background: checked ? '#00a884' : '#374151',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.25s ease',
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
        left: checked ? 23 : 3,
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}
    />
  </div>
);

// Chevron Icon
const ChevronIcon = () => (
  <span
    style={{
      color: 'var(--text-muted, #667781)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 8,
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </span>
);

// Styles
const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  cursor: 'pointer',
  borderBottom: '1px solid var(--border-subtle, #1e2127)',
  transition: 'background 0.15s ease',
};

const handleRowEnter = (e) => {
  e.currentTarget.style.background = 'var(--bg-hover, #1b1d23)';
};

const handleRowLeave = (e) => {
  e.currentTarget.style.background = 'transparent';
};

const titleStyle = {
  fontSize: '0.92rem',
  fontWeight: 600,
  color: 'var(--text-primary, #f3f4f6)',
  margin: 0,
};

const subtitleStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted, #8b929d)',
  margin: '2px 0 0',
};

const sectionHeaderStyle = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-muted, #8b929d)',
  letterSpacing: '0.3px',
  margin: '0 0 8px',
};

const pickerItemStyle = (isSelected) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  background: isSelected ? 'rgba(78, 227, 197, 0.08)' : 'transparent',
  transition: 'background 0.15s ease',
});

const smallActionButtonStyle = {
  display: 'block',
  background: 'none',
  border: 'none',
  color: '#00a884',
  fontSize: '0.78rem',
  fontWeight: 600,
  padding: 0,
  marginTop: 3,
  cursor: 'pointer',
  textAlign: 'left',
};

const fullPrimaryBtn = {
  width: '100%',
  marginTop: 16,
  padding: '10px 16px',
  borderRadius: 10,
  background: '#00a884',
  color: '#ffffff',
  border: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const learnMoreStyle = {
  color: '#00a884',
  fontWeight: 600,
  cursor: 'pointer',
};

export default PrivacySettings;
