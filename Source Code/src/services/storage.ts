import { Student, GatePassRequest, UserAccount, AuditLogItem, Role } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'smartgps_students_v1',
  GATE_PASSES: 'smartgps_gatepasses_v1',
  USERS: 'smartgps_users_v1',
  CURRENT_USER: 'smartgps_current_user_v1',
  AUDIT_LOGS: 'smartgps_audit_logs_v1',
};

// Initial default system accounts for HoD, Security Guard, and Admin
const INITIAL_SYSTEM_USERS: UserAccount[] = [
  {
    id: 'user-hod',
    role: 'department',
    username: 'dshod.gcet.edu.in',
    name: 'Dr. D. Sujatha (HOD - DS)',
    department: 'Computer Science & Engineering',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-guard',
    role: 'guard',
    username: 'name@gcet.edu.in',
    name: 'Officer R. Verma (Security Guard)',
    department: 'Main Gate Security Post',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-admin',
    role: 'admin',
    username: 'admin@gcet.edu.in',
    name: 'Campus System Admin',
    department: 'Central Administration',
    createdAt: new Date().toISOString(),
  },
];

// Helper: load from localStorage
function load<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Helper: save to localStorage
function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

export const StorageService = {
  // --- USERS & AUTH ---
  getUsers(): UserAccount[] {
    const users = load<UserAccount[]>(STORAGE_KEYS.USERS, []);
    if (users.length === 0) {
      save(STORAGE_KEYS.USERS, INITIAL_SYSTEM_USERS);
      return INITIAL_SYSTEM_USERS;
    }
    return users;
  },

  addUser(user: UserAccount): void {
    const users = this.getUsers();
    users.push(user);
    save(STORAGE_KEYS.USERS, users);
  },

  getCurrentUser(): { user: UserAccount | Student; role: Role } | null {
    return load<{ user: UserAccount | Student; role: Role } | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(session: { user: UserAccount | Student; role: Role } | null): void {
    save(STORAGE_KEYS.CURRENT_USER, session);
  },

  // --- STUDENTS ---
  getStudents(): Student[] {
    return load<Student[]>(STORAGE_KEYS.STUDENTS, []);
  },

  getStudentById(studentId: string): Student | undefined {
    const students = this.getStudents();
    return students.find((s) => s.studentId.toUpperCase() === studentId.toUpperCase().trim());
  },

  saveStudent(student: Student): { success: boolean; message: string } {
    const students = this.getStudents();
    const existingIndex = students.findIndex((s) => s.studentId.toUpperCase() === student.studentId.toUpperCase().trim());

    if (existingIndex >= 0) {
      students[existingIndex] = student;
    } else {
      students.unshift(student);
    }

    save(STORAGE_KEYS.STUDENTS, students);
    this.addAuditLog({
      action: existingIndex >= 0 ? 'STUDENT_UPDATED' : 'STUDENT_REGISTERED',
      actorRole: 'Admin',
      actorId: 'Admin',
      studentId: student.studentId,
      details: `Student ${student.name} (${student.studentId}) registered with biometric facial embedding.`,
      status: 'SUCCESS',
    });

    return { success: true, message: 'Student saved successfully' };
  },

  deleteStudent(id: string): void {
    let students = this.getStudents();
    const target = students.find((s) => s.id === id || s.studentId === id);
    if (target) {
      students = students.filter((s) => s.id !== id && s.studentId !== id);
      save(STORAGE_KEYS.STUDENTS, students);

      // Remove student's gate passes too
      let passes = this.getGatePasses();
      passes = passes.filter((p) => p.studentId !== target.studentId);
      save(STORAGE_KEYS.GATE_PASSES, passes);

      this.addAuditLog({
        action: 'STUDENT_DELETED',
        actorRole: 'Admin',
        actorId: 'Admin',
        studentId: target.studentId,
        details: `Student record ${target.studentId} removed from system.`,
        status: 'SUCCESS',
      });
    }
  },

  // --- GATE PASSES ---
  getGatePasses(): GatePassRequest[] {
    return load<GatePassRequest[]>(STORAGE_KEYS.GATE_PASSES, []);
  },

  createGatePass(
    student: Student,
    date: string,
    time: string,
    reason: string
  ): { success: boolean; message: string; pass?: GatePassRequest } {
    const passes = this.getGatePasses();

    // Check for pending pass
    const hasPending = passes.some((p) => p.studentId === student.studentId && p.status === 'Pending');
    if (hasPending) {
      return { success: false, message: 'You already have a pending gate pass request awaiting HoD review.' };
    }

    const newPass: GatePassRequest = {
      id: 'gp-' + Date.now(),
      studentId: student.studentId,
      studentName: student.name,
      studentBranch: student.branch,
      studentYear: student.year,
      studentSection: student.section,
      studentImageUrl: student.imageUrl,
      date,
      time,
      reason,
      parentNotified: true,
      parentConfirmed: false,
      parentConfirmedAt: null,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    passes.unshift(newPass);
    save(STORAGE_KEYS.GATE_PASSES, passes);

    this.addAuditLog({
      action: 'GATE_PASS_SUBMITTED',
      actorRole: 'Student',
      actorId: student.studentId,
      studentId: student.studentId,
      details: `Gate pass requested for ${date} at ${time}. Reason: "${reason}". Notification dispatched to parent (${student.parentMobile}).`,
      status: 'SUCCESS',
    });

    return { success: true, message: 'Gate pass submitted successfully!', pass: newPass };
  },

  confirmParentRequest(passId: string): void {
    const passes = this.getGatePasses();
    const target = passes.find((p) => p.id === passId);
    if (target) {
      target.parentConfirmed = true;
      target.parentConfirmedAt = new Date().toISOString();
      save(STORAGE_KEYS.GATE_PASSES, passes);

      this.addAuditLog({
        action: 'PARENT_CONFIRMED',
        actorRole: 'Parent',
        actorId: 'Parent',
        studentId: target.studentId,
        details: `Parent confirmed gate pass request for student ${target.studentName} (${target.studentId}) to HoD.`,
        status: 'SUCCESS',
      });
    }
  },

  updatePassStatus(
    passId: string,
    status: 'Approved' | 'Rejected',
    remarks?: string
  ): { success: boolean; message: string } {
    const passes = this.getGatePasses();
    const target = passes.find((p) => p.id === passId);
    if (!target) return { success: false, message: 'Gate pass not found' };

    target.status = status;
    if (remarks) target.hodRemarks = remarks;
    save(STORAGE_KEYS.GATE_PASSES, passes);

    this.addAuditLog({
      action: status === 'Approved' ? 'HOD_APPROVED' : 'HOD_REJECTED',
      actorRole: 'HOD',
      actorId: 'dshod.gcet.edu.in',
      studentId: target.studentId,
      details: `HOD ${status.toLowerCase()} gate pass for ${target.studentName}. Message: "${remarks || 'Approved'}".`,
      status: 'SUCCESS',
    });

    return { success: true, message: `Gate pass successfully marked as ${status}.` };
  },

  deleteGatePass(passId: string, studentId: string): { success: boolean; message: string } {
    let passes = this.getGatePasses();
    const target = passes.find((p) => p.id === passId);
    if (!target) return { success: false, message: 'Request not found' };

    if (target.status === 'Approved' || target.status === 'Left Campus') {
      return { success: false, message: 'Cannot delete an already Approved or completed gate pass.' };
    }

    passes = passes.filter((p) => p.id !== passId);
    save(STORAGE_KEYS.GATE_PASSES, passes);

    this.addAuditLog({
      action: 'GATE_PASS_DELETED',
      actorRole: 'Student',
      actorId: studentId,
      studentId,
      details: `Pending gate pass request for ${target.date} was withdrawn by the student.`,
      status: 'SUCCESS',
    });

    return { success: true, message: 'Gate pass request deleted successfully.' };
  },

  markStudentLeftCampus(
    passId: string,
    securityGuardId: string,
    similarityScore: number
  ): { success: boolean; message: string; pass?: GatePassRequest } {
    const passes = this.getGatePasses();
    const target = passes.find((p) => p.id === passId);
    if (!target) return { success: false, message: 'Gate pass not found' };

    target.status = 'Left Campus';
    target.leftAt = new Date().toISOString();
    target.securityGuardVerifiedBy = securityGuardId;
    target.faceVerificationSimilarity = similarityScore;
    save(STORAGE_KEYS.GATE_PASSES, passes);

    this.addAuditLog({
      action: 'CAMPUS_EXIT_VERIFIED',
      actorRole: 'Security Guard',
      actorId: securityGuardId || 'Security Guard',
      studentId: target.studentId,
      similarityScore,
      details: `Student verified at Main Gate via VGG-Face comparison (${(similarityScore * 100).toFixed(1)}%). Student marked as Left Campus.`,
      status: 'VERIFIED',
    });

    return { success: true, message: 'Student marked as Left Campus. Exit broadcast to HoD, Parent, and Student.', pass: target };
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLogItem[] {
    return load<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  addAuditLog(item: Omit<AuditLogItem, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogItem = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...item,
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    save(STORAGE_KEYS.AUDIT_LOGS, logs);
  },
};
