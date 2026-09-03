import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { RiskBadge, SIFBadge } from '../components/RiskBadge';
import { LanguageBadge, TranslationBadge, MultilingualStatsBanner } from '../components/MultilingualBadge';
import { computeBarrierFailures, computeSiteRisk, computeActivityRisk, computeEarlyWarnings } from '../utils/riskEngine';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { AlertTriangle, TrendingUp, Shield, CheckSquare, Activity, MapPin, Zap, ArrowUpRight, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

const RISK_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' };

export default function DashboardPage() {
  const { reports, dataset, isDemo, multilingualStats } = useApp();
  const navigate = useNavigate();
  const [showMultilingualTable, setShowMultilingualTable] = useState(false);

  const metrics = useMemo(() => {
    if (!reports.length) return null;
    const sif = reports.filter(r => r.sif_potential === 'YES').length;
    const critical = reports.filter(r => r.severity === 'Critical' || r.risk_level === 'CRITICAL').length;
    const high = reports.filter(r => r.severity === 'High' || r.risk_level === 'HIGH').length;
    const medium = reports.filter(r => r.severity === 'Medium' || r.risk_level === 'MEDIUM').length;
    const low = reports.filter(r => r.severity === 'Low' || r.risk_level === 'LOW').length;
    return { total: reports.length, sif, critical, high, medium, low, sifPct: Math.round(sif / reports.length * 100) };
  }, [reports]);

  const barrierData = useMemo(() => computeBarrierFailures(reports).slice(0, 6), [reports]);
  const siteData = useMemo(() => computeSiteRisk(reports).slice(0, 6), [reports]);
  const activityData = useMemo(() => computeActivityRisk(reports).slice(0, 6), [reports]);
  const warnings = useMemo(() => computeEarlyWarnings(reports), [reports]);

  // ── Multilingual analytics ────────────────────────────────────────────────
  const hasMultilingual = useMemo(() =>
    (multilingualStats.kannada > 0 || multilingualStats.hindi > 0),
    [multilingualStats]
  );

  const languageChartData = useMemo(() => {
    if (!hasMultilingual) return [];
    return [
      { name: 'English', value: multilingualStats.english,  fill: '#3b82f6' },
      { name: 'Kannada', value: multilingualStats.kannada,  fill: '#f97316' },
      { name: 'Hindi',   value: multilingualStats.hindi,    fill: '#22c55e' },
      ...(multilingualStats.unknown > 0
        ? [{ name: 'Unknown', value: multilingualStats.unknown, fill: '#64748b' }]
        : []),
    ].filter(d => d.value > 0);
  }, [multilingualStats, hasMultilingual]);

  // Reports with non-English content for the multilingual table
  const multilingualReports = useMemo(() =>
    reports.filter(r => r.detected_language === 'kn' || r.detected_language === 'hi'),
    [reports]
  );

  const severityDist = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const r of reports) {
      const sev = r.severity || (r.risk_level ? r.risk_level.charAt(0) + r.risk_level.slice(1).toLowerCase() : 'Low');
      if (sev in counts) counts[sev]++;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const lsrDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reports) {
      const rule = r.life_saving_rule || 'Unknown';
      counts[rule] = (counts[rule] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const typeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reports) counts[r.report_type] = (counts[r.report_type] || 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  if (!dataset) return (
    <div className="p-6">
      <EmptyState />
    </div>
  );

  const KPIS = [
    { label: 'Total Reports', value: metrics?.total || 0, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-500/20', sub: 'All uploaded reports' },
    { label: 'SIF Potential', value: metrics?.sif || 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-600/10 border-red-500/20', sub: `${metrics?.sifPct || 0}% of total` },
    { label: 'Critical', value: metrics?.critical || 0, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-600/10 border-orange-500/20', sub: 'Highest priority' },
    { label: 'High Risk', value: metrics?.high || 0, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-600/10 border-yellow-500/20', sub: 'Requires attention' },
    { label: 'Early Warnings', value: warnings.length, icon: Activity, color: 'text-violet-400', bg: 'bg-violet-600/10 border-violet-500/20', sub: 'Active alerts' },
    { label: hasMultilingual ? 'Translated' : 'Open Actions', value: hasMultilingual ? multilingualStats.translated : 0, icon: hasMultilingual ? Languages : CheckSquare, color: hasMultilingual ? 'text-indigo-400' : 'text-green-400', bg: hasMultilingual ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-green-600/10 border-green-500/20', sub: hasMultilingual ? `${multilingualStats.kannada} KN · ${multilingualStats.hindi} HI` : 'Corrective actions' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Safety Intelligence Dashboard</h1>
          <p className="section-sub">
            {isDemo ? '⚠ Synthetic Demo Data — ' : ''}
            {metrics?.total} reports analyzed · {metrics?.sif} with SIF potential
          </p>
        </div>
        <button onClick={() => navigate('/analysis')} className="btn-primary">
          <Zap className="w-4 h-4" />
          Analyze Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPIS.map(kpi => (
          <div key={kpi.label} className={`card border ${kpi.bg}`}>
            <div className="flex items-start justify-between mb-2">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className={`text-3xl font-bold ${kpi.color} mb-0.5`}>{kpi.value}</div>
            <div className="text-xs font-semibold text-slate-300">{kpi.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Multilingual Processing Summary ─────────────────────────────── */}
      {hasMultilingual && (
        <MultilingualStatsBanner stats={multilingualStats} />
      )}

      {/* ── Language Distribution Chart (only when multilingual data present) ─ */}
      {hasMultilingual && languageChartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Language pie chart */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Languages className="w-4 h-4 text-violet-400" />
              Reports by Language
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={languageChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {languageChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Legend formatter={(val) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Language breakdown table */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Multilingual Breakdown</h3>
            <div className="space-y-3">
              {[
                { lang: 'en' as const, label: 'English',  count: multilingualStats.english,  color: 'bg-blue-500' },
                { lang: 'kn' as const, label: 'Kannada',  count: multilingualStats.kannada,  color: 'bg-orange-500' },
                { lang: 'hi' as const, label: 'Hindi',    count: multilingualStats.hindi,    color: 'bg-green-500' },
              ].map(row => (
                <div key={row.lang}>
                  <div className="flex items-center justify-between mb-1">
                    <LanguageBadge language={row.lang} size="sm" />
                    <span className="text-sm font-semibold text-white">{row.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full transition-all duration-700`}
                      style={{ width: `${multilingualStats.total > 0 ? (row.count / multilingualStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <span>Translated to English</span>
                <span className="text-violet-400 font-semibold">{multilingualStats.translated}</span>
              </div>
              {multilingualStats.translation_errors > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Translation errors (original used)</span>
                  <span className="text-red-400 font-semibold">{multilingualStats.translation_errors}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Early Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Early Warnings
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {warnings.map(w => (
              <div
                key={w.id}
                className={`card flex items-start gap-3 border cursor-pointer hover:border-opacity-70 transition-colors ${
                  w.type === 'CRITICAL' ? 'border-red-500/30 bg-red-900/5' :
                  w.type === 'WARNING' ? 'border-orange-500/30 bg-orange-900/5' :
                  'border-yellow-500/30 bg-yellow-900/5'
                }`}
                onClick={() => navigate('/risk-intelligence')}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse ${
                  w.type === 'CRITICAL' ? 'bg-red-500' : w.type === 'WARNING' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold uppercase tracking-widest ${
                      w.type === 'CRITICAL' ? 'text-red-400' : w.type === 'WARNING' ? 'text-orange-400' : 'text-yellow-400'
                    }`}>{w.type}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-white">{w.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{w.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Severity distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={severityDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {severityDist.map((entry) => (
                  <Cell key={entry.name} fill={
                    entry.name === 'Critical' ? '#ef4444' :
                    entry.name === 'High' ? '#f97316' :
                    entry.name === 'Medium' ? '#eab308' : '#22c55e'
                  } />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Report type */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Report Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                {typeDist.map((_, i) => (
                  <Cell key={i} fill={['#3b82f6','#8b5cf6','#f59e0b','#ef4444'][i % 4]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend formatter={(val) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Life-Saving Rules */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Life-Saving Rules</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={lsrDist} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top Barrier Failures */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Top Failed Safety Barriers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barrierData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis type="category" dataKey="barrier" width={160} tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Site Risk Ranking */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Site Risk Ranking</h3>
            <button onClick={() => navigate('/sites')} className="text-xs text-blue-400 hover:text-blue-300">View All →</button>
          </div>
          {siteData.length === 0 ? (
            <p className="text-slate-500 text-sm">Site data not available in uploaded dataset.</p>
          ) : (
            <div className="space-y-2">
              {siteData.map((site, i) => (
                <div key={site.site} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/sites')}>
                  <span className="text-slate-500 text-xs w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200">{site.site}</div>
                    <div className="text-xs text-slate-500">{site.total_reports} reports · {site.sif_count} SIF potential</div>
                  </div>
                  <RiskBadge level={site.risk_level} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity ranking */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">High-Risk Activity Ranking</h3>
          <button onClick={() => navigate('/sites')} className="text-xs text-blue-400 hover:text-blue-300">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">Activity</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2 px-4">Reports</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2 px-4">SIF Potential</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2 px-4">Avg Risk</th>
                <th className="text-left text-xs font-medium text-slate-500 pb-2 px-4">Top Barrier Failure</th>
                <th className="text-left text-xs font-medium text-slate-500 pb-2 pl-4">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activityData.map(act => (
                <tr key={act.activity} className="hover:bg-slate-800/50">
                  <td className="py-2 pr-4 font-medium text-slate-200">{act.activity}</td>
                  <td className="py-2 px-4 text-right text-slate-400">{act.report_count}</td>
                  <td className="py-2 px-4 text-right text-red-400 font-semibold">{act.sif_count}</td>
                  <td className="py-2 px-4 text-right text-slate-400">{act.avg_risk_score}</td>
                  <td className="py-2 px-4 text-slate-400 text-xs">{act.top_barrier_failure}</td>
                  <td className="py-2 pl-4"><RiskBadge level={act.risk_level} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDemo && (
        <div className="text-center py-4">
          <p className="text-xs text-amber-400/70">⚠ All data above is synthetic demo data. It does not represent real organizational safety incidents.</p>
        </div>
      )}

      {/* ── Multilingual Report Table ──────────────────────────────────────── */}
      {hasMultilingual && multilingualReports.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowMultilingualTable(v => !v)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Languages className="w-4 h-4 text-violet-400" />
              Multilingual Reports — Original &amp; Translated
              <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                {multilingualReports.length} reports
              </span>
            </h3>
            {showMultilingualTable
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
            }
          </button>

          {showMultilingualTable && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-500 font-medium pb-2 pr-3 whitespace-nowrap">Report ID</th>
                    <th className="text-left text-slate-500 font-medium pb-2 pr-3 whitespace-nowrap">Language</th>
                    <th className="text-left text-slate-500 font-medium pb-2 pr-3 min-w-[200px]">Original Text</th>
                    <th className="text-left text-slate-500 font-medium pb-2 pr-3 min-w-[200px]">English Translation (used for analysis)</th>
                    <th className="text-left text-slate-500 font-medium pb-2 pr-3 whitespace-nowrap">SIF Result</th>
                    <th className="text-left text-slate-500 font-medium pb-2 pr-3 whitespace-nowrap">Risk Level</th>
                    <th className="text-left text-slate-500 font-medium pb-2 whitespace-nowrap">Translation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {multilingualReports.slice(0, 20).map(r => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => navigate(`/reports/${r.id}`)}
                    >
                      <td className="py-2.5 pr-3 text-blue-400 font-mono whitespace-nowrap">{r.id}</td>
                      <td className="py-2.5 pr-3">
                        {r.detected_language && (
                          <LanguageBadge language={r.detected_language} size="sm" />
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400 max-w-xs">
                        <p className="line-clamp-2">{r.original_report_text || r.report_text}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-200 max-w-xs">
                        <p className="line-clamp-2">{r.translated_report_text || r.report_text}</p>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {r.sif_potential && <SIFBadge potential={r.sif_potential} size="sm" />}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {r.risk_level && <RiskBadge level={r.risk_level} size="sm" />}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <TranslationBadge
                          isTranslated={r.is_translated ?? false}
                          translationError={r.translation_error}
                          method={r.translation_method}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {multilingualReports.length > 20 && (
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Showing 20 of {multilingualReports.length} non-English reports.{' '}
                  <button onClick={() => navigate('/reports')} className="text-blue-400 hover:text-blue-300">
                    View all in Reports →
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
