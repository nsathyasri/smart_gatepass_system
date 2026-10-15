const express = require('express');
const router = express.Router();
const {
  getApprovedRequests,
  markLeftCampus,
} = require('../controllers/gatepassController');
const { verifyFace } = require('../controllers/faceVerificationController');

// Security Guard view approved requests
router.get('/requests', getApprovedRequests);

// Mark student as Left Campus
router.put('/mark-left/:id', markLeftCampus);

// Biometric Face Verification scan at gate
router.post('/verify-face', verifyFace);

module.exports = router;
