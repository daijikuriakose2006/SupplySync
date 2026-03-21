const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

router.use(auth);

// GET /api/suppliers
router.get('/', async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) { next(err); }
});

// POST /api/suppliers — Admin only
router.post('/', role('admin'), async (req, res, next) => {
  try {
    const { name, contact, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Supplier name is required' });
    const supplier = new Supplier({ name, contact, address });
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) { next(err); }
});

// PUT /api/suppliers/:id — Admin only
router.put('/:id', role('admin'), async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json(supplier);
  } catch (err) { next(err); }
});

// DELETE /api/suppliers/:id — Admin only
router.delete('/:id', role('admin'), async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) { next(err); }
});

// POST /api/suppliers/scan-bill — lookup products by list of barcodes (for supplier billing)
router.post('/scan-bill', async (req, res, next) => {
  try {
    const { barcodes } = req.body; // array of barcode strings
    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({ message: 'barcodes array is required' });
    }
    const products = await Product.find({ barcode: { $in: barcodes } });
    const result = barcodes.map(code => {
      const p = products.find(prod => prod.barcode === code);
      return p ? { found: true, product: p } : { found: false, barcode: code };
    });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
