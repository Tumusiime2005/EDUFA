import React, { useState, useMemo } from 'react';
import {
  Shield,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  DollarSign,
  TrendingUp,
  FileCheck,
  ArrowUpDown,
  BookOpen,
  ChevronRight,
  Eye,
  Building2,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ApplicationDetailModal } from './ApplicationDetailModal.tsx';

interface CommitteeDashboardProps {
  applications: any[];
  onRefresh: () => void;
  onOpenNewApplicationModal: () => void;
}

export const CommitteeDashboard: React.FC<CommitteeDashboardProps> = ({
  applications,
  onRefresh,
  onOpenNewApplicationModal,
}) => {
  const { anonymizedMode, setAnonymizedMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'need_desc' | 'academic_desc' | 'recent'>('score_desc');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // KPIs
  const stats = useMemo(() => {
    const total = applications.length;
    if (total === 0) return { total: 0, avgScore: 0, tier1Count: 0, approvedCount: 0, anomalyCount: 0 };

    const totalScore = applications.reduce((acc, app) => acc + (app.scoreRecord?.compositeScore || 0), 0);
    const avgScore = (totalScore / total).toFixed(1);
    const tier1Count = applications.filter((app) => (app.scoreRecord?.compositeScore || 0) >= 80).length;
    const approvedCount = applications.filter((app) => app.status === 'approved').length;
    const anomalyCount = applications.filter((app) => !app.financialData?.documentsVerified || (app.scoreRecord?.explanation?.riskAnomalyFlags?.length || 0) > 0).length;

    return { total, avgScore, tier1Count, approvedCount, anomalyCount };
  }, [applications]);

  // Filtered & Sorted List
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const applicantName = app.applicant?.profile?.fullName?.toLowerCase() || '';
      const email = app.applicant?.email?.toLowerCase() || '';
      const program = app.academicData?.degreeProgram?.toLowerCase() || '';
      const institution = app.academicData?.currentInstitution?.toLowerCase() || '';
      const idMatch = `applicant #${app.id}`.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSearch =
        applicantName.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        program.includes(searchTerm.toLowerCase()) ||
        institution.includes(searchTerm.toLowerCase()) ||
        idMatch;

      const compScore = app.scoreRecord?.compositeScore || 0;
      let matchesTier = true;
      if (tierFilter === 'tier1') matchesTier = compScore >= 80;
      else if (tierFilter === 'tier2') matchesTier = compScore >= 65 && compScore < 80;
      else if (tierFilter === 'tier3') matchesTier = compScore >= 50 && compScore < 65;
      else if (tierFilter === 'tier4') matchesTier = compScore < 50;

      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesField = fieldFilter === 'all' || app.academicData?.fieldOfStudyCategory === fieldFilter;

      return matchesSearch && matchesTier && matchesStatus && matchesField;
    }).sort((a, b) => {
      const scoreA = a.scoreRecord?.compositeScore || 0;
      const scoreB = b.scoreRecord?.compositeScore || 0;
      const needA = a.scoreRecord?.needScore || 0;
      const needB = b.scoreRecord?.needScore || 0;
      const acadA = a.scoreRecord?.academicScore || 0;
      const acadB = b.scoreRecord?.academicScore || 0;

      if (sortBy === 'score_desc') return scoreB - scoreA;
      if (sortBy === 'score_asc') return scoreA - scoreB;
      if (sortBy === 'need_desc') return needB - needA;
      if (sortBy === 'academic_desc') return acadB - acadA;
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [applications, searchTerm, tierFilter, statusFilter, fieldFilter, sortBy]);

  return (
    <div className="space-y-8">
      {/* Committee Hero & Anonymized Mode Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-linear-to-r from-orange-950/40 via-neutral-900 to-neutral-950 p-6 rounded-3xl border border-orange-500/30 shadow-xl shadow-orange-950/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
              Committee Oversight Room
            </span>
            <span className="text-xs text-neutral-400">System Registry Synchronized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Fairness Allocation Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-2xl">
            Multi-dimensional objective evaluation neutralizing personal bias across 4 transparent pillars: Financial Need (35%), Academic Grit (25%), Alignment (20%), and Sustainability (20%).
          </p>
        </div>

        {/* Anonymized Review Mode Feature Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
          <div className={`p-2.5 rounded-xl ${anonymizedMode ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-100">Anonymized Review Mode</span>
              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${anonymizedMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                {anonymizedMode ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 max-w-xs">
              Masks applicant names, contact, and demographics to eliminate unconscious affinity bias.
            </p>
          </div>
          <button
            onClick={() => setAnonymizedMode(!anonymizedMode)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              anonymizedMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            {anonymizedMode ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium">Total Dossiers</span>
            <Users className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.total}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Submitted for scoring</p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium">Mean Fairness Score</span>
            <Award className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-500 font-mono mt-1">{stats.avgScore} <span className="text-xs font-normal text-neutral-400">/100</span></div>
          <p className="text-[11px] text-neutral-400 mt-1">Composite average</p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium">Critical High-Need</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono mt-1">{stats.tier1Count}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Score ≥ 80.0 (Priority 1)</p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium">Awards Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{stats.approvedCount}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Allocations finalized</p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-md col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-medium">Verification Flags</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.anomalyCount}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Require document scrutiny</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={anonymizedMode ? "Search by Applicant #ID, Program, or Institution..." : "Search by name, email, institution, or program..."}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder:text-neutral-400 text-xs focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs focus:outline-hidden focus:border-orange-500"
          >
            <option value="all">All Equity Tiers</option>
            <option value="tier1">Tier 1: Critical High Need (≥80)</option>
            <option value="tier2">Tier 2: High Merit & Need (65-79)</option>
            <option value="tier3">Tier 3: Moderate (50-64)</option>
            <option value="tier4">Tier 4: Borderline (&lt;50)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs focus:outline-hidden focus:border-orange-500"
          >
            <option value="all">All Decision Statuses</option>
            <option value="submitted">Submitted (Pending)</option>
            <option value="approved">Approved</option>
            <option value="more_info_requested">More Info Requested</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Field Filter */}
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs focus:outline-hidden focus:border-orange-500"
          >
            <option value="all">All Disciplines</option>
            <option value="stem">STEM Priority</option>
            <option value="healthcare">Healthcare Priority</option>
            <option value="education">Education Priority</option>
            <option value="commerce">Commerce</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs focus:outline-hidden focus:border-orange-500"
          >
            <option value="score_desc">Fairness Score: High to Low</option>
            <option value="score_asc">Fairness Score: Low to High</option>
            <option value="need_desc">Need Quotient (35% Max)</option>
            <option value="academic_desc">Academic Rating (25% Max)</option>
            <option value="recent">Most Recently Submitted</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Applicant Dossier</th>
                <th className="py-3.5 px-4 text-center">Composite Score</th>
                <th className="py-3.5 px-4">4-Pillar Quotient Breakdown</th>
                <th className="py-3.5 px-4">Discipline & Institution</th>
                <th className="py-3.5 px-4 text-center">Verification</th>
                <th className="py-3.5 px-4 text-center">Decision Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-400 text-sm">
                    <p className="font-semibold text-neutral-300">No applicant dossiers in database</p>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      All mock data has been cleared. Submit fresh applicant dossiers using the "Submit Dossier" button above to populate the committee evaluation ledger.
                    </p>
                    <button
                      onClick={onOpenNewApplicationModal}
                      className="mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/30"
                    >
                      Submit First Dossier
                    </button>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const score = app.scoreRecord || {};
                  const compScore = score.compositeScore || 0;
                  const verified = app.financialData?.documentsVerified;
                  const candidateLabel = anonymizedMode
                    ? `Applicant #${app.id}`
                    : app.applicant?.profile?.fullName || `Applicant #${app.id}`;

                  const candidateSub = anonymizedMode
                    ? 'Identity Shielded (Anonymized Mode)'
                    : app.applicant?.email;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-neutral-800/40 transition-colors group"
                    >
                      {/* Candidate */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            anonymizedMode
                              ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                              : 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                          }`}>
                            {anonymizedMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : candidateLabel.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-100 flex items-center gap-1.5">
                              {candidateLabel}
                              {compScore >= 80 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                                  Tier 1
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-neutral-400 font-mono">
                              {candidateSub}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Composite Score */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className={`px-2.5 py-1 rounded-xl font-mono font-black text-sm border ${
                            compScore >= 80
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                              : compScore >= 65
                              ? 'bg-orange-950/40 text-orange-400 border-orange-500/40'
                              : compScore >= 50
                              ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {compScore.toFixed(1)}
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-0.5">out of 100</span>
                        </div>
                      </td>

                      {/* 4 Pillars Mini-Bars */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5 w-48">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-orange-400 font-medium">Need: {score.needScore?.toFixed(0)}/35</span>
                            <span className="text-blue-400 font-medium">Acad: {score.academicScore?.toFixed(0)}/25</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1.5">
                            <div className="bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="bg-orange-500 h-full"
                                style={{ width: `${Math.min(100, ((score.needScore || 0) / 35) * 100)}%` }}
                              />
                            </div>
                            <div className="bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-500 h-full"
                                style={{ width: `${Math.min(100, ((score.academicScore || 0) / 25) * 100)}%` }}
                              />
                            </div>
                            <div className="bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full"
                                style={{ width: `${Math.min(100, ((score.alignmentScore || 0) / 20) * 100)}%` }}
                              />
                            </div>
                            <div className="bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-500 h-full"
                                style={{ width: `${Math.min(100, ((score.sustainabilityScore || 0) / 20) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-emerald-400 font-medium">Align: {score.alignmentScore?.toFixed(0)}/20</span>
                            <span className="text-purple-400 font-medium">Scope: {score.sustainabilityScore?.toFixed(0)}/20</span>
                          </div>
                        </div>
                      </td>

                      {/* Discipline & Institution */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-neutral-200">
                            {app.academicData?.degreeProgram || 'General Degree'}
                          </p>
                          <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-neutral-400" />
                            {app.academicData?.currentInstitution || 'Higher Education Institution'}
                          </p>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-4 text-center">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> Flagged
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          app.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : app.status === 'rejected'
                            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                            : app.status === 'more_info_requested'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-sm shadow-orange-600/30 flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          Evaluate <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
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
