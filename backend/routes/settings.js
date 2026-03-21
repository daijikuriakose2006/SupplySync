const express = require('express');
const router = express.Router();
const ShopSettings = require('../models/ShopSettings');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

router.use(auth);

// GET /api/settings — get shop settings (all users)
router.get('/', async (req, res, next) => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = await ShopSettings.create({ shopName: 'My Shop' });
    }
    res.json(settings);
  } catch (err) { next(err); }
});

// PUT /api/settings — update shop name (admin only)
router.put('/', role('admin'), async (req, res, next) => {
  try {
    const { shopName } = req.body;
    if (!shopName || !shopName.trim()) {
      return res.status(400).json({ message: 'Shop name is required' });
    }
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = new ShopSettings({ shopName: shopName.trim() });
    } else {
      settings.shopName = shopName.trim();
    }
    await settings.save();
    res.json(settings);
  } catch (err) { next(err); }
});

module.exports = router;
