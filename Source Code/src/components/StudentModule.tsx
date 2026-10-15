import React, { useState } from 'react';
import { Student, GatePassRequest } from '../types';
import { StorageService } from '../services/storage';
import {
  Send,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Phone,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Building,
  RefreshCw,
} from 'lucide-react';

interface StudentModuleProps {
  currentStudent: Student;
  onRefresh: () => void;
}

export const StudentModule: React.FC<StudentModuleProps> = ({
  currentStudent,
  onRefresh,
}) => {
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>('13:30');
  const [reason, setReason] = useState<string>('Health / Fever - Medical Consultation');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Retrieve current student's gate passes
  const passes = StorageService.getGatePasses().filter(
    (p) => p.studentId.toUpperCase() === currentStudent.studentId.toUpperCase()
  );

  const handleApplyPass = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    const finalReason = reason === 'Other' ? customReason.trim() : reason;

    if (!finalReason) {
      setFeedback({ type: 'error', message: 'Please specify the reason for campus gate pass' });
      setSubmitting(false);
      return;
    }

    const result = StorageService.createGatePass(currentStudent, date, time, finalReason);
    setSubmitting(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Gate pass requested successfully! Notification sent to parent for HoD confirmation.',
      });
      setCustomReason('');
      onRefresh();
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleDeleteRequest = (pass: GatePassRequest) => {
    // STU-06 Test Case: Check if approved
    if (pass.status === 'Approved' || pass.status === 'Left Campus') {
      alert('Approved or completed gate pass requests cannot be deleted.');
      return;
    }

    if (confirm('Are you sure you want to withdraw and delete this pending gate pass request?')) {
      const res = StorageService.deleteGatePass(pass.id, currentStudent.studentId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }
  };

  // Helper for parent confirmation simulation
  const handleSimulateParentConfirmation = (passId: string) => {
    StorageService.confirmParentRequest(passId);
    setFeedback({
      type: 'success',
      message: "Parent's confirmation submitted to HoD! Request is now marked as Parent Confirmed.",
    });
    onRefresh();
  };

  const getStatusBadge = (status: GatePassRequest['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pending HoD Approval
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Approved by HoD
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Rejected by HoD
          </span>
        );
      case 'Left Campus':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Left Campus (Verified)
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Student Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {currentStudent.imageUrl ? (
              <img
                src={currentStudent.imageUrl}
                alt={currentStudent.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl border-2 border-blue-200">
                {currentStudent.name.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">{currentStudent.name}</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded font-mono">
                {currentStudent.studentId}
              </span>
            </div>
            <p className="text-sm text-slate-600 flex items-center space-x-2 mt-1">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentStudent.branch}</span>
              <span>•</span>
              <span>{currentStudent.year}</span>
              <span>•</span>
              <span>Sec {currentStudent.section}</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Parent's Registered Mobile: {currentStudent.parentMobile}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start space-x-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Apply Gate Pass Form & Active Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Column: Apply Gate Pass Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-blue-50 mb-5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Apply Gate Pass</h3>
              <p className="text-xs text-slate-500">Submit date, exit time, & reason</p>
            </div>
          </div>

          <form onSubmit={handleApplyPass} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Out Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Out Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Gate operating hours: 08:00 AM to 05:00 PM
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason for Leaving Campus
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Health / Fever - Medical Consultation">Health / Fever - Medical Consultation</option>
                <option value="Severe Headache / Medical Emergency">Severe Headache / Medical Emergency</option>
                <option value="Family Emergency / Urgent Personal Work">Family Emergency / Urgent Personal Work</option>
                <option value="College Project / Off-Campus Lab Work">College Project / Off-Campus Lab Work</option>
                <option value="Hostel Essential Work">Hostel Essential Work</option>
                <option value="Other">Other (Type custom reason below)</option>
              </select>

              {reason === 'Other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Provide precise details of reason..."
                  rows={2}
                  className="w-full mt-2.5 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              )}
            </div>

            {/* Workflow info callout */}
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <span>Security Workflow Note:</span>
              </p>
              <p>
                1. Submitting alerts your parent via SMS ({currentStudent.parentMobile}).
              </p>
              <p>
                2. HoD reviews parent confirmation and sanctions the digital gate pass.
              </p>
              <p>
                3. Security Guard verifies your face via VGG-Face scan at Main Gate.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Gate Pass Request'}</span>
            </button>
          </form>
        </div>

        {/* Right 2 Columns: View Status & Request History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-blue-50 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">My Gate Pass Requests & Status</h3>
                <p className="text-xs text-slate-500">Track real-time approval from HoD & Security Guard</p>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                Total Requests: {passes.length}
              </span>
            </div>

            {passes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-3">
                  <Calendar className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">No Gate Pass Requests Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  You haven't requested any gate passes. Fill the form on the left to submit a new gate pass request.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {passes.map((pass) => (
                  <div
                    key={pass.id}
                    className="border border-blue-100 rounded-2xl p-5 bg-gradient-to-br from-white to-blue-50/20 hover:border-blue-200 transition shadow-xs"
                  >
                    {/* Status and Action Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(pass.status)}
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(pass.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Delete Pending Request button (Allowed only if status is Pending) */}
                      {pass.status === 'Pending' ? (
                        <button
                          onClick={() => handleDeleteRequest(pass)}
                          className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition font-medium border border-rose-200"
                          title="Withdraw and delete this pending request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Request</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {pass.status === 'Approved' ? 'Locked (Approved by HoD)' : pass.status}
                        </span>
                      )}
                    </div>

                    {/* Details Row */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[10px]">Pass Date</span>
                        <span className="text-slate-800 font-bold">{pass.date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[10px]">Out Time</span>
                        <span className="text-slate-800 font-bold">{pass.time}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[10px]">Parent Status</span>
                        <span className="font-semibold text-slate-700">
                          {pass.parentConfirmed ? (
                            <span className="text-emerald-700 flex items-center space-x-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Confirmed to HoD</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>SMS Sent (Pending)</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="mt-2.5 bg-slate-50 p-2.5 rounded-xl text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">Reason:</span>
                      <span>{pass.reason}</span>
                    </div>

                    {/* HoD Feedback message if provided */}
                    {pass.hodRemarks && (
                      <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Message from HoD:</span>
                          <p className="italic font-medium mt-0.5">"{pass.hodRemarks}"</p>
                        </div>
                      </div>
                    )}

                    {/* Parent Confirmation Simulation Helper (For testing step 2 in prompt) */}
                    {!pass.parentConfirmed && pass.status === 'Pending' && (
                      <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Parent received SMS notification at <strong>{currentStudent.parentMobile}</strong>.
                          </span>
                        </div>
                        <button
                          onClick={() => handleSimulateParentConfirmation(pass.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-xs"
                        >
                          Confirm as Parent to HoD
                        </button>
                      </div>
                    )}

                    {/* Digital Pass Card (If Approved) */}
                    {pass.status === 'Approved' && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-md border border-blue-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <QrCode className="w-5 h-5 text-emerald-400" />
                            <span className="font-bold text-sm text-white tracking-wide">DIGITAL GATE PASS ACTIVE</span>
                          </div>
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Authorized
                          </span>
                        </div>
                        <p className="text-xs text-blue-100 mt-2">
                          Proceed to Main Campus Gate. Security Guard will scan your live face to verify biometric match against this pass.
                        </p>
                      </div>
                    )}

                    {/* Campus Exit Recorded Banner (If Left Campus) */}
                    {pass.status === 'Left Campus' && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 font-semibold">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Student exited campus at {pass.leftAt ? new Date(pass.leftAt).toLocaleTimeString() : 'Verified'}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Verified by: {pass.securityGuardVerifiedBy || 'Security Guard'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
