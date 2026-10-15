import React, { useState } from 'react';
import { Role, Student, UserAccount } from '../types';
import { StorageService } from '../services/storage';
import { extractEmbeddingFromCanvas, generateDeterministicEmbedding } from '../services/faceMatcher';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  School,
  Sliders,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface AuthPortalProps {
  targetRole: Role;
  onLoginSuccess: (user: any, role: Role) => void;
  onSwitchRole: (role: Role) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  targetRole,
  onLoginSuccess,
  onSwitchRole,
}) => {
  // Mode: 'login' or 'signup'
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // Form Fields
  const [identifier, setIdentifier] = useState<string>(
    targetRole === 'department'
      ? 'dshod.gcet.edu.in'
      : targetRole === 'guard'
      ? 'name@gcet.edu.in'
      : targetRole === 'admin'
      ? 'admin@gcet.edu.in'
      : ''
  );
  const [password, setPassword] = useState<string>(
    targetRole === 'department'
      ? 'hod123'
      : targetRole === 'guard'
      ? 'guard123'
      : targetRole === 'admin'
      ? 'admin123'
      : ''
  );

  // Student specific signup fields
  const [studentName, setStudentName] = useState<string>('');
  const [branch, setBranch] = useState<string>('Computer Science & Engineering');
  const [year, setYear] = useState<string>('Year 3');
  const [section, setSection] = useState<string>('A');
  const [parentMobile, setParentMobile] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [generatedEmbedding, setGeneratedEmbedding] = useState<number[]>([]);

  // Update default credentials when role changes
  const handleRoleTabChange = (newRole: Role) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSignUp(false);
    onSwitchRole(newRole);

    if (newRole === 'department') {
      setIdentifier('dshod.gcet.edu.in');
      setPassword('hod123');
    } else if (newRole === 'guard') {
      setIdentifier('name@gcet.edu.in');
      setPassword('guard123');
    } else if (newRole === 'admin') {
      setIdentifier('admin@gcet.edu.in');
      setPassword('admin123');
    } else {
      setIdentifier('');
      setPassword('');
    }
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    // Extract real facial embedding from captured photo
    const img = new Image();
    img.src = photoDataUrl;
    img.onload = () => {
      const emb = extractEmbeddingFromCanvas(img, identifier);
      setGeneratedEmbedding(emb);
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = identifier.trim();

    if (!cleanId) {
      setErrorMsg(targetRole === 'student' ? 'Please enter your 10-character Roll Number' : 'Please enter your username/email');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    // --- SIGN UP LOGIC ---
    if (isSignUp) {
      if (targetRole === 'student') {
        if (cleanId.length !== 10) {
          setErrorMsg('Student Roll Number must be exactly 10 alphanumeric characters (e.g. 23R11A67G6).');
          return;
        }

        if (!studentName.trim()) {
          setErrorMsg('Please enter full student name.');
          return;
        }

        if (!parentMobile.trim() || parentMobile.trim().length < 10) {
          setErrorMsg("Please enter a valid 10-digit parent's mobile number.");
          return;
        }

        // Check if student already exists
        const existingStudent = StorageService.getStudentById(cleanId);
        if (existingStudent) {
          setErrorMsg(`Student with Roll Number ${cleanId.toUpperCase()} already exists. Please switch to Login.`);
          return;
        }

        // Create student
        const embedding = generatedEmbedding.length > 0 ? generatedEmbedding : generateDeterministicEmbedding(cleanId);
        const newStudent: Student = {
          id: 'stu-' + Date.now(),
          studentId: cleanId.toUpperCase(),
          name: studentName.trim(),
          branch,
          year,
          section,
          parentMobile: parentMobile.trim(),
          imageUrl: capturedPhoto || '',
          embedding,
          password,
          createdAt: new Date().toISOString(),
        };

        StorageService.saveStudent(newStudent);
        setSuccessMsg('Student registration completed! Logging into Student Dashboard...');
        setTimeout(() => {
          onLoginSuccess(newStudent, 'student');
        }, 800);
      } else {
        // Staff Sign-Up (HOD, Security Guard, Admin)
        const users = StorageService.getUsers();
        const existing = users.find((u) => u.username.toLowerCase() === cleanId.toLowerCase());
        if (existing) {
          setErrorMsg(`User account "${cleanId}" already registered. Please login.`);
          return;
        }

        const newUser: UserAccount = {
          id: 'user-' + Date.now(),
          role: targetRole,
          username: cleanId.toLowerCase(),
          name:
            targetRole === 'department'
              ? 'Head of Department'
              : targetRole === 'guard'
              ? 'Security Guard'
              : 'System Administrator',
          department: targetRole === 'department' ? 'Academic Department' : 'Campus Administration',
          createdAt: new Date().toISOString(),
        };

        StorageService.addUser(newUser);
        setSuccessMsg(`${getRoleLabel(targetRole)} account created! Redirecting to dashboard...`);
        setTimeout(() => {
          onLoginSuccess(newUser, targetRole);
        }, 800);
      }
      return;
    }

    // --- LOGIN LOGIC ---
    if (targetRole === 'student') {
      const student = StorageService.getStudentById(cleanId);
      if (!student) {
        setErrorMsg('Student Roll Number not registered yet. Please click "Sign Up" below to register.');
        return;
      }

      if (student.password && student.password !== password) {
        setErrorMsg('Invalid password. Please check your credentials.');
        return;
      }

      onLoginSuccess(student, 'student');
    } else {
      // HOD, Security Guard, Admin
      const users = StorageService.getUsers();
      const user = users.find((u) => u.username.toLowerCase() === cleanId.toLowerCase());

      if (!user) {
        // If it matches standard demo credentials, create session or notify
        if (
          (targetRole === 'department' && cleanId === 'dshod.gcet.edu.in') ||
          (targetRole === 'guard' && cleanId === 'name@gcet.edu.in') ||
          (targetRole === 'admin' && cleanId === 'admin@gcet.edu.in')
        ) {
          const defaultUser: UserAccount = {
            id: 'user-' + targetRole,
            role: targetRole,
            username: cleanId,
            name:
              targetRole === 'department'
                ? 'Head of Department (CSE)'
                : targetRole === 'guard'
                ? 'Main Gate Security Guard'
                : 'Central Administrator',
            department: 'GCET Campus',
            createdAt: new Date().toISOString(),
          };
          onLoginSuccess(defaultUser, targetRole);
          return;
        }

        setErrorMsg('User account not found. Please verify username or sign up.');
        return;
      }

      if (user.role !== targetRole) {
        setErrorMsg(`This account is registered for ${user.role.toUpperCase()} portal.`);
        return;
      }

      onLoginSuccess(user, targetRole);
    }
  };

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case 'student':
        return 'Student';
      case 'department':
        return 'HoD';
      case 'guard':
        return 'Security Guard';
      case 'admin':
        return 'Admin';
    }
  };

  return (
    <div className="min-h-[calc(100vh-110px)] flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30">
      {/* Role Selection Tabs */}
      <div className="w-full max-w-xl mb-6">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => handleRoleTabChange('student')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 ${
              targetRole === 'student'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('department')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 ${
              targetRole === 'department'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <School className="w-4 h-4" />
            <span>HoD</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('guard')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 ${
              targetRole === 'guard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security Guard</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('admin')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 ${
              targetRole === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-blue-100 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
                Official Authentication
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                {getRoleLabel(targetRole)} {isSignUp ? 'Registration' : 'Login'}
              </h2>
              <p className="text-xs text-blue-100 mt-1">
                {targetRole === 'student'
                  ? 'Enter 10-character Roll Number and credentials to access gate pass portal'
                  : targetRole === 'department'
                  ? 'Department Head portal for verifying parent approvals & sanctions'
                  : targetRole === 'guard'
                  ? 'Main Gate terminal with VGG-Face biometric identity scanner'
                  : 'Campus system administration & student records management'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              {targetRole === 'student' ? (
                <UserCheck className="w-6 h-6" />
              ) : targetRole === 'department' ? (
                <School className="w-6 h-6" />
              ) : targetRole === 'guard' ? (
                <Shield className="w-6 h-6" />
              ) : (
                <Sliders className="w-6 h-6" />
              )}
            </div>
          </div>

          {/* Toggle Sign-Up vs Login */}
          <div className="mt-5 flex items-center bg-blue-950/40 p-1 rounded-xl border border-blue-600/50 max-w-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                !isSignUp ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'
              }`}
            >
              Sign In (Existing)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                isSignUp ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'
              }`}
            >
              Sign Up (First Time)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Identifier Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {targetRole === 'student' ? 'Student Roll Number (10 Characters)' : 'Username / College Email'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  targetRole === 'student'
                    ? 'e.g. 23R11A67G6 (10 chars)'
                    : targetRole === 'department'
                    ? 'dshod.gcet.edu.in'
                    : targetRole === 'guard'
                    ? 'name@gcet.edu.in'
                    : 'admin@gcet.edu.in'
                }
                maxLength={targetRole === 'student' ? 10 : 80}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
              />
            </div>
            {targetRole === 'student' && (
              <p className="text-[11px] text-slate-500 mt-1">
                Must be exactly 10 alphanumeric characters (e.g. 23R11A67G6).
              </p>
            )}
          </div>

          {/* Student Sign-Up Specific Fields */}
          {isSignUp && targetRole === 'student' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Siri"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Branch / Dept
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Data Science">DS</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">MECH</option>
                    <option value="Civil Engineering">CIVIL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent's Mobile Number (For Gate Pass SMS Alerts)
                </label>
                <input
                  type="tel"
                  value={parentMobile}
                  onChange={(e) => setParentMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Facial Biometric Registration */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Biometric Face Registration (VGG-Face)
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      Required for Security Guard gate verification and identity validation
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{capturedPhoto ? 'Retake Photo' : 'Capture Face'}</span>
                  </button>
                </div>

                {capturedPhoto ? (
                  <div className="flex items-center space-x-3 mt-3 bg-white p-2.5 rounded-lg border border-blue-200">
                    <img
                      src={capturedPhoto}
                      alt="Student Face"
                      className="w-14 h-14 rounded-lg object-cover border border-blue-300"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Facial Profile & Embeddings Generated</span>
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        128-dimensional VGG feature vector stored for gate verification
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">
                    No photo captured yet. You can capture via webcam or upload.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2"
            >
              <span>{isSignUp ? 'Complete Registration & Enter' : `Login to ${getRoleLabel(targetRole)} Portal`}</span>
            </button>
          </div>

          {/* Preset / Default credential reminder */}
          {!isSignUp && (
            <div className="pt-2 text-center text-xs text-slate-500">
              {targetRole === 'department' && (
                <p>
                  Official HoD login: <span className="font-mono text-blue-700 font-semibold">dshod.gcet.edu.in</span> / <span className="font-mono text-blue-700">hod123</span>
                </p>
              )}
              {targetRole === 'guard' && (
                <p>
                  Security Guard login: <span className="font-mono text-blue-700 font-semibold">name@gcet.edu.in</span> / <span className="font-mono text-blue-700">guard123</span>
                </p>
              )}
              {targetRole === 'admin' && (
                <p>
                  Admin login: <span className="font-mono text-blue-700 font-semibold">admin@gcet.edu.in</span> / <span className="font-mono text-blue-700">admin123</span>
                </p>
              )}
              {targetRole === 'student' && (
                <p>
                  First time? Click <span className="font-semibold text-blue-600 cursor-pointer" onClick={() => setIsSignUp(true)}>Sign Up</span> to register your 10-character Roll Number!
                </p>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        title="Student Face Registration"
        instruction="Capture clear facial image for VGG-Face biometric identity verification"
      />
    </div>
  );
};
