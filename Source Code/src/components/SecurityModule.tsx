import React, { useState } from 'react';
import { GatePassRequest, Student, FaceVerificationResult } from '../types';
import { StorageService } from '../services/storage';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  SIMILARITY_THRESHOLD,
  computeCosineSimilarity,
  extractEmbeddingFromCanvas,
  generateDeterministicEmbedding,
} from '../services/faceMatcher';
import {
  Shield,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  ShieldCheck,
  Check,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Sparkles,
  Search,
} from 'lucide-react';

interface SecurityModuleProps {
  onRefresh: () => void;
}

export const SecurityModule: React.FC<SecurityModuleProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'approved' | 'exited'>('approved');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const allPasses = StorageService.getGatePasses();
  const allStudents = StorageService.getStudents();

  // Approved requests (not yet exited)
  const approvedRequests = allPasses.filter(
    (p) => p.status === 'Approved' && (!p.leftAt || p.leftAt === null)
  );

  // Exited requests
  const exitedRequests = allPasses.filter((p) => p.status === 'Left Campus');

  // Triggered when Security Guard captures a live frame or uploads an image
  const handleFaceCaptured = (photoDataUrl: string) => {
    setScannedImage(photoDataUrl);
    setIsVerifying(true);
    setVerificationResult(null);

    // Run VGG-Face feature extraction and Cosine Similarity matching against today's approved passes
    const img = new Image();
    img.src = photoDataUrl;
    img.onload = () => {
      setTimeout(() => {
        const liveEmbedding = extractEmbeddingFromCanvas(img, 'live-gate-scan');

        if (approvedRequests.length === 0) {
          setIsVerifying(false);
          setVerificationResult({
            match: false,
            message: 'Access Denied: There are currently no active APPROVED gate passes in the system today.',
            similarity: 0.0,
            confidence: 0,
            threshold: SIMILARITY_THRESHOLD,
          });
          return;
        }

        let bestMatchStudent: Student | undefined;
        let bestMatchPass: GatePassRequest | undefined;
        let highestSim = -1;

        for (const pass of approvedRequests) {
          const student = StorageService.getStudentById(pass.studentId);
          if (student) {
            const registeredEmb =
              student.embedding && student.embedding.length > 0
                ? student.embedding
                : generateDeterministicEmbedding(student.studentId);

            const sim = computeCosineSimilarity(liveEmbedding, registeredEmb);
            if (sim > highestSim) {
              highestSim = sim;
              bestMatchStudent = student;
              bestMatchPass = pass;
            }
          }
        }

        const isMatch = highestSim >= SIMILARITY_THRESHOLD && !!bestMatchStudent && !!bestMatchPass;
        const confidence = Math.max(0, Math.min(100, Math.round(highestSim * 100)));

        setIsVerifying(false);
        setVerificationResult({
          match: isMatch,
          message: isMatch
            ? 'Face Verified: Student Identity Matched. Exit Permitted.'
            : 'Biometric Mismatch: Live face does not match the approved student record.',
          similarity: Number(highestSim.toFixed(4)),
          confidence,
          threshold: SIMILARITY_THRESHOLD,
          student: bestMatchStudent,
          gatePass: bestMatchPass,
        });
      }, 500);
    };
  };

  const handleMarkAsLeft = (passId: string, similarity: number) => {
    const res = StorageService.markStudentLeftCampus(passId, 'name@gcet.edu.in', similarity);
    if (res.success) {
      setToastMessage(res.message);
      setVerificationResult(null);
      setScannedImage(null);
      setTimeout(() => setToastMessage(null), 4000);
      onRefresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Security Guard Terminal Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">Main Gate Terminal - Security Guard</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Terminal Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged in as: <span className="font-mono text-blue-700 font-semibold">name@gcet.edu.in</span> • Gate Hours: 09:30 AM to 05:30 PM
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Student Face at Gate</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
              Approved Passes Ready for Exit
            </span>
            <span className="text-2xl font-bold text-blue-900 mt-1 block">{approvedRequests.length}</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Students Exited Today
            </span>
            <span className="text-2xl font-bold text-emerald-900 mt-1 block">{exitedRequests.length}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              VGG-Face Decision Threshold
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block font-mono">
              T ≥ {SIMILARITY_THRESHOLD.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl shadow-sm text-sm font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Verification Result Card */}
      {isVerifying && (
        <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-lg text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-base">Processing VGG-Face Biometric Verification...</h3>
          <p className="text-xs text-slate-500 mt-1">
            Computing Cosine Similarity between live facial image and stored student embeddings.
          </p>
        </div>
      )}

      {verificationResult && !isVerifying && (
        <div
          className={`bg-white rounded-2xl shadow-lg border p-6 animate-in zoom-in-95 duration-150 ${
            verificationResult.match
              ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/30 to-white'
              : 'border-rose-300 bg-gradient-to-b from-rose-50/30 to-white'
          }`}
        >
          {/* Header Verdict */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-2xl text-white ${
                  verificationResult.match ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {verificationResult.match ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>
              <div>
                <span
                  className={`text-xs uppercase font-bold tracking-wider ${
                    verificationResult.match ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Biometric Verification Verdict
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {verificationResult.match ? 'ALLOW EXIT - IDENTITY CONFIRMED' : 'DENY EXIT - ACCESS REJECTED'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{verificationResult.message}</p>
              </div>
            </div>

            {/* Score pill */}
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cosine Similarity</span>
              <span className="text-lg font-mono font-bold text-blue-900">
                {(verificationResult.similarity * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                Threshold: {(verificationResult.threshold * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Details Comparison */}
          {verificationResult.match && verificationResult.student && verificationResult.gatePass && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Stored Photo vs Live Scanned Photo */}
              <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Enrolled Face
                  </span>
                  {verificationResult.student.imageUrl ? (
                    <img
                      src={verificationResult.student.imageUrl}
                      alt="Enrolled Student"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                      {verificationResult.student.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Live Gate Scan
                  </span>
                  {scannedImage ? (
                    <img
                      src={scannedImage}
                      alt="Scanned Face"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                      Live
                    </div>
                  )}
                </div>
              </div>

              {/* Student Identity */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Student Credentials</span>
                <p className="font-bold text-slate-900 text-sm">{verificationResult.student.name}</p>
                <p className="font-mono font-bold text-blue-700">Roll: {verificationResult.student.studentId}</p>
                <p className="text-slate-600">
                  {verificationResult.student.branch} • {verificationResult.student.year} (Sec {verificationResult.student.section})
                </p>
                <p className="text-slate-500">Parent Mobile: {verificationResult.student.parentMobile}</p>
              </div>

              {/* Pass details & Allow Action */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Approved Pass Details</span>
                  <p className="font-bold text-slate-800">Reason: {verificationResult.gatePass.reason}</p>
                  <p className="text-slate-600">
                    Approved Out Time: <strong>{verificationResult.gatePass.time}</strong> ({verificationResult.gatePass.date})
                  </p>
                  {verificationResult.gatePass.hodRemarks && (
                    <p className="text-blue-700 italic">HoD: "{verificationResult.gatePass.hodRemarks}"</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() =>
                      handleMarkAsLeft(
                        verificationResult.gatePass!.id,
                        verificationResult.similarity
                      )
                    }
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Exit & Mark Left Campus</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Biometric Mismatch failure action */}
          {!verificationResult.match && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  Exit is strictly denied. Student does not possess a verified matching biometric signature or valid approved pass.
                </span>
              </div>
              <button
                onClick={() => setVerificationResult(null)}
                className="px-3 py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700"
              >
                Dismiss Alert
              </button>
            </div>
          )}
        </div>
      )}

      {/* Requests Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5">
        <div className="flex items-center justify-between pb-4 border-b border-blue-50">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'approved'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved Gate Passes ({approvedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('exited')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'exited'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exit History Log ({exitedRequests.length})
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Campus Main Gate Terminal 01
          </span>
        </div>

        {/* Tab 1: Approved Gate Passes */}
        {activeTab === 'approved' && (
          <div className="mt-4 overflow-x-auto">
            {approvedRequests.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Pending Approved Requests</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  All approved passes for today have either exited campus or none are pending.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-3">Branch & Year</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Out Time</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-3">Enrolled Photo</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{req.studentId}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{req.studentName}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {req.studentBranch} ({req.studentYear}, Sec {req.studentSection})
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{req.date}</td>
                      <td className="py-3 px-3 font-semibold text-blue-700">{req.time}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-700">{req.reason}</td>
                      <td className="py-3 px-3">
                        {req.studentImageUrl ? (
                          <img
                            src={req.studentImageUrl}
                            alt={req.studentName}
                            className="w-10 h-10 rounded-lg object-cover border border-blue-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {req.studentName.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            // Direct mark as left or prompt to scan face
                            setIsCameraOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs flex items-center space-x-1 ml-auto"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Verify Face</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Exited Requests History */}
        {activeTab === 'exited' && (
          <div className="mt-4 overflow-x-auto">
            {exitedRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Campus Exits Recorded Yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Students who exit through the gate will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-3">Roll Number</th>
                    <th className="py-3 px-3">Branch</th>
                    <th className="py-3 px-3">Exit Timestamp</th>
                    <th className="py-3 px-3">Biometric Match</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exitedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          {req.studentImageUrl ? (
                            <img
                              src={req.studentImageUrl}
                              alt={req.studentName}
                              className="w-8 h-8 rounded-lg object-cover border border-blue-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                              {req.studentName.charAt(0)}
                            </div>
                          )}
                          <span className="font-bold text-slate-900">{req.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-800">{req.studentId}</td>
                      <td className="py-3 px-3 text-slate-600">{req.studentBranch}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {req.leftAt ? new Date(req.leftAt).toLocaleString() : 'Recorded'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {req.faceVerificationSimilarity
                            ? `${(req.faceVerificationSimilarity * 100).toFixed(1)}%`
                            : 'Verified'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Left Campus
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

      {/* Live Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFaceCaptured}
        title="Security Guard Biometric Face Scanner"
        instruction="Capture live camera frame of student at the campus gate to authenticate against approved gate passes"
      />
    </div>
  );
};
