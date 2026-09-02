import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { RiskBadge } from '../components/RiskBadge';
import { computeEarlyWarnings, computeBarrierFailures } from '../utils/riskEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export default function RiskIntelligencePage() {
  const { reports, dataset } = useApp();

  const warnings = useMemo(() => computeEarlyWarnings(reports), [reports]);
  const barriers = useMemo(() => computeBarrierFailures(reports), [reports]);

  const monthlyData = useMemo(() => {
    if (!dataset?.quality.has_date) return [];
    const monthly: Record<string, { month: string; total: number; sif: number; critical: number }> = {};
    for (const r of reports) {
      if (!r.date) continue;
      const month = r.date.slice(0, 7);
      if (!monthly[month]) monthly[month] = { month, total: 0, sif: 0, critical: 0 };
      monthly[month].total++;
      if (r.sif_potential === 'YES') monthly[month].sif++;
      if (r.severity === 'Critical' || r.risk_level === 'CRITICAL') monthly[month].critical++;
    }
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }, [reports, dataset]);

  const lsrData = useMemo(() => {
    const counts: Record<string, { name: string; total: number; sif: number }> = {};
    for (const r of reports) {
      const rule = r.life_saving_rule || 'Unknown';
      if (!counts[rule]) counts[rule] = { name: rule, total: 0, sif: 0 };
      counts[rule].total++;
      if (r.sif_potential === 'YES') counts[rule].sif++;
    }
    return Object.values(counts).sort((a, b) => b.sif - a.sif).slice(0, 8);
  }, [reports]);

  if (!dataset) return <div className="p-6"><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6 animate-in">
      <div>
        <h1 className="section-title">Risk Intelligence</h1>
        <p className="section-sub">Early warnings, barrier failures, and risk trends across your safety dataset.</p>
      </div>

      {/* Early Warnings */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Early Warning Center
        </h2>
        {warnings.length === 0 ? (
          <div className="card text-slate-500 text-sm">No active warnings detected in the current dataset.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {warnings.map(w => (
              <div key={w.id} className={`card border ${
                w.type === 'CRITICAL' ? 'border-red-500/30 bg-red-900/5' :
                w.type === 'WARNING' ? 'border-orange-500/30 bg-orange-900/5' :
                'border-yellow-500/30 bg-yellow-900/5'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    w.type === 'CRITICAL' ? 'bg-red-600/20' : w.type === 'WARNING' ? 'bg-orange-600/20' : 'bg-yellow-600/20'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      w.type === 'CRITICAL' ? 'text-red-400' : w.type === 'WARNING' ? 'text-orange-400' : 'text-yellow-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-widest ${
                        w.type === 'CRITICAL' ? 'text-red-400' : w.type === 'WARNING' ? 'text-orange-400' : 'text-yellow-400'
                      }`}>{w.type}</span>
                    </div>
                    <p className="font-semibold text-white text-sm">{w.title}</p>
                    <p className="text-slate-400 text-xs mt-1">{w.description}</p>
                    {w.affected_sites.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {w.affected_sites.slice(0, 3).map(site => (
                          <span key={site} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{site}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-green-400">+{w.change_pct}%</div>
                    <div className="text-xs text-slate-500">vs prev period</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trend chart */}
      {monthlyData.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Monthly Safety Trend
          </h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Reports" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sif" stroke="#ef4444" name="SIF Potential" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="critical" stroke="#f97316" name="Critical" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <div className="card text-slate-500 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Trend analysis requires a date column. Not available in the current dataset.
        </div>
      )}

      {/* LSR breakdown */}
      <div className="grid lg:grid-cols-2 gap-5">
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Life-Saving Rule Distribution</h2>
          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lsrData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[0, 3, 3, 0]} />
                <Bar dataKey="sif" fill="#ef4444" name="SIF Potential" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Barrier Failures */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Failed Safety Barriers</h2>
          <div className="card">
            <div className="space-y-3">
              {barriers.slice(0, 8).map(b => (
                <div key={b.barrier}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate flex-1 mr-2">{b.barrier}</span>
                    <span className="text-slate-400 flex-shrink-0">{b.count} ({b.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-700"
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
