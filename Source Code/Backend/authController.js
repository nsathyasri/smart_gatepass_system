const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const User = require('../models/User');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'smartgps_jwt_super_secret_key_2026', {
    expiresIn: '1d',
  });
};

// Sign-Up for users (Student, HOD, Security Guard, Admin)
const signup = async (req, res) => {
  try {
    const { role, id, password, name, branch, year, section, parentMobile, imageUrl, embedding } = req.body;

    if (!role || !id || !password) {
      return res.status(400).json({ message: 'Role, ID/Username, and Password are required.' });
    }

    if (role === 'student') {
      // Check 10-char roll number
      if (id.trim().length !== 10) {
        return res.status(400).json({ message: 'Roll number must be exactly 10 alphanumeric characters.' });
      }

      const existingStudent = await Student.findOne({ studentId: id.toUpperCase().trim() });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student with this Roll Number already exists. Please login.' });
      }

      const student = new Student({
        studentId: id.toUpperCase().trim(),
        name: name || 'Student',
        branch: branch || 'Data Science',
        year: year || 'Year 4',
        section: section || 'D',
        parentMobile: parentMobile || '9876543210',
        imageUrl: imageUrl || '',
        embedding: embedding || [],
        password,
      });

      await student.save();
      const token = generateToken({ id: student._id, studentId: student.studentId, role: 'student' });
      return res.status(201).json({
        message: 'Student registered successfully',
        token,
        role: 'student',
        user: {
          id: student.studentId,
          studentId: student.studentId,
          name: student.name,
          branch: student.branch,
          year: student.year,
          section: student.section,
          parentMobile: student.parentMobile,
          imageUrl: student.imageUrl,
        },
      });
    } else {
      // HOD, Security Guard, Admin
      const existingUser = await User.findOne({ username: id.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({ message: `User ${id} already registered. Please login.` });
      }

      const user = new User({
        role,
        username: id.toLowerCase().trim(),
        name: name || (role === 'department' ? 'Department HoD' : role === 'guard' ? 'Security Guard' : 'Administrator'),
        department: branch || 'Campus Administration',
        password,
      });

      await user.save();
      const token = generateToken({ id: user._id, username: user.username, role });
      return res.status(201).json({
        message: `${role} registered successfully`,
        token,
        role,
        user: {
          id: user.username,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// Login for all roles
const login = async (req, res) => {
  const { role, id, password } = req.body;

  try {
    if (!role || !id || !password) {
      return res.status(400).json({ message: 'Please provide role, ID/username, and password' });
    }

    if (role === 'student') {
      const student = await Student.findOne({ studentId: id.toUpperCase().trim() });
      if (!student) {
        return res.status(401).json({ message: 'Student ID not registered. Please sign up.' });
      }

      const isMatch = await student.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({ id: student._id, studentId: student.studentId, role: 'student' });
      return res.status(200).json({
        message: 'Login successful',
        token,
        role: 'student',
        user: {
          id: student.studentId,
          studentId: student.studentId,
          name: student.name,
          branch: student.branch,
          year: student.year,
          section: student.section,
          parentMobile: student.parentMobile,
          imageUrl: student.imageUrl,
        },
      });
    } else {
      // Department / HoD, Security Guard, Admin
      const user = await User.findOne({ username: id.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({ message: 'User not registered. Please sign up.' });
      }

      if (user.role !== role) {
        return res.status(401).json({ message: `This account is registered as ${user.role}, not ${role}` });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({ id: user._id, username: user.username, role: user.role });
      return res.status(200).json({
        message: 'Login successful',
        token,
        role: user.role,
        user: {
          id: user.username,
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department,
        },
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during authentication', error: error.message });
  }
};

module.exports = { signup, login };
