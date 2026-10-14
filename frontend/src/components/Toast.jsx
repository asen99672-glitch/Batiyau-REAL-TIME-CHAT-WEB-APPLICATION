import { useEffect } from 'react';

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 2600);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success' || !toast.type;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: isError ? '#ef4444' : '#1f242d',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        padding: '10px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55)',
        fontSize: '0.88rem',
        fontWeight: 500,
        letterSpacing: '0.2px',
        animation: 'fadeInToast 0.25s ease-out',
        pointerEvents: 'none',
      }}
    >
      {toast.icon && <span style={{ fontSize: 16 }}>{toast.icon}</span>}
      <span>{toast.message}</span>
      <style>{`
        @keyframes fadeInToast {
          from {
            opacity: 0;
            transform: translate(-50%, 14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
