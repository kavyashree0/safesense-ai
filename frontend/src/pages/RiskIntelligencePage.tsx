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
    <div className="p-6 space-y-6 animate-in bg-[#F8FAFC]">
      <div>
        <h1 className="section-title">Risk Intelligence</h1>
        <p className="section-sub mb-0">Early warnings, barrier failures, and risk trends across your safety dataset.</p>
      </div>

      {/* Early Warnings */}
      <section>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> Early Warning Center
        </h2>
        {warnings.length === 0 ? (
          <div className="card text-slate-500 text-sm">No active warnings detected in the current dataset.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {warnings.map(w => (
              <div key={w.id} className={`card border hover:shadow-soft-md transition-all ${
                w.type === 'CRITICAL' ? 'border-red-200 bg-red-50/40 border-t-4 border-t-red-500' :
                w.type === 'WARNING' ? 'border-orange-200 bg-orange-50/40 border-t-4 border-t-orange-500' :
                'border-amber-200 bg-amber-50/40 border-t-4 border-t-amber-500'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                    w.type === 'CRITICAL' ? 'bg-red-100 text-red-600' : w.type === 'WARNING' ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        w.type === 'CRITICAL' ? 'text-red-700' : w.type === 'WARNING' ? 'text-orange-700' : 'text-amber-700'
                      }`}>{w.type}</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{w.title}</p>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">{w.description}</p>
                    {w.affected_sites.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {w.affected_sites.slice(0, 3).map(site => (
                          <span key={site} className="text-xs bg-white text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">{site}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-red-600">+{w.change_pct}%</div>
                    <div className="text-[11px] text-slate-400 font-medium">vs prev period</div>
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
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Monthly Safety Trend
          </h2>
          <div className="card shadow-soft">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#4F46E5" name="Total Reports" strokeWidth={2.5} dot={{ r: 4, fill: '#4F46E5' }} />
                <Line type="monotone" dataKey="sif" stroke="#EF4444" name="SIF Potential" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444' }} />
                <Line type="monotone" dataKey="critical" stroke="#F97316" name="Critical Risk" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <div className="card text-slate-500 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          Trend analysis requires a date column. Not available in the current dataset.
        </div>
      )}

      {/* LSR breakdown */}
      <div className="grid lg:grid-cols-2 gap-5">
        <section>
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Life-Saving Rule Distribution</h2>
          <div className="card shadow-soft">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lsrData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#475569', fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#4F46E5" name="Total" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sif" fill="#EF4444" name="SIF Potential" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Barrier Failures */}
        <section>
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Failed Safety Barriers</h2>
          <div className="card shadow-soft">
            <div className="space-y-3">
              {barriers.slice(0, 8).map(b => (
                <div key={b.barrier}>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-800 truncate flex-1 mr-2">{b.barrier}</span>
                    <span className="text-slate-500 flex-shrink-0 font-semibold">{b.count} ({b.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-700"
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
