import { useState } from 'react';

const REPORT_CATEGORIES = [
  { value: 'harassment', label: '😤 Harassment / Abuse', desc: 'Threatening, bullying, or abusive behavior' },
  { value: 'spam', label: '📧 Spam', desc: 'Unwanted promotional or repetitive content' },
  { value: 'fake_account', label: '👤 Fake Account / Impersonation', desc: 'Pretending to be someone else' },
  { value: 'inappropriate', label: '🔞 Inappropriate Content', desc: 'Explicit, violent, or offensive material' },
  { value: 'fraud', label: '💸 Fraud / Scam', desc: 'Deceptive or fraudulent activity' },
  { value: 'other', label: '📋 Other', desc: 'Other violation of community guidelines' },
];

const ReportMessageModal = ({ message, onClose, onReport }) => {
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState('harassment');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState(1); // 1: select category, 2: confirm

  const selectedCat = REPORT_CATEGORIES.find((c) => c.value === category);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onReport({ category, reason: reason.trim() || selectedCat?.desc || 'Reported by user' });
      onClose();
    } catch {
      // error shown by parent toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'linear-gradient(135deg, #1a1d24 0%, #1e2130 100%)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 18,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          padding: '24px',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🚩
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Report this message
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#7e8596' }}>
              From {message?.sender?.name || 'User'} · This report goes directly to admins
            </span>
          </div>
        </div>

        {/* Quoted message */}
        {message?.message && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 10,
              borderLeft: '3px solid #ef4444',
              fontSize: '0.83rem',
              color: '#9aa0b2',
              marginBottom: 20,
              fontStyle: 'italic',
              maxHeight: 60,
              overflowY: 'auto',
            }}
          >
            "{message.message}"
          </div>
        )}

        {/* Step 1: Category selection */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9aa0b2', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 10 }}>
            Why are you reporting this?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REPORT_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: `1px solid ${category === cat.value ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  background: category === cat.value ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="report_category"
                  value={cat.value}
                  checked={category === cat.value}
                  onChange={() => setCategory(cat.value)}
                  style={{ accentColor: '#ef4444', width: 16, height: 16, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: category === cat.value ? '#f87171' : '#cbd5e1' }}>{cat.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 1 }}>{cat.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Additional details */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9aa0b2', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
            Additional details (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what happened..."
            maxLength={500}
            style={{
              width: '100%',
              minHeight: 72,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 12px',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '0.72rem', color: '#4b5563', textAlign: 'right', marginTop: 4 }}>
            {reason.length}/500
          </div>
        </div>

        {/* Privacy note */}
        <p style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: 20, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          🔒 Your report is confidential. The sender will not be notified. Admin will review this and take appropriate action.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#9aa0b2',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: submitting ? '#7f1d1d' : 'linear-gradient(135deg, #dc2626, #ef4444)',
              color: '#fff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: submitting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {submitting ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                Submitting...
              </>
            ) : (
              '🚩 Submit Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportMessageModal;
