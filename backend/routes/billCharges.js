const express = require('express');
const router = express.Router();
const BillCharge = require('../models/BillCharge');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

router.use(auth);

// GET /api/bill-charges
router.get('/', async (req, res, next) => {
  try {
    const charges = await BillCharge.find().sort({ name: 1 });
    res.json(charges);
  } catch (err) { next(err); }
});

// POST /api/bill-charges (admin only)
router.post('/', role('admin'), async (req, res, next) => {
  try {
    const { name, percentage } = req.body;
    if (!name || percentage === undefined) {
      return res.status(400).json({ message: 'Name and percentage are required' });
    }
    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ message: 'Percentage must be between 0 and 100' });
    }
    const existing = await BillCharge.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ message: 'Charge name already exists' });
    const charge = new BillCharge({ name: name.trim(), percentage: pct });
    await charge.save();
    res.status(201).json(charge);
  } catch (err) { next(err); }
});

// PUT /api/bill-charges/:id (admin only)
router.put('/:id', role('admin'), async (req, res, next) => {
  try {
    const { percentage } = req.body;
    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0) return res.status(400).json({ message: 'Invalid percentage' });
    const charge = await BillCharge.findByIdAndUpdate(req.params.id, { percentage: pct }, { new: true });
    if (!charge) return res.status(404).json({ message: 'Charge not found' });
    res.json(charge);
  } catch (err) { next(err); }
});

// DELETE /api/bill-charges/:id (admin only)
router.delete('/:id', role('admin'), async (req, res, next) => {
  try {
    const charge = await BillCharge.findByIdAndDelete(req.params.id);
    if (!charge) return res.status(404).json({ message: 'Charge not found' });
    res.json({ message: `${charge.name} removed` });
  } catch (err) { next(err); }
});

module.exports = router;
