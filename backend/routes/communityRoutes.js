import express from 'express';
import {
  getCommunities,
  createCommunity,
  getCommunityDetails,
  addCommunityGroup,
  joinCommunity,
  leaveCommunity,
  deleteCommunity,
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCommunities);
router.post('/', createCommunity);
router.get('/:id', getCommunityDetails);
router.post('/:id/groups', addCommunityGroup);
router.post('/:id/join', joinCommunity);
router.post('/:id/leave', leaveCommunity);
router.delete('/:id', deleteCommunity);

export default router;
