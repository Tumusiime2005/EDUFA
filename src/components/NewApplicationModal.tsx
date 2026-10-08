import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  DollarSign,
  BookOpen,
  HeartHandshake,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Check,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  calculateFairnessScore,
  FinancialData,
  AcademicData,
  AlignmentData,
  FundingScopeData,
} from '../lib/scoring-engine.ts';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Personal & Geographic
  const [fullName, setFullName] = useState(currentUser?.profile?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [region, setRegion] = useState('');

  // 2. Financial Pillar (35%)
  const [financial, setFinancial] = useState<FinancialData>({
    householdIncomeAnnual: 0,
    currency: 'USD',
    dependentsCount: 1,
    siblingsInHigherEducation: 0,
    householdStructure: 'dual_parent_low_earning',
    geographicBackground: 'urban',
    documentsVerified: false,
    documentsList: [],
  });

  // 3. Academic Pillar (25%)
  const [academic, setAcademic] = useState<AcademicData>({
    currentInstitution: '',
    degreeProgram: '',
    currentYear: 'Year 1',
    gpa: 3.0,
    gpaScale: 4.0,
    baselineThresholdMet: true,
    academicTrajectory: 'stable_moderate',
    fieldOfStudyCategory: 'stem',
    isCriticalSkillShortage: true,
    matricOrEntrancePercentile: 70,
  });

  // 4. Institutional Alignment Pillar (20%)
  const [alignment, setAlignment] = useState<AlignmentData>({
    donorMandateCompliance: false,
    targetedDemographicMatch: false,
    firstGenerationScholar: false,
    communityServiceHours: 0,
    leadershipExperience: '',
    commitmentToGiveBack: '',
    workBackAgreementAccepted: false,
  });

  // 5. Funding Scope & Sustainability (20%)
  const [funding, setFunding] = useState<FundingScopeData>({
    fundingScopeType: 'tuition_only',
    componentsRequested: {
      tuition: true,
      housing: false,
      booksAllowance: false,
      livingStipend: false,
      transport: false,
    },
    estimatedAnnualAmount: 0,
    durationYears: 1,
    renewalPerformanceTargetGpa: 3.0,
    requiresMentorship: false,
    requiresAcademicTutoring: false,
    requiresCounseling: false,
  });

  // Live Score Preview on the fly
  const liveScore = useMemo(() => {
    return calculateFairnessScore(financial, academic, alignment, funding);
  }, [financial, academic, alignment, funding]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: currentUser?.id || 1,
          financialData: financial,
          academicData: academic,
          alignmentData: alignment,
          fundingScopeData: funding,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-500 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">New Bursary & Sponsorship Dossier</h3>
              <p className="text-xs text-neutral-400">Step {step} of 5 — Multi-Pillar Objective Evaluation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="grid grid-cols-5 border-b border-neutral-800 bg-neutral-950/40 text-xs">
          {[
            { num: 1, label: 'Profile' },
            { num: 2, label: 'Financial (35%)' },
            { num: 3, label: 'Academic (25%)' },
            { num: 4, label: 'Alignment (20%)' },
            { num: 5, label: 'Scope (20%)' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-3 text-center transition-all cursor-pointer border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                step === s.num
                  ? 'border-orange-500 text-orange-400 font-bold bg-orange-500/5'
                  : step > s.num
                  ? 'border-emerald-500 text-emerald-400 font-medium'
                  : 'border-transparent text-neutral-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === s.num
                  ? 'bg-orange-500 text-white'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-800 text-neutral-400'
              }`}>
                {step > s.num ? <Check className="w-3 h-3" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body: Two column layout with Live Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200">1. Applicant Profile & Geographic Origin</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-300 font-medium mb-1">Geographic Region / District</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  2. Financial Need & Circumstances (35% Weight)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Annual Household Income (USD/equiv)</label>
                    <input
                      type="number"
                      value={financial.householdIncomeAnnual}
                      onChange={(e) => setFinancial({ ...financial, householdIncomeAnnual: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Household Structure</label>
                    <select
                      value={financial.householdStructure}
                      onChange={(e: any) => setFinancial({ ...financial, householdStructure: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="orphan">Orphan / Child-Headed Household (+6 pts)</option>
                      <option value="single_parent">Single-Parent Household (+4 pts)</option>
                      <option value="dual_parent_low_earning">Dual-Parent Low Earning (+2 pts)</option>
                      <option value="dual_parent_moderate">Dual-Parent Moderate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Dependents in Household</label>
                    <input
                      type="number"
                      value={financial.dependentsCount}
                      onChange={(e) => setFinancial({ ...financial, dependentsCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Siblings in Higher Education</label>
                    <input
                      type="number"
                      value={financial.siblingsInHigherEducation}
                      onChange={(e) => setFinancial({ ...financial, siblingsInHigherEducation: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Geographic Context</label>
                    <select
                      value={financial.geographicBackground}
                      onChange={(e: any) => setFinancial({ ...financial, geographicBackground: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="deep_rural">Deep Rural Underrepresented (+4 pts)</option>
                      <option value="peri_urban">Peri-Urban / Informal Settlement (+2.5 pts)</option>
                      <option value="marginalized_district">Marginalized District (+2.5 pts)</option>
                      <option value="urban">Urban Standard Baseline</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financial.documentsVerified}
                        onChange={(e) => setFinancial({ ...financial, documentsVerified: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">Income Proof Fully Stamped & Verified</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  3. Academic Performance & Potential (25% Weight)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Institution</label>
                    <input
                      type="text"
                      value={academic.currentInstitution}
                      onChange={(e) => setAcademic({ ...academic, currentInstitution: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Degree / Major</label>
                    <input
                      type="text"
                      value={academic.degreeProgram}
                      onChange={(e) => setAcademic({ ...academic, degreeProgram: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Cumulative GPA (out of 4.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={academic.gpa}
                      onChange={(e) => setAcademic({ ...academic, gpa: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Academic Trajectory</label>
                    <select
                      value={academic.academicTrajectory}
                      onChange={(e: any) => setAcademic({ ...academic, academicTrajectory: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="improving">Improving (Demonstrating Grit +7 pts)</option>
                      <option value="consistently_high">Consistently High (+6 pts)</option>
                      <option value="stable_moderate">Stable Moderate (+4 pts)</option>
                      <option value="declining">Declining (-3 pts penalty flag)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Field Category</label>
                    <select
                      value={academic.fieldOfStudyCategory}
                      onChange={(e: any) => setAcademic({ ...academic, fieldOfStudyCategory: e.target.value, isCriticalSkillShortage: e.target.value === 'stem' || e.target.value === 'healthcare' })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="stem">STEM (Priority Shortage +6 pts)</option>
                      <option value="healthcare">Healthcare & Medicine (+6 pts)</option>
                      <option value="education">Education & Pedagogy (+5 pts)</option>
                      <option value="commerce">Commerce / Economics</option>
                      <option value="humanities">Humanities & Arts</option>
                      <option value="law">Law</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={academic.baselineThresholdMet}
                        onChange={(e) => setAcademic({ ...academic, baselineThresholdMet: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">Baseline Academic Cutoff Met</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  4. Institutional Alignment & Value Fit (20% Weight)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Community Service Hours Logged</label>
                    <input
                      type="number"
                      value={alignment.communityServiceHours}
                      onChange={(e) => setAlignment({ ...alignment, communityServiceHours: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alignment.donorMandateCompliance}
                        onChange={(e) => setAlignment({ ...alignment, donorMandateCompliance: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">Donor Mandate Match (+5 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alignment.firstGenerationScholar}
                        onChange={(e) => setAlignment({ ...alignment, firstGenerationScholar: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">First-Generation Scholar (+3 pts)</span>
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-300 font-medium mb-1">Leadership Roles & Peer Mentorship</label>
                    <input
                      type="text"
                      value={alignment.leadershipExperience}
                      onChange={(e) => setAlignment({ ...alignment, leadershipExperience: e.target.value })}
                      placeholder="e.g. Student mentor, club founder, youth tutor..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-300 font-medium mb-1">Commitment to Give Back Essay</label>
                    <textarea
                      rows={2}
                      value={alignment.commitmentToGiveBack}
                      onChange={(e) => setAlignment({ ...alignment, commitmentToGiveBack: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alignment.workBackAgreementAccepted}
                        onChange={(e) => setAlignment({ ...alignment, workBackAgreementAccepted: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">Signed Work-Back & Service Agreement (+3 pts)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  5. Funding Scope & Operational Sustainability (20% Weight)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Funding Scope Type</label>
                    <select
                      value={funding.fundingScopeType}
                      onChange={(e: any) => setFunding({ ...funding, fundingScopeType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="comprehensive">Comprehensive (Tuition, Housing, Stipend)</option>
                      <option value="partial_tuition_living">Blended Co-Funding (Tuition + Living)</option>
                      <option value="tuition_only">Tuition Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Funding Duration (Years)</label>
                    <input
                      type="number"
                      value={funding.durationYears}
                      onChange={(e) => setFunding({ ...funding, durationYears: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Renewal Performance GPA Covenant</label>
                    <input
                      type="number"
                      step="0.1"
                      value={funding.renewalPerformanceTargetGpa}
                      onChange={(e) => setFunding({ ...funding, renewalPerformanceTargetGpa: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Estimated Annual Cost (USD)</label>
                    <input
                      type="number"
                      value={funding.estimatedAnnualAmount}
                      onChange={(e) => setFunding({ ...funding, estimatedAnnualAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={funding.requiresMentorship}
                        onChange={(e) => setFunding({ ...funding, requiresMentorship: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">Executive Mentorship Program Pairing (+2 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={funding.requiresAcademicTutoring}
                        onChange={(e) => setFunding({ ...funding, requiresAcademicTutoring: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">Supplementary Academic Tutoring Readiness</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/30"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Transmitting to Database...' : 'Finalize & Submit Dossier'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Fairness Engine Simulator */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-orange-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Live Fairness Engine
                </span>
                <span className="text-[10px] text-neutral-400">Deterministic</span>
              </div>

              <div className="text-center my-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Composite Fairness Score</span>
                <div className="text-3xl font-black text-orange-500 font-mono mt-1">
                  {liveScore.compositeScore.toFixed(1)} <span className="text-xs font-normal text-neutral-400">/100</span>
                </div>
                <span className="inline-block mt-1 text-[11px] font-semibold text-orange-300">
                  {liveScore.explanation.equityTier}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Need (35%):</span>
                  <span className="font-mono font-bold text-neutral-200">{liveScore.needScore.toFixed(1)} / 35</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Academic (25%):</span>
                  <span className="font-mono font-bold text-neutral-200">{liveScore.academicScore.toFixed(1)} / 25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Alignment (20%):</span>
                  <span className="font-mono font-bold text-neutral-200">{liveScore.alignmentScore.toFixed(1)} / 20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Scope (20%):</span>
                  <span className="font-mono font-bold text-neutral-200">{liveScore.sustainabilityScore.toFixed(1)} / 20</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
                <p className="font-bold text-emerald-400 mb-1">Key Positive Drivers:</p>
                <ul className="space-y-1 list-disc pl-3 text-neutral-300">
                  {liveScore.explanation.positiveScoreDrivers.slice(0, 3).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 text-[11px] text-orange-300">
              EDUFA scores are fully explainable and logged to audit trails for committee transparency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
