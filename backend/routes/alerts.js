const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');

router.use(auth);

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
    res.json(alerts);
  } catch (err) { next(err); }
});

// POST /api/alerts/check — auto-generate alerts from current stock levels
router.post('/check', async (req, res, next) => {
  try {
    const LOW_STOCK_THRESHOLD = 10;
    const EXPIRY_DAYS = 7;

    const products = await Product.find();
    const now = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(now.getDate() + EXPIRY_DAYS);

    let newAlerts = 0;

    for (const product of products) {
      // Low stock alert
      if (product.stockQuantity < LOW_STOCK_THRESHOLD) {
        const exists = await Alert.findOne({ type: 'low_stock', product: product._id });
        if (!exists) {
          const severity = product.stockQuantity <= 5 ? 'high' : product.stockQuantity <= 7 ? 'medium' : 'low';
          await Alert.create({
            type: 'low_stock',
            product: product._id,
            productName: product.name,
            message: `Stock below threshold (${product.stockQuantity} units remaining)`,
            severity,
          });
          newAlerts++;
        }
      }

      // Expiry alert
      if (product.expiryDate && new Date(product.expiryDate) <= expiryThreshold) {
        const exists = await Alert.findOne({ type: 'expiry', product: product._id });
        if (!exists) {
          const daysUntilExpiry = Math.ceil((new Date(product.expiryDate) - now) / (1000 * 60 * 60 * 24));
          const severity = daysUntilExpiry <= 2 ? 'high' : daysUntilExpiry <= 4 ? 'medium' : 'low';
          await Alert.create({
            type: 'expiry',
            product: product._id,
            productName: product.name,
            message: `Expiring in ${daysUntilExpiry} day(s)`,
            severity,
          });
          newAlerts++;
        }
      }
    }

    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
    res.json({ newAlerts, alerts });
  } catch (err) { next(err); }
});

// DELETE /api/alerts/:id — delete alert
router.delete('/:id', async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ message: 'Alert deleted' });
  } catch (err) { next(err); }
});

// PUT /api/alerts/read-all — mark all as read
router.put('/read-all', async (req, res, next) => {
  try {
    await Alert.updateMany({}, { isRead: true });
    res.json({ message: 'All alerts marked as read' });
  } catch (err) { next(err); }
});

module.exports = router;
