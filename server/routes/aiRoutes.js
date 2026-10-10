import express from 'express';
import { generateSummary } from '../controllers/aiController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/summarize', protect, generateSummary);

export default router;
