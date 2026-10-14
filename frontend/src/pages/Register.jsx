import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BatiyauLogo from '../components/BatiyauLogo';

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phoneNumber.trim()) {
      return setError('Please enter your phone number');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle = { marginBottom: 16 };
  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <BatiyauLogo size={64} animated={true} idPrefix="register" />
          </div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 6,
            }}
          >
            Batiyau
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Join ChatApp and start messaging
          </p>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <form id="register-form" onSubmit={handleSubmit}>
          <div style={inputStyle}>
            <label htmlFor="reg-name" style={labelStyle}>Full Name</label>
            <input
              id="reg-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="input-field"
              required
            />
          </div>

          <div style={inputStyle}>
            <label htmlFor="reg-username" style={labelStyle}>Username</label>
            <input
              id="reg-username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              className="input-field"
              required
            />
          </div>

          <div style={inputStyle}>
            <label htmlFor="reg-email" style={labelStyle}>Email Address</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="input-field"
              required
            />
          </div>

          <div style={inputStyle}>
            <label htmlFor="reg-phone" style={labelStyle}>Phone Number</label>
            <input
              id="reg-phone"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className="input-field"
              required
            />
          </div>

          <div style={inputStyle}>
            <label htmlFor="reg-password" style={labelStyle}>Password</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className="input-field"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="reg-confirm-password" style={labelStyle}>Confirm Password</label>
            <input
              id="reg-confirm-password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              className="input-field"
              required
            />
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-secondary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
