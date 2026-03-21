const mongoose = require('mongoose');

const billChargeDetailSchema = new mongoose.Schema({
  name: String,
  percentage: Number,
  amount: Number,
}, { _id: false });

const saleSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  category: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },       // unit selling price
  gstPct: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  billCharges: { type: [billChargeDetailSchema], default: [] },
  billChargeTotal: { type: Number, default: 0 },
  total: { type: Number, required: true },        // price*qty + gst
  date: { type: String, required: true },          // YYYY-MM-DD for easy filtering
  time: { type: String, default: '' },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

saleSchema.index({ date: 1 });

module.exports = mongoose.model('Sale', saleSchema);
