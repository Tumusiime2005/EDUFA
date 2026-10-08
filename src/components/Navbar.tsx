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

        {/* Center: Mode Switching Pill */}
        <div className="hidden md:flex items-center bg-neutral-900/90 border border-neutral-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setActiveRole('committee')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeRole === 'committee'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Committee Review
          </button>
          <button
            onClick={() => setActiveRole('applicant')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeRole === 'applicant'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Applicant Portal
          </button>
        </div>

        {/* Right Action Stack */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Anonymized Review Mode Toggle (Visible especially for committee review) */}
          {activeRole === 'committee' && (
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

          {/* Register / Sign In Buttons */}
          <button
            onClick={() => openAuthModal('register')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm shadow-orange-600/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register
          </button>

          {/* New Application CTA */}
          <button
            onClick={onOpenNewApplicationModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-orange-400 border border-orange-500/30 hover:border-orange-500/60 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-orange-500" />
            Submit Dossier
          </button>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Role & Persona Menu */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                {currentUser?.profile?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-medium text-neutral-200 truncate max-w-32">
                  {currentUser?.profile?.fullName || currentUser?.email || 'Guest User'}
                </p>
                <p className="text-[10px] text-orange-400/90 font-mono capitalize">
                  {activeRole} View
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
            </button>

            {roleMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                  <div className="p-3 border-b border-neutral-800 mb-1">
                    <p className="font-semibold text-neutral-100">{currentUser?.profile?.fullName}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{currentUser?.email}</p>
                    <span className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20 capitalize">
                      Active: {activeRole} Perspective
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-neutral-400 px-3 pt-2 pb-1">
                      Role & Access Control (RBAC)
                    </p>
                    <button
                      onClick={() => {
                        switchDemoUser('committee');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-300 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className="font-medium text-neutral-200">Committee / Admin</p>
                          <p className="text-[10px] text-neutral-400">admin@dragonsenterprises.com</p>
                        </div>
                      </div>
                      {activeRole === 'committee' && <UserCheck className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <button
                      onClick={() => {
                        switchDemoUser('applicant');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-300 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="font-medium text-neutral-200">Applicant Workspace</p>
                          <p className="text-[10px] text-neutral-400">applicant@dragonsenterprises.com</p>
                        </div>
                      </div>
                      {activeRole === 'applicant' && <UserCheck className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 mt-2 space-y-1">
                    <button
                      onClick={() => {
                        openAuthModal('register');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-orange-400 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-orange-400" />
                      Create Applicant Account
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('login');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-300 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-neutral-400" />
                      Applicant Sign In
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('admin');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-amber-300 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-400" />
                      Committee Evaluator Login
                    </button>
                    <button
                      onClick={() => {
                        signInWithGoogle();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      Sign in with Google OAuth
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Reset Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
