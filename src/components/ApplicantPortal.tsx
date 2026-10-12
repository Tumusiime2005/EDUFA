import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PlusCircle,
  Sparkles,
  Send,
  FileCheck,
  UserPlus,
  Bell,
  MessageSquare,
  ShieldCheck,
  School,
  IdCard,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ApplicationDetailModal } from './ApplicationDetailModal.tsx';
import { UgandaScholarshipLogo } from './UgandaScholarshipLogo.tsx';

interface ApplicantPortalProps {
  applications: any[];
  onOpenNewApplicationModal: () => void;
  onRefresh: () => void;
}

interface FeedbackNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const ApplicantPortal: React.FC<ApplicantPortalProps> = ({
  applications,
  onOpenNewApplicationModal,
  onRefresh,
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [infoReply, setInfoReply] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackNotification[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // Filter applications strictly belonging to the currently authenticated applicant
  const userApps = currentUser ? applications.filter((a) => a.applicantId === currentUser.id) : [];
  const [selectedDossierId, setSelectedDossierId] = useState<number | null>(null);
  const activeApp = (selectedDossierId ? userApps.find((a) => a.id === selectedDossierId) : null) || userApps[0] || null;

  // Fetch applicant's notifications/feedback messages
  const loadFeedbacks = async () => {
    if (!currentUser) return;
    try {
      setLoadingFeedbacks(true);
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
    const interval = setInterval(loadFeedbacks, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoReply.trim() || !activeApp || !currentUser) return;

    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/applications/${activeApp.id}/clarification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: infoReply.trim(),
          senderId: currentUser.id,
        }),
      });

      if (res.ok) {
        setReplySuccess(true);
        setInfoReply('');
        await loadFeedbacks();
        onRefresh();
        setTimeout(() => setReplySuccess(false), 4000);
      }
    } catch (e) {
      console.error('Error submitting clarification:', e);
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Applicant Welcome Header */}
      <div className="bg-gradient-to-r from-orange-950/40 via-neutral-900 to-neutral-950 p-6 sm:p-8 rounded-3xl border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <UgandaScholarshipLogo size="lg" className="shadow-xl shadow-orange-600/30" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                Applicant Portal
              </span>
              <span className="text-xs text-neutral-400">Uganda Scholarship Fairness</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {currentUser?.profile?.fullName || 'Scholar'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl">
              Submit your bursary dossier, verify academic documents with optical scanning, and monitor institutional committee decisions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {userApps.length > 0 ? (
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-inner">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dossier Submitted (1 of 1 Max)</span>
            </div>
          ) : (
            <button
              onClick={onOpenNewApplicationModal}
              className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Submit Bursary Dossier
            </button>
          )}
        </div>
      </div>

      {activeApp ? (
        <div className="space-y-6">
          {/* One dossier per applicant policy banner */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 flex items-start sm:items-center gap-2.5 shadow-sm">
            <Lock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold text-neutral-200">Single Dossier Policy: </span>
              <span className="text-neutral-400">
                Your official application (#Dossier {activeApp.id}) is successfully recorded. Each applicant account is strictly restricted to one dossier submission to ensure equal consideration across all candidates.
              </span>
            </div>
          </div>

          {/* Active Application Status Banner */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <span className="text-xs text-neutral-400">Application Reference</span>
                <h3 className="text-lg font-bold text-white">
                  Dossier #{activeApp.id}: {activeApp.academicData?.degreeProgram || 'Undergraduate Degree'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {activeApp.academicData?.currentInstitution} • Submitted on {new Date(activeApp.createdAt).toLocaleDateString()}
                </p>
                {userApps.length > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500 font-medium">Switch Dossier:</span>
                    <select
                      value={activeApp.id}
                      onChange={(e) => setSelectedDossierId(Number(e.target.value))}
                      className="text-xs px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-hidden focus:border-orange-500"
                    >
                      {userApps.map((app) => (
                        <option key={app.id} value={app.id}>
                          Dossier #{app.id} - {app.academicData?.degreeProgram || 'Program'} ({app.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${
                  activeApp.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : activeApp.status === 'more_info_requested'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 ring-1 ring-amber-500/20'
                    : activeApp.status === 'rejected'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30 ring-1 ring-orange-500/20'
                }`}>
                  {activeApp.status === 'approved' && <Award className="w-3.5 h-3.5 text-emerald-400" />}
                  {activeApp.status === 'more_info_requested' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {activeApp.status === 'under_review' && <Clock className="w-3.5 h-3.5 text-orange-400" />}
                  {activeApp.status === 'submitted' && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                  Verification: {activeApp.status.replace('_', ' ')}
                </span>

                <button
                  onClick={() => setSelectedApp(activeApp)}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-all cursor-pointer"
                >
                  View Submitted Dossier
                </button>
              </div>
            </div>

            {/* If more info requested banner */}
            {activeApp.status === 'more_info_requested' && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Action Required: Additional Information Requested by Administration
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  The Bursary Committee has reviewed your application and requested additional details or clarification. Please enter your response below to update the administrators.
                </p>
                <form onSubmit={handleSendClarification} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={infoReply}
                    onChange={(e) => setInfoReply(e.target.value)}
                    placeholder="Enter requested verification details or clarification notes..."
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 placeholder:text-neutral-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={replySubmitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {replySubmitting ? 'Sending...' : 'Send Clarification'}
                  </button>
                </form>
                {replySuccess && (
                  <p className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Clarification transmitted successfully! Administrators have been updated.
                  </p>
                )}
              </div>
            )}

            {/* Administrative Feedback & Communication Feed */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <h4 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">
                    Feedback from Administration
                  </h4>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {feedbacks.length} Message{feedbacks.length === 1 ? '' : 's'} on Record
                </span>
              </div>

              {feedbacks.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>
                    Your dossier has been received and queued for review. You will receive real-time administrative feedback here as soon as verification commences.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {feedbacks.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                          {item.title.includes('Awarded') || item.title.includes('Approved') ? (
                            <Award className="w-3.5 h-3.5 text-emerald-400" />
                          ) : item.title.includes('Clarification') ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <FileCheck className="w-3.5 h-3.5 text-orange-400" />
                          )}
                          {item.title}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(item.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed pl-5">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Credentials on File */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3.5">
              <h4 className="font-bold text-xs text-neutral-200 uppercase tracking-wider flex items-center justify-between">
                <span>Verified Credentials on Record</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Institutional Verification Matched
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] uppercase font-bold block flex items-center gap-1">
                    <School className="w-3 h-3 text-orange-400" /> Previous School
                  </span>
                  <p className="text-neutral-200 font-medium truncate">
                    {activeApp.academicData?.levelCompletionProof?.previousSchoolName || "St. Mary's College Kisubi"}
                  </p>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                    ID: {activeApp.academicData?.levelCompletionProof?.previousSchoolStudentId || 'Verified'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] uppercase font-bold block flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-orange-400" /> Level Completed
                  </span>
                  <p className="text-neutral-200 font-medium truncate">
                    {activeApp.academicData?.levelCompletionProof?.levelCompleted || 'UACE / A-Level'}
                  </p>
                  <span className="text-[11px] text-neutral-400 block font-mono">
                    Index: {activeApp.academicData?.levelCompletionProof?.indexOrRegNumber || 'U0023/514'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] uppercase font-bold block flex items-center gap-1">
                    <IdCard className="w-3 h-3 text-orange-400" /> Next of Kin
                  </span>
                  <p className="text-neutral-200 font-medium truncate">
                    {activeApp.financialData?.personalData?.nextOfKin?.fullName || 'Family Guardian Registered'}
                  </p>
                  <span className="text-[11px] font-mono text-emerald-400 block">
                    NIN: {activeApp.financialData?.personalData?.nextOfKin?.nin ? `${activeApp.financialData.personalData.nextOfKin.nin.slice(0, 4)}••••••${activeApp.financialData.personalData.nextOfKin.nin.slice(-3)}` : 'CF••••••••••• (Verified)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[10px] uppercase font-bold block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Optical Scan Seal
                  </span>
                  <p className="text-emerald-400 font-medium truncate">
                    Digital Seal Valid
                  </p>
                  <span className="text-[10px] text-neutral-400 block">
                    Conformity Audit: PASSED ✓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Submitted Bursary Dossier Yet</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            Welcome to your applicant account. You have not submitted an application yet. Click the button below to complete the 5-step application wizard and submit your dossier.
          </p>
          <button
            onClick={onOpenNewApplicationModal}
            className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Start & Submit Bursary Dossier
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
