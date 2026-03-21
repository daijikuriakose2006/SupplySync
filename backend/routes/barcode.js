const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middlewares/auth');

router.use(auth);

// GET /api/barcode/:code — lookup product by barcode
router.get('/:code', async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.code.trim() }).populate('supplier', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found', barcode: req.params.code });
    }
    res.json(product);
  } catch (err) { next(err); }
});

// POST /api/barcode/scan — scan and update stock
router.post('/scan', async (req, res, next) => {
  try {
    const { barcode, addStock } = req.body;
    if (!barcode) return res.status(400).json({ message: 'Barcode is required' });

    const product = await Product.findOne({ barcode: barcode.trim() });
    if (!product) {
      return res.status(404).json({ message: 'Product not found', barcode });
    }

    if (addStock && parseInt(addStock) > 0) {
      product.stockQuantity += parseInt(addStock);
      await product.save();
    }

    res.json(product);
  } catch (err) { next(err); }
});

module.exports = router;
