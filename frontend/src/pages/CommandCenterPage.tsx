import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { computeSiteRisk, computeBarrierFailures, computeEarlyWarnings, computePatterns } from '../utils/riskEngine';
import { RiskBadge } from '../components/RiskBadge';
import { Zap, AlertTriangle, MapPin, GitBranch, CheckSquare, Shield, ArrowRight } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function CommandCenterPage() {
  const { reports, dataset, actions } = useApp();
  const navigate = useNavigate();

  const siteRisks = useMemo(() => computeSiteRisk(reports), [reports]);
  const barriers = useMemo(() => computeBarrierFailures(reports), [reports]);
  const warnings = useMemo(() => computeEarlyWarnings(reports), [reports]);
  const patterns = useMemo(() => computePatterns(reports), [reports]);

  if (!dataset) return <div className="p-6"><EmptyState /></div>;

  const criticalCount = reports.filter(r => r.severity === 'Critical' || r.risk_level === 'CRITICAL').length;
  const sifCount = reports.filter(r => r.sif_potential === 'YES').length;
  const openActions = actions.filter(a => a.status === 'Open').length;
  const highRiskSites = siteRisks.filter(s => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH').length;
  const risingPatterns = patterns.filter(p => p.trend === 'increasing').length;

  const COMMAND_STATS = [
    { label: 'CRITICAL ALERTS', value: criticalCount, color: 'text-red-400', bg: 'border-red-500/30 bg-red-900/5', icon: Zap },
    { label: 'SIF POTENTIAL', value: sifCount, color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-900/5', icon: AlertTriangle },
    { label: 'HIGH-RISK SITES', value: highRiskSites, color: 'text-yellow-400', bg: 'border-yellow-500/30 bg-yellow-900/5', icon: MapPin },
    { label: 'RISING PRECURSORS', value: risingPatterns, color: 'text-violet-400', bg: 'border-violet-500/30 bg-violet-900/5', icon: GitBranch },
    { label: 'OPEN ACTIONS', value: openActions, color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-900/5', icon: CheckSquare },
    { label: 'EARLY WARNINGS', value: warnings.length, color: 'text-rose-400', bg: 'border-rose-500/30 bg-rose-900/5', icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6 animate-in">
      <div>
        <h1 className="section-title flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" />Safety Command Center</h1>
        <p className="section-sub">Real-time safety intelligence overview — critical items requiring immediate attention.</p>
      </div>

      {/* Big number stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {COMMAND_STATS.map(stat => (
          <div key={stat.label} className={`card border ${stat.bg} text-center py-5`}>
            <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
            <div className={`text-4xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Warnings panel */}
      {warnings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />Active Early Warnings
            </h2>
            <button onClick={() => navigate('/risk-intelligence')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Full Analysis <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {warnings.map(w => (
              <div key={w.id} className={`card border cursor-pointer ${
                w.type === 'CRITICAL' ? 'border-red-500/40 bg-red-900/10' :
                w.type === 'WARNING' ? 'border-orange-500/40 bg-orange-900/10' :
                'border-yellow-500/40 bg-yellow-900/10'
              }`} onClick={() => navigate('/risk-intelligence')}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    w.type === 'CRITICAL' ? 'text-red-400' : w.type === 'WARNING' ? 'text-orange-400' : 'text-yellow-400'
                  }`}>{w.type}</span>
                  <span className="text-xs text-green-400 font-semibold ml-auto">+{w.change_pct}%</span>
                </div>
                <p className="font-semibold text-white text-sm">{w.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{w.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* High-risk sites */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />High-Risk Sites
            </h2>
            <button onClick={() => navigate('/sites')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="card space-y-2">
            {siteRisks.filter(s => s.risk_level !== 'LOW').slice(0, 5).map(site => (
              <div key={site.site} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer" onClick={() => navigate('/sites')}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{site.site}</span>
                    <RiskBadge level={site.risk_level} size="sm" />
                  </div>
                  <div className="text-xs text-slate-500">{site.total_reports} reports · {site.sif_count} SIF potential</div>
                </div>
                <div className={`text-xl font-bold ${
                  site.risk_score > 50 ? 'text-red-400' : site.risk_score > 35 ? 'text-orange-400' : 'text-yellow-400'
                }`}>{site.risk_score}</div>
              </div>
            ))}
            {siteRisks.filter(s => s.risk_level !== 'LOW').length === 0 && (
              <p className="text-slate-500 text-sm">No high-risk sites detected or site data not available.</p>
            )}
          </div>
        </section>

        {/* Failed barriers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />Top Failed Barriers
            </h2>
            <button onClick={() => navigate('/risk-intelligence')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="card space-y-3">
            {barriers.slice(0, 5).map(b => (
              <div key={b.barrier}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 truncate flex-1 mr-2">{b.barrier}</span>
                  <span className="text-red-400 font-semibold flex-shrink-0">{b.count}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${b.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Open actions */}
      {actions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-green-400" />Open Corrective Actions
            </h2>
            <button onClick={() => navigate('/actions')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Manage All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="card">
            {actions.filter(a => a.status === 'Open').length === 0 ? (
              <p className="text-slate-500 text-sm">No open corrective actions.</p>
            ) : (
              <div className="space-y-2">
                {actions.filter(a => a.status === 'Open').slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{a.action}</p>
                      <div className="text-xs text-slate-500 mt-0.5">Owner: {a.owner} · Due: {a.due_date}</div>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${
                      a.priority === 'Critical' ? 'text-red-400' : a.priority === 'High' ? 'text-orange-400' : 'text-yellow-400'
                    }`}>{a.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
