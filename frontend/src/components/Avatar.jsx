import BatiyauLogo from './BatiyauLogo';

// Avatar component - profile picture ya initials dikhata hai
const Avatar = ({ user, size = 40, showOnline = false, isOnline = false }) => {
  const isBatiyaoOfficial =
    user?.isOfficial ||
    user?.username === 'batiyao' ||
    (user?.name && user.name.toLowerCase() === 'batiyao') ||
    (user?.name && user.name.toLowerCase() === 'batiyao official');

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      {isBatiyaoOfficial ? (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #041f17 0%, #064e3b 100%)',
            border: '1.5px solid #10b981',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          <BatiyauLogo size={size * 0.78} />
        </div>
      ) : user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.name}
          className="avatar"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="avatar-placeholder"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.36,
          }}
        >
          {initials}
        </div>
      )}

      {/* Online indicator dot */}
      {showOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: '50%',
            background: isOnline ? 'var(--online-color)' : 'var(--offline-color)',
            border: '2px solid #ffffff',
          }}
        />
      )}
    </div>
  );
};

export default Avatar;
