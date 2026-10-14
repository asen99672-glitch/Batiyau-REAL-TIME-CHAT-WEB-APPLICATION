import { io } from 'socket.io-client';

let socket = null;

// Socket connection create karo
export const createSocketConnection = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token }, // JWT token socket auth mein bhejo
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚠️ Socket disconnected:', reason);
  });

  socket.on('sessionConflict', (data) => {
    console.warn('⚠️ Server reported session conflict:', data);
    if (onSessionConflictCallback) {
      onSessionConflictCallback(data);
    }
  });

  return socket;
};

let onSessionConflictCallback = null;
export const setOnSessionConflict = (callback) => {
  onSessionConflictCallback = callback;
};

// Existing socket instance return karo
export const getSocket = () => socket;

// Socket disconnect karo
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { createSocketConnection, getSocket, disconnectSocket, setOnSessionConflict };
