import React, { useState, useMemo } from 'react';
import Icons from './AdminIcons';

const UsersListView = ({
  users = [],
  onSelectUser,
  onOpenBlockModal,
  onOpenSuspendModal,
  onOpenDeleteModal,
  onRestoreUser,
  onOpenBroadcastModal,
  totalUsersCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'active' | 'online' | 'offline' | 'blocked' | 'suspended' | 'recent'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter users based on query and filter pill
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Filter tab
      if (filterType === 'active' && (u.isBanned || u.isSuspended || u.isDeleted)) return false;
      if (filterType === 'online' && u.status !== 'online') return false;
      if (filterType === 'offline' && u.status === 'online') return false;
      if (filterType === 'blocked' && !u.isBanned) return false;
      if (filterType === 'suspended' && !u.isSuspended) return false;
      if (filterType === 'recent') {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        if (new Date(u.createdAt) < threeDaysAgo) return false;
      }

      // Search query (Name, Phone, Email, User ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchUser = u.username?.toLowerCase().includes(q);
        const matchPhone = u.phoneNumber?.includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchId = String(u._id).toLowerCase().includes(q);
        return matchName || matchUser || matchPhone || matchEmail || matchId;
      }

      return true;
    });
  }, [users, filterType, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export users to CSV (Safe non-sensitive fields)
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['User ID', 'Name', 'Username', 'Email', 'Phone Number', 'Status', 'Role', 'Registration Date', 'Last Seen'];
    const rows = filteredUsers.map((u) => [
      `"${u._id}"`,
      `"${u.name || ''}"`,
      `"${u.username || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phoneNumber || ''}"`,
      `"${u.isDeleted ? 'Deleted' : u.isBanned ? 'Blocked' : u.isSuspended ? 'Suspended' : 'Active'}"`,
      `"${u.role || 'user'}"`,
      `"${u.createdAt ? new Date(u.createdAt).toISOString() : ''}"`,
      `"${u.status === 'online' ? 'Online' : u.lastSeen ? new Date(u.lastSeen).toISOString() : 'Offline'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chatapp_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="users-list-view-container">
      {/* Title & Actions Row */}
      <div className="dashboard-title-row">
        <div>
          <h1>User Management</h1>
          <p className="dashboard-subtitle">
            Manage registered accounts, view real-time activity, inspect devices, and take moderation actions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ud-btn-export-csv" onClick={handleExportCSV} title="Export filtered users to CSV">
            <Icons.Download style={{ width: 15, height: 15 }} />
            <span>Export Users</span>
          </button>
          <button className="btn-primary-confirm" onClick={onOpenBroadcastModal}>
            <Icons.Bell style={{ width: 15, height: 15 }} />
            <span>Broadcast Notice</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="users-filter-bar">
        <div className="users-search-box">
          <Icons.Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, phone (+91), email, or User ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="users-filter-pills">
          {[
            { id: 'all', label: 'All Users', count: users.length },
            { id: 'active', label: 'Active', count: users.filter((u) => !u.isBanned && !u.isSuspended && !u.isDeleted).length },
            { id: 'online', label: 'Online', count: users.filter((u) => u.status === 'online').length },
            { id: 'offline', label: 'Offline', count: users.filter((u) => u.status !== 'online').length },
            { id: 'blocked', label: 'Blocked', count: users.filter((u) => u.isBanned).length },
            { id: 'suspended', label: 'Suspended', count: users.filter((u) => u.isSuspended).length },
            { id: 'recent', label: 'Recently Registered' },
          ].map((pill) => (
            <button
              key={pill.id}
              className={`user-filter-pill ${filterType === pill.id ? 'active' : ''}`}
              onClick={() => {
                setFilterType(pill.id);
                setCurrentPage(1);
              }}
            >
              <span>{pill.label}</span>
              {pill.count !== undefined && <span className="pill-count">{pill.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-custom-table">
          <thead>
            <tr>
              <th>User</th>
              <th>User ID</th>
              <th>Mobile Number</th>
              <th>Email</th>
              <th>Status</th>
              <th>Registration Date</th>
              <th>Last Seen</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                  <Icons.Users style={{ width: 36, height: 36, margin: '0 auto 8px', color: '#cbd5e1' }} />
                  <p>No registered users found matching the filter criteria.</p>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const isOnline = u.status === 'online';
                const regDate = u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '12 Jan 2025';
                const lastSeenText = isOnline
                  ? 'Active now'
                  : u.lastSeen
                  ? new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today'
                  : 'Offline';

                return (
                  <tr
                    key={u._id}
                    onClick={() => onSelectUser(u)}
                    className="user-table-row-hoverable"
                  >
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar-wrap">
                          <img
                            src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2563EB&color=fff`}
                            alt={u.name}
                            className="table-avatar"
                          />
                          <span className={`table-online-dot ${isOnline ? 'online' : 'offline'}`} />
                        </div>
                        <div>
                          <div className="table-user-name">{u.name}</div>
                          <div className="table-username-sub">@{u.username || 'user'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="user-id-code" title={u._id}>
                        #{String(u._id).slice(-6)}
                      </code>
                    </td>
                    <td className="table-phone-cell">{u.phoneNumber || '+91 98765 43210'}</td>
                    <td className="table-email-cell">{u.email || 'user@chatapp.com'}</td>
                    <td>
                      {u.isDeleted ? (
                        <span className="status-pill status-deleted">● Deleted</span>
                      ) : u.isBanned ? (
                        <span className="status-pill status-blocked">● Blocked</span>
                      ) : u.isSuspended ? (
                        <span className="status-pill status-suspended">● Suspended</span>
                      ) : (
                        <span className="status-pill status-active">● Active</span>
                      )}
                    </td>
                    <td>{regDate}</td>
                    <td>
                      <span className={isOnline ? 'text-online-highlight' : 'text-muted'}>
                        {lastSeenText}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions-wrap" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="table-action-view-btn"
                          title="View Complete User Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectUser(u);
                          }}
                        >
                          <Icons.Eye style={{ width: 14, height: 14 }} />
                          <span>View</span>
                        </button>

                        <button
                          className="table-action-icon-btn"
                          title={u.isBanned ? 'Unblock User' : 'Block User'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBlockModal(u);
                          }}
                        >
                          <Icons.Ban style={{ color: u.isBanned ? '#10b981' : '#ef4444' }} />
                        </button>

                        <button
                          className="table-action-icon-btn warning"
                          title={u.isSuspended ? 'Activate User' : 'Suspend User'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSuspendModal(u);
                          }}
                        >
                          <Icons.PauseCircle />
                        </button>

                        <button
                          className="table-action-icon-btn danger"
                          title="Delete User Account"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDeleteModal(u);
                          }}
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Table Pagination Footer */}
        <div className="table-footer-row" style={{ padding: '14px 20px' }}>
          <span>
            Showing {filteredUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} Users
          </span>
          <div className="table-pagination-nav">
            <button
              className="page-num-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <Icons.ChevronLeft />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`page-num-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="page-num-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <Icons.ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersListView;
