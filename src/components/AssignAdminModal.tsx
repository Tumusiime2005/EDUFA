import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  RefreshCw,
  Building,
  KeyRound,
} from 'lucide-react';
import { UgandaScholarshipLogo } from './UgandaScholarshipLogo.tsx';

interface AssignAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAssigned?: () => void;
}

export const AssignAdminModal: React.FC<AssignAdminModalProps> = ({
  isOpen,
  onClose,
  onAdminAssigned,
}) => {
  const [activeTab, setActiveTab] = useState<'assign' | 'directory'>('assign');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('Central Region (Kampala)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Directory State
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const res = await fetch('/api/admin/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full legal name and official email are required.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMsg('Clearance password must be at least 6 characters long.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          region: region.trim(),
          password: password ? password.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign administrator');
      }

      setSuccessMsg(`Administrator ${fullName.trim()} has been assigned and granted clearance.`);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      fetchAdmins();
      if (onAdminAssigned) onAdminAssigned();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while assigning administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/40 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <UgandaScholarshipLogo size="sm" className="shadow-lg shadow-amber-600/20" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Admins Room Only
                </span>
                <span className="text-xs text-neutral-400">Governance Portal</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                Assign & Manage Administrators
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 border-b border-neutral-800 bg-neutral-950/60 text-xs font-semibold text-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab('assign');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3 transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'assign'
                ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Assign New Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('directory');
              setErrorMsg('');
              setSuccessMsg('');
              fetchAdmins();
            }}
            className={`py-3 transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'directory'
                ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Active Admins ({admins.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
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

          {/* TAB 1: ASSIGN NEW ADMIN FORM */}
          {activeTab === 'assign' && (
            <form onSubmit={handleAssignAdmin} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1 text-amber-200/90 leading-relaxed text-[11px]">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> High-Level Institutional Governance
                </p>
                <p className="text-neutral-300">
                  You are assigning an official evaluator. Assigned administrators receive full clearance to review bursary applications, inspect anonymized dossiers, request clarifications, and award tiers.
                </p>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Administrator Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Kasumba Robert"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Official Institutional Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kasumba.robert@dragonsenterprises.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Official Phone / Ext.</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+256 772 123456"
                      className="w-full pl-8 pr-2.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Regional Jurisdiction</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full pl-8 pr-2 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="Central Region (Kampala)">Central (Kampala)</option>
                      <option value="Wakiso District">Wakiso District</option>
                      <option value="Mukono District">Mukono District</option>
                      <option value="Eastern Region (Jinja / Mbale)">Eastern (Jinja/Mbale)</option>
                      <option value="Western Region (Mbarara / Kabale)">Western (Mbarara)</option>
                      <option value="Northern Region (Gulu / Lira)">Northern (Gulu/Lira)</option>
                      <option value="National Headquarters">National Headquarters</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Clearance Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-8 pr-2.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-8 pr-2.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  {submitting ? 'Assigning Administrator Clearance...' : 'Grant Clearance & Assign Administrator'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ACTIVE DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Authorized Officers with Evaluation Clearance</span>
                <button
                  onClick={fetchAdmins}
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAdmins ? 'animate-spin' : ''}`} />
                  Refresh Directory
                </button>
              </div>

              {loadingAdmins ? (
                <div className="py-12 text-center text-neutral-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  <p>Loading administrative directory...</p>
                </div>
              ) : admins.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <Users className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p>No other administrators recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-100">{admin.fullName || 'Admin Officer'}</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                              {admin.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{admin.email}</p>
                          <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1">
                            <span>{admin.region || 'National'}</span>
                            {admin.phone && <span>• {admin.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active Clearance
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
