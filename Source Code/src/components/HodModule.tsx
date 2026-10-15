import React, { useState } from 'react';
import { GatePassRequest, Student } from '../types';
import { StorageService } from '../services/storage';
import { CameraCaptureModal } from './CameraCaptureModal';
import { computeCosineSimilarity, extractEmbeddingFromCanvas, generateDeterministicEmbedding } from '../services/faceMatcher';
import {
  School,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Search,
  History,
  Camera,
  MessageSquare,
  ShieldCheck,
  Building,
  Check,
  X,
  Phone,
  Filter,
} from 'lucide-react';

interface HodModuleProps {
  onRefresh: () => void;
}

export const HodModule: React.FC<HodModuleProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedPassForAction, setSelectedPassForAction] = useState<{
    pass: GatePassRequest;
    action: 'Approved' | 'Rejected';
  } | null>(null);
  const [hodMessage, setHodMessage] = useState<string>('');

  const [studentHistoryModal, setStudentHistoryModal] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);

  const [isFaceSearchOpen, setIsFaceSearchOpen] = useState<boolean>(false);
  const [faceSearchResult, setFaceSearchResult] = useState<{
    student?: Student;
    similarity?: number;
    message?: string;
  } | null>(null);

  // Today's date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const allPasses = StorageService.getGatePasses();
  const allStudents = StorageService.getStudents();

  // Filter requests
  const filteredPasses = allPasses.filter((pass) => {
    // Date filter
    if (activeTab === 'today' && pass.date !== todayStr) return false;

    // Status filter
    if (statusFilter !== 'ALL' && pass.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = pass.studentId.toLowerCase().includes(q);
      const matchName = pass.studentName.toLowerCase().includes(q);
      const matchReason = pass.reason.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchReason) return false;
    }

    return true;
  });

  // Summary counts
  const pendingCount = allPasses.filter((p) => p.status === 'Pending').length;
  const approvedCount = allPasses.filter((p) => p.status === 'Approved').length;
  const rejectedCount = allPasses.filter((p) => p.status === 'Rejected').length;
  const totalCount = allPasses.length;

  const handleOpenActionModal = (pass: GatePassRequest, action: 'Approved' | 'Rejected') => {
    setSelectedPassForAction({ pass, action });
    setHodMessage(action === 'Approved' ? 'Approved. Please return by scheduled time.' : 'You are not allowed this time.');
  };

  const handleConfirmAction = () => {
    if (selectedPassForAction) {
      StorageService.updatePassStatus(
        selectedPassForAction.pass.id,
        selectedPassForAction.action,
        hodMessage.trim()
      );
      setSelectedPassForAction(null);
      setHodMessage('');
      onRefresh();
    }
  };

  const handleFaceScanForStudent = (photoDataUrl: string) => {
    const img = new Image();
    img.src = photoDataUrl;
    img.onload = () => {
      const scannedEmbedding = extractEmbeddingFromCanvas(img, 'hod-scan');
      let bestMatch: Student | undefined;
      let highestSimilarity = -1;

      for (const stu of allStudents) {
        const emb = stu.embedding && stu.embedding.length > 0 ? stu.embedding : generateDeterministicEmbedding(stu.studentId);
        const sim = computeCosineSimilarity(scannedEmbedding, emb);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
          bestMatch = stu;
        }
      }

      if (bestMatch && highestSimilarity >= 0.35) {
        setFaceSearchResult({
          student: bestMatch,
          similarity: highestSimilarity,
          message: `Matched Student: ${bestMatch.name} (${bestMatch.studentId}) - Similarity: ${(highestSimilarity * 100).toFixed(1)}%`,
        });
      } else {
        setFaceSearchResult({
          message: 'No student face matched above confidence threshold. Please verify student registration in Admin portal.',
        });
      }
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header and Summary Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Department HoD Sanction Portal</h2>
              <p className="text-xs text-slate-500">
                Logged in as: <span className="font-mono text-blue-700 font-semibold">dshod.gcet.edu.in</span> • Review gate passes & student movement
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setFaceSearchResult(null);
                setIsFaceSearchOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Scan Face to Fetch Details</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Pending Review
            </span>
            <span className="text-2xl font-bold text-amber-900 mt-1 block">{pendingCount}</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Approved
            </span>
            <span className="text-2xl font-bold text-emerald-900 mt-1 block">{approvedCount}</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">
              Rejected
            </span>
            <span className="text-2xl font-bold text-rose-900 mt-1 block">{rejectedCount}</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
              Total Requests
            </span>
            <span className="text-2xl font-bold text-blue-900 mt-1 block">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Face Scan Search Banner Result */}
      {faceSearchResult && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-5 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {faceSearchResult.student?.imageUrl ? (
                <img
                  src={faceSearchResult.student.imageUrl}
                  alt={faceSearchResult.student.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  <User className="w-8 h-8" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {faceSearchResult.student ? faceSearchResult.student.name : 'Facial Recognition Result'}
                </h4>
                <p className="text-xs text-blue-700 font-medium">{faceSearchResult.message}</p>
                {faceSearchResult.student && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Roll: <strong className="font-mono">{faceSearchResult.student.studentId}</strong> •{' '}
                    {faceSearchResult.student.branch} • {faceSearchResult.student.year} (Sec {faceSearchResult.student.section})
                  </p>
                )}
              </div>
            </div>

            {faceSearchResult.student && (
              <button
                onClick={() =>
                  setStudentHistoryModal({
                    studentId: faceSearchResult.student!.studentId,
                    studentName: faceSearchResult.student!.name,
                  })
                }
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
              >
                View Gate Pass History
              </button>
            )}
          </div>
        </div>
      )}

      {/* Controls: Tab switcher & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'today' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today's Requests ({allPasses.filter((p) => p.date === todayStr).length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'all' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requests History ({allPasses.length})
            </button>
          </div>

          {/* Search and Status Dropdown */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Roll No, Name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Status</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="mt-5 overflow-x-auto">
          {filteredPasses.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No gate pass requests found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'today' ? "No students submitted requests for today." : "No records match the current filter."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Roll Number</th>
                  <th className="py-3 px-3">Date & Out-Time</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-3">Parent Confirmation</th>
                  <th className="py-3 px-3">Current Status</th>
                  <th className="py-3 px-4 text-right">HoD Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {pass.studentImageUrl ? (
                          <img
                            src={pass.studentImageUrl}
                            alt={pass.studentName}
                            className="w-9 h-9 rounded-lg object-cover border border-blue-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {pass.studentName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <button
                            onClick={() =>
                              setStudentHistoryModal({
                                studentId: pass.studentId,
                                studentName: pass.studentName,
                              })
                            }
                            className="font-bold text-slate-900 hover:text-blue-600 text-left transition flex items-center space-x-1"
                            title="Click to view full student gate pass history"
                          >
                            <span>{pass.studentName}</span>
                            <History className="w-3 h-3 text-slate-400" />
                          </button>
                          <span className="text-[11px] text-slate-500 block">
                            {pass.studentBranch} • {pass.studentYear}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-blue-900">
                      {pass.studentId}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{pass.date}</span>
                      <span className="text-slate-500 text-[11px] flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{pass.time}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-800 font-medium line-clamp-2">{pass.reason}</p>
                      {pass.hodRemarks && (
                        <p className="text-[11px] text-blue-700 italic mt-0.5">
                          HoD Note: "{pass.hodRemarks}"
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {pass.parentConfirmed ? (
                        <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          Parent Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          Pending Parent
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {pass.status === 'Pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      )}
                      {pass.status === 'Approved' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Approved
                        </span>
                      )}
                      {pass.status === 'Rejected' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
                          Rejected
                        </span>
                      )}
                      {pass.status === 'Left Campus' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800">
                          Left Campus
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {pass.status === 'Pending' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenActionModal(pass, 'Approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                            title="Approve student request"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(pass, 'Rejected')}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                            title="Reject student request"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Approve / Reject with custom student message */}
      {selectedPassForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-blue-100 animate-in zoom-in-95 duration-150">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                selectedPassForAction.action === 'Approved' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {selectedPassForAction.action === 'Approved' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <h3 className="font-bold text-base">
                  Confirm {selectedPassForAction.action === 'Approved' ? 'Approval' : 'Rejection'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPassForAction(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p>
                  <strong>Student:</strong> {selectedPassForAction.pass.studentName} ({selectedPassForAction.pass.studentId})
                </p>
                <p className="mt-1">
                  <strong>Reason:</strong> {selectedPassForAction.pass.reason}
                </p>
                <p className="mt-1">
                  <strong>Parent Confirmation:</strong>{' '}
                  {selectedPassForAction.pass.parentConfirmed ? (
                    <span className="text-emerald-700 font-bold">Confirmed to HoD</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Pending Confirmation</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Optional Message to Student
                </label>
                <textarea
                  value={hodMessage}
                  onChange={(e) => setHodMessage(e.target.value)}
                  placeholder="e.g. Return by scheduled time / Do not repeat this / Lab permission granted"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPassForAction(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition ${
                    selectedPassForAction.action === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Submit {selectedPassForAction.action}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student History Modal */}
      {studentHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-blue-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">
                  Gate Pass History for {studentHistoryModal.studentName} ({studentHistoryModal.studentId})
                </h3>
              </div>
              <button
                onClick={() => setStudentHistoryModal(null)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {allPasses.filter((p) => p.studentId === studentHistoryModal.studentId).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No previous gate passes on record.</p>
              ) : (
                allPasses
                  .filter((p) => p.studentId === studentHistoryModal.studentId)
                  .map((historyPass) => (
                    <div
                      key={historyPass.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {historyPass.date} at {historyPass.time}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            historyPass.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : historyPass.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : historyPass.status === 'Left Campus'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {historyPass.status}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        <strong>Reason:</strong> {historyPass.reason}
                      </p>
                      {historyPass.hodRemarks && (
                        <p className="text-blue-700 italic">
                          <strong>HoD Remark:</strong> "{historyPass.hodRemarks}"
                        </p>
                      )}
                      {historyPass.leftAt && (
                        <p className="text-slate-500 text-[11px]">
                          <strong>Exited Campus:</strong> {new Date(historyPass.leftAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setStudentHistoryModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Scan Camera Modal for HOD */}
      <CameraCaptureModal
        isOpen={isFaceSearchOpen}
        onClose={() => setIsFaceSearchOpen(false)}
        onCapture={handleFaceScanForStudent}
        title="HoD Biometric Student Search"
        instruction="Capture student face to automatically locate identity and gate pass history"
      />
    </div>
  );
};
