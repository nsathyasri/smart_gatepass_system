const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const gatepassRoutes = require('./routes/gatepassRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const guardRoutes = require('./routes/guardRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/gatepass', gatepassRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/guard', guardRoutes);
app.use('/api/admin', adminRoutes);

// System Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'Automated Smart Gate Pass and Identity Verification System',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SmartGPS Backend] Server running on port ${PORT}`);
});

module.exports = app;
