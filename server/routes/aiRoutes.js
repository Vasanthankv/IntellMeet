import express from 'express';
import { generateSummary } from '../controllers/aiController.js';
import { testGeminiConnection } from '../services/geminiService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  const status = await testGeminiConnection();
  return res.json({ success: true, ...status });
});

router.post('/summarize', protect, generateSummary);

export default router;

