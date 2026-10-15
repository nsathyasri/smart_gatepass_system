import React from 'react';
import { ShieldCheck, UserCheck, School, Shield, Sliders, LogOut } from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  currentRole: Role;
  onSelectRole: (role: Role) => void;
  currentUser: any;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  currentUser,
  onLogout,
}) => {
  const getRoleDisplayName = (r: Role) => {
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
    <header className="bg-white border-b border-blue-100 shadow-xs sticky top-0 z-40">
      {/* Top Banner with Institution Identity */}
      <div className="bg-blue-900 text-white px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight leading-none text-white">
              Automated Smart Gate Pass System
            </h1>
            <p className="text-[11px] text-blue-200 mt-0.5 font-medium">
              Geethanjali College of Engineering and Technology • Campus Access & Biometric Verification
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden sm:flex items-center space-x-2 bg-blue-800/80 px-3 py-1.5 rounded-lg border border-blue-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-blue-100 font-medium">
                {currentUser.name || currentUser.username || currentUser.studentId}
              </span>
              <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                {getRoleDisplayName(currentRole)}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 bg-blue-700 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition font-medium text-white shadow-xs"
              title="Log out of current portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Navigation Bar */}
      <div className="px-4 sm:px-8 py-2.5 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/70 border-t border-blue-50 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-max">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 hidden md:inline">
            Active Portal:
          </span>

          <button
            onClick={() => onSelectRole('student')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              currentRole === 'student'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-blue-100/60 hover:text-blue-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student Portal</span>
          </button>

          <button
            onClick={() => onSelectRole('department')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              currentRole === 'department'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-blue-100/60 hover:text-blue-800'
            }`}
          >
            <School className="w-4 h-4" />
            <span>HoD Portal</span>
          </button>

          <button
            onClick={() => onSelectRole('guard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              currentRole === 'guard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-blue-100/60 hover:text-blue-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security Guard Portal</span>
          </button>

          <button
            onClick={() => onSelectRole('admin')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              currentRole === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-blue-100/60 hover:text-blue-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center text-xs text-blue-700 font-medium bg-blue-100/60 px-2.5 py-1 rounded-md">
          <span>Official Campus Access System</span>
        </div>
      </div>
    </header>
  );
};
