import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import api from '../services/api';

const NewGroupModal = ({ onClose }) => {
  const { user } = useAuth();
  const { createGroup, selectConversation } = useChat();
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Fetch users for participant selection
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const endpoint = searchQuery
          ? `/users/search?q=${encodeURIComponent(searchQuery)}`
          : '/users';
        const { data } = await api.get(endpoint);
        // Exclude current user
        setUsers(data.filter((u) => u._id !== user?._id));
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 250);
    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const toggleUserSelection = (targetUser) => {
    setError('');
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u._id === targetUser._id);
      if (exists) {
        return prev.filter((u) => u._id !== targetUser._id);
      } else {
        return [...prev, targetUser];
      }
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please select at least 1 member');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const participantIds = selectedUsers.map((u) => u._id);
      const newGroup = await createGroup(groupName.trim(), participantIds);
      if (newGroup) {
        await selectConversation(newGroup);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 440,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
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
                borderRadius: '50%',
                background: 'rgba(78, 227, 197, 0.15)',
                color: '#4ee3c5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>New Group</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Group Name input */}
        <div style={{ padding: '16px 20px 8px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Group Name
          </label>
          <input
            id="group-name-input"
            type="text"
            placeholder="e.g. Friends, Project Team"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              setError('');
            }}
            maxLength={60}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              outline: 'none',
              transition: 'var(--transition)',
            }}
          />
        </div>

        {/* Selected Participants Chips */}
        {selectedUsers.length > 0 && (
          <div
            style={{
              padding: '8px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              maxHeight: 90,
              overflowY: 'auto',
            }}
          >
            {selectedUsers.map((u) => (
              <div
                key={u._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#164642',
                  color: '#ffffff',
                  padding: '4px 10px 4px 6px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                }}
              >
                <Avatar user={u} size={20} />
                <span>{u.name}</span>
                <button
                  type="button"
                  onClick={() => toggleUserSelection(u)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: 12,
                    marginLeft: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Participant search input */}
        <div style={{ padding: '8px 20px' }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
              }}
            >
              🔍
            </span>
            <input
              id="group-search-input"
              type="text"
              placeholder="Search people to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-hover)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p style={{ padding: '0 20px', color: '#ef4444', fontSize: '0.8rem', margin: '4px 0' }}>
            {error}
          </p>
        )}

        {/* User list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', minHeight: 180, maxHeight: 240 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24, color: 'var(--text-muted)' }}>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No contacts found
            </div>
          ) : (
            users.map((u) => {
              const isSelected = selectedUsers.some((sel) => sel._id === u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleUserSelection(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(78, 227, 197, 0.08)' : 'transparent',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar user={u} size={38} />
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</p>
                    </div>
                  </div>
                  {/* Checkbox circle */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: isSelected ? '2px solid #4ee3c5' : '2px solid var(--border-color)',
                      background: isSelected ? '#4ee3c5' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0d2825',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {isSelected && '✓'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            id="create-group-btn"
            type="button"
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            onClick={handleCreateGroup}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#164642',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: creating || !groupName.trim() || selectedUsers.length === 0 ? 'not-allowed' : 'pointer',
              opacity: creating || !groupName.trim() || selectedUsers.length === 0 ? 0.6 : 1,
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {creating ? 'Creating...' : `Create Group (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;
