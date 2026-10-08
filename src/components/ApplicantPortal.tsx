import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  DollarSign,
  BookOpen,
  HeartHandshake,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ApplicationDetailModal } from './ApplicationDetailModal.tsx';

interface ApplicantPortalProps {
  applications: any[];
  onOpenNewApplicationModal: () => void;
  onRefresh: () => void;
}

export const ApplicantPortal: React.FC<ApplicantPortalProps> = ({
  applications,
  onOpenNewApplicationModal,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [infoReply, setInfoReply] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Filter applications belonging to current applicant
  const userApps = applications.filter((a) => a.applicantId === currentUser?.id);
  const activeApp = userApps[0] || null;

  const score = activeApp?.scoreRecord || {};
  const explanation = score.explanation || {};

  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoReply.trim() || !activeApp) return;

    setReplySubmitting(true);
    try {
      // Simulate posting document update / clarification note
      setTimeout(() => {
        setReplySubmitting(false);
        setReplySuccess(true);
        setInfoReply('');
        setTimeout(() => setReplySuccess(false), 3000);
      }, 700);
    } catch (e) {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Applicant Welcome Header */}
      <div className="bg-linear-to-r from-orange-950/40 via-neutral-900 to-neutral-950 p-6 sm:p-8 rounded-3xl border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
              Applicant Portal
            </span>
            <span className="text-xs text-neutral-400">Authenticated Student Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {currentUser?.profile?.fullName || 'Scholar'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl">
            Track your bursary application status, review explainable score drivers, and submit verified financial and academic credentials.
          </p>
        </div>

        <button
          onClick={onOpenNewApplicationModal}
          className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Submit New Bursary Dossier
        </button>
      </div>

      {activeApp ? (
        <div className="space-y-6">
          {/* Active Application Status Banner */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <span className="text-xs text-neutral-400">Current Application</span>
                <h3 className="text-lg font-bold text-white">
                  Dossier #{activeApp.id}: {activeApp.academicData?.degreeProgram || 'Undergraduate Degree'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {activeApp.academicData?.currentInstitution} • Submitted on {new Date(activeApp.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${
                  activeApp.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeApp.status === 'more_info_requested'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : activeApp.status === 'rejected'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                  {activeApp.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {activeApp.status === 'more_info_requested' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {activeApp.status === 'under_review' && <Clock className="w-3.5 h-3.5" />}
                  Status: {activeApp.status.replace('_', ' ')}
                </span>

                <button
                  onClick={() => setSelectedApp(activeApp)}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-all cursor-pointer"
                >
                  View Full Dossier
                </button>
              </div>
            </div>

            {/* If more info requested banner */}
            {activeApp.status === 'more_info_requested' && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Action Required: Committee Requested Further Information
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  The bursary review committee has reviewed your application and requested additional verification. Please upload or submit the requested document details below.
                </p>
                <form onSubmit={handleSendClarification} className="flex gap-2">
                  <input
                    type="text"
                    value={infoReply}
                    onChange={(e) => setInfoReply(e.target.value)}
                    placeholder="Enter document verification reference or clarification notes..."
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 placeholder:text-neutral-400 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={replySubmitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {replySubmitting ? 'Submitting...' : 'Send Clarification'}
                  </button>
                </form>
                {replySuccess && (
                  <p className="text-emerald-400 font-semibold text-xs">
                    Clarification note transmitted to committee lead!
                  </p>
                )}
              </div>
            )}

            {/* Explainable Fairness Score Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Dial Score */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] uppercase font-bold text-neutral-400 tracking-wider">
                  Fairness Scorer Rating
                </span>
                <div className="text-4xl font-black text-orange-500 font-mono mt-2">
                  {score.compositeScore ? score.compositeScore.toFixed(1) : '--'}
                  <span className="text-sm font-normal text-neutral-400">/100</span>
                </div>
                <span className="mt-2 text-xs px-3 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
                  {explanation.equityTier || 'Calculated Tier'}
                </span>
                <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
                  Evaluated across four weighted pillars to ensure zero personal bias.
                </p>
              </div>

              {/* 4 Pillars Breakdown */}
              <div className="md:col-span-2 space-y-3.5 p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                <h4 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">
                  Multi-Pillar Weight Allocation
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-300 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                        Pillar 1: Financial Need (35% Weight)
                      </span>
                      <span className="font-mono font-bold text-orange-400">{score.needScore?.toFixed(1) || 0} / 35.0</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, ((score.needScore || 0) / 35) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        Pillar 2: Academic Grit & Potential (25% Weight)
                      </span>
                      <span className="font-mono font-bold text-blue-400">{score.academicScore?.toFixed(1) || 0} / 25.0</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, ((score.academicScore || 0) / 25) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                        Pillar 3: Institutional Alignment (20% Weight)
                      </span>
                      <span className="font-mono font-bold text-emerald-400">{score.alignmentScore?.toFixed(1) || 0} / 20.0</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, ((score.alignmentScore || 0) / 20) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                        Pillar 4: Operational Scope & Sustainability (20% Weight)
                      </span>
                      <span className="font-mono font-bold text-purple-400">{score.sustainabilityScore?.toFixed(1) || 0} / 20.0</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, ((score.sustainabilityScore || 0) / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explainable Rationale */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <h5 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">
                  Committee Rationale Summary
                </h5>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {explanation.rationaleSummary || 'Assessment calculation in progress.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Active Bursary Application</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Submit your financial background, academic trajectory, and community impact credentials for objective multi-pillar evaluation.
          </p>
          <button
            onClick={onOpenNewApplicationModal}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Start Application
          </button>
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onDecisionSubmitted={() => {
            setSelectedApp(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
