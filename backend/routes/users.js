const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

// All routes are admin-only
router.use(auth, role('admin'));

// POST /api/users — Create staff account
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = new User({
      name, email, password, role: 'staff',
      isFirstLogin: true, createdBy: req.user._id
    });
    await user.save();
    res.status(201).json({
      id: user._id, name: user.name, email: user.email,
      role: user.role, isFirstLogin: user.isFirstLogin,
      createdAt: user.createdAt,
      // return the raw password for admin to share (only on creation)
      tempPassword: password
    });
  } catch (err) { next(err); }
});

// GET /api/users — List all staff
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ role: 'staff' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { next(err); }
});

// PUT /api/users/:id — Update staff
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) { user.password = password; user.isFirstLogin = true; }
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id — Delete staff
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Staff member removed' });
  } catch (err) { next(err); }
});

module.exports = router;
