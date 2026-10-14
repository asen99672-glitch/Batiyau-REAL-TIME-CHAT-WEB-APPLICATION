import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute, { SuperAdminRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

import CallModal from './components/CallModal';
import SingleTabModal from './components/SingleTabModal';
import Toast from './components/Toast';
import SplashScreen from './components/SplashScreen';
import SystemAnnouncementModal from './components/SystemAnnouncementModal';

// Global Toast listener component
const GlobalToast = () => {
  const { toast, setToast } = useChat();
  return <Toast toast={toast} onClose={() => setToast(null)} />;
};

// Call Link redirect handler to connect directly to video call
const CallRedirectHandler = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, selectConversation, startCall, showToast } = useChat();

  useEffect(() => {
    if (!conversationId) {
      navigate('/chat', { replace: true });
      return;
    }

    const conv = conversations.find(
      (c) => c._id?.toString() === conversationId.toString()
    );

    if (conv) {
      selectConversation(conv);
      const otherUser = !conv.isGroup
        ? conv.participants?.find((p) => (p?._id || p)?.toString() !== user?._id?.toString())
        : conv.participants?.[0];

      if (otherUser) {
        showToast('Connecting to video call...', 'info', '📹');
        startCall(otherUser, 'video');
      }
      navigate('/chat', { replace: true });
    } else if (conversations.length > 0) {
      navigate('/chat', { replace: true });
    }
  }, [conversationId, conversations, user, selectConversation, startCall, navigate, showToast]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36 }} />
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Connecting to video call...</p>
      </div>
    </div>
  );
};

// Public route - logged in users ko chat pe bhejo
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return children;
};

// App with ChatProvider (needs AuthProvider already in tree)
const AppRoutes = () => {
  const { user, showPostAuthSplash } = useAuth();

  // Synchronize chat message font size with user chats preferences
  useEffect(() => {
    const fontSize = user?.chatsPreferences?.fontSize || 'medium';
    const fontSizes = {
      small: '0.80rem',
      medium: '0.92rem',
      large: '1.08rem',
    };
    const sizeVal = fontSizes[fontSize] || '0.92rem';
    document.documentElement.style.setProperty('--chat-message-font-size', sizeVal);
    document.documentElement.setAttribute('data-chat-font-size', fontSize);
  }, [user?.chatsPreferences?.fontSize]);

  return (
    <ChatProvider>
      {showPostAuthSplash && <SplashScreen duration={2000} />}
      <SingleTabModal />
      <CallModal />
      <GlobalToast />
      <SystemAnnouncementModal />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route path="/splash" element={<SplashScreen duration={999999} />} />
        {/* Protected Routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/call/:conversationId"
          element={
            <ProtectedRoute>
              <CallRedirectHandler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <SuperAdminRoute>
              <Admin />
            </SuperAdminRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </ChatProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
