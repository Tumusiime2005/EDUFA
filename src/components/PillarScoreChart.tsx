import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface PillarScoreChartProps {
  applications: any[];
  totalCount: number;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

type ChartMode = 'distribution' | 'averages';

interface PillarMeta {
  key: 'needScore' | 'academicScore' | 'alignmentScore' | 'sustainabilityScore';
  dataKey: 'need' | 'academic' | 'alignment' | 'sustainability';
  label: string;
  shortLabel: string;
  max: number;
  color: string;
  subtitle: string;
}

const PILLARS: PillarMeta[] = [
  {
    key: 'needScore',
    dataKey: 'need',
    label: 'Financial Need & Vulnerability',
    shortLabel: 'Need & Hardship',
    max: 35,
    color: '#f97316',
    subtitle: 'Income, orphan/single-parent & rural hardship',
  },
  {
    key: 'academicScore',
    dataKey: 'academic',
    label: 'Academic Grit & Merit',
    shortLabel: 'Academic Merit',
    max: 25,
    color: '#3b82f6',
    subtitle: 'GPA standing, trajectory & priority field',
  },
  {
    key: 'alignmentScore',
    dataKey: 'alignment',
    label: 'Institutional Alignment',
    shortLabel: 'Alignment',
    max: 20,
    color: '#10b981',
    subtitle: 'Donor mandate, service hours & work-back',
  },
  {
    key: 'sustainabilityScore',
    dataKey: 'sustainability',
    label: 'Operational Sustainability',
    shortLabel: 'Sustainability',
    max: 20,
    color: '#a855f7',
    subtitle: 'Co-funding feasibility & renewal target',
  },
];

const BANDS = [
  { id: 'low', label: '0–49%', sublabel: 'Baseline', min: 0, max: 50 },
  { id: 'moderate', label: '50–69%', sublabel: 'Moderate', min: 50, max: 70 },
  { id: 'strong', label: '70–84%', sublabel: 'Strong', min: 70, max: 85 },
  { id: 'critical', label: '85–100%', sublabel: 'Critical', min: 85, max: 101 },
];

export const PillarScoreChart: React.FC<PillarScoreChartProps> = ({
  applications,
  totalCount,
  onResetFilters,
  hasActiveFilters,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('distribution');

  const scoredApps = useMemo(
    () => applications.filter((app) => Boolean(app.scoreRecord)),
    [applications]
  );

  // 1. Score Band Distribution across the 4 pillars (normalized to % of pillar max)
  const distributionData = useMemo(() => {
    return BANDS.map((band) => {
      const row: Record<string, string | number> = {
        band: band.label,
        sublabel: band.sublabel,
      };

      for (const pillar of PILLARS) {
        const count = scoredApps.filter((app) => {
          const raw = Number(app.scoreRecord?.[pillar.key] ?? 0);
          const pct = Math.min(100, Math.max(0, (raw / pillar.max) * 100));
          return pct >= band.min && pct < band.max;
        }).length;
        row[pillar.dataKey] = count;
      }

      return row;
    });
  }, [scoredApps]);

  // 2. Pillar Averages (% of max) comparing Filtered Cohort vs Approved Awards
  const averagesData = useMemo(() => {
    const approvedApps = scoredApps.filter((app) => app.status === 'approved');

    return PILLARS.map((pillar) => {
      const cohortRawAvg =
        scoredApps.length > 0
          ? scoredApps.reduce((sum, app) => sum + Number(app.scoreRecord?.[pillar.key] ?? 0), 0) /
            scoredApps.length
          : 0;

      const approvedRawAvg =
        approvedApps.length > 0
          ? approvedApps.reduce((sum, app) => sum + Number(app.scoreRecord?.[pillar.key] ?? 0), 0) /
            approvedApps.length
          : 0;

      return {
        pillar: pillar.shortLabel,
        fullLabel: pillar.label,
        max: pillar.max,
        cohortPct: Math.round((cohortRawAvg / pillar.max) * 1000) / 10,
        approvedPct: Math.round((approvedRawAvg / pillar.max) * 1000) / 10,
        cohortRaw: Math.round(cohortRawAvg * 10) / 10,
        approvedRaw: Math.round(approvedRawAvg * 10) / 10,
        approvedCount: approvedApps.length,
      };
    });
  }, [scoredApps]);

  return (
    <section
      aria-label="Pillar Score Distribution Analytics"
      className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-6"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-orange-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pillar Score Distribution
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Normalized score spread across Need & Vulnerability (35), Academic Merit (25), Alignment (20), and Sustainability (20)
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums text-neutral-300">
                {scoredApps.length}
                {hasActiveFilters && totalCount !== scoredApps.length ? ` of ${totalCount}` : ''}{' '}
                {scoredApps.length === 1 ? 'dossier' : 'dossiers'}
              </span>
            </p>
          </div>
        </div>

        {/* Mode Segmented Toggle */}
        <div
          role="tablist"
          aria-label="Chart visualization mode"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-950 border border-neutral-800 self-start md:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={chartMode === 'distribution'}
            onClick={() => setChartMode('distribution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartMode === 'distribution'
                ? 'bg-orange-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Score Bands
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chartMode === 'averages'}
            onClick={() => setChartMode('averages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartMode === 'averages'
                ? 'bg-orange-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Cohort vs. Approved Mean
          </button>
        </div>
      </div>

      {/* Inline Pillar Summary Metrics Strip (Single-level hairline strip, no nested cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-b border-neutral-800/80">
        {averagesData.map((item, idx) => {
          const meta = PILLARS[idx];
          return (
            <div key={meta.key} className="flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-300 truncate">
                  {meta.shortLabel}
                </span>
                <span
                  className="text-xs font-mono font-bold tabular-nums shrink-0"
                  style={{ color: meta.color }}
                >
                  {scoredApps.length > 0 ? `${item.cohortPct.toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-[11px] text-neutral-500 truncate">{meta.subtitle}</span>
                <span className="text-[11px] font-mono tabular-nums text-neutral-400 shrink-0">
                  {scoredApps.length > 0 ? `${item.cohortRaw}/${meta.max}` : `0/${meta.max}`} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Viewport or Empty State */}
      {scoredApps.length === 0 ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm font-semibold text-neutral-300">
            {hasActiveFilters
              ? 'No dossiers match the active filters'
              : 'No scored dossiers available yet'}
          </p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md">
            {hasActiveFilters
              ? 'Adjust or clear your search and equity tier filters to inspect pillar score distributions.'
              : 'Once applicant dossiers are submitted and scored, their distribution across the 4 evaluation pillars will render here.'}
          </p>
          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-3 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="pt-5 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {chartMode === 'distribution' ? (
              <BarChart
                data={distributionData}
                margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                barGap={4}
                barCategoryGap="22%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#262626"
                />
                <XAxis
                  dataKey="band"
                  tick={{ fill: '#a3a3a3', fontSize: 12 }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#a3a3a3', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: 'Dossiers',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 20,
                    fill: '#737373',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const bandMeta = BANDS.find((b) => b.label === label);
                    return (
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 shadow-xl text-xs">
                        <p className="font-bold text-neutral-100 mb-1.5">
                          {label} Score Band{' '}
                          {bandMeta ? (
                            <span className="text-neutral-400 font-normal">
                              ({bandMeta.sublabel})
                            </span>
                          ) : null}
                        </p>
                        <div className="space-y-1">
                          {payload.map((entry) => (
                            <div
                              key={String(entry.dataKey)}
                              className="flex items-center justify-between gap-5"
                            >
                              <span className="flex items-center gap-2 text-neutral-300">
                                <span
                                  className="w-2.5 h-2.5 rounded-xs inline-block"
                                  style={{ backgroundColor: entry.color }}
                                />
                                {entry.name}
                              </span>
                              <span className="font-mono font-bold tabular-nums text-white">
                                {entry.value} {Number(entry.value) === 1 ? 'dossier' : 'dossiers'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar
                  dataKey="need"
                  name="Need & Vulnerability (35)"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="academic"
                  name="Academic Merit (25)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="alignment"
                  name="Alignment (20)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="sustainability"
                  name="Sustainability (20)"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            ) : (
              <BarChart
                data={averagesData}
                margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                barGap={6}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#262626"
                />
                <XAxis
                  dataKey="pillar"
                  tick={{ fill: '#a3a3a3', fontSize: 12 }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#a3a3a3', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const row = payload[0]?.payload;
                    return (
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 shadow-xl text-xs">
                        <p className="font-bold text-neutral-100 mb-1.5">
                          {row.fullLabel} (Max {row.max} pts)
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-2 text-neutral-300">
                              <span className="w-2.5 h-2.5 rounded-xs inline-block bg-orange-500" />
                              Cohort Mean ({scoredApps.length})
                            </span>
                            <span className="font-mono font-bold tabular-nums text-white">
                              {row.cohortPct}% ({row.cohortRaw}/{row.max})
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-2 text-neutral-300">
                              <span className="w-2.5 h-2.5 rounded-xs inline-block bg-emerald-500" />
                              Approved Mean ({row.approvedCount})
                            </span>
                            <span className="font-mono font-bold tabular-nums text-white">
                              {row.approvedCount > 0
                                ? `${row.approvedPct}% (${row.approvedRaw}/${row.max})`
                                : 'No approvals yet'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar
                  dataKey="cohortPct"
                  name="Filtered Cohort Mean (%)"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
                <Bar
                  dataKey="approvedPct"
                  name="Approved Awards Mean (%)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
