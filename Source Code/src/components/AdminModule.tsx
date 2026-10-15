import React, { useState } from 'react';
import { Student, UserAccount, AuditLogItem } from '../types';
import { StorageService } from '../services/storage';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  extractEmbeddingFromCanvas,
  generateDeterministicEmbedding,
} from '../services/faceMatcher';
import {
  Sliders,
  UserPlus,
  Users,
  ShieldCheck,
  Trash2,
  Camera,
  Activity,
  CheckCircle2,
  AlertCircle,
  Building,
  Phone,
  Search,
  School,
  Shield,
  Clock,
  UserCheck,
} from 'lucide-react';

interface AdminModuleProps {
  onRefresh: () => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'users' | 'logs'>('students');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Student Form State
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [branch, setBranch] = useState<string>('Data Science');
  const [year, setYear] = useState<string>('Year 4');
  const [section, setSection] = useState<string>('D');
  const [parentMobile, setParentMobile] = useState<string>('');
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [studentPassword, setStudentPassword] = useState<string>('student123');

  const allStudents = StorageService.getStudents();
  const allUsers = StorageService.getUsers();
  const allLogs = StorageService.getAuditLogs();
  const allPasses = StorageService.getGatePasses();

  const handlePhotoCaptured = (photoDataUrl: string) => {
    setStudentPhoto(photoDataUrl);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentId.trim().toUpperCase();

    if (cleanId.length !== 10) {
      setToastMessage({ type: 'error', text: 'Student Roll Number must be exactly 10 alphanumeric characters (e.g. 22B81A1245).' });
      return;
    }

    if (!studentName.trim()) {
      setToastMessage({ type: 'error', text: 'Please enter student name.' });
      return;
    }

    if (!parentMobile.trim() || parentMobile.trim().length < 10) {
      setToastMessage({ type: 'error', text: "Please enter a valid 10-digit parent's mobile number." });
      return;
    }

    // Check existing
    const existing = StorageService.getStudentById(cleanId);
    if (existing) {
      setToastMessage({ type: 'error', text: `Student with Roll Number ${cleanId} is already enrolled.` });
      return;
    }

    let embedding: number[] = [];
    if (studentPhoto) {
      const img = new Image();
      img.src = studentPhoto;
      embedding = extractEmbeddingFromCanvas(img, cleanId);
    } else {
      embedding = generateDeterministicEmbedding(cleanId);
    }

    const newStudent: Student = {
      id: 'stu-' + Date.now(),
      studentId: cleanId,
      name: studentName.trim(),
      branch,
      year,
      section,
      parentMobile: parentMobile.trim(),
      imageUrl: studentPhoto || '',
      embedding,
      password: studentPassword || 'student123',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveStudent(newStudent);
    setToastMessage({ type: 'success', text: `Student ${newStudent.name} (${newStudent.studentId}) successfully registered!` });

    // Reset Form
    setStudentId('');
    setStudentName('');
    setParentMobile('');
    setStudentPhoto(null);
    setIsAddStudentModalOpen(false);
    onRefresh();
  };

  const handleDeleteStudent = (stu: Student) => {
    if (confirm(`Remove student ${stu.name} (${stu.studentId}) from system?`)) {
      StorageService.deleteStudent(stu.studentId);
      setToastMessage({ type: 'success', text: `Student ${stu.studentId} removed.` });
      onRefresh();
    }
  };

  const filteredStudents = allStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentId.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.branch.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Admin Console Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Admin Control Center</h2>
              <p className="text-xs text-slate-500">
                Logged in as: <span className="font-mono text-blue-700 font-semibold">admin@gcet.edu.in</span> • Student database CRUD & system monitoring
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student Details</span>
          </button>
        </div>

        {/* System Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
              Enrolled Students
            </span>
            <span className="text-2xl font-bold text-blue-900 mt-1 block">{allStudents.length}</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Active Passes Today
            </span>
            <span className="text-2xl font-bold text-amber-900 mt-1 block">{allPasses.length}</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Campus Exits Recorded
            </span>
            <span className="text-2xl font-bold text-emerald-900 mt-1 block">
              {allPasses.filter((p) => p.status === 'Left Campus').length}
            </span>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider block">
              System Audit Events
            </span>
            <span className="text-2xl font-bold text-indigo-900 mt-1 block">{allLogs.length}</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Admin Module Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'students'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manage Students ({allStudents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'users'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Manage System Users ({allUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'logs'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Audit Logs ({allLogs.length})</span>
            </button>
          </div>

          {activeTab === 'students' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter Roll No, Name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}
        </div>

        {/* TAB 1: MANAGE STUDENTS */}
        {activeTab === 'students' && (
          <div className="mt-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base">Student Database Ready</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  You requested: <em>"I have the students details, i will enter them when required"</em>.
                  Click the button below to add your genuine student details (Roll number, Name, Year, Section, Department, Parent Mobile, Photo).
                </p>
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="mt-4 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Enter Student Details Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-blue-100 bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Roll Number (10 Chars)</th>
                      <th className="py-3 px-3">Department / Branch</th>
                      <th className="py-3 px-3">Year & Section</th>
                      <th className="py-3 px-3">Parent's Mobile</th>
                      <th className="py-3 px-3">Biometric Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((stu) => (
                      <tr key={stu.studentId} className="hover:bg-blue-50/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {stu.imageUrl ? (
                              <img
                                src={stu.imageUrl}
                                alt={stu.name}
                                className="w-10 h-10 rounded-xl object-cover border border-blue-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                {stu.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-bold text-slate-900">{stu.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-900">{stu.studentId}</td>
                        <td className="py-3 px-3 text-slate-700">{stu.branch}</td>
                        <td className="py-3 px-3 text-slate-700">
                          {stu.year} (Sec {stu.section})
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-mono">{stu.parentMobile}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            VGG-Face Enrolled
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteStudent(stu)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition"
                            title="Remove student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAGE USERS */}
        {activeTab === 'users' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Username / College Email</th>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Department / Post</th>
                  <th className="py-3 px-4">Authentication Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === 'department'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'guard'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {user.role === 'guard' ? 'Security Guard' : user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{user.username}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{user.name}</td>
                    <td className="py-3 px-4 text-slate-600">{user.department || 'Campus'}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="mt-4 overflow-x-auto">
            {allLogs.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-xs">No audit logs recorded yet.</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Actor Role</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-4">Event Details</th>
                    <th className="py-3 px-3">Similarity</th>
                    <th className="py-3 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {allLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">{log.actorRole}</td>
                      <td className="py-3 px-3 font-semibold text-blue-700">{log.action}</td>
                      <td className="py-3 px-4 font-sans text-slate-700 max-w-sm">{log.details}</td>
                      <td className="py-3 px-3">
                        {log.similarityScore !== null && log.similarityScore !== undefined
                          ? `${(log.similarityScore * 100).toFixed(1)}%`
                          : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'VERIFIED' || log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add Student Details */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-blue-100 my-8 animate-in zoom-in-95 duration-150">
            <div className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-base">Register New Student Record</h3>
              </div>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Roll Number (10 Characters - Alphabets & Numbers)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 23R11A67G6"
                  maxLength={10}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">Length: {studentId.length}/10</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Siri"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="CSE">CSE</option>
                    <option value="Data Science">Data Science</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="A">Sec A</option>
                    <option value="B">Sec B</option>
                    <option value="C">Sec C</option>
                    <option value="D">Sec D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Parent's Mobile Number (For Gate Pass SMS & Confirmation)
                </label>
                <input
                  type="tel"
                  value={parentMobile}
                  onChange={(e) => setParentMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Facial Photo Capture / Upload */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 uppercase tracking-wider">
                    Student Face Photo (For VGG-Face Matching)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{studentPhoto ? 'Change Photo' : 'Capture Webcam'}</span>
                  </button>
                </div>

                {studentPhoto ? (
                  <div className="mt-3 flex items-center space-x-3 bg-white p-2 rounded-lg border border-blue-200">
                    <img
                      src={studentPhoto}
                      alt="Student Face"
                      className="w-14 h-14 rounded-lg object-cover border border-blue-300"
                    />
                    <div>
                      <p className="font-bold text-emerald-700">Photo Enrolled</p>
                      <p className="text-slate-500 text-[11px]">Feature embeddings will be extracted automatically</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] mt-1 italic">
                    Capture webcam frame or use default deterministic facial embedding.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Login Password
                </label>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="student123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        title="Student Face Photo Enrollment"
        instruction="Ensure face is centered with clear frontal exposure for VGG-Face embeddings"
      />
    </div>
  );
};
