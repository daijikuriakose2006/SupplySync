const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middlewares/auth');

router.use(auth);

// GET /api/products/categories — unique categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.sort());
  } catch (err) { next(err); }
});

// GET /api/products — list with search, filter, pagination
router.get('/', async (req, res, next) => {
  try {
    const { search, category, lowStock, expiring, page = 1, limit = 100 } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { category: regex }, { barcode: regex }];
    }
    if (category) query.category = new RegExp(category, 'i');
    if (lowStock === 'true') query.stockQuantity = { $lt: 10 };
    if (expiring === 'true') {
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      query.expiryDate = { $ne: null, $lte: sevenDays };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('supplier', 'name').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page: parseInt(page) });
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
});

// POST /api/products — add product
router.post('/', async (req, res, next) => {
  try {
    const { name, category, sellingPrice, buyingPrice, stockQuantity, barcode, expiryDate, supplier, supplierName } = req.body;
    if (!name || !category || sellingPrice === undefined) {
      return res.status(400).json({ message: 'Name, category, and selling price are required' });
    }

    // Check barcode uniqueness if provided
    if (barcode && barcode.trim()) {
      const existing = await Product.findOne({ barcode: barcode.trim() });
      if (existing) return res.status(409).json({ message: 'Barcode already exists' });
    }

    const product = new Product({
      name, category,
      sellingPrice: parseFloat(sellingPrice),
      buyingPrice: parseFloat(buyingPrice) || 0,
      stockQuantity: parseInt(stockQuantity) || 0,
      barcode: barcode && barcode.trim() ? barcode.trim() : undefined,
      expiryDate: expiryDate || null,
      supplier: supplier || null,
      supplierName: supplierName || '',
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, sellingPrice, buyingPrice, stockQuantity, barcode, expiryDate, supplier, supplierName } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check barcode uniqueness if changed
    if (barcode && barcode.trim() && barcode.trim() !== product.barcode) {
      const existing = await Product.findOne({ barcode: barcode.trim(), _id: { $ne: product._id } });
      if (existing) return res.status(409).json({ message: 'Barcode already used by another product' });
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (sellingPrice !== undefined) product.sellingPrice = parseFloat(sellingPrice);
    if (buyingPrice !== undefined) product.buyingPrice = parseFloat(buyingPrice);
    if (stockQuantity !== undefined) product.stockQuantity = parseInt(stockQuantity);
    if (barcode !== undefined) product.barcode = barcode && barcode.trim() ? barcode.trim() : undefined;
    if (expiryDate !== undefined) product.expiryDate = expiryDate || null;
    if (supplier !== undefined) product.supplier = supplier || null;
    if (supplierName !== undefined) product.supplierName = supplierName || '';

    await product.save();
    res.json(product);
  } catch (err) { next(err); }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
