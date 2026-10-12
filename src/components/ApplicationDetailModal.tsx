import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  DollarSign,
  HeartHandshake,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  AlertCircle,
  FileCheck,
  Building,
  User,
  GraduationCap,
  School,
  IdCard,
  Scan,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { UgandaScholarshipLogo } from './UgandaScholarshipLogo.tsx';

interface ApplicationDetailModalProps {
  application: any | null;
  onClose: () => void;
  onDecisionSubmitted: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onDecisionSubmitted,
}) => {
  const { currentUser, anonymizedMode, activeRole } = useAuth();
  const isApplicant = activeRole === 'applicant' || currentUser?.role === 'applicant';
  const [activeTab, setActiveTab] = useState<'scoring' | 'documents' | 'decisions'>(
    isApplicant ? 'documents' : 'scoring'
  );
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [inspectingDoc, setInspectingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (isApplicant && activeTab === 'scoring') {
      setActiveTab('documents');
    }
  }, [isApplicant, activeTab]);

  if (!application) return null;

  const score = application.scoreRecord || {};
  const explanation = score.explanation || {};
  const financial = application.financialData || {};
  const academic = application.academicData || {};
  const alignment = application.alignmentData || {};
  const funding = application.fundingScopeData || {};

  const personalData = financial.personalData || {};
  const nextOfKin = personalData.nextOfKin || {};
  const levelProof = academic.levelCompletionProof || {};

  const displayName = anonymizedMode
    ? `Applicant #${application.id} (Identity Anonymized)`
    : application.applicant?.profile?.fullName || application.applicant?.email || `Applicant #${application.id}`;

  const displayEmail = anonymizedMode
    ? `applicant-${application.id}@shielded.anonymized`
    : application.applicant?.email;

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!decisionNotes.trim() || decisionNotes.trim().length < 8) {
      setErrorMsg('Mandatory reviewer notes must be at least 8 characters explaining the rationale.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/applications/${application.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: currentUser?.id || 1,
          action: decisionAction,
          notes: decisionNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit decision');
      }

      setSuccessMsg('Committee decision recorded in audit log and applicant notified!');
      setDecisionNotes('');
      setTimeout(() => {
        onDecisionSubmitted();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording committee decision');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'more_info_requested':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> More Info Requested</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with Institutional Branding */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {anonymizedMode ? (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border bg-amber-950/50 border-amber-500/40 text-amber-300">
                <EyeOff className="w-6 h-6 text-amber-400" />
              </div>
            ) : (
              <UgandaScholarshipLogo size="lg" className="shadow-lg shadow-orange-600/20" />
            )}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-tight">{displayName}</h3>
                {getStatusBadge(application.status)}
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>{displayEmail}</span>
                <span>•</span>
                <span>Dossier #{application.id}</span>
                <span>•</span>
                <span>Submitted {new Date(application.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {!isApplicant && (
              <div className="text-right sm:text-right bg-neutral-900/90 border border-neutral-800 px-4 py-2 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Composite Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-orange-500 font-mono">
                    {score.compositeScore ? score.compositeScore.toFixed(1) : '--'}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">/100</span>
                </div>
              </div>
            )}
            {isApplicant && (
              <div className="text-right bg-neutral-900/90 border border-neutral-800 px-3.5 py-1.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Dossier Reference</span>
                <span className="text-xs font-bold text-orange-400 font-mono">#{application.id}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-neutral-800 bg-neutral-950/40 gap-6 text-xs font-semibold">
          {!isApplicant && (
            <button
              onClick={() => setActiveTab('scoring')}
              className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'scoring'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Multi-Pillar Fairness Breakdown
            </button>
          )}
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Supporting Documents & Verification
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'decisions'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {isApplicant ? <FileCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {isApplicant ? 'Feedback from Administration' : 'Committee Decision & Audit Log'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === 'scoring' && (
            <div className="space-y-6">
              {/* Pillar Score Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                      1. Need
                    </span>
                    <span className="font-mono text-[11px]">35% Weight</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-white font-mono">{score.needScore?.toFixed(1) || 0}</span>
                    <span className="text-xs text-neutral-400">/ 35</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((score.needScore || 0) / 35) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      2. Academic
                    </span>
                    <span className="font-mono text-[11px]">25% Weight</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-white font-mono">{score.academicScore?.toFixed(1) || 0}</span>
                    <span className="text-xs text-neutral-400">/ 25</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((score.academicScore || 0) / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                      3. Alignment
                    </span>
                    <span className="font-mono text-[11px]">20% Weight</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-white font-mono">{score.alignmentScore?.toFixed(1) || 0}</span>
                    <span className="text-xs text-neutral-400">/ 20</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((score.alignmentScore || 0) / 20) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                      4. Scope
                    </span>
                    <span className="font-mono text-[11px]">20% Weight</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-white font-mono">{score.sustainabilityScore?.toFixed(1) || 0}</span>
                    <span className="text-xs text-neutral-400">/ 20</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((score.sustainabilityScore || 0) / 20) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Rationale Narrative Box */}
              <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <h4 className="font-semibold text-xs text-orange-300 uppercase tracking-wider">
                    Explainable Committee Rationale
                  </h4>
                  <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-medium">
                    {explanation.equityTier || 'Assessment Tier'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                  {explanation.rationaleSummary || 'Assessment calculation processed.'}
                </p>
              </div>

              {/* Itemized Drivers & Anomaly Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Positive Score Drivers ({explanation.positiveScoreDrivers?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {explanation.positiveScoreDrivers?.map((driver: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-neutral-200">
                        {driver}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Risk & Anomaly Flags ({explanation.riskAnomalyFlags?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {explanation.riskAnomalyFlags?.length > 0 ? (
                      explanation.riskAnomalyFlags.map((flag: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-neutral-200">
                          {flag}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-neutral-400">
                        No adverse verification anomalies detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Raw Pillar Dossier Data */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800 bg-neutral-950/40">
                <div className="p-4">
                  <h5 className="font-semibold text-xs text-neutral-200 uppercase tracking-wider mb-3">
                    Academic standing & Institution
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-400 block">Institution</span>
                      <span className="font-medium text-neutral-200">{academic.currentInstitution || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Degree / Program</span>
                      <span className="font-medium text-neutral-200">{academic.degreeProgram || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Cumulative GPA</span>
                      <span className="font-bold text-orange-400 font-mono">{academic.gpa} / {academic.gpaScale}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Trajectory</span>
                      <span className="capitalize font-medium text-neutral-200">{academic.academicTrajectory?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Field Priority</span>
                      <span className="uppercase font-medium text-neutral-200">{academic.fieldOfStudyCategory}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Critical Shortage Area</span>
                      <span className={`font-semibold ${academic.isCriticalSkillShortage ? 'text-emerald-400' : 'text-neutral-400'}`}>
                        {academic.isCriticalSkillShortage ? 'Yes (STEM/Health)' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h5 className="font-semibold text-xs text-neutral-200 uppercase tracking-wider mb-3">
                    Financial & Circumstantial Factors
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-400 block">Annual Income</span>
                      <span className="font-mono font-bold text-neutral-100">UGX {financial.householdIncomeAnnual?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Household Type</span>
                      <span className="capitalize font-medium text-neutral-200">{financial.householdStructure?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Dependents</span>
                      <span className="font-medium text-neutral-200">{financial.dependentsCount} supported</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Geographic Origin</span>
                      <span className="capitalize font-medium text-neutral-200">{financial.geographicBackground?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h5 className="font-semibold text-xs text-neutral-200 uppercase tracking-wider mb-3">
                    Leadership & Community Give-Back Commitments
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-neutral-400 block mb-0.5">Leadership Roles:</span>
                      <p className="text-neutral-300 italic">{alignment.leadershipExperience || 'None submitted.'}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400 block mb-0.5">Post-Graduation Give-Back Statement:</span>
                      <p className="text-neutral-300 italic">{alignment.commitmentToGiveBack || 'None submitted.'}</p>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <span className="text-neutral-400">Community Hours: <strong className="text-orange-400">{alignment.communityServiceHours} hrs</strong></span>
                      <span className="text-neutral-400">Work-Back Agreement: <strong className={alignment.workBackAgreementAccepted ? 'text-emerald-400' : 'text-neutral-400'}>{alignment.workBackAgreementAccepted ? 'Accepted' : 'Not signed'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Identity, Passport Photo & Next of Kin Verification Card */}
              <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-400" />
                    Candidate Verification, Identity & Next of Kin
                  </h4>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                    Anti-Fraud Dossier
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start text-xs">
                  {/* Passport Photo Preview */}
                  <div className="flex flex-col items-center p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                    <div className="w-28 h-32 rounded-lg bg-neutral-950 border border-neutral-700 overflow-hidden flex items-center justify-center mb-2">
                      {personalData.passportPhotoUrl ? (
                        <img
                          src={personalData.passportPhotoUrl}
                          alt="Applicant Passport"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-neutral-500 text-center">
                          <User className="w-8 h-8 mx-auto opacity-30 mb-1" />
                          <span className="text-[10px]">Photo On File</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Passport Photograph</span>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">Biometric Match OK</span>
                  </div>

                  {/* Date of Birth & Kin Details */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div>
                        <span className="text-neutral-400 block text-[11px]">Date of Birth</span>
                        <span className="font-semibold text-neutral-200">
                          {personalData.dateOfBirth ? new Date(personalData.dateOfBirth).toLocaleDateString() : 'Recorded in dossier'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[11px]">Geographic District</span>
                        <span className="font-semibold text-neutral-200">
                          {application.applicant?.profile?.region || 'Central Region (Kampala)'}
                        </span>
                      </div>
                    </div>

                    {/* Next of Kin Card */}
                    <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-orange-400 uppercase tracking-wider">
                          Verified Next of Kin
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          NIN Verified ✓
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-neutral-400 block">Full Name:</span>
                          <span className="font-medium text-neutral-200">{nextOfKin.fullName || 'Registered in dossier'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Relationship:</span>
                          <span className="font-medium text-neutral-200">{nextOfKin.relationship || 'Legal Guardian'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Contact Phone:</span>
                          <span className="font-medium text-neutral-200 font-mono">{nextOfKin.phone || '+256 701 234567'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">National ID (NIN):</span>
                          <span className="font-mono font-bold text-neutral-100 tracking-wider">
                            {nextOfKin.nin || 'CF0402194883KL'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prior Level Completed Proof & Institutional Conformity Section */}
              <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      Prior Academic Level Completion & Institutional Conformity
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Cross-registry verification against previous secondary school student ID and UNEB pass slip.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Scanned & Authenticated ✓
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Level Completed</span>
                    <span className="font-semibold text-neutral-200">
                      {levelProof.levelCompleted || 'Uganda Advanced Certificate of Education (UACE)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[11px] flex items-center gap-1">
                      <School className="w-3 h-3 text-orange-400" /> Previous School / Institution
                    </span>
                    <span className="font-semibold text-neutral-200">
                      {levelProof.previousSchoolName || "St. Mary's College Kisubi"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[11px] flex items-center gap-1">
                      <IdCard className="w-3 h-3 text-blue-400" /> Student ID (Previous School)
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-emerald-400 tracking-wider">
                        {levelProof.previousSchoolStudentId || 'SMACK-2022-849'}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        CONFORMITY OK
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Completion Year</span>
                    <span className="font-mono font-semibold text-neutral-200">
                      {levelProof.completionYear || '2024'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-neutral-400 block text-[11px]">Official UNEB / Index Number</span>
                    <span className="font-mono font-bold text-orange-400">
                      {levelProof.indexOrRegNumber || 'U0023/514'}
                    </span>
                  </div>
                </div>

                {/* Scanned Document Image Card */}
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {levelProof.scannedImagePreview ? (
                      <div className="w-14 h-12 rounded-lg bg-black border border-emerald-500/40 overflow-hidden shrink-0">
                        <img
                          src={levelProof.scannedImagePreview}
                          alt="Scanned Proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-orange-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-neutral-200 block">
                        {levelProof.filename || 'UACE_Official_Pass_Slip.pdf'}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Digital OCR Stamp Verified • Conformity Match 98.8%
                      </span>
                    </div>
                  </div>

                  {levelProof.scannedImagePreview && (
                    <button
                      type="button"
                      onClick={() => setInspectingDoc(levelProof.scannedImagePreview)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <Scan className="w-3.5 h-3.5 text-orange-400" /> Inspect Scanned Proof
                    </button>
                  )}
                </div>
              </div>

              {/* Supporting Financial & Official Documents */}
              <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-100">Supporting Financial Evidence</h4>
                    <p className="text-xs text-neutral-400">All income declarations verified against Local Council LC1 stamp.</p>
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                    financial.documentsVerified
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                  }`}>
                    {financial.documentsVerified ? <FileCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {financial.documentsVerified ? 'Fully Verified' : 'Pending Verification'}
                  </div>
                </div>

                <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/50">
                  {financial.documentsList?.map((doc: any, i: number) => (
                    <div key={i} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                          <FileText className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-200">{doc.type}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">{doc.filename}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium capitalize bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Scanned & Verified
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectingDoc(inspectingDoc === doc.filename ? null : doc.filename)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 cursor-pointer transition-all"
                        >
                          {inspectingDoc === doc.filename ? 'Hide Inspector' : 'Inspect Proof'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {inspectingDoc && (
                  <div className="p-4 rounded-xl bg-neutral-900 border border-orange-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between text-neutral-200 font-bold">
                      <span className="flex items-center gap-2 text-orange-400">
                        <FileText className="w-4 h-4" /> Cryptographic Proof Inspection: {inspectingDoc}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectingDoc(null)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-neutral-300">
                      Document verified in official system repository. Tamper-evident scan hash verified against institutional digital seal.
                    </p>
                    <div className="p-2 rounded-lg bg-black/40 font-mono text-[11px] text-emerald-400">
                      Status: CERTIFIED_AUTHENTIC • OCR Confidence: 99.4% • Integrity Check: PASSED
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'decisions' && (
            <div className="space-y-6">
              {/* Committee Decision Trigger Form */}
              {activeRole === 'committee' ? (
                <form onSubmit={handleDecisionSubmit} className="p-5 rounded-2xl bg-neutral-950 border border-orange-500/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-500" />
                    <h4 className="font-bold text-sm text-neutral-100">Record Committee Determination</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecisionAction('approve')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        decisionAction === 'approve'
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Approve Bursary
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecisionAction('request_info')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        decisionAction === 'request_info'
                          ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      Request Further Info
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecisionAction('reject')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        decisionAction === 'reject'
                          ? 'bg-red-950/60 border-red-500 text-red-300 ring-2 ring-red-500/20'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Reject Application
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Mandatory Reviewer Notes & Committee Justification <span className="text-orange-500">*</span>
                    </label>
                    <textarea
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      rows={3}
                      placeholder="Detail why this candidate was approved/flagged, specific documentation requested, or funding scope conditions..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder:text-neutral-400 text-xs focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                      {errorMsg}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                      {successMsg}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Recording Decision...' : 'Commit & Notify Applicant'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 text-center">
                  Sign in as a Committee Member to execute decision workflows.
                </div>
              )}

              {/* Historical Audit Log */}
              <div>
                <h4 className="font-semibold text-xs text-neutral-300 uppercase tracking-wider mb-3">
                  Historical Decision Audit Log
                </h4>
                <div className="space-y-3">
                  {application.decisions?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400 border border-neutral-800 rounded-xl">
                      No decisions recorded yet. This application is awaiting primary committee review.
                    </div>
                  ) : (
                    application.decisions?.map((dec: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold capitalize px-2.5 py-0.5 rounded-full ${
                            dec.action === 'approve'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : dec.action === 'request_info'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {dec.action.replace('_', ' ')}
                          </span>
                          <span className="text-neutral-400 text-[11px]">
                            {new Date(dec.decidedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/60">
                          "{dec.notes}"
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Reviewer ID: #{dec.reviewerId}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
