const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');

router.use(auth);

// GET /api/recommendations — products to restock for next week
router.get('/', async (req, res, next) => {
  try {
    // Get sales from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const salesAgg = await Sale.aggregate([
      { $match: { date: { $gte: thirtyDaysAgoStr } } },
      {
        $group: {
          _id: { product: '$product', productName: '$productName' },
          totalQty: { $sum: '$quantity' },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    const salesByProduct = {};
    salesAgg.forEach(s => {
      const key = s._id.product?.toString() || s._id.productName;
      salesByProduct[key] = {
        totalQty: s.totalQty,
        salesCount: s.salesCount,
        productName: s._id.productName
      };
    });

    const products = await Product.find().populate('supplier', 'name');
    const recommendations = products.map(product => {
      const pd = salesByProduct[product._id.toString()];
      const avgWeeklySales = pd ? Math.ceil((pd.totalQty / 4) * 1.15) : 0; // 30 days ≈ 4 weeks
      const predictedDemand = avgWeeklySales;
      const currentStock = product.stockQuantity;
      const reorderQty = Math.max(0, predictedDemand - currentStock);
      const urgency = reorderQty > predictedDemand * 0.7 ? 'high'
        : reorderQty > 0 ? 'medium' : 'low';

      return {
        id: product._id,
        name: product.name,
        category: product.category,
        currentStock,
        predictedDemand,
        reorderQty,
        urgency,
        supplier: product.supplierName || product.supplier?.name || '',
      };
    }).sort((a, b) => b.reorderQty - a.reorderQty);

    res.json(recommendations);
  } catch (err) { next(err); }
});

module.exports = router;
