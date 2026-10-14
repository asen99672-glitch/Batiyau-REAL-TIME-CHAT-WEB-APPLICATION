import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import { CommunityIcon, AnnouncementIcon } from './CallIcons';

const CommunityDetailModal = ({ community, onClose, onSelectConversation }) => {
  const { user } = useAuth();
  const {
    conversations,
    addCommunityGroup,
    leaveCommunity,
    deleteCommunity,
    selectConversation,
    showToast,
  } = useChat();

  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'members'
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedExistingGroupId, setSelectedExistingGroupId] = useState('');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  const isAdmin =
    community?.admin?._id === user?._id ||
    community?.admin === user?._id ||
    community?.admins?.some((a) => (a?._id || a) === user?._id);

  // Available existing groups not already in this community
  const availableGroups = conversations.filter(
    (c) =>
      c.isGroup &&
      !c.isAnnouncementGroup &&
      !community?.groups?.some((g) => (g?._id || g) === c._id)
  );

  const handleOpenChat = async (conv) => {
    if (!conv) return;
    await selectConversation(conv);
    if (onSelectConversation) onSelectConversation(conv);
    onClose();
  };

  const handleAddGroupSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() && !selectedExistingGroupId) {
      showToast('Please provide a group name or select an existing group', 'error');
      return;
    }
    setIsSubmittingGroup(true);
    try {
      await addCommunityGroup(community._id, {
        groupName: newGroupName.trim(),
        groupDescription: newGroupDesc.trim(),
        existingGroupId: selectedExistingGroupId || undefined,
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedExistingGroupId('');
      setShowAddGroupForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Are you sure you want to leave this community?')) {
      await leaveCommunity(community._id);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this community? This cannot be undone.')) {
      await deleteCommunity(community._id);
      onClose();
    }
  };

  if (!community) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: 500,
          maxHeight: '85vh',
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Banner Header */}
        <div
          style={{
            position: 'relative',
            background: 'var(--bg-tertiary)',
            padding: '24px 20px 18px',
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <button
            onClick={onClose}
            title="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {community.icon ? (
            <img
              src={community.icon}
              alt={community.name}
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                objectFit: 'cover',
                marginBottom: 10,
                border: '2px solid var(--border-subtle)',
              }}
            />
          ) : (
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                background: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              }}
            >
              <CommunityIcon size={34} color="#ffffff" />
            </div>
          )}

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {community.name}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '90%' }}>
            {community.description || 'No description provided.'}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>{community.members?.length || 1} members</span>
            <span>•</span>
            <span>{(community.groups?.length || 0) + 1} groups</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
          }}
        >
          <button
            onClick={() => setActiveTab('groups')}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'groups' ? '#4ee3c5' : 'var(--text-muted)',
              borderBottom: activeTab === 'groups' ? '2px solid #4ee3c5' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Groups ({ (community.groups?.length || 0) + 1 })
          </button>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'members' ? '#4ee3c5' : 'var(--text-muted)',
              borderBottom: activeTab === 'members' ? '2px solid #4ee3c5' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Members ({community.members?.length || 1})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {activeTab === 'groups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Official Announcement Channel */}
              {community.announcementGroup && (
                <div
                  onClick={() => handleOpenChat(community.announcementGroup)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(78, 227, 197, 0.1)',
                    border: '1px solid rgba(78, 227, 197, 0.25)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AnnouncementIcon size={22} color="var(--text-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {community.announcementGroup.groupName || 'Announcements'}
                      </h4>
                      <span
                        style={{
                          background: 'rgba(78, 227, 197, 0.2)',
                          color: '#4ee3c5',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          borderRadius: 6,
                          padding: '1px 6px',
                        }}
                      >
                        ANNOUNCEMENT
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Official broadcast channel
                    </p>
                  </div>
                  <span style={{ fontSize: 18, color: '#4ee3c5' }}>➔</span>
                </div>
              )}

              {/* Sub-groups in this community */}
              {community.groups && community.groups.length > 0 ? (
                community.groups.map((grp) => (
                  <div
                    key={grp._id}
                    onClick={() => handleOpenChat(grp)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                  >
                    <Avatar
                      user={{ name: grp.groupName, profilePicture: grp.groupImage }}
                      size={40}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {grp.groupName}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {grp.groupDescription || `${grp.participants?.length || 0} members`}
                      </p>
                    </div>
                    <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>➔</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '14px 0' }}>
                  No sub-groups added yet.
                </p>
              )}

              {/* Add Group Form for Admins */}
              {isAdmin && (
                <div style={{ marginTop: 10 }}>
                  {!showAddGroupForm ? (
                    <button
                      onClick={() => setShowAddGroupForm(true)}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 10,
                        background: 'var(--bg-tertiary)',
                        border: '1px dashed var(--border-color)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    >
                      + Add Group to Community
                    </button>
                  ) : (
                    <form
                      onSubmit={handleAddGroupSubmit}
                      style={{
                        background: 'var(--bg-tertiary)',
                        padding: 14,
                        borderRadius: 12,
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Add or Create a Sub-Group
                      </h5>

                      {availableGroups.length > 0 && (
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                            Or link existing group:
                          </label>
                          <select
                            value={selectedExistingGroupId}
                            onChange={(e) => setSelectedExistingGroupId(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                            }}
                          >
                            <option value="">-- Create new group instead --</option>
                            {availableGroups.map((g) => (
                              <option key={g._id} value={g._id}>
                                {g.groupName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {!selectedExistingGroupId && (
                        <>
                          <input
                            type="text"
                            placeholder="New Group Name *"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Group Description (optional)"
                            value={newGroupDesc}
                            onChange={(e) => setNewGroupDesc(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                            }}
                          />
                        </>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setShowAddGroupForm(false)}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 8,
                            background: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingGroup}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 8,
                            background: 'var(--accent-primary)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          {isSubmittingGroup ? 'Adding...' : 'Add Group'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {community.members && community.members.length > 0 ? (
                community.members.map((m) => {
                  const isMemAdmin =
                    m._id === community.admin?._id ||
                    community.admins?.some((a) => (a?._id || a) === m._id);

                  return (
                    <div
                      key={m._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'var(--bg-tertiary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar user={m} size={36} />
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {m.name} {m._id === user?._id && '(You)'}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            @{m.username}
                          </p>
                        </div>
                      </div>

                      {isMemAdmin && (
                        <span
                          style={{
                            background: 'rgba(78, 227, 197, 0.2)',
                            color: '#4ee3c5',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            borderRadius: 6,
                            padding: '2px 6px',
                          }}
                        >
                          Community Admin
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No members</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
          }}
        >
          {community.admin?._id === user?._id ? (
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Delete Community
            </button>
          ) : (
            <button
              onClick={handleLeave}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Exit Community
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              padding: '6px 12px',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetailModal;
