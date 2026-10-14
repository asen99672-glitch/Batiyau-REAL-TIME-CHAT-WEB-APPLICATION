import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { initializeSocket } from './socket/socket.js';
import { errorHandler } from './middleware/errorMiddleware.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import callRoutes from './routes/callRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { startAutoExpiryWorker } from './controllers/adminController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// .env file load karo
dotenv.config();

// MongoDB connect karo
connectDB();

const app = express();

// HTTP server aur Socket.IO server ek saath create karo
const httpServer = createServer(app);

const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true); // Allow all origins for local dev
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // JSON body parse karne ke liye
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/admin', adminRoutes);

app.set('io', io);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat API is running!' });
});

// Socket.IO initialize karo
initializeSocket(io);

// Background worker for real-time auto-expiry of temporary blocks & suspensions
startAutoExpiryWorker(io);

// Error handling middleware (sabse last mein hona chahiye)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
});
// Restart trigger - Fixed syntax in seedAdmin.js
