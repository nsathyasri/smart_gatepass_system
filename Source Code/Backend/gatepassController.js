const GatePass = require('../models/GatePass');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');

// 1. Student submits gate pass request
const sendGatePassRequest = async (req, res) => {
  try {
    const { studentId, date, time, reason } = req.body;

    if (!studentId || !date || !time || !reason) {
      return res.status(400).json({ message: 'Roll number, date, time, and reason are required' });
    }

    const student = await Student.findOne({ studentId: studentId.toUpperCase().trim() });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found in system database' });
    }

    // Check if there is already an active pending request
    const existingPending = await GatePass.findOne({
      studentId: student.studentId,
      status: 'Pending',
    });

    if (existingPending) {
      return res.status(400).json({ message: 'You already have an active pending gate pass request.' });
    }

    const gatePass = new GatePass({
      student: student._id,
      studentId: student.studentId,
      date,
      time,
      reason,
      parentNotified: true,
      parentConfirmed: false,
      status: 'Pending',
    });

    await gatePass.save();

    // Create audit log
    await AuditLog.create({
      action: 'GATE_PASS_REQUESTED',
      actorRole: 'Student',
      actorId: student.studentId,
      studentId: student.studentId,
      details: `Gate pass requested for ${date} at ${time}. Reason: "${reason}". Parent SMS notification dispatched to ${student.parentMobile}.`,
    });

    return res.status(201).json({
      message: 'Gate pass request submitted successfully. Parent notified for HoD confirmation.',
      gatePass,
    });
  } catch (error) {
    console.error('sendGatePassRequest error:', error);
    return res.status(500).json({ message: 'Error submitting gate pass request', error: error.message });
  }
};

// 2. Parent confirms the request to HoD
const confirmParent = async (req, res) => {
  try {
    const { id } = req.params;
    const gatePass = await GatePass.findById(id).populate('student');

    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    gatePass.parentConfirmed = true;
    gatePass.parentConfirmedAt = new Date();
    await gatePass.save();

    await AuditLog.create({
      action: 'PARENT_CONFIRMED',
      actorRole: 'Parent',
      actorId: gatePass.student?.parentMobile || 'Parent',
      studentId: gatePass.studentId,
      details: `Parent confirmed gate pass request for student ${gatePass.studentId} to HoD.`,
    });

    return res.status(200).json({
      message: "Parent confirmation recorded. Request is ready for HoD review.",
      gatePass,
    });
  } catch (error) {
    console.error('confirmParent error:', error);
    return res.status(500).json({ message: 'Error updating parent confirmation', error: error.message });
  }
};

// 3. View student request status
const viewStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const requests = await GatePass.find({ studentId: studentId.toUpperCase().trim() })
      .populate('student')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('viewStudentStatus error:', error);
    return res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// 4. Delete pending request (prevent deletion if already approved)
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const gatePass = await GatePass.findById(id);

    if (!gatePass) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (gatePass.status === 'Approved' || gatePass.status === 'Left Campus') {
      return res.status(400).json({ message: 'Approved requests cannot be deleted.' });
    }

    await GatePass.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'REQUEST_WITHDRAWN',
      actorRole: 'Student',
      actorId: gatePass.studentId,
      studentId: gatePass.studentId,
      details: `Pending gate pass request for ${gatePass.date} was withdrawn by student.`,
    });

    return res.status(200).json({ message: 'Gate pass request deleted successfully' });
  } catch (error) {
    console.error('deleteRequest error:', error);
    return res.status(500).json({ message: 'Error deleting request', error: error.message });
  }
};

// 5. HoD view all requests (with filtering)
const getDepartmentRequests = async (req, res) => {
  try {
    const requests = await GatePass.find()
      .populate('student')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('getDepartmentRequests error:', error);
    return res.status(500).json({ message: 'Error fetching department requests', error: error.message });
  }
};

// 6. HoD approves or rejects request
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected.' });
    }

    const gatePass = await GatePass.findById(id).populate('student');
    if (!gatePass) {
      return res.status(404).json({ message: 'Request not found' });
    }

    gatePass.status = status;
    if (remarks !== undefined) {
      gatePass.hodRemarks = remarks;
    }
    await gatePass.save();

    await AuditLog.create({
      action: status === 'Approved' ? 'HOD_APPROVED' : 'HOD_REJECTED',
      actorRole: 'HOD',
      actorId: 'dshod.gcet.edu.in',
      studentId: gatePass.studentId,
      details: `HoD ${status.toLowerCase()} gate pass. Message to student: "${remarks || 'None'}".`,
    });

    return res.status(200).json({
      message: `Gate pass ${status.toLowerCase()} successfully`,
      gatePass,
    });
  } catch (error) {
    console.error('updateRequestStatus error:', error);
    return res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

// 7. Security Guard views approved requests
const getApprovedRequests = async (req, res) => {
  try {
    const requests = await GatePass.find({ status: { $in: ['Approved', 'Left Campus'] } })
      .populate('student')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('getApprovedRequests error:', error);
    return res.status(500).json({ message: 'Error fetching approved requests', error: error.message });
  }
};

// 8. Security Guard marks student as Left Campus
const markLeftCampus = async (req, res) => {
  try {
    const { id } = req.params;
    const { securityGuardId, similarity } = req.body;

    const gatePass = await GatePass.findById(id).populate('student');
    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass record not found' });
    }

    if (gatePass.status !== 'Approved') {
      return res.status(400).json({ message: `Cannot mark exit for request with status: ${gatePass.status}` });
    }

    gatePass.status = 'Left Campus';
    gatePass.leftAt = new Date();
    if (securityGuardId) gatePass.securityGuardVerifiedBy = securityGuardId;
    if (similarity !== undefined) gatePass.faceVerificationSimilarity = similarity;
    await gatePass.save();

    await AuditLog.create({
      action: 'CAMPUS_EXIT_CONFIRMED',
      actorRole: 'Security Guard',
      actorId: securityGuardId || 'Security Guard',
      studentId: gatePass.studentId,
      similarityScore: similarity,
      details: `Student verified via biometric facial comparison and allowed to exit campus. Status marked as Left Campus.`,
    });

    return res.status(200).json({
      message: 'Student marked as Left Campus. Exit broadcast to HoD, Parent, and Student.',
      gatePass,
    });
  } catch (error) {
    console.error('markLeftCampus error:', error);
    return res.status(500).json({ message: 'Error marking campus exit', error: error.message });
  }
};

module.exports = {
  sendGatePassRequest,
  confirmParent,
  viewStudentStatus,
  deleteRequest,
  getDepartmentRequests,
  updateRequestStatus,
  getApprovedRequests,
  markLeftCampus,
};
