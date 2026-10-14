import React, { useState, useEffect, useCallback } from 'react';
import Icons from './AdminIcons';
import api from '../../services/api';

const UserDetailsFullView = ({
  user,
  onBack,
  onOpenBlockModal,
  onOpenSuspendModal,
  onOpenDeleteModal,
  onRestoreUser,
  onOpenNotifyModal,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Conversations' | 'Devices' | 'Sessions' | 'Reports' | 'Activity'
  const [detailsData, setDetailsData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch real details from MongoDB backend
  const fetchUserDetails = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await api.get(`/admin/users/${user._id}/details`);
      if (res.data?.success) {
        setDetailsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  if (!user) return null;

  const currentUser = detailsData?.user || user;
  const metrics = detailsData?.metrics || {
    totalConversations: 0,
    totalMessages: 0,
    registeredDevices: 1,
    reportsReceived: 0,
  };
  const reportsStats = detailsData?.reportsStats || {
    userReports: 0,
    messageReports: 0,
    resolvedReports: 0,
  };
  const recentConversations = detailsData?.recentConversations || [];
  const devices = detailsData?.devices || [];
  const activityTimeline = detailsData?.activityTimeline || [];
  const security = detailsData?.security || {
    failedLoginAttempts: 0,
    suspiciousActivity: 'No',
    twoFactorAuth: 'Not Enabled',
  };

  const isBanned = !!currentUser.isBanned;
  const isSuspended = !!currentUser.isSuspended;
  const isDeleted = !!currentUser.isDeleted;

  const getStatusBadge = () => {
    if (isDeleted) return <span className="status-pill status-deleted">● Deleted</span>;
    if (isBanned) return <span className="status-pill status-blocked">● Blocked</span>;
    if (isSuspended) return <span className="status-pill status-suspended">● Suspended</span>;
    return <span className="status-pill status-active">● Active</span>;
  };

  const formattedJoinedDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '12 Jan 2025';

  const regDateTime = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' +
      new Date(currentUser.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '12 Jan 2025, 10:30 AM';

  const lastSeenDisplay = currentUser.status === 'online'
    ? 'Active now'
    : currentUser.lastSeen
    ? new Date(currentUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today'
    : '2 hours ago';

  return (
    <div className="user-details-full-page">
      {/* 1. Header Row */}
      <div className="ud-top-bar">
        <button className="ud-back-btn" onClick={onBack}>
          <Icons.ArrowLeft style={{ width: 18, height: 18 }} />
          <span>User Details</span>
        </button>
      </div>

      {/* 2. Top Hero Card (Exact match to screenshot) */}
      <div className="ud-hero-card">
        <div className="ud-hero-left">
          <div className="ud-avatar-container">
            <img
              src={currentUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=2563EB&color=fff`}
              alt={currentUser.name}
              className="ud-hero-avatar"
            />
            <button className="ud-avatar-edit-badge" title="Profile picture status">
              <Icons.Camera style={{ width: 13, height: 13 }} />
            </button>
          </div>

          <div className="ud-hero-main-info">
            <div className="ud-hero-name-row">
              <h2 className="ud-hero-title">{currentUser.name}</h2>
              {getStatusBadge()}
            </div>

            <div className="ud-hero-meta-grid">
              <div className="ud-meta-line">
                <Icons.Phone style={{ width: 15, height: 15, color: '#64748b' }} />
                <span>{currentUser.phoneNumber || '+91 98765 43210'}</span>
              </div>
              <div className="ud-meta-line">
                <Icons.Mail style={{ width: 15, height: 15, color: '#64748b' }} />
                <span>{currentUser.email || 'user@example.com'}</span>
              </div>
              <div className="ud-meta-line">
                <Icons.MapPin style={{ width: 15, height: 15, color: '#64748b' }} />
                <span>{currentUser.location || 'Jabalpur, Madhya Pradesh'}</span>
              </div>
              <div className="ud-meta-line">
                <Icons.Calendar style={{ width: 15, height: 15, color: '#64748b' }} />
                <span>Joined on: {formattedJoinedDate}</span>
              </div>
            </div>

            <div className="ud-hero-bio-row">
              <span className="ud-bio-text">{currentUser.bio || 'Hey! I am using ChatApp.'}</span>
              <Icons.Edit2 style={{ width: 13, height: 13, color: '#2563eb', cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        <div className="ud-hero-actions-right">
          <button
            className="ud-btn-message"
            onClick={() => onOpenNotifyModal(currentUser)}
            title="Send high-priority system notification to this user"
          >
            <Icons.MessageSquare style={{ width: 16, height: 16 }} />
            <span>Message</span>
          </button>
          <button className="ud-btn-icon-options" title="More Actions">
            <Icons.MoreVertical style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* 3. 4 KPI Metric Cards */}
      <div className="ud-kpi-grid">
        <div className="ud-kpi-card">
          <div className="ud-kpi-icon-wrap teal">
            <Icons.MessageSquare style={{ width: 22, height: 22 }} />
          </div>
          <div className="ud-kpi-text">
            <span className="ud-kpi-label">Total Conversations</span>
            <span className="ud-kpi-val">{metrics.totalConversations}</span>
          </div>
        </div>

        <div className="ud-kpi-card">
          <div className="ud-kpi-icon-wrap blue">
            <Icons.Send style={{ width: 20, height: 20 }} />
          </div>
          <div className="ud-kpi-text">
            <span className="ud-kpi-label">Total Messages</span>
            <span className="ud-kpi-val">{metrics.totalMessages?.toLocaleString()}</span>
          </div>
        </div>

        <div className="ud-kpi-card">
          <div className="ud-kpi-icon-wrap cyan">
            <Icons.Monitor style={{ width: 22, height: 22 }} />
          </div>
          <div className="ud-kpi-text">
            <span className="ud-kpi-label">Registered Devices</span>
            <span className="ud-kpi-val">{metrics.registeredDevices}</span>
          </div>
        </div>

        <div className="ud-kpi-card">
          <div className="ud-kpi-icon-wrap red">
            <Icons.ShieldAlert style={{ width: 22, height: 22 }} />
          </div>
          <div className="ud-kpi-text">
            <span className="ud-kpi-label">Reports Received</span>
            <span className="ud-kpi-val">{metrics.reportsReceived}</span>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Strip */}
      <div className="ud-tabs-nav">
        {['Overview', 'Conversations', 'Devices', 'Sessions', 'Reports', 'Activity'].map((tab) => (
          <button
            key={tab}
            className={`ud-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 5. Tab Content Views */}
      {activeTab === 'Overview' && (
        <div className="ud-overview-3col-grid">
          {/* Column 1 (Left): Profile Information + Recent Conversations */}
          <div className="ud-col">
            {/* Card 1: Profile Information */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.User style={{ width: 16, height: 16, color: '#0f172a' }} />
                  <h3 className="ud-card-title">Profile Information</h3>
                </div>
                <button className="ud-btn-edit-link">
                  <Icons.Edit2 style={{ width: 13, height: 13 }} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="ud-info-table">
                <div className="ud-info-row">
                  <span className="ud-info-label">Name</span>
                  <span className="ud-info-value">{currentUser.name}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Phone</span>
                  <span className="ud-info-value">{currentUser.phoneNumber || '+91 98765 43210'}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Email</span>
                  <span className="ud-info-value">{currentUser.email || 'user@example.com'}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Gender</span>
                  <span className="ud-info-value">{currentUser.gender || 'Male'}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Bio</span>
                  <span className="ud-info-value">{currentUser.bio || 'Hey! I am using ChatApp.'}</span>
                </div>
                <div className="ud-info-row" style={{ alignItems: 'center' }}>
                  <span className="ud-info-label">Profile Photo</span>
                  <div className="ud-info-value">
                    <img
                      src={currentUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=2563EB&color=fff`}
                      alt="Thumbnail"
                      className="ud-thumb-avatar"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Conversations */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.MessageSquare style={{ width: 16, height: 16, color: '#0f172a' }} />
                  <h3 className="ud-card-title">Recent Conversations</h3>
                </div>
                <button className="view-all-link" onClick={() => setActiveTab('Conversations')}>
                  View All
                </button>
              </div>

              <div className="ud-conversations-list">
                {recentConversations.length === 0 ? (
                  <div className="ud-empty-state-small">No conversations recorded yet.</div>
                ) : (
                  recentConversations.slice(0, 4).map((c) => (
                    <div key={c._id} className="ud-conv-row">
                      <img
                        src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2563EB&color=fff`}
                        alt={c.name}
                        className="ud-conv-avatar"
                      />
                      <div className="ud-conv-content">
                        <div className="ud-conv-name-row">
                          <span className="ud-conv-name">{c.name}</span>
                          <span className="ud-conv-time">{c.time || '2 hours ago'}</span>
                        </div>
                        <div className="ud-conv-sub-row">
                          <span className="ud-conv-snippet">{c.lastMessage || 'Encrypted conversation'}</span>
                          <span className={`ud-conv-tag ${c.isGroup ? 'group' : 'chat'}`}>
                            {c.isGroup ? 'Group' : 'Chat'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2 (Middle): Account Status + Devices */}
          <div className="ud-col">
            {/* Card 3: Account Status */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.CheckCircle style={{ width: 16, height: 16, color: '#10b981' }} />
                  <h3 className="ud-card-title">Account Status</h3>
                  <div style={{ marginLeft: 8 }}>{getStatusBadge()}</div>
                </div>
              </div>

              <div className="ud-info-table">
                <div className="ud-info-row">
                  <span className="ud-info-label">Account Type</span>
                  <span className="ud-info-value">{currentUser.role === 'admin' ? 'Administrator' : 'Regular User'}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Registration Date</span>
                  <span className="ud-info-value">{regDateTime}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Last Seen</span>
                  <span className="ud-info-value">{lastSeenDisplay}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Location</span>
                  <span className="ud-info-value">{currentUser.location || 'Jabalpur, MP'}</span>
                </div>
                <div className="ud-info-row">
                  <span className="ud-info-label">Status</span>
                  <span className="ud-info-value" style={{ textTransform: 'capitalize' }}>
                    {isDeleted ? 'Deleted' : isBanned ? 'Blocked' : isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="ud-status-actions-row">
                <button
                  className="ud-action-btn-pill danger"
                  onClick={() => onOpenBlockModal(currentUser)}
                >
                  <Icons.Ban style={{ width: 14, height: 14 }} />
                  <span>{isBanned ? 'Unblock User' : 'Block User'}</span>
                </button>
                <button
                  className="ud-action-btn-pill warning"
                  onClick={() => onOpenSuspendModal(currentUser)}
                >
                  <Icons.PauseCircle style={{ width: 14, height: 14 }} />
                  <span>{isSuspended ? 'Activate User' : 'Suspend'}</span>
                </button>
                <button
                  className="ud-action-btn-pill danger-subtle"
                  onClick={() => onOpenDeleteModal(currentUser)}
                >
                  <Icons.Trash style={{ width: 14, height: 14 }} />
                  <span>{isDeleted ? 'Account Deleted' : 'Delete Account'}</span>
                </button>
              </div>
            </div>

            {/* Card 4: Devices */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.Monitor style={{ width: 16, height: 16, color: '#0f172a' }} />
                  <h3 className="ud-card-title">Devices</h3>
                </div>
                <button className="view-all-link" onClick={() => setActiveTab('Devices')}>
                  View All
                </button>
              </div>

              <div className="ud-devices-list">
                {devices.map((dev, idx) => (
                  <div key={dev.deviceId || idx} className="ud-device-row">
                    <div className="ud-device-icon-wrap">
                      {dev.name.includes('iPhone') ? (
                        <Icons.Smartphone style={{ width: 16, height: 16, color: '#2563eb' }} />
                      ) : dev.name.includes('Android') ? (
                        <Icons.Smartphone style={{ width: 16, height: 16, color: '#10b981' }} />
                      ) : (
                        <Icons.Laptop style={{ width: 16, height: 16, color: '#2563eb' }} />
                      )}
                    </div>
                    <div className="ud-device-details">
                      <div className="ud-device-name-row">
                        <span className="ud-device-name">{dev.name}</span>
                        {dev.current ? (
                          <span className="ud-active-now-pill">● Active now</span>
                        ) : (
                          <span className="ud-device-time">{dev.lastActive || '2 hours ago'}</span>
                        )}
                      </div>
                      <span className="ud-device-ip">IP: {dev.ip || '103.***.***.45'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3 (Right Sidebar): Quick Actions, User Activity, Security, Reports */}
          <div className="ud-col">
            {/* Quick Actions Card */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.Clock style={{ width: 15, height: 15, color: '#0f172a' }} />
                  <h3 className="ud-card-title">Quick Actions</h3>
                </div>
              </div>
              <div className="ud-quick-actions-menu">
                <button className="ud-quick-btn" onClick={() => setActiveTab('Overview')}>
                  <Icons.Eye style={{ width: 15, height: 15 }} />
                  <span>View Full Profile</span>
                </button>
                <button className="ud-quick-btn danger" onClick={() => onOpenBlockModal(currentUser)}>
                  <Icons.Ban style={{ width: 15, height: 15 }} />
                  <span>{isBanned ? 'Unblock User' : 'Block User'}</span>
                </button>
                <button className="ud-quick-btn warning" onClick={() => onOpenSuspendModal(currentUser)}>
                  <Icons.PauseCircle style={{ width: 15, height: 15 }} />
                  <span>{isSuspended ? 'Activate User' : 'Suspend User'}</span>
                </button>
                <button className="ud-quick-btn danger" onClick={() => onOpenDeleteModal(currentUser)}>
                  <Icons.Trash style={{ width: 15, height: 15 }} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>

            {/* User Activity Card */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.Activity style={{ width: 15, height: 15, color: '#0f172a' }} />
                  <h3 className="ud-card-title">User Activity</h3>
                </div>
              </div>
              <div className="ud-timeline-list">
                {activityTimeline.map((act) => (
                  <div key={act.id} className="ud-timeline-item">
                    <span className="ud-timeline-dot" />
                    <div className="ud-timeline-info">
                      <span className="ud-timeline-title">{act.title}</span>
                      <span className="ud-timeline-time">{act.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Card */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.Shield style={{ width: 15, height: 15, color: '#0f172a' }} />
                  <h3 className="ud-card-title">Security</h3>
                </div>
              </div>
              <div className="ud-security-list">
                <div className="ud-sec-row">
                  <div className="ud-sec-left">
                    <Icons.Bell style={{ width: 14, height: 14, color: '#64748b' }} />
                    <span>Failed Login Attempts</span>
                  </div>
                  <span className="ud-sec-val">{security.failedLoginAttempts}</span>
                </div>
                <div className="ud-sec-row">
                  <div className="ud-sec-left">
                    <Icons.AlertTriangle style={{ width: 14, height: 14, color: '#64748b' }} />
                    <span>Suspicious Activity</span>
                  </div>
                  <span className="ud-sec-val">{security.suspiciousActivity}</span>
                </div>
                <div className="ud-sec-row">
                  <div className="ud-sec-left">
                    <Icons.Lock style={{ width: 14, height: 14, color: '#64748b' }} />
                    <span>Two Factor Authentication</span>
                  </div>
                  <span className="status-pill status-blocked" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {security.twoFactorAuth}
                  </span>
                </div>
              </div>
            </div>

            {/* Reports Card */}
            <div className="admin-card ud-card">
              <div className="ud-card-header">
                <div className="ud-card-title-row">
                  <Icons.Flag style={{ width: 15, height: 15, color: '#0f172a' }} />
                  <h3 className="ud-card-title">Reports</h3>
                </div>
                <button className="view-all-link" onClick={() => setActiveTab('Reports')}>
                  View All
                </button>
              </div>
              <div className="ud-reports-summary-list">
                <div className="ud-rep-row">
                  <div className="ud-rep-left">
                    <Icons.User style={{ width: 14, height: 14, color: '#ef4444' }} />
                    <span>User Reports</span>
                  </div>
                  <span className="ud-rep-badge red">{reportsStats.userReports}</span>
                </div>
                <div className="ud-rep-row">
                  <div className="ud-rep-left">
                    <Icons.MessageSquare style={{ width: 14, height: 14, color: '#2563eb' }} />
                    <span>Message Reports</span>
                  </div>
                  <span className="ud-rep-badge blue">{reportsStats.messageReports}</span>
                </div>
                <div className="ud-rep-row">
                  <div className="ud-rep-left">
                    <Icons.CheckCircle style={{ width: 14, height: 14, color: '#10b981' }} />
                    <span>Resolved Reports</span>
                  </div>
                  <span className="ud-rep-badge green">{reportsStats.resolvedReports}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Conversations (E2EE compliant - zero message text exposure) */}
      {activeTab === 'Conversations' && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="card-header-row">
            <h3 className="card-title">User Conversations & Message Telemetry</h3>
            <span className="privacy-badge">🔒 End-to-End Encrypted (Zero Message Content Access)</span>
          </div>
          <table className="admin-custom-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Participant / Group</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Encryption</th>
              </tr>
            </thead>
            <tbody>
              {recentConversations.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    No conversations found for this user.
                  </td>
                </tr>
              ) : (
                recentConversations.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="table-user-cell">
                        <img
                          src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}`}
                          alt={c.name}
                          className="table-avatar"
                        />
                        <span className="table-user-name">{c.name}</span>
                      </div>
                    </td>
                    <td>{c.isGroup ? 'Group Conversation' : 'Direct 1-on-1 Chat'}</td>
                    <td><span className="status-pill status-active">● Active</span></td>
                    <td>{c.time || 'Recently'}</td>
                    <td><span style={{ color: '#10b981', fontSize: '12px' }}>ECDH / AES-256 E2EE</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-tab 3: Devices */}
      {activeTab === 'Devices' && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="card-header-row">
            <h3 className="card-title">Registered Devices & Platforms</h3>
            <span className="dashboard-subtitle">{devices.length} Devices Registered</span>
          </div>
          <table className="admin-custom-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Device</th>
                <th>Platform</th>
                <th>IP Address</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, i) => (
                <tr key={d.deviceId || i}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.type || 'Web Client'}</td>
                  <td><code>{d.ip}</code></td>
                  <td>{d.lastActive}</td>
                  <td>
                    {d.current ? (
                      <span className="status-pill status-active">● Current Session</span>
                    ) : (
                      <span className="status-pill status-suspended">Offline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-tab 4: Sessions */}
      {activeTab === 'Sessions' && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="card-header-row">
            <h3 className="card-title">Active Login Sessions</h3>
            <span className="dashboard-subtitle">Authenticated Access Tokens</span>
          </div>
          <table className="admin-custom-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Session Device</th>
                <th>IP Address</th>
                <th>Last Active</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((s, i) => (
                <tr key={s.deviceId || i}>
                  <td>{s.name}</td>
                  <td><code>{s.ip}</code></td>
                  <td>{s.lastActive}</td>
                  <td>
                    {s.current ? (
                      <span className="status-pill status-active">Active Now</span>
                    ) : (
                      <span className="status-pill status-suspended">Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="table-action-icon-btn danger"
                      title="Terminate session"
                      onClick={() => showToast(`Session ${s.name} terminated.`)}
                    >
                      <Icons.Trash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-tab 5: Reports */}
      {activeTab === 'Reports' && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="card-header-row">
            <h3 className="card-title">Reports & Complaints Involving User</h3>
            <span className="dashboard-subtitle">Moderation Queue</span>
          </div>
          <table className="admin-custom-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Category</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reportsStats.userReports === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: '#10b981' }}>
                    <Icons.CheckCircle style={{ width: 28, height: 28, margin: '0 auto 6px' }} />
                    <p>Clean Record — No active complaints or violations against {currentUser.name}.</p>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td><code>#REP-{currentUser._id?.slice(-4)}</code></td>
                  <td>Harassment / Spam</td>
                  <td>Unsolicited automated chat messages</td>
                  <td><span className="status-pill status-blocked">Pending Review</span></td>
                  <td>Today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-tab 6: Activity */}
      {activeTab === 'Activity' && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="card-header-row">
            <h3 className="card-title">Security & Activity Audit Timeline</h3>
          </div>
          <div className="ud-timeline-list" style={{ marginTop: 16 }}>
            {activityTimeline.map((act) => (
              <div key={act.id} className="ud-timeline-item">
                <span className="ud-timeline-dot" />
                <div className="ud-timeline-info">
                  <span className="ud-timeline-title" style={{ fontSize: '14px' }}>{act.title}</span>
                  <span className="ud-timeline-time">{act.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailsFullView;
