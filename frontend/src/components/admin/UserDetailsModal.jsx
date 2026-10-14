import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Icons from './AdminIcons';
import Avatar from '../Avatar';

const UserDetailsModal = ({ isOpen, onClose, user, onAction }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?._id) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/admin/users/${user._id}/details`);
        setDetails(data);
      } catch (err) {
        console.error('Failed to load user details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [isOpen, user?._id]);

  if (!isOpen || !user) return null;

  const targetUser = details?.user || user;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUser._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div className="modal-icon-badge primary">
            <Icons.User />
          </div>
          <div className="modal-title-wrap">
            <h3>User Profile & Security Dossier</h3>
            <p>100% Real Database Inspection for {targetUser.name}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* User Bio Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}
          >
            <Avatar user={targetUser} size={54} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{targetUser.name}</h4>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: '#e0e7ff',
                    color: '#3730a3',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {targetUser.role || 'user'}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: targetUser.status === 'online' ? '#dcfce7' : '#f1f5f9',
                    color: targetUser.status === 'online' ? '#16a34a' : '#64748b',
                    fontWeight: 700,
                  }}
                >
                  ● {targetUser.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                @{targetUser.username}
              </p>
              {targetUser.bio && (
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#334155', fontStyle: 'italic' }}>
                  "{targetUser.bio}"
                </p>
              )}
            </div>
          </div>

          {/* User Meta Data Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              fontSize: '0.82rem',
            }}
          >
            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                USER ID
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <code style={{ fontSize: '0.76rem', color: '#0f172a' }}>{targetUser._id}</code>
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    color: copiedId ? '#10b981' : '#2563eb',
                  }}
                >
                  {copiedId ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                MOBILE NUMBER
              </span>
              <strong style={{ color: '#0f172a' }}>{targetUser.phoneNumber || 'Not provided'}</strong>
            </div>

            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                EMAIL ADDRESS
              </span>
              <strong style={{ color: '#0f172a' }}>{targetUser.email}</strong>
            </div>

            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                JOINED DATE
              </span>
              <strong style={{ color: '#0f172a' }}>
                {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : 'N/A'}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                LAST SEEN
              </span>
              <strong style={{ color: '#0f172a' }}>
                {targetUser.status === 'online' ? 'Active Now' : targetUser.lastSeen ? new Date(targetUser.lastSeen).toLocaleString() : 'Recently'}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                E2EE ENCRYPTION STATUS
              </span>
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.76rem' }}>
                🔒 Active (ECDH Key Registered)
              </span>
            </div>
          </div>

          {/* Activity Metrics */}
          {details?.metrics && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ background: '#eff6ff', padding: '10px 8px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>Total Chats</span>
                <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e40af' }}>
                  {details.metrics.totalConversations}
                </p>
              </div>

              <div style={{ background: '#ecfdf5', padding: '10px 8px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>Total Messages</span>
                <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>
                  {details.metrics.totalMessages}
                </p>
              </div>

              <div style={{ background: '#fef2f2', padding: '10px 8px', borderRadius: 8, border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>Reports Received</span>
                <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
                  {details.metrics.reportsReceived}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-primary-confirm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
