import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Scale,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const InstitutionalAuthGate: React.FC = () => {
  const { loginUserAccount, registerUserAccount, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin_login' | 'applicant_login' | 'create_committee' | 'register_applicant'>('admin_login');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('Central Region (Kampala)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    const expectedRole = activeTab === 'admin_login' ? 'committee' : 'applicant';

    setSubmitting(true);
    try {
      await loginUserAccount(loginEmail.trim(), loginPassword.trim(), expectedRole);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials or select another sign-in option.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full name and email address are required.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    const targetRole = activeTab === 'create_committee' ? 'committee' : 'applicant';

    setSubmitting(true);
    try {
      await registerUserAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        region,
        password,
        role: targetRole,
      });
      setSuccessMsg(
        targetRole === 'committee'
          ? 'Committee administrator created successfully! Opening Committee Portal...'
          : 'Applicant account created successfully! Opening Applicant Portal...'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Brand Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-neutral-950 via-neutral-900 to-orange-950/40 border-b border-neutral-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mx-auto shadow-lg shadow-orange-600/30 ring-1 ring-orange-400/40 mb-3.5">
            <Scale className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            EDU<span className="text-orange-500">FA</span> Institutional Access Gate
          </h2>
          <p className="text-xs text-neutral-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Please sign in to verify your clearance level. Administrators access the Committee Review Room; Applicants access the Bursary Application Portal. All non-assigned options lock upon sign in.
          </p>
        </div>

        {/* Tab Switcher - 4 Clear Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-neutral-800 bg-neutral-950/70 text-[11px] font-semibold text-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin_login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3.5 transition-all cursor-pointer border-b-2 flex flex-col items-center justify-center gap-1 ${
              activeTab === 'admin_login'
                ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Admin Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('applicant_login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3.5 transition-all cursor-pointer border-b-2 flex flex-col items-center justify-center gap-1 ${
              activeTab === 'applicant_login'
                ? 'border-orange-500 text-orange-400 font-bold bg-orange-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-orange-400" />
            <span>Applicant Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register_applicant');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3.5 transition-all cursor-pointer border-b-2 flex flex-col items-center justify-center gap-1 ${
              activeTab === 'register_applicant'
                ? 'border-orange-500 text-orange-400 font-bold bg-orange-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-orange-400" />
            <span>New Applicant</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('create_committee');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3.5 transition-all cursor-pointer border-b-2 flex flex-col items-center justify-center gap-1 ${
              activeTab === 'create_committee'
                ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>New Admin</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: ADMIN SIGN IN */}
          {activeTab === 'admin_login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-400">
                  <Shield className="w-3.5 h-3.5" /> Bursary Committee Administrator Access
                </p>
                <p className="text-[11px] text-neutral-400">
                  Signing in with administrative clearance locks access exclusively to the Committee Evaluation Dashboard. Applicants are not permitted here.
                </p>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Admin / Committee Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. admin@dragonsenterprises.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter admin password (optional for demo account)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                {submitting ? 'Verifying Admin Clearance...' : 'Sign In as Committee Administrator'}
              </button>
            </form>
          )}

          {/* TAB 2: APPLICANT SIGN IN */}
          {activeTab === 'applicant_login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/30 text-[11px] text-orange-200/90 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-orange-400">
                  <GraduationCap className="w-3.5 h-3.5" /> Student Applicant Portal Access
                </p>
                <p className="text-[11px] text-neutral-400">
                  Sign in with your student credentials to submit bursary dossiers, review feedback, and send clarifications. Committee reviews and scoring points remain hidden.
                </p>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Applicant Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. student@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Verifying Applicant Account...' : 'Sign In to Applicant Portal'}
              </button>
            </form>
          )}

          {/* TAB 3 & 4: REGISTRATION */}
          {(activeTab === 'create_committee' || activeTab === 'register_applicant') && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800 text-[11px] leading-relaxed">
                {activeTab === 'create_committee' ? (
                  <span className="text-amber-300 font-medium flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                    Create a new Bursary Committee Member account with evaluation clearance.
                  </span>
                ) : (
                  <span className="text-orange-300 font-medium flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-orange-400 shrink-0" />
                    Register a new student applicant account to submit bursary dossiers.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  {activeTab === 'create_committee' ? 'Committee Member Full Name' : 'Applicant Full Legal Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={activeTab === 'create_committee' ? 'e.g. Dr. Kasumba Robert' : 'e.g. Mukasa David'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  {activeTab === 'create_committee' ? 'Institutional Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'create_committee' ? 'e.g. evaluator@dragonsenterprises.com' : 'e.g. student@gmail.com'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full mt-2 py-3.5 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  activeTab === 'create_committee'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'
                }`}
              >
                {activeTab === 'create_committee' ? <Shield className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {submitting
                  ? 'Processing...'
                  : activeTab === 'create_committee'
                  ? 'Register Committee Administrator'
                  : 'Complete Applicant Registration'}
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
