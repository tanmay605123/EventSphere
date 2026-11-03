const express = require('express');
const router = express.Router();
const { Registration, Event: eventStore } = require('../models/dbStore');
const { protect } = require('../middleware/authMiddleware');

// @route   DELETE /registrations/:id
// @desc    Cancel a user's registration and restore event seat
// @access  Protected
router.delete('/registrations/:id', protect, async (req, res) => {
  try {
    const regId = req.params.id;
    const userId = req.user._id;

    // Find the registration
    const registration = await Registration.findById(regId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Verify ownership
    if (String(registration.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this registration',
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This registration has already been cancelled',
      });
    }

    // Cancel registration
    await Registration.cancel(regId, userId);

    // Increase seatsLeft on the event
    await eventStore.updateSeats(registration.eventId, 1);

    return res.json({
      success: true,
      message: 'Registration cancelled successfully. Seat has been released.',
      registrationId: registration.registrationId,
    });
  } catch (err) {
    console.error('Error cancelling registration:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
    });
  }
});

module.exports = router;
