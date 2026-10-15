export type Role = 'student' | 'department' | 'guard' | 'admin';
export type GatePassStatus = 'Pending' | 'Approved' | 'Rejected' | 'Left Campus';
export interface Student {
  id: string;
  studentId: string; // 10-char alphanumeric roll number (e.g., 23R11A67G6)
  name: string;
  branch: string;
  year: string;
  section: string;
  parentMobile: string;
  imageUrl?: string;
  embedding?: number[]; // VGG-Face embedding vector
  password?: string;
  createdAt: string;
}
export interface GatePassRequest {
  id: string;
  studentId: string; // 10-character Roll number
  studentName: string;
  studentBranch: string;
  studentYear: string;
  studentSection: string;
  studentImageUrl?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or 12h format
  reason: string;
  parentNotified: boolean;
  parentConfirmed: boolean;
  parentConfirmedAt?: string | null;
  status: GatePassStatus;
  hodRemarks?: string;
  securityGuardVerifiedBy?: string;
  faceVerificationSimilarity?: number | null;
  leftAt?: string | null;
  createdAt: string;
}
export interface UserAccount {
  id: string;
  role: Role;
  username: string; // e.g., dshod.gcet.edu.in, name@gcet.edu.in
  name: string;
  department?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorRole: 'Student' | 'HOD' | 'Security Guard' | 'Parent' | 'Admin';
  actorId: string;
  studentId?: string;
  details: string;
  similarityScore?: number | null;
  status: 'SUCCESS' | 'VERIFIED' | 'DENIED' | 'MISMATCH';
  timestamp: string;
}

export interface FaceVerificationResult {
  match: boolean;
  message: string;
  similarity: number;
  confidence: number;
  threshold: number;
  student?: Student;
  gatePass?: GatePassRequest;
}
