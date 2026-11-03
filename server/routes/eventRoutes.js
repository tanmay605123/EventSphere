const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Event: eventStore, Registration } = require('../models/dbStore');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Helper to generate readable registration ID: REG-2026-A8K9Z
const generateRegistrationId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REG-2026-${code}`;
};

// @route   GET /events
// @desc    Get all events with search, date, time and category query filters
// @access  Public
router.get('/events', async (req, res) => {
  try {
    const { search, category, day, date, time } = req.query;

    const events = await eventStore.find({
      search,
      category,
      day,
      date,
      time,
    });

    return res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve events',
    });
  }
});

// @route   GET /events/:id
// @desc    Get single event by ID with registration status for authenticated user
// @access  Public (with optionalAuth)
router.get('/events/:id', optionalAuth, async (req, res) => {
  try {
    const event = await eventStore.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    let isRegistered = false;
    let registrationDetails = null;

    if (req.user) {
      const reg = await Registration.findByUserAndEvent(req.user._id, event._id);
      if (reg) {
        isRegistered = true;
        registrationDetails = {
          _id: reg._id,
          registrationId: reg.registrationId,
          createdAt: reg.createdAt,
          status: reg.status,
        };
      }
    }

    // Fetch attendees for this event
    const attendees = await Registration.findAttendees(event._id || event.id);

    return res.json({
      success: true,
      event,
      isRegistered,
      registration: registrationDetails,
      attendees: attendees || [],
    });
  } catch (err) {
    console.error('Error fetching event details:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details',
    });
  }
});

// @route   POST /events/:id/register
// @desc    Register current user for an event
// @access  Protected
router.post('/events/:id/register', protect, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    const event = await eventStore.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if seats are available
    if (event.seatsLeft <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this event is already full. No seats remaining.',
      });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findByUserAndEvent(userId, eventId);
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event.',
        registration: existingRegistration,
      });
    }

    // Generate unique Registration ID
    let registrationId = generateRegistrationId();
    let collisionCheck = await Registration.findByRegistrationId(registrationId);
    while (collisionCheck) {
      registrationId = generateRegistrationId();
      collisionCheck = await Registration.findByRegistrationId(registrationId);
    }

    // Create registration
    const registration = await Registration.create({
      userId,
      eventId,
      registrationId,
    });

    // Decrease seatsLeft atomically
    const updatedEvent = await eventStore.updateSeats(eventId, -1);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! See you at the event.',
      registration,
      event: updatedEvent,
    });
  } catch (err) {
    console.error('Error registering for event:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process event registration',
    });
  }
});

module.exports = router;
