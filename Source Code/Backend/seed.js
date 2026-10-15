const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedSystemAccounts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartgps';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for system initialization');

    // 1. Ensure HOD account exists
    const hodUsername = 'dshod.gcet.edu.in';
    const existingHod = await User.findOne({ username: hodUsername });
    if (!existingHod) {
      const hod = new User({
        role: 'department',
        username: hodUsername,
        name: 'Head of Department (DS)',
        department: 'Data Science',
        password: 'hodpassword123',
      });
      await hod.save();
      console.log(`[Seed] HoD account created: ${hodUsername}`);
    }

    // 2. Ensure Security Guard account exists
    const guardUsername = 'name@gcet.edu.in';
    const existingGuard = await User.findOne({ username: guardUsername });
    if (!existingGuard) {
      const guard = new User({
        role: 'guard',
        username: guardUsername,
        name: 'Main Gate Security Guard',
        department: 'Campus Security Office',
        password: 'guardpassword123',
      });
      await guard.save();
      console.log(`[Seed] Security Guard account created: ${guardUsername}`);
    }

    // 3. Ensure Admin account exists
    const adminUsername = 'admin@gcet.edu.in';
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      const admin = new User({
        role: 'admin',
        username: adminUsername,
        name: 'Campus System Administrator',
        department: 'Security & Access Administration',
        password: 'adminpassword123',
      });
      await admin.save();
      console.log(`[Seed] Admin account created: ${adminUsername}`);
    }

    console.log('[Seed] System accounts verified successfully.');
    console.log('[Notice] Student repository kept clean so you can enter your genuine student data via the portal/Admin console.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed system accounts:', error);
    process.exit(1);
  }
};

seedSystemAccounts();
