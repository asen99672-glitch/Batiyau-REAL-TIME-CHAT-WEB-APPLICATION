import React, { useState, useEffect, useMemo } from 'react';
import Icons from './AdminIcons';
const { X, Flag, AlertCircle, CheckCircle, ShieldAlert, Users, MessageSquare, DollarSign, Image, MoreVertical, Search, Filter, Lock, Unlock, Slash, Trash } = Icons;
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import './ReportsModeration.css';

const ReportsModeration = ({ activeType = 'reports_all' }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [adminNote, setAdminNote] = useState('');

  // Fetch initial data
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports', {
        params: {
          type: activeType,
          status: statusFilter,
          priority: priorityFilter,
          search: search,
          limit: 100
        }
      });
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const [newReportAlert, setNewReportAlert] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [activeType, statusFilter, priorityFilter, search]);

  // Real-time Socket Updates — WhatsApp-like instant delivery
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReportCreated = (newReport) => {
      setReports(prev => [newReport, ...prev]);
      // Show a live notification banner at the top
      setNewReportAlert({
        id: newReport._id,
        reporter: newReport.reportedBy?.name || 'A user',
        target: newReport.reportedUser?.name || 'a user',
        category: newReport.category,
      });
      setTimeout(() => setNewReportAlert(null), 6000);
    };

    const handleReportUpdated = ({ report }) => {
      setReports(prev => prev.map(r => r._id === report._id ? report : r));
      if (selectedReport && selectedReport._id === report._id) {
        setSelectedReport(report);
      }
    };

    socket.on('adminReportCreated', handleReportCreated);
    socket.on('adminReportUpdated', handleReportUpdated);

    return () => {
      socket.off('adminReportCreated', handleReportCreated);
      socket.off('adminReportUpdated', handleReportUpdated);
    };
  }, [selectedReport]);

  // Derived Stats (Calculated Real-Time)
  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const rejected = reports.filter(r => r.status === 'rejected').length;
    const critical = reports.filter(r => r.severity === 'high' || r.severity === 'critical').length;
    return { total, pending, resolved, rejected, critical };
  }, [reports]);

  // Handle Actions
  const handleAction = async (reportId, actionType, statusUpdate = null) => {
    try {
      const payload = { actionTaken: actionType };
      if (statusUpdate) payload.status = statusUpdate;
      if (adminNote) payload.notes = adminNote;

      await api.post(`/admin/reports/${reportId}/resolve`, payload);
      setAdminNote('');
      
      // Real-time update happens via socket, but we can optimistically update
      // We will rely on socket.io for exactly like WhatsApp real-time
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  // Helper
  const formatId = (id) => `#RPT-${id.substring(id.length - 6).toUpperCase()}`;
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}\n${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="reports-moderation-container">
      {/* Real-time New Report Alert Banner */}
      {newReportAlert && (
        <div style={{
          position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(239,68,68,0.5)', borderRadius: 14,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'slideDown 0.3s ease',
          minWidth: 320,
        }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div>
            <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.88rem' }}>New Report Received!</div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              <strong style={{ color: '#e2e8f0' }}>{newReportAlert.reporter}</strong> reported{' '}
              <strong style={{ color: '#e2e8f0' }}>{newReportAlert.target}</strong> for{' '}
              <span style={{ color: '#fbbf24', textTransform: 'capitalize' }}>{newReportAlert.category?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button onClick={() => setNewReportAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Main List Section */}
      <div className="reports-main">
        <div className="reports-header-alert">
          <div className="alert-icon">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1>Report & Moderation Control</h1>
            <p>Review user reports, take appropriate action and keep the community safe.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="reports-stats-grid">
          <div className="report-stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <Flag size={20} />
            </div>
            <div className="stat-title">Total Reports</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-trend up">↑ 12% vs. last month</div>
          </div>
          <div className="report-stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
              <AlertCircle size={20} />
            </div>
            <div className="stat-title">Pending</div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-trend neutral">Needs review</div>
          </div>
          <div className="report-stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#059669' }}>
              <CheckCircle size={20} />
            </div>
            <div className="stat-title">Resolved</div>
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-trend up">↑ 15% in last 30 days</div>
          </div>
          <div className="report-stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
              <X size={20} />
            </div>
            <div className="stat-title">Rejected</div>
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-trend down">↓ 5% false / invalid</div>
          </div>
          <div className="report-stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#ef4444' }}>
              <ShieldAlert size={20} />
            </div>
            <div className="stat-title">High Priority</div>
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-trend down">Needs urgent action</div>
          </div>
        </div>

        {/* Filters */}
        <div className="reports-filters">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search anything... (user, report, message, etc.)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Report Types</option>
            <option value="user">User Reports</option>
            <option value="message">Message Reports</option>
            <option value="group">Group Reports</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_investigation">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="high">High & Critical</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="filter-select" style={{ width: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={16}/> Filter
          </button>
        </div>

        {/* Table */}
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Report ID</th>
                <th>Type</th>
                <th>Reported User</th>
                <th>Reported By</th>
                <th>Reason</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr 
                  key={report._id} 
                  className={selectedReport?._id === report._id ? 'selected' : ''}
                  onClick={() => setSelectedReport(report)}
                >
                  <td><input type="checkbox" onClick={e => e.stopPropagation()} /></td>
                  <td style={{ fontWeight: 500 }}>{formatId(report._id)}</td>
                  <td>
                    <span className={`type-badge ${report.reportType}`}>{report.reportType === 'user' ? 'User' : report.reportType === 'message' ? 'Message' : 'Group'}</span>
                  </td>
                  <td>
                    {report.reportedUser ? (
                      <div className="user-cell">
                        <img src={report.reportedUser.profilePicture || `https://ui-avatars.com/api/?name=${report.reportedUser.name}`} className="user-avatar" />
                        <div className="user-info">
                          <span className="name">{report.reportedUser.name}</span>
                          <span className="handle">@{report.reportedUser.username}</span>
                        </div>
                      </div>
                    ) : 'Unknown'}
                  </td>
                  <td>
                    {report.reportedBy ? (
                      <div className="user-info">
                        <span className="name">{report.reportedBy.name}</span>
                        <span className="handle">@{report.reportedBy.username}</span>
                      </div>
                    ) : 'System'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{report.category.charAt(0).toUpperCase() + report.category.slice(1)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{report.reason.length > 30 ? report.reason.substring(0, 30) + '...' : report.reason}</div>
                  </td>
                  <td><span className={`priority-badge ${report.severity}`}>{report.severity}</span></td>
                  <td>
                    <span className={`status-badge ${report.status}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'pre-line', fontSize: '0.8rem' }}>{formatDate(report.createdAt)}</td>
                  <td>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && !loading && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No reports found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Side Panel - Report Details */}
      {selectedReport && (
        <div className="report-details-panel">
          <div className="details-header">
            <h2>Report Details</h2>
            <button className="close-btn" onClick={() => setSelectedReport(null)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="details-content">
            <div className="report-header-info">
              <span className={`type-badge ${selectedReport.reportType}`}>
                {selectedReport.reportType === 'user' ? 'User Report' : 'Message Report'}
              </span>
              <span className="report-id">{formatId(selectedReport._id)}</span>
              <span className={`priority-badge ${selectedReport.severity}`} style={{ marginLeft: 'auto' }}>
                {selectedReport.severity} Priority
              </span>
            </div>

            {/* Reported User Profile */}
            {selectedReport.reportedUser && (
              <div className="reported-user-card">
                <img src={selectedReport.reportedUser.profilePicture || `https://ui-avatars.com/api/?name=${selectedReport.reportedUser.name}`} />
                <div className="ru-info">
                  <h3>{selectedReport.reportedUser.name}</h3>
                  <p>@{selectedReport.reportedUser.username}</p>
                  <p>{selectedReport.reportedUser.phoneNumber}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                  User ID: <br/><strong style={{color: '#1e293b'}}>{selectedReport.reportedUser._id.substring(0,8)}</strong><br/>
                  Account Created:<br/><strong style={{color: '#1e293b'}}>{new Date(selectedReport.reportedUser.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>
            )}

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label"><Flag size={14}/> Report Type</span>
                <span className="info-value" style={{ textTransform: 'capitalize' }}>{selectedReport.reportType}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><AlertCircle size={14}/> Reason</span>
                <span className="info-value" style={{ textTransform: 'capitalize' }}>{selectedReport.category.replace('_', ' ')}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Users size={14}/> Reported By</span>
                <span className="info-value">{selectedReport.reportedBy?.name || 'Unknown'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><CheckCircle size={14}/> Status</span>
                <span className="info-value">
                  <span className={`status-badge ${selectedReport.status}`}>{selectedReport.status.replace('_', ' ')}</span>
                </span>
              </div>
            </div>

            {/* Report Description */}
            <h4 className="section-title">Report Description</h4>
            <div className="description-box">
              "{selectedReport.reason}"
            </div>

            {/* Evidence if message report */}
            {selectedReport.message && (
              <>
                <h4 className="section-title">Evidence (Reported Message)</h4>
                <div className="evidence-box">
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>{selectedReport.message.content}</p>
                  {selectedReport.message.attachments?.length > 0 && (
                    <img src={selectedReport.message.attachments[0]} alt="Evidence" />
                  )}
                  <a href="#" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>View Full Context</a>
                </div>
              </>
            )}

            {/* Moderation Actions */}
            <h4 className="section-title">Moderation Actions</h4>
            <div className="action-buttons">
              <button className="btn-action btn-investigate" onClick={() => handleAction(selectedReport._id, 'investigated', 'under_investigation')}>
                <Search size={16}/> Investigate
              </button>
              <button className="btn-action btn-resolve" onClick={() => handleAction(selectedReport._id, 'resolved', 'resolved')}>
                <CheckCircle size={16}/> Resolve Report
              </button>
              <button className="btn-action btn-reject" onClick={() => handleAction(selectedReport._id, 'rejected', 'rejected')}>
                <X size={16}/> Reject Report
              </button>
              <button className="btn-action btn-warn" onClick={() => handleAction(selectedReport._id, 'warned')}>
                <AlertCircle size={16}/> Warn User
              </button>
              <button className="btn-action btn-block" onClick={() => handleAction(selectedReport._id, 'banned')}>
                <Slash size={16}/> Block User
              </button>
              <button className="btn-action btn-suspend" onClick={() => handleAction(selectedReport._id, 'suspended')}>
                <Lock size={16}/> Suspend User
              </button>
              <button className="btn-action btn-delete">
                <Trash size={16}/> Delete / Archive
              </button>
              <button className="btn-action btn-suspend" style={{ background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1'}}>
                <ShieldAlert size={16}/> Escalate
              </button>
            </div>

            {/* Admin Note */}
            <h4 className="section-title">Admin Note</h4>
            <div className="admin-note-box">
              <textarea 
                placeholder="Add internal note (visible only to admins)..."
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
              />
              <button className="btn-add-note" onClick={() => handleAction(selectedReport._id, selectedReport.actionTaken || 'none')}>Add Note</button>
              <div style={{ clear: 'both' }}></div>
            </div>
            
            {/* Show existing notes if any */}
            {selectedReport.notes && (
              <div style={{ marginTop: '16px', background: '#fef3c7', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e', whiteSpace: 'pre-line' }}>
                <strong>Previous Notes:</strong><br/>
                {selectedReport.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsModeration;
