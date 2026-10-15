const express = require('express');
const router = express.Router();
const {
  sendGatePassRequest,
  confirmParent,
  viewStudentStatus,
  deleteRequest,
} = require('../controllers/gatepassController');

router.post('/request', sendGatePassRequest);
router.get('/status/:studentId', viewStudentStatus);
router.delete('/:id', deleteRequest);
router.put('/confirm-parent/:id', confirmParent);

module.exports = router;
