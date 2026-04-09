const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Alert = require('../models/Alert');
const auth = require('../middlewares/auth');

router.use(auth);

// GET /api/dashboard/summary
router.get('/summary', async (req, res, next) => {
  try {
    const [totalProducts, lowStockCount, unreadAlerts, allSales, topSales] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stockQuantity: { $lt: 10 } }),
      Alert.countDocuments({ isRead: false }),
      Sale.find(),
      Sale.aggregate([
        {
          $match: {
            createdAt: {
              $gte: (() => {
                const d = new Date();
                d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // Monday
                d.setHours(0, 0, 0, 0);
                return d;
              })()
            }
          }
        },
        { $group: { _id: '$productName', totalQty: { $sum: '$quantity' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
        { $project: { productName: '$_id', quantity: '$totalQty', _id: 0 } }
      ])
    ]);

    const totalRevenue = allSales.reduce((s, sale) => s + sale.total, 0);

    res.json({
      totalProducts,
      lowStockCount,
      totalRevenue,
      activeAlerts: unreadAlerts,
      topProducts: topSales,
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/sales-trends?period=daily|weekly|monthly
router.get('/sales-trends', async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query;
    let groupFormat;
    if (period === 'weekly') groupFormat = { $week: { $toDate: '$date' } };
    else if (period === 'monthly') groupFormat = { $month: { $toDate: '$date' } };
    else groupFormat = '$date'; // daily — use date string directly

    const trends = await Sale.aggregate([
      { $group: { _id: groupFormat, revenue: { $sum: '$total' }, items: { $sum: '$quantity' } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      { $project: { _id: 0, date: '$_id', revenue: 1, items: 1 } }
    ]);

    // Build last 7 days for daily
    if (period === 'daily') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const match = trends.find(t => t.date === dateStr);
        const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        days.push({ date: label, revenue: match?.revenue || 0, items: match?.items || 0 });
      }
      return res.json(days);
    }

    res.json(trends);
  } catch (err) { next(err); }
});

// GET /api/dashboard/category-distribution
router.get('/category-distribution', async (req, res, next) => {
  try {
    const distribution = await Sale.aggregate([
      { $group: { _id: '$category', value: { $sum: '$quantity' } } },
      { $sort: { value: -1 } },
      { $project: { _id: 0, name: '$_id', value: 1 } }
    ]);
    res.json(distribution);
  } catch (err) { next(err); }
});

module.exports = router;
