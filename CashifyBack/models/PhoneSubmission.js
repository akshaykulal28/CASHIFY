const mongoose = require('mongoose');

const phoneSubmissionSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    required: true,
  },
  batteryLife: {
    type: String,
    required: true,
  },
  durationUsed: {
    type: String,
    required: true,
  },
  damage: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  images: [
    {
      type: String,
    },
  ],
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'accepted', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PhoneSubmission = mongoose.model('PhoneSubmission', phoneSubmissionSchema);

module.exports = PhoneSubmission;
