const mongoose = require('mongoose');

const billChargeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true });

module.exports = mongoose.model('BillCharge', billChargeSchema);
