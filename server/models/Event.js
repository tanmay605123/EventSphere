const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
  },
  image: {
    type: String,
    required: [true, 'Event banner image is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Tech', 'Cultural', 'Sports', 'Workshops'],
  },
  date: {
    type: String,
    required: [true, 'Event date is required'], // e.g. YYYY-MM-DD
  },
  time: {
    type: String,
    required: [true, 'Event time is required'], // e.g. 10:00 AM
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true,
  },
  organizer: {
    type: String,
    required: [true, 'Organizer is required'],
    trim: true,
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: 1,
  },
  seatsLeft: {
    type: Number,
    required: [true, 'Seats left is required'],
    min: 0,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseEvent = mongoose.models.Event || mongoose.model('Event', eventSchema);

module.exports = {
  eventSchema,
  MongooseEvent,
};
