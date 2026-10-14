import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAllStatuses,
  createStatus,
  viewStatus,
  deleteStatus,
  getStatusViewers,
} from '../controllers/statusController.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `status-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for status videos/photos
});

const router = express.Router();

router.use(protect);

router.get('/', getAllStatuses);
router.post('/', upload.single('media'), createStatus);
router.post('/:id/view', viewStatus);
router.delete('/:id', deleteStatus);
router.get('/:id/viewers', getStatusViewers);

export default router;
