import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const { data } = await api.put('/users/profile', formData);
      updateUser({ ...user, ...data });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '40px 20px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Back button */}
        <button
          id="profile-back-btn"
          onClick={() => navigate('/chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: 24,
            padding: '6px 0',
          }}
        >
          ← Back to Chat
        </button>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(10, 46, 43, 0.08)',
          }}
        >
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 24 }}>
            Edit Profile
          </h1>

          {/* Avatar preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                user={{ ...user, name: formData.name, profilePicture: formData.profilePicture }}
                size={88}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Paste an image URL below to update photo
              </p>
            </div>
          </div>

          {success && <div className="success-msg" style={{ marginBottom: 16 }}>{success}</div>}
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

          <form id="profile-form" onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="profile-name" style={labelStyle}>Full Name</label>
              <input
                id="profile-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Username</label>
              <input
                value={`@${user?.username}`}
                className="input-field"
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                value={user?.email}
                className="input-field"
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label htmlFor="profile-phone" style={{ ...labelStyle, marginBottom: 0 }}>
                  Phone Number (Contact Matching)
                </label>
                {formData.phoneNumber && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(formData.phoneNumber);
                      setSuccess('Mobile number copied to clipboard! ✓');
                      setTimeout(() => setSuccess(''), 2500);
                    }}
                    style={{
                      background: 'rgba(78, 227, 197, 0.1)',
                      border: '1px solid rgba(78, 227, 197, 0.3)',
                      color: '#4ee3c5',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    📋 Copy
                  </button>
                )}
              </div>
              <input
                id="profile-phone"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="e.g. +91 9876543210"
                className="input-field"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="profile-picture" style={labelStyle}>Profile Picture URL</label>
              <input
                id="profile-picture"
                type="url"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
                className="input-field"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="profile-bio" style={labelStyle}>Bio</label>
              <textarea
                id="profile-bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell something about yourself..."
                rows={3}
                maxLength={200}
                className="input-field"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                {formData.bio.length}/200
              </p>
            </div>

            <button
              id="save-profile-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '13px' }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
