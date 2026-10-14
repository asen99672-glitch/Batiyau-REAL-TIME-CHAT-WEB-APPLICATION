import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Loading spinner component
const LoadingScreen = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
    </div>
  </div>
);

// Protected route - agar logged in nahi hai toh login pe bhejo
export const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.isBanned) {
    const isTemp = user.blockType === 'temporary';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary, #0c151c)',
          color: 'var(--text-primary, #e9edef)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            color: '#ef4444',
            fontSize: '32px',
          }}
        >
          🚫
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8, color: '#f87171' }}>
          Account {isTemp ? 'Temporarily Restricted' : 'Permanently Blocked'}
        </h2>
        <p style={{ maxWidth: 480, fontSize: '0.94rem', color: 'var(--text-secondary, #8696a0)', lineHeight: 1.6, marginBottom: 16 }}>
          {user.banReason
            ? `Reason: "${user.banReason}"`
            : 'Your account access has been restricted by an administrator due to community policy violations.'}
        </p>
        {isTemp && user.blockExpiryDate && (
          <div
            style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '8px 16px',
              borderRadius: 8,
              marginBottom: 20,
              fontWeight: 700,
              fontSize: '0.86rem',
            }}
          >
            ⏳ Restriction Expires: {new Date(user.blockExpiryDate).toLocaleString()}
          </div>
        )}
        <button
          onClick={logout}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Log Out
        </button>
      </div>
    );
  }

  if (user?.isSuspended) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary, #0c151c)',
          color: 'var(--text-primary, #e9edef)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            color: '#f59e0b',
            fontSize: '32px',
          }}
        >
          ⏸️
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8, color: '#fbbf24' }}>
          Account Temporarily Suspended
        </h2>
        <p style={{ maxWidth: 480, fontSize: '0.94rem', color: 'var(--text-secondary, #8696a0)', lineHeight: 1.6, marginBottom: 16 }}>
          {user.suspendReason
            ? `Reason: "${user.suspendReason}"`
            : 'Your account access has been temporarily suspended by an administrator.'}
        </p>
        {user.suspendedUntil && (
          <div
            style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '8px 16px',
              borderRadius: 8,
              marginBottom: 20,
              fontWeight: 700,
              fontSize: '0.86rem',
            }}
          >
            ⏳ Suspension Concludes: {new Date(user.suspendedUntil).toLocaleString()}
          </div>
        )}
        <button
          onClick={logout}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Log Out
        </button>
      </div>
    );
  }

  if (user?.isDeleted) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary, #0c151c)',
          color: 'var(--text-primary, #e9edef)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(100, 116, 139, 0.15)',
            border: '2px solid rgba(100, 116, 139, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            color: '#94a3b8',
            fontSize: '32px',
          }}
        >
          🗑️
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8, color: '#94a3b8' }}>
          Account Archived / Marked as Deleted
        </h2>
        <p style={{ maxWidth: 480, fontSize: '0.94rem', color: 'var(--text-secondary, #8696a0)', lineHeight: 1.6, marginBottom: 16 }}>
          {user.deletionReason
            ? `Reason: "${user.deletionReason}"`
            : 'Your account has been deleted by an administrator under the data retention policy.'}
        </p>
        {user.retentionExpiryDate && (
          <div
            style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '8px 16px',
              borderRadius: 8,
              marginBottom: 20,
              fontWeight: 700,
              fontSize: '0.86rem',
            }}
          >
            🗓️ Retention Expiry: {new Date(user.retentionExpiryDate).toLocaleString()}
          </div>
        )}
        <button
          onClick={logout}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            background: '#64748b',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Log Out
        </button>
      </div>
    );
  }

  return children;
};

// SuperAdmin route - sirf superadmin ko access milega
export const SuperAdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const adminRoles = ['superadmin', 'admin', 'moderator', 'support_admin', 'security_admin'];
  if (!adminRoles.includes(user?.role)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary, #0c151c)',
          color: 'var(--text-primary, #e9edef)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            color: '#ef4444',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
          Access Denied
        </h2>
        <p style={{ maxWidth: 440, fontSize: '0.92rem', color: 'var(--text-secondary, #8696a0)', lineHeight: 1.6, marginBottom: 24 }}>
          Admin Panel ka control sirf <strong>Super Admin</strong> ke paas hai. Regular users ise access nahi kar sakte.
        </p>
        <a
          href="/chat"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            borderRadius: 10,
            background: 'var(--primary-color, #00a884)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0, 168, 132, 0.25)',
          }}
        >
          ← Return to Chat
        </a>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
