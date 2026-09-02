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
    <div className="p-6 space-y-6 animate-in">
      <div>
        <h1 className="section-title">Sites & Activities</h1>
        <p className="section-sub">Risk ranking by site and activity based on uploaded dataset.</p>
      </div>

      {/* Sites */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" /> Site Risk Ranking
        </h2>
        {noSiteData ? (
          <div className="card text-slate-500 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Site-level analysis is unavailable because the uploaded dataset does not contain a site/location field.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {siteRisks.map((site, i) => (
                <div key={site.site} className="card flex items-center gap-4">
                  <div className="text-2xl font-bold text-slate-600 w-7 flex-shrink-0 text-center">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{site.site}</span>
                      <RiskBadge level={site.risk_level} size="sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                      <span>{site.total_reports} reports</span>
                      <span className="text-red-400">{site.sif_count} SIF</span>
                      <span>{site.critical_count} critical</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      Top precursor: {site.top_precursor} · Top failure: {site.top_barrier_failure}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xl font-bold ${
                      site.risk_score > 50 ? 'text-red-400' : site.risk_score > 35 ? 'text-orange-400' : site.risk_score > 15 ? 'text-yellow-400' : 'text-green-400'
                    }`}>{site.risk_score}</div>
                    <div className="text-xs text-slate-500">score</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">SIF Potential by Site</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={siteRisks.slice(0, 6)} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="site" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                  <Bar dataKey="sif_count" fill="#ef4444" name="SIF Potential" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_reports" fill="#3b82f6" name="Total Reports" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* Activities */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" /> Activity Risk Ranking
        </h2>
        {noActivityData ? (
          <div className="card text-slate-500 text-sm">Activity data not available in the current dataset.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">#</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">Activity</th>
                  <th className="text-right text-xs font-medium text-slate-500 pb-2 px-4">Reports</th>
                  <th className="text-right text-xs font-medium text-slate-500 pb-2 px-4">SIF Potential</th>
                  <th className="text-right text-xs font-medium text-slate-500 pb-2 px-4">Avg Risk</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2 px-4">Top Barrier Failure</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2 pl-4">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activityRisks.map((act, i) => (
                  <tr key={act.activity} className="hover:bg-slate-800/50">
                    <td className="py-2 pr-4 text-slate-500">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium text-slate-200">{act.activity}</td>
                    <td className="py-2 px-4 text-right text-slate-400">{act.report_count}</td>
                    <td className="py-2 px-4 text-right text-red-400 font-semibold">{act.sif_count}</td>
                    <td className="py-2 px-4 text-right text-slate-400">{act.avg_risk_score}</td>
                    <td className="py-2 px-4 text-slate-400 text-xs max-w-xs truncate">{act.top_barrier_failure}</td>
                    <td className="py-2 pl-4"><RiskBadge level={act.risk_level} size="sm" /></td>
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
