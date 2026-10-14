import React, { useState } from 'react';
import Icons from './AdminIcons';

const UserDetailsCard = ({
  user,
  onClose,
  onBlockToggle,
  onSuspendToggle,
  onDeleteUser,
  onRestoreUser,
  onViewFullProfile,
}) => {
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Sessions' | 'Devices' | 'Reports'

  if (!user) {
    return (
      <div className="admin-card user-details-card empty-state">
        <div className="empty-content">
          <Icons.User style={{ width: 44, height: 44, color: '#94a3b8' }} />
          <h4>Select a User</h4>
          <p>Click on any user in the table to inspect their complete profile, sessions, and account actions.</p>
        </div>
      </div>
    );
  }

  const isBanned = !!user.isBanned;
  const isSuspended = !!user.isSuspended;
  const isDeleted = !!user.isDeleted;

  const getStatusBadge = () => {
    if (isDeleted) {
      return <span className="status-pill status-deleted">● Deleted</span>;
    }
    if (isBanned) {
      return <span className="status-pill status-blocked">● Blocked</span>;
    }
    if (isSuspended) {
      return <span className="status-pill status-suspended">● Suspended</span>;
    }
    return <span className="status-pill status-active">● Active</span>;
  };

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '12 Jan 2025';

  const lastSeenText = user.status === 'online'
    ? 'Online now'
    : user.lastSeen
    ? new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today'
    : '2 min ago';

  return (
    <div className="admin-card user-details-card">
      {/* Header bar */}
      <div className="user-details-header">
        <button className="back-btn" onClick={onClose} title="Close / Back">
          <Icons.ArrowLeft />
          <span>User Details</span>
        </button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {onViewFullProfile && (
            <button
              className="table-action-view-btn"
              onClick={() => onViewFullProfile(user)}
              title="Open full page user details view"
            >
              <Icons.Eye style={{ width: 13, height: 13 }} />
              <span>Full View</span>
            </button>
          )}
          <button className="icon-action-btn" title="Options">
            <Icons.MoreVertical />
          </button>
        </div>
      </div>

      {/* User Hero section */}
      <div className="user-details-hero">
        <div className="hero-avatar-wrap">
          <img
            src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=2563EB&color=fff`}
            alt={user.name}
            className="hero-avatar"
          />
          <span className={`hero-online-dot ${user.status === 'online' ? 'online' : 'offline'}`} />
        </div>
        <div className="hero-info">
          <div className="hero-name-row">
            <h3 className="hero-name">{user.name}</h3>
            {getStatusBadge()}
          </div>
          <div className="hero-meta-list">
            <div className="hero-meta-item">
              <Icons.Phone />
              <span>{user.phoneNumber || '+91 98765 43210'}</span>
            </div>
            <div className="hero-meta-item">
              <Icons.Mail />
              <span>{user.email || 'user@example.com'}</span>
            </div>
            <div className="hero-meta-sub">
              <div className="sub-item">
                <Icons.Calendar />
                <span>Joined on: {joinedDate}</span>
              </div>
              <div className="sub-item">
                <Icons.Clock />
                <span>Last seen: {lastSeenText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="user-details-tabs">
        {['Overview', 'Sessions', 'Devices', 'Reports'].map((tab) => (
          <button
            key={tab}
            className={`details-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'Overview' && (
        <div className="tab-pane overview-pane">
          {/* Account Actions Bar */}
          <div className="account-actions-box">
            <div className="section-subtitle">Account Actions</div>
            <div className="actions-btn-group">
              <button
                className={`action-pill-btn ${isBanned ? 'unban' : 'ban'}`}
                onClick={() => onBlockToggle(user)}
              >
                {isBanned ? <Icons.CheckCircle /> : <Icons.Ban />}
                <span>{isBanned ? 'Unblock User' : 'Block User'}</span>
              </button>

              <button
                className={`action-pill-btn ${isSuspended ? 'unsuspend' : 'suspend'}`}
                onClick={() => onSuspendToggle(user)}
              >
                {isSuspended ? <Icons.RotateCcw /> : <Icons.PauseCircle />}
                <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
              </button>

              {isDeleted ? (
                <button
                  className="action-pill-btn restore"
                  onClick={() => onRestoreUser && onRestoreUser(user)}
                >
                  <Icons.RotateCcw />
                  <span>Restore Account</span>
                </button>
              ) : (
                <button
                  className="action-pill-btn delete"
                  onClick={() => onDeleteUser(user)}
                >
                  <Icons.Trash />
                  <span>Delete Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Information List */}
          <div className="profile-info-box">
            <div className="section-subtitle">Profile Information</div>
            <div className="profile-grid">
              <div className="profile-row">
                <span className="profile-label">Name</span>
                <span className="profile-value">{user.name}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Username</span>
                <span className="profile-value">@{user.username || 'user'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Phone</span>
                <span className="profile-value">{user.phoneNumber || '+91 98765 43210'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user.email}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Gender</span>
                <span className="profile-value">{user.gender || 'Male'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Bio</span>
                <span className="profile-value bio-text">{user.bio || 'Hey! I am using ChatApp.'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Profile Photo</span>
                <span className="profile-value photo-preview-wrap">
                  <img
                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                    alt="avatar-preview"
                    className="photo-thumb"
                  />
                </span>
              </div>
              {isBanned && user.banReason && (
                <div className="profile-row alert-row">
                  <span className="profile-label">Ban Reason</span>
                  <span className="profile-value ban-reason-badge">{user.banReason}</span>
                </div>
              )}
              {isSuspended && user.suspendReason && (
                <div className="profile-row alert-row">
                  <span className="profile-label">Suspension</span>
                  <span className="profile-value suspend-reason-badge">{user.suspendReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sessions */}
      {activeTab === 'Sessions' && (
        <div className="tab-pane sessions-pane">
          <div className="section-subtitle">Active Login Sessions</div>
          <div className="sessions-list">
            {(user.loginSessions && user.loginSessions.length > 0
              ? user.loginSessions
              : [
                  { id: 's1', device: 'Windows • Chrome', ip: '103.***.***.45', lastActive: 'Active now', current: true },
                  { id: 's2', device: 'Android • Mobile App', ip: '182.***.***.12', lastActive: '2 hours ago', current: false },
                ]
            ).map((s, idx) => (
              <div key={idx} className="session-item-row">
                <div className="session-icon-wrap">
                  {s.device.toLowerCase().includes('windows') || s.device.toLowerCase().includes('mac') ? (
                    <Icons.Laptop />
                  ) : (
                    <Icons.Smartphone />
                  )}
                </div>
                <div className="session-meta">
                  <div className="session-device-name">
                    {s.device}
                    {s.current && <span className="active-now-badge">Active now</span>}
                  </div>
                  <div className="session-ip">IP: {s.ip} • {s.lastActive}</div>
                </div>
                <button
                  className="revoke-session-btn"
                  onClick={() => alert(`Session for ${s.device} revoked`)}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Devices */}
      {activeTab === 'Devices' && (
        <div className="tab-pane devices-pane">
          <div className="section-subtitle">Registered Trusted Devices</div>
          <div className="devices-list">
            <div className="device-item-card">
              <Icons.Laptop style={{ color: '#2563EB' }} />
              <div className="device-info">
                <strong>Primary Desktop (Chrome Browser)</strong>
                <span>Fingerprint: dev_win_7781x • Push Active</span>
              </div>
            </div>
            <div className="device-item-card">
              <Icons.Smartphone style={{ color: '#10B981' }} />
              <div className="device-info">
                <strong>Primary Phone (OnePlus 11 / Android)</strong>
                <span>FCM Push Token Registered • Encrypted Key Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Reports */}
      {activeTab === 'Reports' && (
        <div className="tab-pane reports-pane">
          <div className="section-subtitle">Report History</div>
          <div className="user-reports-list">
            {isBanned ? (
              <div className="report-history-card flagged">
                <div className="report-badge-tag high">High Severity</div>
                <p className="report-reason-text">Reported by 3 users for suspicious spam links.</p>
                <span className="report-date-text">Action: Account Blocked by Super Admin</span>
              </div>
            ) : (
              <div className="clean-record-card">
                <Icons.CheckCircle style={{ color: '#10B981', width: 24, height: 24 }} />
                <span>Good standing: No active unresolved complaints on this profile.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailsCard;
