import React, { useState } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  Shield,
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { UgandaScholarshipLogo } from './UgandaScholarshipLogo.tsx';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    currentUser,
    registerUserAccount,
    loginUserAccount,
    signInWithGoogle,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>(authModalTab);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRegion, setRegRegion] = useState('Central Region (Kampala)');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  React.useEffect(() => {
    const isPrivileged = currentUser && (currentUser.role === 'committee' || currentUser.role === 'admin');
    if (authModalTab === 'admin' && !isPrivileged) {
      setActiveTab('login');
    } else {
      setActiveTab(authModalTab);
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoginPassword('');
  }, [authModalTab, currentUser]);

  if (!isAuthModalOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regFullName.trim() || !regEmail.trim()) {
      setErrorMsg('Full name and email address are required.');
      return;
    }

    if (regPassword && regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    const targetRole = activeTab === 'admin' ? 'committee' : 'applicant';

    setSubmitting(true);
    try {
      await registerUserAccount({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        region: regRegion,
        password: regPassword,
        role: targetRole,
      });
      setSuccessMsg(
        targetRole === 'committee'
          ? 'Committee member created successfully! Welcome to the Committee Room.'
          : 'Applicant account created successfully! Welcome to Dragons Enterprises.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }

    setSubmitting(true);
    try {
      await loginUserAccount(loginEmail.trim(), loginPassword.trim());
      setSuccessMsg('Signed in successfully! Verifying clearance...');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials or register a new account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UgandaScholarshipLogo size="sm" className="shadow-md" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {activeTab === 'login' && 'Sign In to Account'}
                {activeTab === 'register' && 'Register Applicant Account'}
                {activeTab === 'admin' && 'Create Committee Member'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {activeTab === 'login' && 'Uganda Scholarship Fairness Board Authentication'}
                {activeTab === 'register' && 'Scholar Registration for Bursary Application'}
                {activeTab === 'admin' && 'Authorized Committee & Administrative Clearance'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector - Admin tab visible exclusively to authorized committee admins */}
        <div className={`grid ${currentUser && (currentUser.role === 'committee' || currentUser.role === 'admin') ? 'grid-cols-3' : 'grid-cols-2'} border-b border-neutral-800 bg-neutral-950/40 text-xs text-center font-medium`}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3 transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'border-orange-500 text-orange-400 font-bold bg-orange-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3 transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-orange-500 text-orange-400 font-bold bg-orange-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Applicant
          </button>
          {currentUser && (currentUser.role === 'committee' || currentUser.role === 'admin') && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-3 transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/5'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Committee Admin
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
                Enter your registered email and password. The system will inspect your account credentials and grant access to either the <strong>Committee Room</strong> or the <strong>Applicant Workspace</strong>.
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Verifying Account Role...' : 'Sign In to Portal'}
              </button>
            </form>
          )}

          {/* Registration Form (Applicant or Committee Member) */}
          {(activeTab === 'register' || activeTab === 'admin') && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400">
                {activeTab === 'admin' ? (
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Setting up authorized Bursary Committee Evaluator
                  </span>
                ) : (
                  <span className="text-orange-300 font-medium flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> Setting up student applicant dossier account
                  </span>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  {activeTab === 'admin' ? 'Committee Member Full Name' : 'Applicant Full Legal Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'e.g. Dr. Kasumba Robert' : 'e.g. Mukasa David'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  {activeTab === 'admin' ? 'Institutional Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'e.g. evaluator@dragonsenterprises.com' : 'e.g. student@gmail.com'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+256 701 234567"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">District / Region</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={regRegion}
                      onChange={(e) => setRegRegion(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="Central Region (Kampala)">Central (Kampala)</option>
                      <option value="Wakiso District">Wakiso District</option>
                      <option value="Mukono District">Mukono District</option>
                      <option value="Eastern Region (Jinja / Mbale)">Eastern (Jinja/Mbale)</option>
                      <option value="Western Region (Mbarara / Kabale)">Western (Mbarara)</option>
                      <option value="Northern Region (Gulu / Lira)">Northern (Gulu/Lira)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full mt-2 py-3 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'
                }`}
              >
                {activeTab === 'admin' ? <Shield className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {submitting
                  ? 'Creating Account...'
                  : activeTab === 'admin'
                  ? 'Register Committee Administrator'
                  : 'Complete Scholar Registration'}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-neutral-800 text-center">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Or continue with Google Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
