const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  actorRole: {
    type: String,
    required: true, // Student, HoD, Security Guard, Admin
  },
  actorId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    default: '',
  },
  details: {
    type: String,
    required: true,
  },
  similarityScore: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    default: 'SUCCESS',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
