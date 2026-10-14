import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icons from './AdminIcons';

const AdminHeader = ({
  searchQuery,
  onSearchChange,
  currentUser,
  onLogout,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="admin-top-header">
      {/* Search Bar matching screenshot */}
      <div className="header-search-wrap">
        <Icons.Search className="search-icon" />
        <input
          type="text"
          placeholder="Search users, phone number, email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="header-search-input"
        />
        {searchQuery && (
          <button
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="header-right-actions">
        {/* Live Real-time Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#059669',
          }}
          title="Connected via WebSocket. Live user activity, online status and telemetry active."
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span>Live Real-Time</span>
        </div>

        {/* Switch to User Chat link */}
        <button
          className="switch-app-btn"
          onClick={() => navigate('/chat')}
          title="Switch to User Chat Application"
        >
          <Icons.MessageSquare />
          <span>Open Chat App</span>
        </button>

        {/* Notification Bell with unread counter */}
        <div className="notification-bell-wrap" onClick={onOpenNotifications}>
          <button className="icon-badge-btn" aria-label="Notifications">
            <Icons.Bell />
            <span className="bell-badge-count">3</span>
          </button>
        </div>

        {/* Admin Profile Pill */}
        <div className="admin-profile-pill-wrap">
          <div
            className="admin-profile-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <img
              src={currentUser?.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt="Admin Avatar"
              className="admin-avatar"
            />
            <div className="admin-meta-text">
              <span className="admin-name">{currentUser?.name || 'Admin'}</span>
              <span className="admin-role-badge">Super Admin</span>
            </div>
            <Icons.ChevronDown className="dropdown-caret" />
          </div>

          {dropdownOpen && (
            <div className="admin-dropdown-menu">
              <div className="dropdown-header">
                <strong>{currentUser?.name || 'Admin'}</strong>
                <span>{currentUser?.email || 'admin@batiyau.com'}</span>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenProfile();
                }}
              >
                <Icons.User />
                <span>My Profile</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
              >
                <Icons.Settings />
                <span>Preferences</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item danger"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    localStorage.removeItem('chatToken');
                    localStorage.removeItem('chatUser');
                    navigate('/login');
                  }
                }}
              >
                <Icons.LogOut />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
