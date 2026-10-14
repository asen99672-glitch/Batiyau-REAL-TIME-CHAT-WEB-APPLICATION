import React from 'react';
import Icons from './AdminIcons';

const AdminSidebar = ({ activeTab, onSelectTab, onLogout, counts = {} }) => {
  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="admin-brand-header">
        <div className="admin-brand-logo">
          <Icons.LogoChat />
        </div>
        <div className="admin-brand-text">
          <h2>ChatApp Admin</h2>
          <span className="brand-subtitle">Batiyau Control Center</span>
        </div>
      </div>

      {/* Nav Menu Scrollable Container */}
      <div className="admin-nav-container">
        {/* Main Dashboard item */}
        <div className="nav-group">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            <Icons.Dashboard />
            <span>Dashboard</span>
          </button>
        </div>

        {/* 1. MANAGE USERS */}
        <div className="nav-group">
          <div className="nav-group-title">MANAGE USERS</div>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => onSelectTab('users')}
          >
            <Icons.User />
            <span>Users</span>
            {counts.totalUsers && <span className="nav-badge">{counts.totalUsers}</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'blocked_users' ? 'active' : ''}`}
            onClick={() => onSelectTab('blocked_users')}
          >
            <Icons.Ban />
            <span>Blocked Users</span>
            {counts.blockedUsers && <span className="nav-badge danger">{counts.blockedUsers}</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'suspended_users' ? 'active' : ''}`}
            onClick={() => onSelectTab('suspended_users')}
          >
            <Icons.PauseCircle />
            <span>Suspended Accounts</span>
            {counts.suspendedUsers && <span className="nav-badge warning">{counts.suspendedUsers}</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'deleted_users' ? 'active' : ''}`}
            onClick={() => onSelectTab('deleted_users')}
          >
            <Icons.Trash />
            <span>Deleted Accounts</span>
            {counts.deletedUsers > 0 && <span className="nav-badge slate">{counts.deletedUsers}</span>}
          </button>
        </div>

        {/* 2. REPORTS & MODERATION */}
        <div className="nav-group">
          <div className="nav-group-title">REPORTS & MODERATION</div>
          <button
            className={`nav-item ${activeTab === 'reports_all' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_all')}
          >
            <Icons.Flag />
            <span>All Reports</span>
            {counts.reports > 0 && <span className="nav-badge danger">{counts.reports}</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_user' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_user')}
          >
            <Icons.User />
            <span>User Reports</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_message' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_message')}
          >
            <Icons.MessageReport />
            <span>Message Reports</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_group' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_group')}
          >
            <Icons.Users />
            <span>Group Reports</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_spam' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_spam')}
          >
            <Icons.AlertCircle />
            <span>Spam Reports</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_harassment' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_harassment')}
          >
            <Icons.ShieldAlert />
            <span>Abuse / Harassment</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_fake_account' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_fake_account')}
          >
            <Icons.UserMinus />
            <span>Fake Account Reports</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_fraud' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_fraud')}
          >
            <Icons.DollarSign />
            <span>Fraud / Scam Reports</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'reports_inappropriate' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports_inappropriate')}
          >
            <Icons.Image />
            <span>Inappropriate Content</span>
          </button>
        </div>

        {/* 3. CONVERSATIONS */}
        <div className="nav-group">
          <div className="nav-group-title">CONVERSATIONS</div>
          <button
            className={`nav-item ${activeTab === 'conversations_metadata' ? 'active' : ''}`}
            onClick={() => onSelectTab('conversations_metadata')}
          >
            <Icons.MessageSquare />
            <span>Conversations (Metadata)</span>
          </button>
        </div>

        {/* 4. SECURITY */}
        <div className="nav-group">
          <div className="nav-group-title">SECURITY</div>
          <button
            className={`nav-item ${activeTab === 'login_sessions' ? 'active' : ''}`}
            onClick={() => onSelectTab('login_sessions')}
          >
            <Icons.Shield />
            <span>Login Sessions</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => onSelectTab('devices')}
          >
            <Icons.Laptop />
            <span>Devices</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'suspicious_activity' ? 'active' : ''}`}
            onClick={() => onSelectTab('suspicious_activity')}
          >
            <Icons.ShieldAlert />
            <span>Suspicious Activity</span>
          </button>
        </div>

        {/* 5. ANALYTICS */}
        <div className="nav-group">
          <div className="nav-group-title">ANALYTICS</div>
          <button
            className={`nav-item ${activeTab === 'user_analytics' ? 'active' : ''}`}
            onClick={() => onSelectTab('user_analytics')}
          >
            <Icons.BarChart />
            <span>User Analytics</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'chat_analytics' ? 'active' : ''}`}
            onClick={() => onSelectTab('chat_analytics')}
          >
            <Icons.MessageSquare />
            <span>Chat Analytics</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'report_analytics' ? 'active' : ''}`}
            onClick={() => onSelectTab('report_analytics')}
          >
            <Icons.Flag />
            <span>Report Analytics</span>
          </button>
        </div>

        {/* 6. NOTIFICATIONS */}
        <div className="nav-group">
          <div className="nav-group-title">NOTIFICATIONS</div>
          <button
            className={`nav-item ${activeTab === 'system_notifications' ? 'active' : ''}`}
            onClick={() => onSelectTab('system_notifications')}
          >
            <Icons.Bell />
            <span>System Notifications</span>
          </button>
        </div>

        {/* 7. SETTINGS */}
        <div className="nav-group">
          <div className="nav-group-title">SETTINGS</div>
          <button
            className={`nav-item ${activeTab === 'app_settings' ? 'active' : ''}`}
            onClick={() => onSelectTab('app_settings')}
          >
            <Icons.Settings />
            <span>App Settings</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'notification_settings' ? 'active' : ''}`}
            onClick={() => onSelectTab('notification_settings')}
          >
            <Icons.Bell />
            <span>Notification Settings</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'roles_permissions' ? 'active' : ''}`}
            onClick={() => onSelectTab('roles_permissions')}
          >
            <Icons.Key />
            <span>Roles & Permissions</span>
          </button>
        </div>

        {/* 8. SYSTEM & AUDIT */}
        <div className="nav-group">
          <div className="nav-group-title">SYSTEM & AUDIT</div>
          <button
            className={`nav-item ${activeTab === 'system_control' ? 'active' : ''}`}
            onClick={() => onSelectTab('system_control')}
          >
            <Icons.Server />
            <span>System Control</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'audit_logs' ? 'active' : ''}`}
            onClick={() => onSelectTab('audit_logs')}
          >
            <Icons.FileText />
            <span>Admin Activity Logs</span>
          </button>
        </div>

        {/* 9. ADMIN */}
        <div className="nav-group">
          <div className="nav-group-title">ADMIN</div>
          <button
            className={`nav-item ${activeTab === 'my_profile' ? 'active' : ''}`}
            onClick={() => onSelectTab('my_profile')}
          >
            <Icons.User />
            <span>My Profile</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'change_password' ? 'active' : ''}`}
            onClick={() => onSelectTab('change_password')}
          >
            <Icons.Lock />
            <span>Change Password</span>
          </button>
          <button className="nav-item logout" onClick={onLogout}>
            <Icons.LogOut />
            <span>Logout</span>
          </button>
        </div>

        {/* Privacy First Widget inside scroll container */}
        <div className="sidebar-privacy-card">
          <div className="privacy-card-icon">
            <Icons.ShieldCheck style={{ width: 20, height: 20, color: '#10B981' }} />
          </div>
          <div className="privacy-card-content">
            <h4>Privacy First</h4>
            <p>Admin manages users & metadata. Private chat plaintext is E2EE encrypted and cannot be read.</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
