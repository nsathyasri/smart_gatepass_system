const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const GatePass = require('../models/GatePass');
const AuditLog = require('../models/AuditLog');

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ students });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Add new student (Admin adds student details)
router.post('/students', async (req, res) => {
  try {
    const { studentId, name, branch, year, section, parentMobile, imageUrl, embedding, password } = req.body;

    if (!studentId || !name || !parentMobile) {
      return res.status(400).json({ message: 'Student ID (10 chars), Name, and Parent Mobile are required' });
    }

    if (studentId.trim().length !== 10) {
      return res.status(400).json({ message: 'Student Roll Number must be exactly 10 alphanumeric characters' });
    }

    const existing = await Student.findOne({ studentId: studentId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ message: `Student ID ${studentId} is already registered` });
    }

    const student = new Student({
      studentId: studentId.toUpperCase().trim(),
      name,
      branch: branch || 'Data Science',
      year: year || 'Year 4',
      section: section || 'D',
      parentMobile,
      imageUrl: imageUrl || '',
      embedding: embedding || [],
      password: password || 'student123',
    });

    await student.save();

    await AuditLog.create({
      action: 'STUDENT_ENROLLED',
      actorRole: 'Admin',
      actorId: req.body.adminId || 'Admin',
      studentId: student.studentId,
      details: `Student ${name} (${student.studentId}) registered in system database.`,
    });

    return res.status(201).json({ message: 'Student registered successfully', student });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Also remove associated gate passes
    await GatePass.deleteMany({ studentId: student.studentId });

    await AuditLog.create({
      action: 'STUDENT_REMOVED',
      actorRole: 'Admin',
      actorId: 'Admin',
      studentId: student.studentId,
      details: `Student ${student.studentId} record deleted by Admin.`,
    });

    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

// System Overview stats
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalGatePasses = await GatePass.countDocuments();
    const pendingPasses = await GatePass.countDocuments({ status: 'Pending' });
    const approvedPasses = await GatePass.countDocuments({ status: 'Approved' });
    const exitedPasses = await GatePass.countDocuments({ status: 'Left Campus' });
    const rejectedPasses = await GatePass.countDocuments({ status: 'Rejected' });

    return res.status(200).json({
      stats: {
        totalStudents,
        totalGatePasses,
        pendingPasses,
        approvedPasses,
        exitedPasses,
        rejectedPasses,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching logs', error: error.message });
  }
});

// System Users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

module.exports = router;
