const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true, // YYYY-MM-DD
  },
  time: {
    type: String,
    required: true, // HH:MM or 12-hour format
  },
  reason: {
    type: String,
    required: true,
  },
  parentNotified: {
    type: Boolean,
    default: true,
  },
  parentConfirmed: {
    type: Boolean,
    default: false, // Parent confirms request to HoD
  },
  parentConfirmedAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Left Campus'],
    default: 'Pending',
  },
  hodRemarks: {
    type: String,
    default: '',
  },
  securityGuardVerifiedBy: {
    type: String,
    default: '',
  },
  faceVerificationSimilarity: {
    type: Number,
    default: null,
  },
  leftAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('GatePass', gatePassSchema);
