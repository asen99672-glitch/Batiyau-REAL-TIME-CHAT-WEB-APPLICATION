import express from 'express';
import {
  getCallHistory,
  createCallLog,
  clearCallHistory,
} from '../controllers/callController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCallHistory);
router.post('/', createCallLog);
router.delete('/', clearCallHistory);

export default router;
