const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  sellingPrice: { type: Number, required: true, min: 0 },
  buyingPrice: { type: Number, default: 0, min: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 },
  barcode: { type: String, unique: true, sparse: true, trim: true },
  expiryDate: { type: Date, default: null },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  supplierName: { type: String, default: '' },
}, { timestamps: true });

// Full-text search index
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
