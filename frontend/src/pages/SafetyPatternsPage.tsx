import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { RiskBadge } from '../components/RiskBadge';
import { computePatterns } from '../utils/riskEngine';
import {
  GitBranch, MapPin, Activity, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Shield, ChevronDown, ChevronUp,
  BarChart2, Tag, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

// ─── Trend icon ───────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'increasing') return <TrendingUp  className="w-3.5 h-3.5 text-red-600" />;
  if (trend === 'decreasing') return <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />;
  return <Minus className="w-3.5 h-3.5 text-amber-600" />;
}

function TrendLabel({ trend }: { trend: string }) {
  const cfg = {
    increasing: { label: 'Increasing', color: 'text-red-600' },
    decreasing: { label: 'Decreasing', color: 'text-emerald-600' },
    stable:     { label: 'Stable',     color: 'text-amber-600' },
  }[trend] ?? { label: 'Stable', color: 'text-amber-600' };
  return <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>;
}

// ─── Risk colour for bar chart ─────────────────────────────────────────────────
const RISK_BAR_COLOR: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH:     '#F97316',
  MEDIUM:   '#F59E0B',
  LOW:      '#22C55E',
};

export default function SafetyPatternsPage() {
  const { reports, dataset } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'chart'>('grid');

  const patterns = useMemo(() => computePatterns(reports), [reports]);

  // Unique key types for filter
  const keyTypes = useMemo(() => {
    const types = [...new Set(patterns.map(p => (p as Record<string,unknown>).key_type as string))];
    return ['All', ...types];
  }, [patterns]);

  // Apply filters
  const filtered = useMemo(() => patterns.filter(p => {
    const pt = p as Record<string, unknown>;
    if (filterRisk !== 'All' && p.risk_level !== filterRisk) return false;
    if (filterType !== 'All' && pt.key_type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s);
    }
    return true;
  }), [patterns, filterRisk, filterType, search]);

  // Chart data — top 10 by frequency
  const chartData = useMemo(() =>
    filtered.slice(0, 10).map(p => ({
      name: p.name.length > 28 ? p.name.slice(0, 26) + '…' : p.name,
      frequency: p.frequency,
      sif: (p as Record<string,unknown>).sif_count as number,
      fill: RISK_BAR_COLOR[p.risk_level] ?? '#4F46E5',
    })),
    [filtered]
  );

  if (!dataset) return <div className="p-6"><EmptyState /></div>;

  // Summary stats
  const totalPatterns  = patterns.length;
  const criticalCount  = patterns.filter(p => p.risk_level === 'CRITICAL').length;
  const highCount      = patterns.filter(p => p.risk_level === 'HIGH').length;
  const totalSIFInPats = patterns.reduce((s, p) => s + ((p as Record<string,unknown>).sif_count as number || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-in bg-[#F8FAFC]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">Safety Patterns</h1>
          <p className="section-sub mb-0">
            Recurring safety failure patterns detected dynamically from the uploaded dataset
            using activity, barrier failure, life-saving rule, site and SIF potential combinations.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setView('grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Grid View
          </button>
          <button
            onClick={() => setView('chart')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'chart' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Chart View
          </button>
        </div>
      </div>

      {/* ── Summary KPI cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Patterns Found',   value: totalPatterns,  color: 'text-indigo-600',   bg: 'bg-indigo-50 border-indigo-100 text-indigo-600', borderTop: 'border-t-4 border-t-indigo-600', icon: GitBranch },
          { label: 'Critical Patterns',value: criticalCount,  color: 'text-red-600',    bg: 'bg-red-50 border-red-100 text-red-600', borderTop: 'border-t-4 border-t-red-500', icon: AlertTriangle },
          { label: 'High Risk',        value: highCount,      color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100 text-orange-600', borderTop: 'border-t-4 border-t-orange-500', icon: TrendingUp },
          { label: 'SIF in Patterns',  value: totalSIFInPats, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100 text-purple-600', borderTop: 'border-t-4 border-t-purple-500', icon: Shield },
        ].map(kpi => (
          <div key={kpi.label} className={`card ${kpi.borderTop} hover:-translate-y-1 hover:shadow-soft-md transition-all duration-200 cursor-default`}>
            <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center mb-2 shadow-xs`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div className={`text-3xl font-bold ${kpi.color} mb-0.5`}>{kpi.value}</div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2.5 items-center card p-3.5 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patterns..."
            className="input-field pl-9 py-2 text-xs w-48 shadow-2xs"
          />
        </div>

        {/* Risk filter */}
        <select
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="input-field text-xs py-2 w-36 shadow-2xs"
        >
          {['All','CRITICAL','HIGH','MEDIUM','LOW'].map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>

        {/* Key-type filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="input-field text-xs py-2 w-52 shadow-2xs"
        >
          {keyTypes.map(t => <option key={t}>{t}</option>)}
        </select>

        {(search || filterRisk !== 'All' || filterType !== 'All') && (
          <button
            onClick={() => { setSearch(''); setFilterRisk('All'); setFilterType('All'); }}
            className="text-xs text-slate-500 hover:text-indigo-600 font-semibold px-2 py-1.5"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs font-semibold text-slate-500">
          {filtered.length} of {totalPatterns} patterns
        </span>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {patterns.length === 0 && (
        <div className="card text-slate-600 text-sm flex items-start gap-3">
          <GitBranch className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900 mb-1">No recurring patterns detected yet.</p>
            <p>This can happen when the dataset has very few reports, high variation in report text, or missing activity/barrier/LSR fields. Try uploading the multilingual demo dataset to see patterns in action.</p>
          </div>
        </div>
      )}

      {filtered.length === 0 && patterns.length > 0 && (
        <div className="card text-slate-500 text-sm text-center py-8">
          No patterns match the current filters.
        </div>
      )}

      {/* ── Chart view ─────────────────────────────────────────────────────── */}
      {view === 'chart' && filtered.length > 0 && (
        <div className="card shadow-soft">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            Top Recurring Patterns — Report Frequency
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fill: '#475569', fontSize: 10 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name === 'frequency' ? 'Total Reports' : 'SIF Potential',
                ]}
              />
              <Bar dataKey="frequency" name="frequency" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
              <Bar dataKey="sif" name="sif" fill="#EF4444" radius={[0, 6, 6, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Grid view ──────────────────────────────────────────────────────── */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(pattern => {
            const pt = pattern as Record<string, unknown>;
            const sifCount   = (pt.sif_count   as number) || 0;
            const sifPct     = (pt.sif_percentage as number) || 0;
            const percentage = (pt.percentage   as number) || 0;
            const keyType    = (pt.key_type     as string) || '';
            const lsrs       = (pt.lsrs         as string[]) || [];
            const barriers   = (pt.barriers     as string[]) || [];
            const isExpanded = expandedId === pattern.id;

            return (
              <div key={pattern.id} className="card card-hover flex flex-col justify-between">
                <div>
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                        <GitBranch className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {pattern.name}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-500">{keyType}</span>
                      </div>
                    </div>
                    <RiskBadge level={pattern.risk_level} size="sm" />
                  </div>

                  <p className="text-slate-600 text-xs mb-3 leading-relaxed">
                    {pattern.description}
                  </p>

                  {/* ── Stats row ─────────────────────────────────────────── */}
                  <div className="grid grid-cols-4 gap-2 text-center mb-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                      <div className="text-base font-bold text-slate-900">{pattern.frequency}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Reports</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                      <div className="text-base font-bold text-slate-700">{percentage}%</div>
                      <div className="text-[11px] text-slate-500 font-medium">of Total</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                      <div className="text-base font-bold text-red-600">{sifCount}</div>
                      <div className="text-[11px] text-slate-500 font-medium">SIF ({sifPct}%)</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon trend={pattern.trend} />
                      </div>
                      <TrendLabel trend={pattern.trend} />
                    </div>
                  </div>

                  {/* ── Frequency bar ──────────────────────────────────────── */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 text-[11px] font-medium">Precursor concentration</span>
                      <span className="text-slate-700 font-bold">{percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          pattern.risk_level === 'CRITICAL' ? 'bg-red-500' :
                          pattern.risk_level === 'HIGH'     ? 'bg-orange-500' :
                          pattern.risk_level === 'MEDIUM'   ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* ── Sites ─────────────────────────────────────────────── */}
                  {pattern.sites.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {pattern.sites.slice(0, 3).map(site => (
                        <span key={site} className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200/60">
                          {site}
                        </span>
                      ))}
                      {pattern.sites.length > 3 && (
                        <span className="text-[11px] text-slate-400 font-medium">+{pattern.sites.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* ── Activities ────────────────────────────────────────── */}
                  {pattern.activities.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <Activity className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {pattern.activities.slice(0, 2).map(act => (
                        <span key={act} className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200/60">
                          {act}
                        </span>
                      ))}
                      {pattern.activities.length > 2 && (
                        <span className="text-[11px] text-slate-400 font-medium">+{pattern.activities.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  {/* ── Expand / collapse ─────────────────────────────────── */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 self-start"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Hide details' : 'View full pattern breakdown'}
                  </button>

                  {/* ── Expanded detail ───────────────────────────────────── */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                      {lsrs.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Life-Saving Rules involved</span>
                          <div className="flex flex-wrap gap-1.5">
                            {lsrs.map(l => (
                              <span key={l} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium">
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {barriers.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Failed safety barriers</span>
                          <div className="flex flex-wrap gap-1.5">
                            {barriers.map(b => (
                              <span key={b} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full font-medium">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium pt-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>Type: <span className="text-slate-800 font-semibold">{keyType}</span></span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span>ID: <span className="font-mono text-slate-700">{pattern.id}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer note ────────────────────────────────────────────────────── */}
      {patterns.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Patterns calculated dynamically from {reports.length} uploaded reports using activity, barrier failure, life-saving rule, site and SIF potential combinations.
        </p>
      )}
    </div>
  );
}
