const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 10,
    maxlength: 10, // 10 characters roll number (alphabets and numbers)
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String,
    required: true,
    default: 'Computer Science & Engineering',
  },
  year: {
    type: String,
    required: true,
    default: 'Year 3',
  },
  section: {
    type: String,
    required: true,
    default: 'A',
  },
  parentMobile: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  embedding: {
    type: [Number],
    default: [], // VGG-Face facial embedding vector
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to verify password
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
