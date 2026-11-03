const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Registration } = require('../models/dbStore');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /profile
// @desc    Get current user profile
// @access  Protected
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
    });
  }
});

// @route   PUT /profile
// @desc    Update personal info (name, phone)
// @access  Protected
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty',
      });
    }

    const updatedUser = await User.update(userId, {
      name: name.trim(),
      phone: phone !== undefined ? phone.trim() : req.user.phone,
    });

    return res.json({
      success: true,
      message: 'Profile information updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// @route   PUT /profile/password
// @desc    Change user password
// @access  Protected
router.put('/profile/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get user with password field
    const user = await User.findByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updatePassword(userId, hashedPassword);

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    console.error('Error updating password:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update password',
    });
  }
});

// @route   GET /profile/registrations
// @desc    Get all registrations for current user with event details
// @access  Protected
router.get('/profile/registrations', protect, async (req, res) => {
  try {
    const registrations = await Registration.findByUserId(req.user._id);

    return res.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations',
    });
  }
});

module.exports = router;
