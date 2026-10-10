import React from 'react';
import {
  GraduationCap,
  Shield,
  EyeOff,
  UserCheck,
  Sparkles,
  LogOut,
  ChevronDown,
  Scale,
  PlusCircle,
  UserPlus,
  LogIn,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { NotificationCenter } from './NotificationCenter.tsx';

interface NavbarProps {
  onOpenNewApplicationModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewApplicationModal }) => {
  const {
    currentUser,
    activeRole,
    setActiveRole,
    anonymizedMode,
    setAnonymizedMode,
    signInWithGoogle,
    switchDemoUser,
    signOut,
    openAuthModal,
  } = useAuth();

  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-md shadow-orange-600/30 ring-1 ring-orange-400/40">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                EDU<span className="text-orange-500">FA</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Fairness Engine v2.4
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Bursary & Sponsorship Allocation Scorer
            </p>
          </div>
        </div>

        {/* Center: Institutional Status Badge - Strictly locked to current role */}
        {currentUser && (currentUser.role === 'committee' || currentUser.role === 'admin') && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 shadow-inner">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="font-bold">Bursary Committee Portal</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" /> Admin Clearance Locked
            </span>
          </div>
        )}

        {currentUser?.role === 'applicant' && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 shadow-inner">
            <GraduationCap className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-neutral-200">Applicant Workspace</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-orange-400" /> Student Clearance Locked
            </span>
          </div>
        )}

        {/* Right Action Stack */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Anonymized Review Mode Toggle (Visible strictly for committee review) */}
          {(currentUser?.role === 'committee' || currentUser?.role === 'admin') && (
            <button
              onClick={() => setAnonymizedMode(!anonymizedMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                anonymizedMode
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Toggle Anonymized Review Mode to mask identities and eliminate affinity bias"
            >
              <EyeOff className={`w-3.5 h-3.5 ${anonymizedMode ? 'text-amber-400' : 'text-neutral-400'}`} />
              <span className="hidden sm:inline">
                {anonymizedMode ? 'Anonymized Mode: ON' : 'Anonymize Applicants'}
              </span>
            </button>
          )}

          {!currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-400" />
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>
          ) : (
            <>
              {/* New Application CTA - Visible only to applicants */}
              {currentUser.role === 'applicant' && (
                <button
                  onClick={onOpenNewApplicationModal}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-orange-400 border border-orange-500/30 hover:border-orange-500/60 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-orange-500" />
                  Submit Dossier
                </button>
              )}

              {/* Committee: Create Member CTA */}
              {(currentUser.role === 'committee' || currentUser.role === 'admin') && (
                <button
                  onClick={() => openAuthModal('admin')}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 cursor-pointer transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  + Committee Member
                </button>
              )}

              {/* Notification Center */}
              <NotificationCenter />

              {/* User Persona & Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all text-left cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
                    activeRole === 'committee'
                      ? 'bg-amber-600/20 border-amber-500/30 text-amber-400'
                      : 'bg-orange-600/20 border-orange-500/30 text-orange-400'
                  }`}>
                    {currentUser.profile?.fullName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left pr-1">
                    <p className="text-xs font-medium text-neutral-200 truncate max-w-32">
                      {currentUser.profile?.fullName || currentUser.email}
                    </p>
                    <p className="text-[10px] text-orange-400/90 font-mono capitalize">
                      {activeRole === 'committee' ? 'Committee Admin' : 'Applicant Scholar'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
                </button>

                {roleMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                      <div className="p-3 border-b border-neutral-800 mb-1">
                        <p className="font-semibold text-neutral-100">{currentUser.profile?.fullName || 'User Profile'}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{currentUser.email}</p>
                        <span className={`mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border capitalize ${
                          activeRole === 'committee'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                          Clearance: {activeRole === 'committee' ? 'Bursary Committee Admin' : 'Applicant Scholar'}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        {activeRole === 'committee' ? (
                          <button
                            onClick={() => {
                              openAuthModal('admin');
                              setRoleMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-amber-300 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Shield className="w-4 h-4 text-amber-400" />
                            Create New Committee Member
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onOpenNewApplicationModal();
                              setRoleMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-orange-400 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4 text-orange-400" />
                            Submit New Bursary Dossier
                          </button>
                        )}

                        <button
                          onClick={() => {
                            signOut();
                            setRoleMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center gap-2 cursor-pointer border-t border-neutral-800 mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
