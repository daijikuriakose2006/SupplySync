const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');

router.use(auth);

// Moving Average forecast for a single product
function movingAverage(values, windowSize = 3) {
  if (values.length === 0) return 0;
  const recent = values.slice(-windowSize);
  const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
  return Math.ceil(avg * 1.1); // 10% growth buffer
}

// GET /api/forecast/:productId
router.get('/:productId', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Get weekly sales grouped by week (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const eightWeeksAgoStr = eightWeeksAgo.toISOString().split('T')[0];

    const sales = await Sale.aggregate([
      { $match: { product: product._id, date: { $gte: eightWeeksAgoStr } } },
      {
        $group: {
          _id: { $week: { $toDate: '$date' } },
          totalQty: { $sum: '$quantity' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const weeklySales = sales.map(s => s.totalQty);
    const predicted = movingAverage(weeklySales);

    // Build chart data (past 4 weeks + 4 predicted weeks)
    const chartData = [];
    for (let i = 1; i <= 4; i++) {
      const actual = sales[sales.length - (4 - i + 1)]?.totalQty || null;
      chartData.push({ week: `W${i}`, actual });
    }
    for (let i = 5; i <= 8; i++) {
      chartData.push({ week: `W${i}`, actual: null, predicted });
    }

    res.json({
      product: { id: product._id, name: product.name, category: product.category, currentStock: product.stockQuantity },
      predictedDemand: predicted,
      weeklySales,
      chartData,
    });
  } catch (err) { next(err); }
});

// GET /api/forecast — all products summary
router.get('/', async (req, res, next) => {
  try {
    // Get aggregate view for entire store
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const eightWeeksAgoStr = eightWeeksAgo.toISOString().split('T')[0];

    const sales = await Sale.aggregate([
      { $match: { date: { $gte: eightWeeksAgoStr } } },
      {
        $group: {
          _id: { week: { $week: { $toDate: '$date' } }, productName: '$productName' },
          totalQty: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.week': 1 } }
    ]);

    // Build overall weekly totals
    const weeklyMap = {};
    sales.forEach(s => {
      const w = s._id.week;
      weeklyMap[w] = (weeklyMap[w] || 0) + s.totalQty;
    });
    const weeklySalesValues = Object.values(weeklyMap);
    const predicted = movingAverage(weeklySalesValues);

    const chartData = [];
    const weeks = Object.keys(weeklyMap).sort();
    const last4 = weeks.slice(-4);
    last4.forEach((w, i) => chartData.push({ week: `W${i + 1}`, actual: weeklyMap[w] }));
    for (let i = 5; i <= 8; i++) chartData.push({ week: `W${i}`, actual: null, predicted });

    // Compute accuracy: compare predicted from W-1 to actual W (last 4 weeks)
    const accuracyScores = [];
    for (let i = 1; i < last4.length; i++) {
      const prevValues = weeklySalesValues.slice(0, i);
      const prevPredicted = movingAverage(prevValues);
      const actual = weeklyMap[last4[i]];
      if (actual > 0) {
        accuracyScores.push(Math.max(0, 100 - Math.abs((prevPredicted - actual) / actual) * 100));
      }
    }
    const avgAccuracy = accuracyScores.length > 0
      ? (accuracyScores.reduce((s, a) => s + a, 0) / accuracyScores.length).toFixed(1)
      : '—';

    res.json({
      nextWeekForecast: predicted,
      avgAccuracy,
      method: 'Moving Average',
      chartData,
    });
  } catch (err) { next(err); }
});

module.exports = router;
