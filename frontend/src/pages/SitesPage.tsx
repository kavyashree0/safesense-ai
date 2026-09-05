import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { RiskBadge } from '../components/RiskBadge';
import { computeSiteRisk, computeActivityRisk } from '../utils/riskEngine';
import { MapPin, Activity, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SitesPage() {
  const { reports, dataset } = useApp();
  const siteRisks = useMemo(() => computeSiteRisk(reports), [reports]);
  const activityRisks = useMemo(() => computeActivityRisk(reports), [reports]);

  if (!dataset) return <div className="p-6"><EmptyState /></div>;

  const noSiteData = siteRisks.length === 0 || (siteRisks.length === 1 && siteRisks[0].site === 'Unknown');
  const noActivityData = activityRisks.length === 0 || (activityRisks.length === 1 && activityRisks[0].activity === 'Unknown');

  return (
    <div className="p-6 space-y-6 animate-in bg-[#F8FAFC]">
      <div>
        <h1 className="section-title">Sites & Activities</h1>
        <p className="section-sub mb-0">Risk ranking by site and activity based on the uploaded dataset.</p>
      </div>

      {/* Sites */}
      <section>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" /> Site Risk Ranking
        </h2>
        {noSiteData ? (
          <div className="card text-slate-600 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Site-level analysis is unavailable because the uploaded dataset does not contain a site/location field.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {siteRisks.map((site, i) => (
                <div key={site.site} className="card card-hover flex items-center gap-4">
                  <div className="text-xl font-bold text-slate-400 w-8 flex-shrink-0 text-center bg-slate-50 py-1.5 rounded-lg border border-slate-100">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{site.site}</span>
                      <RiskBadge level={site.risk_level} size="sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                      <span>{site.total_reports} reports</span>
                      <span className="text-red-600 font-semibold">{site.sif_count} SIF</span>
                      <span>{site.critical_count} critical</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      Top precursor: <span className="text-slate-600 font-medium">{site.top_precursor}</span> · Barrier: <span className="text-slate-600 font-medium">{site.top_barrier_failure}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-extrabold ${
                      site.risk_score > 50 ? 'text-red-600' : site.risk_score > 35 ? 'text-orange-600' : site.risk_score > 15 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{site.risk_score}</div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">score</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card shadow-soft">
              <h3 className="text-sm font-bold text-slate-900 mb-4">SIF Potential by Site</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={siteRisks.slice(0, 6)} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="site" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="sif_count" fill="#EF4444" name="SIF Potential" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total_reports" fill="#4F46E5" name="Total Reports" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* Activities */}
      <section>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" /> Activity Risk Ranking
        </h2>
        {noActivityData ? (
          <div className="card text-slate-500 text-sm">Activity data not available in the current dataset.</div>
        ) : (
          <div className="card shadow-soft overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-bold text-slate-600 py-3 pl-3 pr-4 uppercase tracking-wider">#</th>
                  <th className="text-left text-xs font-bold text-slate-600 py-3 pr-4 uppercase tracking-wider">Activity</th>
                  <th className="text-right text-xs font-bold text-slate-600 py-3 px-4 uppercase tracking-wider">Reports</th>
                  <th className="text-right text-xs font-bold text-slate-600 py-3 px-4 uppercase tracking-wider">SIF Potential</th>
                  <th className="text-right text-xs font-bold text-slate-600 py-3 px-4 uppercase tracking-wider">Avg Risk</th>
                  <th className="text-left text-xs font-bold text-slate-600 py-3 px-4 uppercase tracking-wider">Top Barrier Failure</th>
                  <th className="text-left text-xs font-bold text-slate-600 py-3 pl-4 pr-3 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityRisks.map((act, i) => (
                  <tr key={act.activity} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-3 pr-4 text-slate-400 font-bold">{i + 1}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-800">{act.activity}</td>
                    <td className="py-3 px-4 text-right text-slate-600 font-medium">{act.report_count}</td>
                    <td className="py-3 px-4 text-right text-red-600 font-bold">{act.sif_count}</td>
                    <td className="py-3 px-4 text-right text-slate-800 font-semibold">{act.avg_risk_score}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs font-medium max-w-xs truncate">{act.top_barrier_failure}</td>
                    <td className="py-3 pl-4 pr-3"><RiskBadge level={act.risk_level} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
