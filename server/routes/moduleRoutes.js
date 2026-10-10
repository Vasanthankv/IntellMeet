import express from 'express';
import ModuleItem from '../models/ModuleItem.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/modules/:type
// @desc    Get all items for a specific module type
router.get('/:type', protect, async (req, res) => {
  try {
    const isDbConnected = ModuleItem.db && ModuleItem.db.readyState === 1;
    if (!isDbConnected) {
      return res.json({ success: true, items: [] });
    }

    const items = await ModuleItem.find({ 
      user: req.user.id, 
      type: req.params.type.toLowerCase() 
    }).sort({ createdAt: -1 });

    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/modules/:type
// @desc    Create a new item in a specific module
router.post('/:type', protect, async (req, res) => {
  try {
    const isDbConnected = ModuleItem.db && ModuleItem.db.readyState === 1;
    if (!isDbConnected) {
      return res.status(400).json({ message: 'Database disconnected' });
    }

    const newItem = await ModuleItem.create({
      ...req.body,
      type: req.params.type.toLowerCase(),
      user: req.user.id,
    });

    return res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/modules/:type/:id
// @desc    Delete an item
router.delete('/:type/:id', protect, async (req, res) => {
  try {
    const isDbConnected = ModuleItem.db && ModuleItem.db.readyState === 1;
    if (!isDbConnected) return res.status(400).json({ message: 'Database disconnected' });

    await ModuleItem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    return res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
