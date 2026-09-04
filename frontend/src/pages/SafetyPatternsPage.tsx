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
  if (trend === 'increasing') return <TrendingUp  className="w-3.5 h-3.5 text-red-400" />;
  if (trend === 'decreasing') return <TrendingDown className="w-3.5 h-3.5 text-green-400" />;
  return <Minus className="w-3.5 h-3.5 text-yellow-400" />;
}

function TrendLabel({ trend }: { trend: string }) {
  const cfg = {
    increasing: { label: 'Increasing', color: 'text-red-400' },
    decreasing: { label: 'Decreasing', color: 'text-green-400' },
    stable:     { label: 'Stable',     color: 'text-yellow-400' },
  }[trend] ?? { label: 'Stable', color: 'text-yellow-400' };
  return <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
}

// ─── Risk colour for bar chart ─────────────────────────────────────────────────
const RISK_BAR_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#22c55e',
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
      fill: RISK_BAR_COLOR[p.risk_level] ?? '#64748b',
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
    <div className="p-6 space-y-6 animate-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">Safety Patterns</h1>
          <p className="section-sub">
            Recurring safety failure patterns detected dynamically from the uploaded dataset
            using activity, barrier failure, life-saving rule, site and SIF potential combinations.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'chart' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            Chart
          </button>
        </div>
      </div>

      {/* ── Summary KPI cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Patterns Found',   value: totalPatterns,  color: 'text-blue-400',   bg: 'bg-blue-600/10 border-blue-500/20',   icon: GitBranch },
          { label: 'Critical Patterns',value: criticalCount,  color: 'text-red-400',    bg: 'bg-red-600/10 border-red-500/20',     icon: AlertTriangle },
          { label: 'High Risk',        value: highCount,      color: 'text-orange-400', bg: 'bg-orange-600/10 border-orange-500/20',icon: TrendingUp },
          { label: 'SIF Reports in Patterns', value: totalSIFInPats, color: 'text-violet-400', bg: 'bg-violet-600/10 border-violet-500/20', icon: Shield },
        ].map(kpi => (
          <div key={kpi.label} className={`card border ${kpi.bg}`}>
            <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patterns..."
            className="input-field pl-8 py-1.5 text-sm w-44"
          />
        </div>

        {/* Risk filter */}
        <select
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="input-field text-sm py-1.5 w-36"
        >
          {['All','CRITICAL','HIGH','MEDIUM','LOW'].map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>

        {/* Key-type filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="input-field text-sm py-1.5 w-52"
        >
          {keyTypes.map(t => <option key={t}>{t}</option>)}
        </select>

        {(search || filterRisk !== 'All' || filterType !== 'All') && (
          <button
            onClick={() => { setSearch(''); setFilterRisk('All'); setFilterType('All'); }}
            className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} of {totalPatterns} patterns
        </span>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {patterns.length === 0 && (
        <div className="card text-slate-400 text-sm flex items-start gap-3">
          <GitBranch className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-slate-300 mb-1">No recurring patterns detected yet.</p>
            <p>This can happen when the dataset has very few reports, high variation in report text, or missing activity/barrier/LSR fields. Try uploading the multilingual demo dataset to see patterns in action.</p>
          </div>
        </div>
      )}

      {filtered.length === 0 && patterns.length > 0 && (
        <div className="card text-slate-400 text-sm">
          No patterns match the current filters.
        </div>
      )}

      {/* ── Chart view ─────────────────────────────────────────────────────── */}
      {view === 'chart' && filtered.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            Top Recurring Patterns — Report Frequency
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fill: '#94a3b8', fontSize: 9 }}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'frequency' ? 'Total Reports' : 'SIF Potential',
                ]}
              />
              <Bar dataKey="frequency" name="frequency" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
              <Bar dataKey="sif" name="sif" fill="#ef4444" radius={[0, 4, 4, 0]} opacity={0.6} />
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
              <div key={pattern.id} className="card-hover flex flex-col gap-0">

                {/* Card header */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <GitBranch className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm leading-tight truncate">
                        {pattern.name}
                      </h3>
                      <span className="text-xs text-slate-500">{keyType}</span>
                    </div>
                  </div>
                  <RiskBadge level={pattern.risk_level} size="sm" />
                </div>

                <p className="text-slate-400 text-xs mb-3 leading-relaxed">
                  {pattern.description}
                </p>

                {/* ── Stats row ─────────────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="text-lg font-bold text-white">{pattern.frequency}</div>
                    <div className="text-xs text-slate-500">Reports</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="text-lg font-bold text-slate-300">{percentage}%</div>
                    <div className="text-xs text-slate-500">of Dataset</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="text-lg font-bold text-red-400">{sifCount}</div>
                    <div className="text-xs text-slate-500">SIF ({sifPct}%)</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="flex items-center justify-center gap-1">
                      <TrendIcon trend={pattern.trend} />
                    </div>
                    <TrendLabel trend={pattern.trend} />
                  </div>
                </div>

                {/* ── Frequency bar ──────────────────────────────────────── */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Occurrence in dataset</span>
                    <span className="text-slate-400">{percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pattern.risk_level === 'CRITICAL' ? 'bg-red-500' :
                        pattern.risk_level === 'HIGH'     ? 'bg-orange-500' :
                        pattern.risk_level === 'MEDIUM'   ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                    />
                  </div>
                </div>

                {/* ── Sites ─────────────────────────────────────────────── */}
                {pattern.sites.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    {pattern.sites.slice(0, 3).map(site => (
                      <span key={site} className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded">
                        {site}
                      </span>
                    ))}
                    {pattern.sites.length > 3 && (
                      <span className="text-xs text-slate-500">+{pattern.sites.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* ── Activities ────────────────────────────────────────── */}
                {pattern.activities.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <Activity className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    {pattern.activities.slice(0, 2).map(act => (
                      <span key={act} className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded">
                        {act}
                      </span>
                    ))}
                    {pattern.activities.length > 2 && (
                      <span className="text-xs text-slate-500">+{pattern.activities.length - 2} more</span>
                    )}
                  </div>
                )}

                {/* ── Expand / collapse ─────────────────────────────────── */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 self-start"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {isExpanded ? 'Show less' : 'Show details'}
                </button>

                {/* ── Expanded detail ───────────────────────────────────── */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">

                    {lsrs.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Life-Saving Rules involved</span>
                        <div className="flex flex-wrap gap-1.5">
                          {lsrs.map(l => (
                            <span key={l} className="text-xs bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {barriers.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Failed safety barriers</span>
                        <div className="flex flex-wrap gap-1.5">
                          {barriers.map(b => (
                            <span key={b} className="text-xs bg-red-500/15 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Tag className="w-3 h-3" />
                      <span>Pattern type: <span className="text-slate-200">{keyType}</span></span>
                      <span className="mx-1 text-slate-600">·</span>
                      <span>Pattern ID: <span className="font-mono text-slate-200">{pattern.id}</span></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer note ────────────────────────────────────────────────────── */}
      {patterns.length > 0 && (
        <p className="text-xs text-slate-600 text-center">
          Patterns calculated dynamically from {reports.length} uploaded reports using activity, barrier failure, life-saving rule, site and SIF potential combinations. Prototype analysis — not a certified safety assessment.
        </p>
      )}
    </div>
  );
}
