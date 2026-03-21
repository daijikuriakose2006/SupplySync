const mongoose = require('mongoose');

const shopSettingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'My Shop', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
