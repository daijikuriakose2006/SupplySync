const express = require('express');
const router = express.Router();
const GstRate = require('../models/GstRate');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

router.use(auth);

// GET /api/gst
router.get('/', async (req, res, next) => {
  try {
    const rates = await GstRate.find().sort({ category: 1 });
    res.json(rates);
  } catch (err) { next(err); }
});

// POST /api/gst — add or update
router.post('/', role('admin'), async (req, res, next) => {
  try {
    const { category, percentage } = req.body;
    if (!category || percentage === undefined) {
      return res.status(400).json({ message: 'Category and percentage are required' });
    }
    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ message: 'Percentage must be between 0 and 100' });
    }
    const rate = await GstRate.findOneAndUpdate(
      { category: category.trim() },
      { percentage: pct },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(rate);
  } catch (err) { next(err); }
});

// DELETE /api/gst/:category
router.delete('/:category', role('admin'), async (req, res, next) => {
  try {
    const rate = await GstRate.findOneAndDelete({ category: req.params.category });
    if (!rate) return res.status(404).json({ message: 'GST rate not found' });
    res.json({ message: `GST for ${req.params.category} removed` });
  } catch (err) { next(err); }
});

module.exports = router;
