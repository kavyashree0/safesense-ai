import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { RiskBadge, SIFBadge } from '../components/RiskBadge';
import { LanguageBadge, TranslationBadge, MultilingualStatsBanner } from '../components/MultilingualBadge';
import { computeBarrierFailures, computeSiteRisk, computeActivityRisk, computeEarlyWarnings } from '../utils/riskEngine';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { AlertTriangle, TrendingUp, Shield, CheckSquare, Activity, Zap, ArrowUpRight, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

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
      { name: 'English', value: multilingualStats.english,  fill: '#4F46E5' },
      { name: 'Kannada', value: multilingualStats.kannada,  fill: '#F97316' },
      { name: 'Hindi',   value: multilingualStats.hindi,    fill: '#22C55E' },
      ...(multilingualStats.unknown > 0
        ? [{ name: 'Unknown', value: multilingualStats.unknown, fill: '#94A3B8' }]
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
    { label: 'Total Reports', value: metrics?.total || 0, icon: Shield, color: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600', borderTop: 'border-t-4 border-t-indigo-600', sub: 'All uploaded reports' },
    { label: 'SIF Potential', value: metrics?.sif || 0, icon: AlertTriangle, color: 'text-red-600', iconBg: 'bg-red-50 text-red-600', borderTop: 'border-t-4 border-t-red-500', sub: `${metrics?.sifPct || 0}% of dataset` },
    { label: 'Critical Risk', value: metrics?.critical || 0, icon: Zap, color: 'text-orange-600', iconBg: 'bg-orange-50 text-orange-600', borderTop: 'border-t-4 border-t-orange-500', sub: 'Highest severity' },
    { label: 'High Risk', value: metrics?.high || 0, icon: TrendingUp, color: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600', borderTop: 'border-t-4 border-t-amber-500', sub: 'Requires mitigation' },
    { label: 'Early Warnings', value: warnings.length, icon: Activity, color: 'text-purple-600', iconBg: 'bg-purple-50 text-purple-600', borderTop: 'border-t-4 border-t-purple-500', sub: 'Active precursor flags' },
    { label: hasMultilingual ? 'Translated' : 'Open Actions', value: hasMultilingual ? multilingualStats.translated : 0, icon: hasMultilingual ? Languages : CheckSquare, color: hasMultilingual ? 'text-cyan-600' : 'text-emerald-600', iconBg: hasMultilingual ? 'bg-cyan-50 text-cyan-600' : 'bg-emerald-50 text-emerald-600', borderTop: hasMultilingual ? 'border-t-4 border-t-cyan-500' : 'border-t-4 border-t-emerald-500', sub: hasMultilingual ? `${multilingualStats.kannada} KN · ${multilingualStats.hindi} HI` : 'Action items' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Safety Intelligence Dashboard</h1>
          <p className="section-sub mb-0">
            {isDemo ? '⚠ Synthetic Demo Data — ' : ''}
            {metrics?.total} reports analyzed · {metrics?.sif} with SIF potential
          </p>
        </div>
        <button onClick={() => navigate('/analysis')} className="btn-primary self-start sm:self-auto">
          <Zap className="w-4 h-4" />
          Analyze Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPIS.map(kpi => (
          <div key={kpi.label} className={`card ${kpi.borderTop} hover:-translate-y-1 hover:shadow-soft-md transition-all duration-200 cursor-default`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl ${kpi.iconBg} flex items-center justify-center shadow-xs`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-3xl font-bold ${kpi.color} mb-0.5 tracking-tight`}>{kpi.value}</div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">{kpi.label}</div>
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
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-600" />
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
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Language breakdown table */}
          <div className="card">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Multilingual Breakdown</h3>
            <div className="space-y-3">
              {[
                { lang: 'en' as const, label: 'English',  count: multilingualStats.english,  color: 'bg-indigo-600' },
                { lang: 'kn' as const, label: 'Kannada',  count: multilingualStats.kannada,  color: 'bg-orange-500' },
                { lang: 'hi' as const, label: 'Hindi',    count: multilingualStats.hindi,    color: 'bg-emerald-500' },
              ].map(row => (
                <div key={row.lang}>
                  <div className="flex items-center justify-between mb-1.5">
                    <LanguageBadge language={row.lang} size="sm" />
                    <span className="text-sm font-bold text-slate-800">{row.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full transition-all duration-700`}
                      style={{ width: `${multilingualStats.total > 0 ? (row.count / multilingualStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Translated to English</span>
                <span className="text-purple-600 font-bold">{multilingualStats.translated}</span>
              </div>
              {multilingualStats.translation_errors > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Translation errors (original used)</span>
                  <span className="text-red-600 font-bold">{multilingualStats.translation_errors}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Early Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Early Warnings
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {warnings.map(w => (
              <div
                key={w.id}
                className={`card flex items-start gap-3.5 border cursor-pointer hover:shadow-soft-md transition-all ${
                  w.type === 'CRITICAL' ? 'border-red-200 bg-red-50/40' :
                  w.type === 'WARNING' ? 'border-orange-200 bg-orange-50/40' :
                  'border-amber-200 bg-amber-50/40'
                }`}
                onClick={() => navigate('/risk-intelligence')}
              >
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 animate-pulse ${
                  w.type === 'CRITICAL' ? 'bg-red-500' : w.type === 'WARNING' ? 'bg-orange-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      w.type === 'CRITICAL' ? 'text-red-700' : w.type === 'WARNING' ? 'text-orange-700' : 'text-amber-700'
                    }`}>{w.type}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">{w.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{w.description}</p>
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
          <h3 className="text-sm font-bold text-slate-900 mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={severityDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {severityDist.map((entry) => (
                  <Cell key={entry.name} fill={
                    entry.name === 'Critical' ? '#EF4444' :
                    entry.name === 'High' ? '#F97316' :
                    entry.name === 'Medium' ? '#F59E0B' : '#22C55E'
                  } />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Report type */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Report Types</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={typeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                {typeDist.map((_, i) => (
                  <Cell key={i} fill={['#4F46E5','#06B6D4','#F59E0B','#EF4444'][i % 4]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Life-Saving Rules */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Life-Saving Rules</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={lsrDist} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#4F46E5" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top Barrier Failures */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Top Failed Safety Barriers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barrierData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
              <YAxis type="category" dataKey="barrier" width={160} tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#EF4444" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Site Risk Ranking */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Site Risk Ranking</h3>
            <button onClick={() => navigate('/sites')} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">View All →</button>
          </div>
          {siteData.length === 0 ? (
            <p className="text-slate-500 text-sm">Site data not available in uploaded dataset.</p>
          ) : (
            <div className="space-y-2">
              {siteData.map((site, i) => (
                <div key={site.site} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all" onClick={() => navigate('/sites')}>
                  <span className="text-slate-400 font-bold text-xs w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">{site.site}</div>
                    <div className="text-xs text-slate-500">{site.total_reports} reports · <span className="text-red-600 font-semibold">{site.sif_count} SIF</span></div>
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
          <h3 className="text-sm font-bold text-slate-900">High-Risk Activity Ranking</h3>
          <button onClick={() => navigate('/sites')} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="text-left text-xs font-bold text-slate-600 py-2.5 pl-3 pr-4 uppercase tracking-wider">Activity</th>
                <th className="text-right text-xs font-bold text-slate-600 py-2.5 px-4 uppercase tracking-wider">Reports</th>
                <th className="text-right text-xs font-bold text-slate-600 py-2.5 px-4 uppercase tracking-wider">SIF Potential</th>
                <th className="text-right text-xs font-bold text-slate-600 py-2.5 px-4 uppercase tracking-wider">Avg Risk</th>
                <th className="text-left text-xs font-bold text-slate-600 py-2.5 px-4 uppercase tracking-wider">Top Barrier Failure</th>
                <th className="text-left text-xs font-bold text-slate-600 py-2.5 pl-4 pr-3 uppercase tracking-wider">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activityData.map(act => (
                <tr key={act.activity} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-3 pr-4 font-semibold text-slate-800">{act.activity}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{act.report_count}</td>
                  <td className="py-3 px-4 text-right text-red-600 font-bold">{act.sif_count}</td>
                  <td className="py-3 px-4 text-right text-slate-700 font-medium">{act.avg_risk_score}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs font-medium">{act.top_barrier_failure}</td>
                  <td className="py-3 pl-4 pr-3"><RiskBadge level={act.risk_level} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDemo && (
        <div className="text-center py-4">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full inline-block px-4 py-1 font-medium">
            ⚠ All data above is synthetic demo data. It does not represent real organizational safety incidents.
          </p>
        </div>
      )}

      {/* ── Multilingual Report Table ──────────────────────────────────────── */}
      {hasMultilingual && multilingualReports.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowMultilingualTable(v => !v)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-600" />
              Multilingual Reports — Original &amp; Translated
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold">
                {multilingualReports.length} reports
              </span>
            </h3>
            {showMultilingualTable
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />
            }
          </button>

          {showMultilingualTable && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-slate-600 font-bold py-2.5 px-3 whitespace-nowrap">Report ID</th>
                    <th className="text-left text-slate-600 font-bold py-2.5 px-3 whitespace-nowrap">Language</th>
                    <th className="text-left text-slate-600 font-bold py-2.5 px-3 min-w-[200px]">Original Text</th>
                    <th className="text-left text-slate-600 font-bold py-2.5 px-3 min-w-[200px]">English Translation</th>
                    <th className="text-left text-slate-600 font-bold py-2.5 px-3 whitespace-nowrap">SIF Result</th>
                    <th className="text-left text-slate-600 font-bold py-2.5 px-3 whitespace-nowrap">Risk Level</th>
                    <th className="text-left text-slate-600 font-bold py-2.5 px-3 whitespace-nowrap">Translation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {multilingualReports.slice(0, 20).map(r => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      onClick={() => navigate(`/reports/${r.id}`)}
                    >
                      <td className="py-2.5 px-3 text-indigo-600 font-mono font-semibold whitespace-nowrap">{r.id}</td>
                      <td className="py-2.5 px-3">
                        {r.detected_language && (
                          <LanguageBadge language={r.detected_language} size="sm" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                        <p className="line-clamp-2">{r.original_report_text || r.report_text}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 max-w-xs font-medium">
                        <p className="line-clamp-2">{r.translated_report_text || r.report_text}</p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.sif_potential && <SIFBadge potential={r.sif_potential} size="sm" />}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.risk_level && <RiskBadge level={r.risk_level} size="sm" />}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
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
                  <button onClick={() => navigate('/reports')} className="text-indigo-600 hover:text-indigo-700 font-semibold">
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
