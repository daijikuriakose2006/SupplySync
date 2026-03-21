const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const GstRate = require('../models/GstRate');
const BillCharge = require('../models/BillCharge');
const auth = require('../middlewares/auth');

router.use(auth);

// POST /api/sales — record a completed sale (full cart)
router.post('/', async (req, res, next) => {
  try {
    const { items } = req.body;
    // items: [{ productId, productName, category, quantity, price }]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Sale items are required' });
    }

    // Fetch GST rates and bill charges from DB
    const [gstRates, billCharges] = await Promise.all([
      GstRate.find(),
      BillCharge.find(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-IN');

    let subtotal = 0;

    // Build sale records and compute GST
    const cartWithGst = items.map(item => {
      const gstEntry = gstRates.find(g => g.category.toLowerCase() === item.category?.toLowerCase());
      const gstPct = gstEntry ? gstEntry.percentage : 0;
      const itemSubtotal = parseFloat(item.price.toString()) * parseInt(item.quantity.toString());
      const gstAmount = itemSubtotal * (gstPct / 100);
      subtotal += itemSubtotal;
      return { ...item, gstPct, gstAmount, itemSubtotal };
    });

    const totalGst = cartWithGst.reduce((s, i) => s + i.gstAmount, 0);
    const subtotalWithGst = subtotal + totalGst;

    // Bill charges
    const billChargeDetails = billCharges.map(c => ({
      name: c.name,
      percentage: c.percentage,
      amount: subtotalWithGst * (c.percentage / 100),
    }));
    const totalBillCharges = billChargeDetails.reduce((s, c) => s + c.amount, 0);

    // Create sale documents
    const saleDocs = cartWithGst.map(item => ({
      product: item.productId || null,
      productName: item.productName,
      category: item.category || '',
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
      gstPct: item.gstPct,
      gstAmount: item.gstAmount,
      billCharges: billChargeDetails,
      billChargeTotal: totalBillCharges / cartWithGst.length, // distribute evenly
      total: item.itemSubtotal + item.gstAmount,
      date: today,
      time,
      soldBy: req.user._id,
    }));

    const savedSales = await Sale.insertMany(saleDocs);

    // Decrement stock for each product
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -parseInt(item.quantity) }
        });
      }
    }

    res.status(201).json({
      sales: savedSales,
      summary: {
        subtotal,
        totalGst,
        subtotalWithGst,
        billCharges: billChargeDetails,
        totalBillCharges,
        grandTotal: subtotalWithGst + totalBillCharges,
      }
    });
  } catch (err) { next(err); }
});

// GET /api/sales — list sales with optional date filter
router.get('/', async (req, res, next) => {
  try {
    const { date, from, to } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    } else if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const sales = await Sale.find(query).sort({ createdAt: -1 }).populate('soldBy', 'name');
    res.json(sales);
  } catch (err) { next(err); }
});

// GET /api/sales/today — today's sales summary
router.get('/today', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sales = await Sale.find({ date: today });
    const totalItems = sales.reduce((s, sale) => s + sale.quantity, 0);
    const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
    const totalBillCharges = sales.reduce((s, sale) => s + (sale.billChargeTotal || 0), 0);
    const uniqueProducts = new Set(sales.map(s => s.productName)).size;
    res.json({ totalItems, totalRevenue, totalBillCharges, uniqueProducts, sales });
  } catch (err) { next(err); }
});

module.exports = router;
