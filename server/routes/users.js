import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// GET /api/users - Admin only
router.get('/', authorize('Admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users - Admin only
router.post('/', authorize('Admin'), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role });
    res.status(201).json({ _id: user._id, username: user.username, role: user.role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/users/:id - Admin only
router.delete('/:id', authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.username === 'admin') return res.status(400).json({ message: 'Cannot delete the main admin user' });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
