import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { CommunityIcon } from './CallIcons';

const NewCommunityModal = ({ onClose, onCreated }) => {
  const { createCommunity, showToast } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a community name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim(),
      });
      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create community:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CommunityIcon size={20} color="var(--text-primary)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              New Community
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* WhatsApp Style Banner */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            padding: '24px 20px',
            textAlign: 'center',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <CommunityIcon size={30} color="#ffffff" />
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>
            Create a Community
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.45, maxWidth: 360, margin: '0 auto' }}>
            Bring related groups together. Admins can send announcements, and members can explore topic-based groups.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Community Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Campus Club, Neighborhood, Office..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Community Description
            </label>
            <textarea
              placeholder="What is this community for? Tell members what to expect..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Community Icon (Image URL - Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/icon.png"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 0',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: !name.trim() || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: !name.trim() || isSubmitting ? 0.6 : 1,
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isSubmitting ? 'Creating Community...' : 'Create Community ✓'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewCommunityModal;
