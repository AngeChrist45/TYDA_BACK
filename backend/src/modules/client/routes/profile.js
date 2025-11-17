const express = require('express');
const User = require('../../../models/User');
const { auth } = require('../../../middleware/auth');
const { asyncHandler } = require('../../../middleware/errorHandler');

const router = express.Router();

// GET /api/client/profile
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate('vendorInfo.validatedBy', 'firstName lastName')
    .lean();
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
  res.json({ success: true, data: { user } });
}));

// PUT /api/client/profile
router.put('/profile', auth, asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, address, preferences } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

  const updates = {};
  if (firstName) updates.firstName = firstName.trim();
  if (lastName) updates.lastName = lastName.trim();
  if (phone) updates.phone = phone;
  if (address) updates.address = { ...user.address, ...address };
  if (preferences) updates.preferences = { ...user.preferences, ...preferences };

  const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).select('-password');
  res.json({ success: true, message: 'Profil mis à jour avec succès', data: { user: updatedUser } });
}));

module.exports = router;
