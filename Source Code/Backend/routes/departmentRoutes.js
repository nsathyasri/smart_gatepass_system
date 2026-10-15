const express = require('express');
const router = express.Router();
const {
  getDepartmentRequests,
  updateRequestStatus,
} = require('../controllers/gatepassController');
const Student = require('../models/Student');
const GatePass = require('../models/GatePass');

// Get all requests for HOD (today and history)
router.get('/requests', getDepartmentRequests);

// Approve or reject
router.put('/status/:id', updateRequestStatus);

// View specific student's gate pass history
router.get('/student-history/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const history = await GatePass.find({ studentId: studentId.toUpperCase().trim() }).sort({ createdAt: -1 });
    const student = await Student.findOne({ studentId: studentId.toUpperCase().trim() });
    return res.status(200).json({ student, history });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching student history', error: error.message });
  }
});

module.exports = router;
