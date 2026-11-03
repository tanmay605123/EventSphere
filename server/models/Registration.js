const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  registrationId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['registered', 'cancelled'],
    default: 'registered',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseRegistration = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);

module.exports = {
  registrationSchema,
  MongooseRegistration,
};
