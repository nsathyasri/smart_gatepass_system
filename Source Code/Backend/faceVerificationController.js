const { spawnSync } = require('child_process');
const path = require('path');
const Student = require('../models/Student');
const GatePass = require('../models/GatePass');
const AuditLog = require('../models/AuditLog');

// VGG-Face Cosine Similarity matching threshold from Chapter 6
const SIMILARITY_THRESHOLD = 0.40;

// Helper: Dot product
function dotProduct(vecA, vecB) {
  let sum = 0;
  for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
    sum += vecA[i] * vecB[i];
  }
  return sum;
}

// Helper: Vector magnitude |A| = sqrt(sum(Ai^2))
function magnitude(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum) || 1e-9;
}

// Cosine similarity: (A · B) / (|A| * |B|)
function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}

// Verify face against approved gate pass requests
const verifyFace = async (req, res) => {
  try {
    const { scannedImageUrl, scannedEmbedding, targetStudentId } = req.body;

    let liveEmbedding = scannedEmbedding;

    // If scannedImageUrl is given without embedding, try python face_engine / verify_face_fast
    if (!liveEmbedding && scannedImageUrl) {
      try {
        const pythonScript = path.join(__dirname, '../../python_face_recognition/verify_face_fast.py');
        const pyResult = spawnSync('python3', [pythonScript, scannedImageUrl]);
        if (pyResult.stdout) {
          const parsed = JSON.parse(pyResult.stdout.toString().trim());
          if (parsed.embedding) {
            liveEmbedding = parsed.embedding;
          }
        }
      } catch (e) {
        console.warn('Python face verification microservice invocation fallback:', e.message);
      }
    }

    if (!liveEmbedding || !Array.isArray(liveEmbedding) || liveEmbedding.length === 0) {
      return res.status(400).json({
        message: 'No facial embedding data available from the camera scan. Please ensure the student is looking directly into the camera lens.',
        match: false,
      });
    }

    // Retrieve approved gate pass requests that haven't left yet
    const query = { status: 'Approved', leftAt: null };
    if (targetStudentId) {
      query.studentId = targetStudentId.toUpperCase().trim();
    }

    const approvedRequests = await GatePass.find(query).populate('student');

    if (approvedRequests.length === 0) {
      // Audit log the rejected scan
      await AuditLog.create({
        action: 'FACE_SCAN_REJECTED',
        actorRole: 'Security Guard',
        actorId: req.body.guardId || 'Gate Guard',
        details: 'Face scan performed at gate, but no matching student with active APPROVED gate pass was found.',
        status: 'DENIED',
      });

      return res.status(404).json({
        message: 'No active approved gate pass found for this time. Access Denied.',
        match: false,
      });
    }

    let bestMatchStudent = null;
    let bestMatchedRequest = null;
    let highestSimilarity = -1;

    for (const request of approvedRequests) {
      const student = request.student;
      if (!student || !student.embedding || student.embedding.length === 0) {
        continue;
      }

      const similarity = calculateCosineSimilarity(liveEmbedding, student.embedding);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatchStudent = student;
        bestMatchedRequest = request;
      }
    }

    const confidenceScore = Math.max(0, Math.min(100, Math.round(highestSimilarity * 100)));

    if (highestSimilarity >= SIMILARITY_THRESHOLD && bestMatchStudent && bestMatchedRequest) {
      await AuditLog.create({
        action: 'FACE_SCAN_VERIFIED',
        actorRole: 'Security Guard',
        actorId: req.body.guardId || 'Security Guard',
        studentId: bestMatchStudent.studentId,
        similarityScore: Number(highestSimilarity.toFixed(4)),
        details: `VGG-Face match confirmed (Similarity: ${(highestSimilarity * 100).toFixed(1)}%). Approved for campus exit.`,
        status: 'VERIFIED',
      });

      return res.status(200).json({
        match: true,
        message: 'Face verified successfully - Student Allowed Exit',
        similarity: Number(highestSimilarity.toFixed(4)),
        confidence: confidenceScore,
        threshold: SIMILARITY_THRESHOLD,
        student: {
          studentId: bestMatchStudent.studentId,
          name: bestMatchStudent.name,
          branch: bestMatchStudent.branch,
          year: bestMatchStudent.year,
          section: bestMatchStudent.section,
          parentMobile: bestMatchStudent.parentMobile,
          imageUrl: bestMatchStudent.imageUrl,
        },
        gatePass: {
          id: bestMatchedRequest._id,
          reason: bestMatchedRequest.reason,
          date: bestMatchedRequest.date,
          time: bestMatchedRequest.time,
          status: bestMatchedRequest.status,
          hodRemarks: bestMatchedRequest.hodRemarks,
        },
      });
    } else {
      await AuditLog.create({
        action: 'FACE_SCAN_MISMATCH',
        actorRole: 'Security Guard',
        actorId: req.body.guardId || 'Security Guard',
        similarityScore: Number(highestSimilarity.toFixed(4)),
        details: `Biometric verification failed. Highest similarity: ${(highestSimilarity * 100).toFixed(1)}% (Threshold: ${(SIMILARITY_THRESHOLD * 100)}%). Exit Denied.`,
        status: 'MISMATCH',
      });

      return res.status(401).json({
        match: false,
        message: 'Face verification failed - Access Denied. Biometric facial signature does not match the approved student record.',
        similarity: Number(highestSimilarity.toFixed(4)),
        threshold: SIMILARITY_THRESHOLD,
      });
    }
  } catch (error) {
    console.error('verifyFace error:', error);
    return res.status(500).json({ message: 'Error performing facial verification', error: error.message });
  }
};

module.exports = {
  verifyFace,
  SIMILARITY_THRESHOLD,
  calculateCosineSimilarity,
};
