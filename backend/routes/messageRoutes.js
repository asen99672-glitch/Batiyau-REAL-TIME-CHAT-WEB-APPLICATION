import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getMessages,
  sendMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  bulkDeleteMessages,
  toggleStarMessage,
  getStarredMessages,
  reactToMessage,
  uploadFile,
  clearChat,
  togglePinMessage,
  reportMessage,
  forwardMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.post('/forward', forwardMessage);
router.delete('/conversation/:conversationId/clear', clearChat);
router.put('/mark-all/read', markAllAsRead);
router.get('/starred/all', getStarredMessages);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.put('/:id/read', markAsRead);
router.put('/:id/star', toggleStarMessage);
router.put('/:id/pin', togglePinMessage);
router.post('/:id/report', reportMessage);
router.put('/:id/react', reactToMessage);
router.post('/bulk-delete', bulkDeleteMessages);
router.delete('/:id', deleteMessage);

export default router;

