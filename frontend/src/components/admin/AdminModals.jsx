import React, { useState, useEffect } from 'react';
import Icons from './AdminIcons';
import Avatar from '../Avatar';

// Modal 1: Block User (Temporary / Permanent, Duration, Reason)
export const BlockUserModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [blockType, setBlockType] = useState('permanent'); // 'temporary' | 'permanent'
  const [blockDuration, setBlockDuration] = useState('24 Hours');
  const [customHours, setCustomHours] = useState('48');
  const [customUntil, setCustomUntil] = useState('');
  const [reason, setReason] = useState('Repeated spam messages and unsolicited links');
  const [customReason, setCustomReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);

  if (!isOpen || !user) return null;

  const finalReason = reason === 'Other' ? customReason.trim() || 'Administrative policy violation' : reason;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm(user, {
      blockType,
      banReason: finalReason,
      blockDuration,
      customHours: blockDuration === 'Custom' ? customHours : undefined,
      customUntil: blockDuration === 'Custom' && customUntil ? customUntil : undefined,
      notifyUser,
    });
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-icon-badge danger">
            <Icons.Ban />
          </div>
          <div className="modal-title-wrap">
            <h3>Block User Account</h3>
            <p>Restrict <strong>{user.name}</strong> (@{user.username || user.email}) from platform features</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Block Type Selection */}
          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
              BLOCK TYPE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                onClick={() => setBlockType('permanent')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: blockType === 'permanent' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                  background: blockType === 'permanent' ? 'rgba(239, 68, 68, 0.08)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#ef4444', fontSize: '0.88rem' }}>
                  <span>🚫 Permanent Block</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Account blocked indefinitely until manually lifted</span>
              </div>

              <div
                onClick={() => setBlockType('temporary')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: blockType === 'temporary' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                  background: blockType === 'temporary' ? 'rgba(245, 158, 11, 0.08)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#d97706', fontSize: '0.88rem' }}>
                  <span>⏳ Temporary Block</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Automatically expires after scheduled duration</span>
              </div>
            </div>
          </div>

          {/* Duration Options (if temporary block) */}
          {blockType === 'temporary' && (
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
                BLOCK DURATION
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                {['1 Hour', '24 Hours', '3 Days', '7 Days', '30 Days', 'Custom'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setBlockDuration(dur)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: blockDuration === dur ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                      background: blockDuration === dur ? '#fef3c7' : '#ffffff',
                      color: blockDuration === dur ? '#92400e' : '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {dur}
                  </button>
                ))}
              </div>

              {blockDuration === 'Custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                      Custom Duration (Hours):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8760"
                      className="modal-text-field"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      placeholder="e.g. 72"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                      Or Pick Exact Expiry Date & Time:
                    </label>
                    <input
                      type="datetime-local"
                      className="modal-text-field"
                      value={customUntil}
                      onChange={(e) => setCustomUntil(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
              BLOCK REASON
            </label>
            <select
              className="modal-select-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', marginBottom: reason === 'Other' ? 8 : 0 }}
            >
              <option value="Repeated spam messages and unsolicited links">Repeated spam messages and unsolicited links</option>
              <option value="Harassment and abusive behaviour in chats">Harassment and abusive behaviour</option>
              <option value="Fake or impersonated profile identity">Fake or impersonated profile identity</option>
              <option value="Terms of Service & Community Policy violation">Terms of Service & Community Policy violation</option>
              <option value="Suspicious automated bot traffic or fraud risk">Suspicious automated bot traffic or fraud risk</option>
              <option value="Other">Other (Custom reason)</option>
            </select>

            {reason === 'Other' && (
              <input
                type="text"
                className="modal-text-field"
                placeholder="Specify exact block reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            )}
          </div>

          {/* Notification Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#ef4444', cursor: 'pointer' }}
            />
            <span>🔔 Send instant real-time notification to user upon restriction</span>
          </label>

          <p className="modal-disclaimer" style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4 }}>
            🔒 <strong>Audit Record:</strong> This action will be permanently recorded in the Super Admin Audit Log with your ID, timestamp, and client IP.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-danger-confirm" onClick={handleSubmit}>
            Confirm {blockType === 'temporary' ? 'Temporary' : 'Permanent'} Block
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 2: Suspend User (Presets 1h, 24h, 3d, 7d, 30d, Custom, Reason)
export const SuspendUserModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [duration, setDuration] = useState('24 Hours');
  const [customHours, setCustomHours] = useState('48');
  const [customUntil, setCustomUntil] = useState('');
  const [reason, setReason] = useState('Under moderation review for suspicious behavior');

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm(user, {
      duration,
      customHours: duration === 'Custom' ? customHours : undefined,
      customUntil: duration === 'Custom' && customUntil ? customUntil : undefined,
      suspendReason: reason.trim() || 'Administrative suspension',
    });
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-icon-badge warning">
            <Icons.PauseCircle />
          </div>
          <div className="modal-title-wrap">
            <h3>Suspend User Account</h3>
            <p>Temporarily deactivate access for <strong>{user.name}</strong> (@{user.username || user.email})</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
              SUSPENSION DURATION
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
              {['1 Hour', '24 Hours', '3 Days', '7 Days', '30 Days', 'Custom'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDuration(opt)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: duration === opt ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                    background: duration === opt ? '#fef3c7' : '#ffffff',
                    color: duration === opt ? '#92400e' : '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {duration === 'Custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Custom Duration (Hours):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    className="modal-text-field"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Or Pick Exact End Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    className="modal-text-field"
                    value={customUntil}
                    onChange={(e) => setCustomUntil(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
              SUSPENSION REASON
            </label>
            <input
              type="text"
              className="modal-text-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Unusual login spikes, pending complaint investigation"
              required
            />
          </div>

          <p className="modal-disclaimer" style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>
            User will be logged out and cannot send messages. Real-time timer will count down until automatic restoration.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-warning-confirm" onClick={handleSubmit}>
            Suspend User ({duration})
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 2b: Extend Suspension Duration
export const ExtendSuspensionModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [duration, setDuration] = useState('24 Hours');
  const [customHours, setCustomHours] = useState('24');
  const [customUntil, setCustomUntil] = useState('');
  const [reason, setReason] = useState('Suspension extended due to additional investigation');

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm(user, {
      duration,
      customHours: duration === 'Custom' ? customHours : undefined,
      customUntil: duration === 'Custom' && customUntil ? customUntil : undefined,
      reason: reason.trim() || 'Suspension extended by administrator',
    });
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-icon-badge warning">
            <Icons.Clock />
          </div>
          <div className="modal-title-wrap">
            <h3>Extend Suspension</h3>
            <p>Add more time to <strong>{user.name}</strong>'s current suspension</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {user.suspendedUntil && (
            <div style={{ background: '#fef3c7', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', color: '#92400e' }}>
              Current Expiry: <strong>{new Date(user.suspendedUntil).toLocaleString()}</strong>
            </div>
          )}

          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
              ADDITIONAL DURATION
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
              {['1 Hour', '24 Hours', '3 Days', '7 Days', '30 Days', 'Custom'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDuration(opt)}
                  style={{
                    padding: '8px',
                    borderRadius: 8,
                    border: duration === opt ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                    background: duration === opt ? '#fef3c7' : '#ffffff',
                    color: duration === opt ? '#92400e' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  +{opt}
                </button>
              ))}
            </div>

            {duration === 'Custom' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  type="number"
                  min="1"
                  className="modal-text-field"
                  placeholder="Extra hours"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
              EXTENSION REASON
            </label>
            <input
              type="text"
              className="modal-text-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Continued policy non-compliance"
              required
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-warning-confirm" onClick={handleSubmit}>
            Extend Suspension (+{duration})
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 3: Delete / Archive Account (OWASP Compliant Soft-Delete with Retention Policy)
export const DeleteUserModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [deletionType, setDeletionType] = useState('Admin action'); // 'Admin action' | 'User requested' | 'Policy violation'
  const [deleteReason, setDeleteReason] = useState('Violation of platform acceptable use policy');
  const [retentionDays, setRetentionDays] = useState(30);
  const [notes, setNotes] = useState('');

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm(user, {
      deletionType,
      reason: deleteReason.trim() || 'Administrative deletion',
      retentionDays: Number(retentionDays) || 30,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-icon-badge danger">
            <Icons.Trash />
          </div>
          <div className="modal-title-wrap">
            <h3>Archive & Delete User Account</h3>
            <p>OWASP Soft-Deletion with Retention Policy for <strong>{user.name}</strong></p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* OWASP Notice */}
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, borderLeft: '4px solid #3b82f6', fontSize: '0.8rem', color: '#334155', lineHeight: 1.45 }}>
            🛡️ <strong>OWASP Archiving Standard:</strong> User is deactivated and securely archived rather than immediately destroyed. Account can be restored within the retention window if needed, protecting legitimate users and audit integrity.
          </div>

          {/* Deletion Type */}
          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
              DELETION TYPE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['Admin action', 'User requested', 'Policy violation'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDeletionType(type)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 8,
                    border: deletionType === type ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    background: deletionType === type ? '#fef2f2' : '#ffffff',
                    color: deletionType === type ? '#dc2626' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Deletion Reason */}
          <div>
            <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
              DELETION REASON
            </label>
            <input
              type="text"
              className="modal-text-field"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Terms violation, severe abuse, user account closure request"
              required
            />
          </div>

          {/* Retention Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                RETENTION POLICY
              </label>
              <select
                className="modal-select-field"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
              >
                <option value={7}>7 Days Retention</option>
                <option value={15}>15 Days Retention</option>
                <option value={30}>30 Days (Standard)</option>
                <option value={60}>60 Days Retention</option>
                <option value={90}>90 Days Retention</option>
              </select>
            </div>
            <div>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                ADMIN AUDIT NOTES
              </label>
              <input
                type="text"
                className="modal-text-field"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional internal notes"
              />
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-danger-confirm" onClick={handleSubmit}>
            Archive & Soft Delete ({retentionDays}d Retention)
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 3b: Permanent Purge Confirmation Modal (Irreversible action)
export const PurgeConfirmModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [confirmName, setConfirmName] = useState('');

  if (!isOpen || !user) return null;

  const isMatched = confirmName.trim().toLowerCase() === (user.username || user.name || '').trim().toLowerCase();

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-icon-badge danger" style={{ background: '#7f1d1d', color: '#ffffff' }}>
            <Icons.Trash />
          </div>
          <div className="modal-title-wrap">
            <h3 style={{ color: '#b91c1c' }}>Permanently Purge Account?</h3>
            <p>Irreversible data anonymization for <strong>{user.name}</strong></p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 8, fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.5 }}>
            ⚠️ <strong>DANGER — IRREVERSIBLE PURGE:</strong>
            <br />
            Once purged, personal data (bio, contacts, sessions) will be erased and the account marked permanently destroyed. <strong>It CANNOT be restored afterwards by any admin.</strong>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: 6 }}>
              Type <strong>{user.username || user.name}</strong> to confirm:
            </label>
            <input
              type="text"
              className="modal-text-field"
              placeholder={`Type "${user.username || user.name}" here`}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-danger-confirm"
            disabled={!isMatched}
            style={{ opacity: isMatched ? 1 : 0.45, cursor: isMatched ? 'pointer' : 'not-allowed' }}
            onClick={() => {
              onConfirm(user);
              onClose();
            }}
          >
            Permanently Purge
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 3c: History Log Modal (Reusable for Block History, Suspension History, Deletion Audit)
export const HistoryLogModal = ({ isOpen, onClose, title, user, type = 'block', history = [] }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div className="modal-icon-badge primary">
            <Icons.FileText />
          </div>
          <div className="modal-title-wrap">
            <h3>{title}</h3>
            <p>Audit trail for <strong>{user.name}</strong> (@{user.username || user.email})</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b' }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>📜</span>
              No previous {type} history records logged for this account.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          item.action === 'block' || item.action === 'delete' || item.action === 'purge'
                            ? '#fee2e2'
                            : item.action === 'suspend' || item.action === 'extend'
                            ? '#fef3c7'
                            : '#dcfce7',
                        color:
                          item.action === 'block' || item.action === 'delete' || item.action === 'purge'
                            ? '#dc2626'
                            : item.action === 'suspend' || item.action === 'extend'
                            ? '#d97706'
                            : '#16a34a',
                      }}
                    >
                      {item.action} {item.blockType ? `(${item.blockType})` : ''} {item.duration ? `(${item.duration})` : ''}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {new Date(item.createdAt || item.performedAt || item.blockedAt || item.startedAt || Date.now()).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>
                    <strong>Reason:</strong> {item.reason || 'No reason provided'}
                  </div>

                  {item.notes && (
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      <strong>Notes:</strong> {item.notes}
                    </div>
                  )}

                  {item.expiryDate && (
                    <div style={{ fontSize: '0.76rem', color: '#d97706' }}>
                      <strong>Expiry Date:</strong> {new Date(item.expiryDate).toLocaleString()}
                    </div>
                  )}

                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Admin: <strong>{item.adminName || 'Super Admin'}</strong>
                  </div>
                </div>
              ))}
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

// Modal 3d: Super Admin Action Modal (Search & Select Any User to Block, Suspend, or Delete)
export const SuperAdminActionModal = ({ isOpen, onClose, allUsers = [], mode = 'block', onConfirmAction }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const matchingUsers = allUsers.filter((u) => {
    if (u.role === 'superadmin') return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q)
    );
  });

  const selectedUser = allUsers.find((u) => u._id === selectedUserId);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-icon-badge primary">
            <Icons.User />
          </div>
          <div className="modal-title-wrap">
            <h3>Select User to {mode.charAt(0).toUpperCase() + mode.slice(1)}</h3>
            <p>Super Admin control: apply restrictions to any registered account</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            className="modal-text-field"
            placeholder="Search user by name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            {matchingUsers.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                No matching users found
              </div>
            ) : (
              matchingUsers.slice(0, 30).map((u) => (
                <div
                  key={u._id}
                  onClick={() => setSelectedUserId(u._id)}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: selectedUserId === u._id ? '#eff6ff' : '#ffffff',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      @{u.username} • {u.email || u.phoneNumber}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: u.isBanned ? '#fee2e2' : u.isSuspended ? '#fef3c7' : '#dcfce7',
                      color: u.isBanned ? '#dc2626' : u.isSuspended ? '#d97706' : '#16a34a',
                      fontWeight: 700,
                    }}
                  >
                    {u.isBanned ? 'Blocked' : u.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary-confirm"
            disabled={!selectedUser}
            style={{ opacity: selectedUser ? 1 : 0.45, cursor: selectedUser ? 'pointer' : 'not-allowed' }}
            onClick={() => {
              if (selectedUser) {
                onConfirmAction(selectedUser);
                onClose();
              }
            }}
          >
            Continue with {selectedUser?.name || 'Selected User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 3b: Send Direct System Notification to a User
export const NotifyUserModal = ({ isOpen, onClose, user, onSend }) => {
  const [title, setTitle] = useState('Security Alert');
  const [message, setMessage] = useState('Your account was accessed from a new device.');

  if (!isOpen || !user) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-badge info">
            <Icons.Bell />
          </div>
          <div className="modal-title-wrap">
            <h3>Send System Notification</h3>
            <p>Deliver an instant high-priority alert to <strong>{user.name}</strong> ({user.phoneNumber || user.email}).</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <label className="modal-input-label">Notification Title:</label>
          <input
            type="text"
            className="modal-text-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Security Alert, Policy Reminder"
          />

          <label className="modal-input-label" style={{ marginTop: 12 }}>Message Body:</label>
          <textarea
            className="modal-textarea-field"
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Your account was accessed from a new device."
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary-confirm"
            disabled={!message.trim()}
            onClick={() => {
              onSend(user, title, message);
              onClose();
            }}
          >
            <Icons.Send />
            <span>Send Notification</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 4: Broadcast Announcement / Notifications
export const BroadcastModal = ({ isOpen, onClose, onSend, users = [] }) => {
  const [title, setTitle] = useState('📢 Official Platform Announcement');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('announcement');
  const [level, setLevel] = useState('info');
  const [targetType, setTargetType] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [sendAsChatMessage, setSendAsChatMessage] = useState(true);

  if (!isOpen) return null;

  const categories = [
    { id: 'announcement', lvl: 'info', label: '📢 Announcement', desc: 'General Updates & Features', defaultTitle: '📢 Official Platform Announcement' },
    { id: 'warning', lvl: 'warning', label: '⚠️ System Warning', desc: 'Security & Caution Alert', defaultTitle: '⚠️ Important System & Security Warning' },
    { id: 'maintenance', lvl: 'warning', label: '🛠️ Maintenance', desc: 'Software & Server Maintenance', defaultTitle: '🛠️ Scheduled Software Maintenance Notice' },
    { id: 'critical', lvl: 'critical', label: '🚨 Critical Alert', desc: 'Urgent System Advisory', defaultTitle: '🚨 Urgent Security Advisory' },
  ];

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div className="modal-icon-badge info">
            <Icons.Bell />
          </div>
          <div className="modal-title-wrap">
            <h3>Send System Notification / Announcement</h3>
            <p>Broadcast real-time notice & send official message to all Batiyao users.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <label className="modal-input-label">Notice Type & Category:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            {categories.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`filter-pill-btn ${category === t.id ? 'active' : ''}`}
                style={{ padding: '8px 10px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', textAlign: 'left' }}
                onClick={() => {
                  setCategory(t.id);
                  setLevel(t.lvl);
                  setTitle(t.defaultTitle);
                }}
              >
                <strong>{t.label}</strong>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>{t.desc}</span>
              </button>
            ))}
          </div>

          <label className="modal-input-label">Target Audience:</label>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="targetAudience"
                value="all"
                checked={targetType === 'all'}
                onChange={() => setTargetType('all')}
              />
              <span>All Batiyao Users ({users.length || 'Platform'})</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="targetAudience"
                value="selected"
                checked={targetType === 'selected'}
                onChange={() => setTargetType('selected')}
              />
              <span>Specific User</span>
            </label>
          </div>

          {targetType === 'selected' && (
            <div style={{ marginBottom: 12 }}>
              <label className="modal-input-label">Select User:</label>
              <select
                className="modal-select-field"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Choose User --</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.phoneNumber || u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="modal-input-label">Announcement Title:</label>
          <input
            type="text"
            className="modal-text-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled Software Maintenance Tonight"
          />

          <label className="modal-input-label" style={{ marginTop: 12 }}>Message Body:</label>
          <textarea
            className="modal-textarea-field"
            rows="4"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the announcement or warning details here..."
            maxLength={600}
          />
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: 4 }}>
            {content.length}/600
          </div>

          {/* Delivery Channel Toggles */}
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={sendAsChatMessage}
                onChange={(e) => setSendAsChatMessage(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#00a884' }}
              />
              <span>💬 Deliver as Official Message from Batiyao in user's chat list</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '0.74rem', color: '#64748b' }}>
              Ensures even offline users can read this announcement in their chats when they log in.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary-confirm"
            disabled={!content.trim() || (targetType === 'selected' && !selectedUserId)}
            onClick={() => {
              onSend({
                title,
                content,
                category,
                level,
                target: targetType,
                targetUserIds: targetType === 'selected' && selectedUserId ? [selectedUserId] : [],
                sendAsChatMessage,
              });
              setContent('');
              onClose();
            }}
          >
            <Icons.Send />
            <span>Broadcast Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal 5: Change Password (100% Real API)
export const ChangePasswordModal = ({ isOpen, onClose, showToast }) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPwd.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const api = (await import('../../services/api.js')).default;
      await api.put('/admin/profile/password', {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });

      setSuccess(true);
      if (showToast) showToast('Password successfully changed!');
      setTimeout(() => {
        setSuccess(false);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Check current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-badge primary">
            <Icons.Lock />
          </div>
          <div className="modal-title-wrap">
            <h3>Change Admin Password</h3>
            <p>Update credentials for this administrator console account.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {success ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '24px 0' }}>
            <Icons.CheckCircle style={{ width: 44, height: 44, color: '#10B981', margin: '0 auto 12px' }} />
            <h4 style={{ color: '#0f172a' }}>Password Changed Successfully</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div style={{ padding: 10, borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <label className="modal-input-label">Current Password:</label>
              <input
                type="password"
                required
                className="modal-text-field"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
              />

              <label className="modal-input-label" style={{ marginTop: 12 }}>New Password:</label>
              <input
                type="password"
                required
                className="modal-text-field"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />

              <label className="modal-input-label" style={{ marginTop: 12 }}>Confirm New Password:</label>
              <input
                type="password"
                required
                className="modal-text-field"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary-confirm" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Modal 6: Two Factor Authentication Setup Modal
export const TwoFactorModal = ({ isOpen, onClose, enabled, onSave }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!enabled && (!pin || pin.length !== 6 || !/^\d+$/.test(pin))) {
      setError('Please enter a 6-digit numeric security PIN.');
      return;
    }
    onSave(!enabled, pin);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-badge primary">
            <Icons.Shield />
          </div>
          <div className="modal-title-wrap">
            <h3>{enabled ? 'Disable' : 'Enable'} Two-Factor Authentication</h3>
            <p>Add an extra layer of protection to your administrative console account.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: 8, borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', marginBottom: 12 }}>
                {error}
              </div>
            )}
            {!enabled ? (
              <>
                <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 12 }}>
                  Set a 6-digit Security PIN that will be required during console login.
                </p>
                <label className="modal-input-label">Set 6-Digit PIN:</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="e.g. 123456"
                  className="modal-text-field"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                Are you sure you want to disable 2FA? Your account will only be protected by your password.
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary-confirm">
              {enabled ? 'Confirm Disable 2FA' : 'Enable 2FA Protection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal 11: Unblock User (Reason, Confirmation, Optional Notification, Audit trail)
export const UnblockUserModal = ({ isOpen, onClose, user, onConfirm, currentAdminName = 'Admin' }) => {
  const [reason, setReason] = useState('User appeal accepted following review');
  const [customReason, setCustomReason] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);

  if (!isOpen || !user) return null;

  const finalReason = reason === 'Other' ? customReason.trim() || 'Block lifted by administrator' : reason;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isConfirmed) return;
    onConfirm(user, {
      reason: finalReason,
      notifyUser,
    });
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-icon-badge success" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Icons.Unlock style={{ width: 22, height: 22 }} />
          </div>
          <div className="modal-title-wrap">
            <h3 style={{ color: '#0f172a' }}>Lift Account Restriction (Unblock)</h3>
            <p>Restore full platform permissions for <strong>{user.name}</strong> (@{user.username || user.email})</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* User identity preview badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <Avatar user={user} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  User ID: <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: 4 }}>{user._id}</code>
                </div>
              </div>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: '#fee2e2',
                  color: '#dc2626',
                }}
              >
                Currently Blocked
              </span>
            </div>

            {/* Unblock Reason Selection */}
            <div>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                UNBLOCK REASON <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="modal-select-field"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%', marginBottom: reason === 'Other' ? 8 : 0 }}
              >
                <option value="User appeal accepted following review">User appeal accepted following review</option>
                <option value="False positive flag - identity verified">False positive flag - identity verified</option>
                <option value="Temporary restriction duration successfully served">Temporary restriction duration successfully served</option>
                <option value="Account terms re-acknowledged by user">Account terms re-acknowledged by user</option>
                <option value="Administrative discretion">Administrative discretion</option>
                <option value="Other">Other (Specify custom reason)</option>
              </select>

              {reason === 'Other' && (
                <input
                  type="text"
                  className="modal-text-field"
                  placeholder="Enter detailed reason for unblocking..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Optional Notification Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.82rem',
                color: '#334155',
                cursor: 'pointer',
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              <input
                type="checkbox"
                checked={notifyUser}
                onChange={(e) => setNotifyUser(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span>
                🔔 <strong>Send unblock notification to user</strong> (Alert via real-time system banner)
              </span>
            </label>

            {/* Audit Log Recording Metadata */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: '#1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Unblock Timestamp:</span>
                <strong>{new Date().toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Admin Audit Log:</span>
                <strong style={{ color: '#0284c7' }}>🛡️ {currentAdminName}</strong>
              </div>
            </div>

            {/* Mandatory Confirmation Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: '0.82rem',
                color: '#0f172a',
                cursor: 'pointer',
                padding: '8px 4px',
              }}
            >
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, accentColor: '#10b981', cursor: 'pointer' }}
                required
              />
              <span>
                <strong>Confirmation Required:</strong> I confirm that I want to remove all restrictions and restore messaging, calls, and session access for this account.
              </span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              disabled={!isConfirmed}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                background: isConfirmed ? '#10b981' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isConfirmed ? 'pointer' : 'not-allowed',
                boxShadow: isConfirmed ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              ✓ Confirm & Lift Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal 12: Change Block Reason Modal
export const ChangeBlockReasonModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [reason, setReason] = useState(user?.banReason || 'Terms of Service & Community Policy violation');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !user) return null;

  const finalReason = reason === 'Other' ? customReason.trim() || 'Policy violation' : reason;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm(user, finalReason);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-icon-badge warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
            <Icons.Edit style={{ width: 20, height: 20 }} />
          </div>
          <div className="modal-title-wrap">
            <h3>Change Block Reason</h3>
            <p>Update official restriction justification for <strong>{user.name}</strong></p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block' }}>CURRENT REASON:</span>
              <strong style={{ color: '#b91c1c' }}>"{user.banReason || 'None specified'}"</strong>
            </div>

            <div>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                NEW BLOCK REASON
              </label>
              <select
                className="modal-select-field"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%', marginBottom: reason === 'Other' ? 8 : 0 }}
              >
                <option value="Repeated spam messages and unsolicited links">Repeated spam messages and unsolicited links</option>
                <option value="Harassment and abusive behaviour in chats">Harassment and abusive behaviour in chats</option>
                <option value="Fake or impersonated profile identity">Fake or impersonated profile identity</option>
                <option value="Terms of Service & Community Policy violation">Terms of Service & Community Policy violation</option>
                <option value="Suspicious automated bot traffic or fraud risk">Suspicious automated bot traffic or fraud risk</option>
                <option value="Severe violation under ongoing moderation investigation">Severe violation under ongoing moderation investigation</option>
                <option value="Other">Other (Custom reason)</option>
              </select>

              {reason === 'Other' && (
                <input
                  type="text"
                  className="modal-text-field"
                  placeholder="Specify new block reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                />
              )}
            </div>

            <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>
              ℹ️ Updating the reason appends a new audit record to this account's block history.
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary-confirm">
              Update Reason
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal 13: Extend Block Duration Modal
export const ExtendBlockModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [duration, setDuration] = useState('24 Hours');
  const [customHours, setCustomHours] = useState('24');
  const [customUntil, setCustomUntil] = useState('');
  const [reason, setReason] = useState('Additional time required for moderation review');

  if (!isOpen || !user) return null;

  // Calculate preview of new expiry
  const getPreviewExpiry = () => {
    const base = user.blockExpiryDate && new Date(user.blockExpiryDate) > new Date()
      ? new Date(user.blockExpiryDate).getTime()
      : Date.now();
    let ms = 24 * 60 * 60 * 1000;
    if (duration === '1 Hour') ms = 1 * 60 * 60 * 1000;
    else if (duration === '24 Hours') ms = 24 * 60 * 60 * 1000;
    else if (duration === '3 Days') ms = 3 * 24 * 60 * 60 * 1000;
    else if (duration === '7 Days') ms = 7 * 24 * 60 * 60 * 1000;
    else if (duration === '30 Days') ms = 30 * 24 * 60 * 60 * 1000;
    else if (duration === 'Custom') {
      if (customUntil) return new Date(customUntil).toLocaleString();
      if (customHours) ms = Number(customHours) * 60 * 60 * 1000;
    }
    return new Date(base + ms).toLocaleString();
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm(user, {
      duration,
      customHours: duration === 'Custom' ? customHours : undefined,
      customUntil: duration === 'Custom' && customUntil ? customUntil : undefined,
      reason: reason.trim() || 'Block duration extended by administrator',
    });
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-icon-badge warning">
            <Icons.Clock />
          </div>
          <div className="modal-title-wrap">
            <h3>Extend Block Duration</h3>
            <p>Add more time to <strong>{user.name}</strong>'s temporary restriction</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {user.blockExpiryDate && (
              <div style={{ background: '#fef3c7', padding: '10px 12px', borderRadius: 8, fontSize: '0.82rem', color: '#92400e' }}>
                Current Expiry: <strong>{new Date(user.blockExpiryDate).toLocaleString()}</strong>
              </div>
            )}

            <div>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
                ADDITIONAL DURATION
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                {['1 Hour', '24 Hours', '3 Days', '7 Days', '30 Days', 'Custom'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDuration(opt)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: duration === opt ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                      background: duration === opt ? '#fef3c7' : '#ffffff',
                      color: duration === opt ? '#92400e' : '#334155',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    +{opt}
                  </button>
                ))}
              </div>

              {duration === 'Custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                      Additional Hours:
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="modal-text-field"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                      Or Pick Exact New End Date & Time:
                    </label>
                    <input
                      type="datetime-local"
                      className="modal-text-field"
                      value={customUntil}
                      onChange={(e) => setCustomUntil(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', color: '#1e40af' }}>
              🗓️ <strong>New Calculated Expiry:</strong> {getPreviewExpiry()}
            </div>

            <div>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                EXTENSION REASON
              </label>
              <input
                type="text"
                className="modal-text-field"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Additional investigation needed"
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-warning-confirm">
              Extend Duration (+{duration})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal 14: Make Permanent Block Modal
export const MakePermanentBlockModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [reason, setReason] = useState('Upgraded to permanent block following repeated or severe policy violations');
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isConfirmed) return;
    onConfirm(user, reason.trim());
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-icon-badge danger">
            <Icons.Ban />
          </div>
          <div className="modal-title-wrap">
            <h3 style={{ color: '#b91c1c' }}>Convert to Permanent Block</h3>
            <p>Upgrade <strong>{user.name}</strong> from temporary to permanent block</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: 8, fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.5 }}>
              ⚠️ <strong>PERMANENT RESTRICTION:</strong>
              <br />
              This will remove the expiration date and permanently lock this account. The user will be unable to log in, send messages, or initiate calls indefinitely until manually lifted by an administrator.
            </div>

            <div>
              <label className="modal-input-label" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                JUSTIFICATION / REASON
              </label>
              <textarea
                className="modal-textarea-field"
                rows="2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', cursor: 'pointer', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: '#ef4444', cursor: 'pointer' }}
                required
              />
              <span>I confirm that I want to convert this account's block to permanent.</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              disabled={!isConfirmed}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                background: isConfirmed ? '#dc2626' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isConfirmed ? 'pointer' : 'not-allowed',
                boxShadow: isConfirmed ? '0 2px 8px rgba(220, 38, 38, 0.3)' : 'none',
              }}
            >
              Confirm Permanent Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal 15: Blocked User Profile / Details Modal (100% Matches Requirement 1)
export const BlockedUserDetailsModal = ({
  isOpen,
  onClose,
  user,
  onChangeReason,
  onExtendBlock,
  onMakePermanent,
  onUnblock,
  onViewHistory,
}) => {
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');

  // Live Countdown Timer for temporary block
  useEffect(() => {
    if (!user || user.blockType !== 'temporary' || !user.blockExpiryDate) {
      setRemainingTime('');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(user.blockExpiryDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingTime('Expired (Pending auto-lift)');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setRemainingTime(`${days}d ${hours}h ${mins}m ${secs}s remaining`);
      } else {
        setRemainingTime(`${hours}h ${mins}m ${secs}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user]);

  if (!isOpen || !user) return null;

  const isTemp = user.blockType === 'temporary';

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(user._id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedCreatedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' +
      new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not available';

  const formattedLastLogin = user.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' +
      new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : user.updatedAt
    ? new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Recently)'
    : 'Not recorded';

  const formattedLastActive = user.status === 'online'
    ? 'Active Online'
    : user.lastSeen
    ? new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today'
    : 'Offline';

  const formattedBlockedDate = user.blockedAt
    ? new Date(user.blockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' +
      new Date(user.blockedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recently';

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 660, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: '20px 24px',
            background: isTemp
              ? 'linear-gradient(135deg, #78350f 0%, #b45309 100%)'
              : 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Avatar user={user} size={56} />
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: isTemp ? '#f59e0b' : '#ef4444',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#ffffff',
                  fontWeight: 900,
                }}
              >
                ✕
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {user.name}
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: 'rgba(255,255,255,0.22)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {isTemp ? '⏳ TEMPORARY BLOCK' : '🚫 PERMANENT BLOCK'}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 2 }}>
                @{user.username || 'username'} • Role: {user.role || 'user'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#ffffff',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Details Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Requirement 1: User Profile / Details 14 Fields */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              👤 User Profile & Account Information
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                background: '#f8fafc',
                padding: '14px',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Full Name
                </span>
                <strong style={{ color: '#0f172a' }}>{user.name}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  User ID
                </span>
                <span
                  onClick={handleCopyId}
                  title="Click to copy User ID"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    color: copied ? '#10b981' : '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: 4, fontSize: '0.76rem' }}>
                    {user._id}
                  </code>
                  <span>{copied ? '✓ Copied' : '📋'}</span>
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Mobile Number
                </span>
                <strong style={{ color: '#0f172a' }}>📱 {user.phoneNumber || 'Not provided'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Email Address
                </span>
                <strong style={{ color: '#0f172a' }}>✉️ {user.email}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Account Created Date
                </span>
                <span style={{ color: '#334155' }}>🗓️ {formattedCreatedDate}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Last Login
                </span>
                <span style={{ color: '#334155' }}>🔑 {formattedLastLogin}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Last Active
                </span>
                <span style={{ color: user.status === 'online' ? '#10b981' : '#64748b', fontWeight: 600 }}>
                  ● {formattedLastActive}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Account Status
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: isTemp ? '#fef3c7' : '#fee2e2',
                    color: isTemp ? '#b45309' : '#dc2626',
                  }}
                >
                  {isTemp ? 'Temporarily Blocked' : 'Permanently Blocked'}
                </span>
              </div>
            </div>
          </div>

          {/* Block Enforcement Details */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🚫 Block Enforcement Information
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                background: isTemp ? 'rgba(245, 158, 11, 0.06)' : 'rgba(239, 68, 68, 0.05)',
                padding: '14px',
                borderRadius: 12,
                border: isTemp ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Blocked Date & Time
                </span>
                <strong style={{ color: '#0f172a' }}>{formattedBlockedDate}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  {user.isPeerBlocked ? 'Blocked By (Contact / User)' : 'Blocked By (Administrator)'}
                </span>
                <strong style={{ color: user.isPeerBlocked ? '#7c3aed' : '#0284c7' }}>
                  {user.isPeerBlocked ? '👤 ' : '🛡️ '}
                  {user.blockedByName || user.blockedBy?.name || user.blockerName || 'Super Admin'}
                </strong>
                {(user.blockedBy?.email || user.blockerUsername) && (
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                    ({user.blockedBy?.email || `@${user.blockerUsername}`})
                  </span>
                )}
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Block Type
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    background: user.isPeerBlocked ? '#ede9fe' : isTemp ? '#fde68a' : '#fecaca',
                    color: user.isPeerBlocked ? '#6d28d9' : isTemp ? '#92400e' : '#991b1b',
                  }}
                >
                  {user.isPeerBlocked ? '👥 Contact Block' : isTemp ? '⏳ Temporary Block' : '🚫 Permanent Block'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Block Expiry Date
                </span>
                {user.isPeerBlocked ? (
                  <span style={{ color: '#7c3aed', fontWeight: 600 }}>Contact Privacy Restriction</span>
                ) : isTemp ? (
                  <div>
                    <strong style={{ color: '#b45309' }}>
                      {user.blockExpiryDate ? new Date(user.blockExpiryDate).toLocaleString() : 'N/A'}
                    </strong>
                    {remainingTime && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.74rem',
                          color: '#d97706',
                          fontWeight: 700,
                          marginTop: 2,
                        }}
                      >
                        ⏱️ {remainingTime}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#64748b' }}>No expiration (Permanent lock)</span>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>
                  Block Reason
                </span>
                <div
                  style={{
                    background: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    marginTop: 4,
                  }}
                >
                  "{user.banReason || 'Violation of community policies'}"
                </div>
              </div>
            </div>
          </div>

          {/* Previous Blocking History (Collapsible / Timeline) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📜 Previous Blocking History ({user.blockHistory?.length || 0})
              </h4>
              <button
                onClick={() => onViewHistory && onViewHistory(user)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                View Full Audit Modal →
              </button>
            </div>

            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff' }}>
              {!user.blockHistory || user.blockHistory.length === 0 ? (
                <div style={{ padding: 14, textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
                  No prior block history logged for this account.
                </div>
              ) : (
                user.blockHistory.slice().reverse().map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '0.76rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          marginRight: 6,
                          background: item.action === 'unblock' ? '#dcfce7' : item.action === 'extend' ? '#fef3c7' : '#fee2e2',
                          color: item.action === 'unblock' ? '#16a34a' : item.action === 'extend' ? '#d97706' : '#dc2626',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.action}
                      </span>
                      <span style={{ color: '#1e293b' }}>{item.reason}</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', flexShrink: 0, marginLeft: 10 }}>
                      {new Date(item.createdAt || item.blockedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Quick Actions Controls */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => {
                onClose();
                onChangeReason(user);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✏️ Change Reason
            </button>

            {isTemp && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onExtendBlock(user);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⏳ Extend Duration
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onMakePermanent(user);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🚫 Make Permanent
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                onClose();
                onUnblock(user);
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                background: '#10b981',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              }}
            >
              🔓 Unblock User
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


