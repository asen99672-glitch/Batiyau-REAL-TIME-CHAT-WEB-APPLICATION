import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { createSocketConnection, disconnectSocket, getSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial load check
  const [isTabConflict, setIsTabConflict] = useState(false);
  const [showPostAuthSplash, setShowPostAuthSplash] = useState(false);
  const splashTimerRef = useRef(null);
  const tabIdRef = useRef('tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now());
  const broadcastChannelRef = useRef(null);
  const singleTabChannelRef = useRef(null);

  // Trigger 2000ms splash screen on register/login
  const triggerPostAuthSplash = useCallback(() => {
    if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    setShowPostAuthSplash(true);
    splashTimerRef.current = setTimeout(() => {
      setShowPostAuthSplash(false);
    }, 2000);
  }, []);

  // Auto-close attempt and conflict activation
  const handleTabConflict = useCallback(() => {
    setIsTabConflict(true);
    disconnectSocket();

    // Try closing the tab immediately (WhatsApp auto-close)
    try {
      window.close();
    } catch (e) {
      // Browser blocks unscripted tab closing
    }
  }, []);

  // Claim active tab (Used on initial load, login, or when clicking "Use Here")
  const claimActiveTab = useCallback(() => {
    const myTabId = tabIdRef.current;
    setIsTabConflict(false);
    localStorage.setItem('chat_active_tab_id', myTabId);
    localStorage.setItem('chat_active_tab_time', Date.now().toString());

    if (singleTabChannelRef.current) {
      try {
        singleTabChannelRef.current.postMessage({
          type: 'CLAIM_ACTIVE_TAB',
          tabId: myTabId,
        });
      } catch (err) {
        // Broadcast failed
      }
    }

    // Reconnect socket if token exists
    const token = localStorage.getItem('chatToken');
    if (token) {
      createSocketConnection(token);
    }
  }, []);

  // Listen to server-side session conflict (same user opened in another browser/window)
  useEffect(() => {
    import('../services/socket.js').then(({ setOnSessionConflict }) => {
      setOnSessionConflict(() => {
        handleTabConflict();
      });
    });
  }, [handleTabConflict]);

  // App open hone par check karo ki user already logged in hai ya nahi
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('chatToken');
      const savedUser = localStorage.getItem('chatUser');

      if (token && savedUser) {
        try {
          // Backend se verify karo
          const { data } = await api.get('/auth/me');
          setUser(data);
          // Socket reconnect karo if not in conflict
          if (!isTabConflict) {
            createSocketConnection(token);
          }
        } catch (error) {
          // Token invalid hai toh clear karo
          localStorage.removeItem('chatToken');
          localStorage.removeItem('chatUser');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Real-time synchronization of account block & unblock status for the current user
  useEffect(() => {
    const socket = getSocket();
    if (socket && user?._id) {
      const handleAccountBlocked = (payload) => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            isBanned: true,
            banReason: payload?.banReason || 'Administrative restriction',
            blockType: payload?.blockType || 'permanent',
            blockExpiryDate: payload?.blockExpiryDate || null,
          };
          localStorage.setItem('chatUser', JSON.stringify(updated));
          return updated;
        });
      };

      const handleAccountUnblocked = () => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            isBanned: false,
            blockExpiryDate: null,
          };
          localStorage.setItem('chatUser', JSON.stringify(updated));
          return updated;
        });
      };

      const handleUserBanStatus = ({ userId, isBanned, banReason, blockType, blockExpiryDate }) => {
        if (String(user._id) === String(userId)) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              isBanned: !!isBanned,
              banReason: banReason || prev.banReason,
              blockType: blockType || prev.blockType,
              blockExpiryDate: blockExpiryDate || null,
            };
            localStorage.setItem('chatUser', JSON.stringify(updated));
            return updated;
          });
        }
      };

      const handleAccountSuspended = (payload) => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            isSuspended: true,
            suspendReason: payload?.suspendReason || 'Administrative suspension',
            suspensionDuration: payload?.duration || prev.suspensionDuration,
            suspendedUntil: payload?.suspendedUntil || null,
          };
          localStorage.setItem('chatUser', JSON.stringify(updated));
          return updated;
        });
      };

      const handleAccountActivated = () => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            isSuspended: false,
            suspendedUntil: null,
          };
          localStorage.setItem('chatUser', JSON.stringify(updated));
          return updated;
        });
      };

      const handleUserSuspensionStatus = ({ userId, isSuspended, suspendReason, duration, suspendedUntil }) => {
        if (String(user._id) === String(userId)) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              isSuspended: !!isSuspended,
              suspendReason: suspendReason || prev.suspendReason,
              suspensionDuration: duration || prev.suspensionDuration,
              suspendedUntil: suspendedUntil || null,
            };
            localStorage.setItem('chatUser', JSON.stringify(updated));
            return updated;
          });
        }
      };

      const handleAccountDeleted = (payload) => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            isDeleted: true,
            deletionReason: payload?.reason || 'Account archived by administrator',
            retentionExpiryDate: payload?.retentionExpiryDate || null,
          };
          localStorage.setItem('chatUser', JSON.stringify(updated));
          return updated;
        });
      };

      const handleAccountRestored = () => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            isDeleted: false,
            isSuspended: false,
            isBanned: false,
          };
          localStorage.setItem('chatUser', JSON.stringify(updated));
          return updated;
        });
      };

      const handleUserDeletedAdmin = ({ userId }) => {
        if (String(user._id) === String(userId)) {
          handleAccountDeleted({});
        }
      };

      const handleUserRestoredAdmin = ({ userId }) => {
        if (String(user._id) === String(userId)) {
          handleAccountRestored();
        }
      };

      socket.on('accountBlocked', handleAccountBlocked);
      socket.on('accountUnblocked', handleAccountUnblocked);
      socket.on('userBanStatusChanged', handleUserBanStatus);
      socket.on('accountSuspended', handleAccountSuspended);
      socket.on('accountActivated', handleAccountActivated);
      socket.on('userSuspensionStatusChanged', handleUserSuspensionStatus);
      socket.on('accountDeleted', handleAccountDeleted);
      socket.on('accountRestored', handleAccountRestored);
      socket.on('userDeletedAdmin', handleUserDeletedAdmin);
      socket.on('userRestoredAdmin', handleUserRestoredAdmin);

      return () => {
        socket.off('accountBlocked', handleAccountBlocked);
        socket.off('accountUnblocked', handleAccountUnblocked);
        socket.off('userBanStatusChanged', handleUserBanStatus);
        socket.off('accountSuspended', handleAccountSuspended);
        socket.off('accountActivated', handleAccountActivated);
        socket.off('userSuspensionStatusChanged', handleUserSuspensionStatus);
        socket.off('accountDeleted', handleAccountDeleted);
        socket.off('accountRestored', handleAccountRestored);
        socket.off('userDeletedAdmin', handleUserDeletedAdmin);
        socket.off('userRestoredAdmin', handleUserRestoredAdmin);
      };
    }
  }, [user?._id]);

  // Single tab enforcement across browser tabs (BroadcastChannel + LocalStorage)
  useEffect(() => {
    const myTabId = tabIdRef.current;

    // 1. Setup Single Tab Broadcast Channel
    let singleTabChannel;
    try {
      singleTabChannel = new BroadcastChannel('chat_single_tab_channel');
      singleTabChannelRef.current = singleTabChannel;

      singleTabChannel.onmessage = (event) => {
        const { type, tabId } = event.data || {};
        if (type === 'CLAIM_ACTIVE_TAB' && tabId && tabId !== myTabId) {
          // Another tab has been opened or claimed ownership!
          handleTabConflict();
        }
      };
    } catch (err) {
      // BroadcastChannel unsupported
    }

    // Immediately claim ownership for this tab on mount
    claimActiveTab();

    // 2. Storage event listener (fallback and multi-window detection)
    const handleStorageChange = (e) => {
      if (e.key === 'chat_active_tab_id') {
        if (e.newValue && e.newValue !== myTabId) {
          handleTabConflict();
        }
      } else if (e.key === 'chatToken') {
        if (!e.newValue) {
          // Token remove ho gaya (logout)
          setUser(null);
          disconnectSocket();
        } else {
          // Token change ho gaya (dusra user login ho gaya)
          const updatedUser = localStorage.getItem('chatUser');
          if (updatedUser) {
            try {
              const parsed = JSON.parse(updatedUser);
              setUser(parsed);
              if (!isTabConflict) {
                createSocketConnection(e.newValue);
              }
            } catch (err) {
              // Ignore parse error
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 3. Auth session channel (LOGIN / LOGOUT sync)
    let authChannel;
    try {
      authChannel = new BroadcastChannel('chat_app_auth_session');
      broadcastChannelRef.current = authChannel;

      authChannel.onmessage = (event) => {
        const { type, token, user: newUser } = event.data || {};
        if (type === 'LOGIN') {
          setUser(newUser);
        } else if (type === 'LOGOUT') {
          setUser(null);
          disconnectSocket();
        }
      };
    } catch (err) {
      // Fallback
    }

    return () => {
      if (singleTabChannel) singleTabChannel.close();
      if (authChannel) authChannel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [claimActiveTab, handleTabConflict]);

  // Register function
  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('chatToken', data.token);
    localStorage.setItem('chatUser', JSON.stringify(data));
    triggerPostAuthSplash();
    setUser(data);
    claimActiveTab();

    // Dusre tabs ko notify karo
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'LOGIN',
        token: data.token,
        user: data,
      });
    }
    return data;
  }, [claimActiveTab, triggerPostAuthSplash]);

  // Login function
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('chatToken', data.token);
    localStorage.setItem('chatUser', JSON.stringify(data));
    triggerPostAuthSplash();
    setUser(data);
    claimActiveTab();

    // Dusre tabs ko notify karo
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'LOGIN',
        token: data.token,
        user: data,
      });
    }
    return data;
  }, [claimActiveTab, triggerPostAuthSplash]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout error ignore karo
    } finally {
      localStorage.removeItem('chatToken');
      localStorage.removeItem('chatUser');
      disconnectSocket();
      setUser(null);

      // Dusre tabs ko notify karo
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT' });
      }
    }
  }, []);

  // Profile update karna
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('chatUser', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    loading,
    isTabConflict,
    claimActiveTab,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    showPostAuthSplash,
    triggerPostAuthSplash,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
