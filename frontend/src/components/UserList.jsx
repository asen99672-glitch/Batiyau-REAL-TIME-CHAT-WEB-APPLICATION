import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import api from '../services/api';

// User list modal - new conversation start karne ke liye
// ONLY shows users who are:
// (1) Registered on the app
// (2) Saved in the current user's phone contact list
const UserList = ({ onClose }) => {
  const { user } = useAuth();
  const { startConversation, selectConversation } = useChat();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(null);

  // New Contact inline form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState(null); // { type: 'success' | 'info' | 'error', text: '' }

  // Fetch users (API returns ONLY registered contacts saved in user's phonebook)
  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query
        ? `/users/search?q=${encodeURIComponent(query)}`
        : '/users';
      const { data } = await api.get(endpoint);
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 250);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleStartChat = async (selectedUser) => {
    setStarting(selectedUser._id);
    try {
      const conversation = await startConversation(selectedUser._id);
      await selectConversation(conversation);
      onClose();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setStarting(null);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      setContactMessage({ type: 'error', text: 'Name and phone number are required.' });
      return;
    }

    setSavingContact(true);
    setContactMessage(null);

    try {
      const { data } = await api.post('/users/contacts', {
        name: contactName.trim(),
        phoneNumber: contactPhone.trim(),
      });

      if (data.isRegistered) {
        setContactMessage({
          type: 'success',
          text: `"${contactName.trim()}" is registered on ChatApp! Added to your chat list ✓`,
        });
      } else {
        setContactMessage({
          type: 'info',
          text: `"${contactName.trim()}" saved to your phone contacts! (Not registered on ChatApp yet)`,
        });
      }

      setContactName('');
      setContactPhone('');
      await fetchUsers(searchQuery);
    } catch (err) {
      setContactMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save contact.',
      });
    } finally {
      setSavingContact(false);
    }
  };

  return (
    // Modal backdrop
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
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
          boxShadow: '0 20px 45px rgba(10, 46, 43, 0.25)',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              New Message
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {users.length} {users.length === 1 ? 'contact' : 'contacts'} on ChatApp
            </p>
          </div>
          <button
            id="close-user-list-btn"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px 8px' }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              🔍
            </span>
            <input
              id="user-search-input"
              type="text"
              placeholder="Search contacts on ChatApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              autoFocus
              style={{
                paddingLeft: 34,
                fontSize: '0.875rem',
                borderRadius: 10,
              }}
            />
          </div>
        </div>

        {/* Add Contact Action Bar */}
        <div style={{ padding: '4px 20px 8px' }}>
          <button
            id="toggle-add-contact-btn"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setContactMessage(null);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: showAddForm ? 'rgba(78, 227, 197, 0.1)' : 'var(--bg-hover)',
              color: '#4ee3c5',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600,
              transition: 'var(--transition)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#164642',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {showAddForm ? '−' : '+'}
            </div>
            <span>{showAddForm ? 'Hide Add Contact' : 'Add New Phone Contact'}</span>
          </button>

          {/* Add Contact Expandable Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddContact}
              style={{
                marginTop: 10,
                padding: 14,
                borderRadius: 12,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                Save someone to your phone contacts list to see them here if they are registered:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  id="new-contact-name"
                  type="text"
                  placeholder="Contact Name (e.g. John Doe)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <input
                  id="new-contact-phone"
                  type="tel"
                  placeholder="Phone Number (e.g. +91 9876543210)"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <button
                  id="save-contact-submit-btn"
                  type="submit"
                  disabled={savingContact || !contactName.trim() || !contactPhone.trim()}
                  style={{
                    marginTop: 4,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#164642',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor:
                      savingContact || !contactName.trim() || !contactPhone.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      savingContact || !contactName.trim() || !contactPhone.trim() ? 0.6 : 1,
                  }}
                >
                  {savingContact ? 'Saving...' : 'Save to Phone Contacts'}
                </button>
              </div>

              {contactMessage && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    lineHeight: 1.35,
                    background:
                      contactMessage.type === 'success'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : contactMessage.type === 'info'
                        ? 'rgba(234, 179, 8, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      contactMessage.type === 'success'
                        ? '#4ade80'
                        : contactMessage.type === 'info'
                        ? '#facc15'
                        : '#f87171',
                  }}
                >
                  {contactMessage.text}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Users list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 14px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>📱</div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                No Contacts on ChatApp
              </p>
              <p
                style={{
                  fontSize: '0.8rem',
                  maxWidth: 300,
                  margin: '0 auto',
                  lineHeight: 1.45,
                }}
              >
                Sirf wahi users yahan show honge jo <b>app par registered hain</b> aur aapki <b>phone contact list</b> me saved hain.
              </p>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    marginTop: 14,
                    padding: '7px 16px',
                    borderRadius: 8,
                    border: '1px solid #4ee3c5',
                    background: 'rgba(78, 227, 197, 0.1)',
                    color: '#4ee3c5',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add New Contact
                </button>
              )}
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u._id}
                id={`user-item-${u._id}`}
                onClick={() => handleStartChat(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar user={u} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {u.contactName || u.name}
                    </p>
                    {u.phoneNumber && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#4ee3c5',
                          background: 'rgba(78, 227, 197, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          flexShrink: 0,
                          marginLeft: 6,
                        }}
                      >
                        {u.phoneNumber}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      marginTop: 2,
                    }}
                  >
                    {u.bio || `@${u.username}`}
                  </p>
                </div>
                {starting === u._id && (
                  <div className="spinner" style={{ width: 20, height: 20, marginLeft: 'auto' }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;
