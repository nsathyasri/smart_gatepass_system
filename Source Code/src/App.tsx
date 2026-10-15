/**
 * Automated Smart Gate Pass and Identity Verification System for Secure Campus Access
 */

import React, { useState, useEffect } from 'react';
import { Role, Student, UserAccount } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { AuthPortal } from './components/AuthPortal';
import { StudentModule } from './components/StudentModule';
import { HodModule } from './components/HodModule';
import { SecurityModule } from './components/SecurityModule';
import { AdminModule } from './components/AdminModule';

export default function App() {
  const [activeRole, setActiveRole] = useState<Role>('student');
  const [session, setSession] = useState<{ user: any; role: Role } | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Load session from storage on load
  useEffect(() => {
    const saved = StorageService.getCurrentUser();
    if (saved) {
      setSession(saved);
      setActiveRole(saved.role);
    }
  }, []);

  const handleLoginSuccess = (user: any, role: Role) => {
    const newSession = { user, role };
    setSession(newSession);
    setActiveRole(role);
    StorageService.setCurrentUser(newSession);
  };

  const handleLogout = () => {
    setSession(null);
    StorageService.setCurrentUser(null);
  };

  const handleRoleSelect = (role: Role) => {
    setActiveRole(role);
    // If the active session belongs to a different role, require authentication for that portal
    if (session && session.role !== role) {
      setSession(null);
      StorageService.setCurrentUser(null);
    }
  };

  const handleTriggerRefresh = () => {
    setRefreshTick((prev) => prev + 1);
  };

  // Check if current view is authenticated for the active portal
  const isAuthenticatedForCurrentRole = session && session.role === activeRole;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Institutional Top Navbar */}
      <Navbar
        currentRole={activeRole}
        onSelectRole={handleRoleSelect}
        currentUser={session?.user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6">
        {!isAuthenticatedForCurrentRole ? (
          /* Authentication Screen (Sign Up / Login for each portal) */
          <AuthPortal
            targetRole={activeRole}
            onLoginSuccess={handleLoginSuccess}
            onSwitchRole={setActiveRole}
          />
        ) : (
          /* Authenticated Portals */
          <>
            {activeRole === 'student' && (
              <StudentModule
                key={`student-${refreshTick}`}
                currentStudent={session.user as Student}
                onRefresh={handleTriggerRefresh}
              />
            )}

            {activeRole === 'department' && (
              <HodModule
                key={`hod-${refreshTick}`}
                onRefresh={handleTriggerRefresh}
              />
            )}

            {activeRole === 'guard' && (
              <SecurityModule
                key={`guard-${refreshTick}`}
                onRefresh={handleTriggerRefresh}
              />
            )}

            {activeRole === 'admin' && (
              <AdminModule
                key={`admin-${refreshTick}`}
                onRefresh={handleTriggerRefresh}
              />
            )}
          </>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-blue-100 bg-white py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Geethanjali College of Engineering and Technology • Automated Smart Gate Pass System
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Biometric Facial Identity Verification & Role-Based Access Control • All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
