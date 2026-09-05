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
    { label: 'CRITICAL ALERTS', value: criticalCount, color: 'text-red-600', iconBg: 'bg-red-50 text-red-600', borderTop: 'border-t-4 border-t-red-500', icon: Zap },
    { label: 'SIF POTENTIAL', value: sifCount, color: 'text-orange-600', iconBg: 'bg-orange-50 text-orange-600', borderTop: 'border-t-4 border-t-orange-500', icon: AlertTriangle },
    { label: 'HIGH-RISK SITES', value: highRiskSites, color: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600', borderTop: 'border-t-4 border-t-amber-500', icon: MapPin },
    { label: 'RISING PRECURSORS', value: risingPatterns, color: 'text-purple-600', iconBg: 'bg-purple-50 text-purple-600', borderTop: 'border-t-4 border-t-purple-500', icon: GitBranch },
    { label: 'OPEN ACTIONS', value: openActions, color: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600', borderTop: 'border-t-4 border-t-indigo-600', icon: CheckSquare },
    { label: 'EARLY WARNINGS', value: warnings.length, color: 'text-rose-600', iconBg: 'bg-rose-50 text-rose-600', borderTop: 'border-t-4 border-t-rose-500', icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6 animate-in bg-[#F8FAFC]">
      <div>
        <h1 className="section-title flex items-center gap-2"><Zap className="w-6 h-6 text-amber-500" />Safety Command Center</h1>
        <p className="section-sub mb-0">Real-time safety intelligence overview — critical items requiring immediate attention.</p>
      </div>

      {/* Big number stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {COMMAND_STATS.map(stat => (
          <div key={stat.label} className={`card ${stat.borderTop} text-center py-5 hover:-translate-y-1 hover:shadow-soft-md transition-all duration-200 cursor-default`}>
            <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center mx-auto mb-2 shadow-xs`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className={`text-3xl font-extrabold ${stat.color} mb-1 tracking-tight`}>{stat.value}</div>
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Warnings panel */}
      {warnings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />Active Early Warnings
            </h2>
            <button onClick={() => navigate('/risk-intelligence')} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              Full Analysis <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {warnings.map(w => (
              <div key={w.id} className={`card border cursor-pointer hover:shadow-soft-md transition-all ${
                w.type === 'CRITICAL' ? 'border-red-200 bg-red-50/40 border-t-4 border-t-red-500' :
                w.type === 'WARNING' ? 'border-orange-200 bg-orange-50/40 border-t-4 border-t-orange-500' :
                'border-amber-200 bg-amber-50/40 border-t-4 border-t-amber-500'
              }`} onClick={() => navigate('/risk-intelligence')}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    w.type === 'CRITICAL' ? 'text-red-700' : w.type === 'WARNING' ? 'text-orange-700' : 'text-amber-700'
                  }`}>{w.type}</span>
                  <span className="text-xs text-red-600 font-bold ml-auto">+{w.change_pct}%</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{w.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{w.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* High-risk sites */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />High-Risk Sites
            </h2>
            <button onClick={() => navigate('/sites')} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="card shadow-soft space-y-2">
            {siteRisks.filter(s => s.risk_level !== 'LOW').slice(0, 5).map(site => (
              <div key={site.site} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors" onClick={() => navigate('/sites')}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{site.site}</span>
                    <RiskBadge level={site.risk_level} size="sm" />
                  </div>
                  <div className="text-xs text-slate-500">{site.total_reports} reports · <span className="text-red-600 font-semibold">{site.sif_count} SIF</span></div>
                </div>
                <div className={`text-xl font-extrabold ${
                  site.risk_score > 50 ? 'text-red-600' : site.risk_score > 35 ? 'text-orange-600' : 'text-amber-600'
                }`}>{site.risk_score}</div>
              </div>
            ))}
            {siteRisks.filter(s => s.risk_level !== 'LOW').length === 0 && (
              <p className="text-slate-500 text-sm py-2">No high-risk sites detected or site data not available.</p>
            )}
          </div>
        </section>

        {/* Failed barriers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />Top Failed Barriers
            </h2>
            <button onClick={() => navigate('/risk-intelligence')} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="card shadow-soft space-y-3">
            {barriers.slice(0, 5).map(b => (
              <div key={b.barrier}>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-800 truncate flex-1 mr-2">{b.barrier}</span>
                  <span className="text-red-600 font-bold flex-shrink-0">{b.count} reports</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full" style={{ width: `${b.percentage}%` }} />
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
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />Open Corrective Actions
            </h2>
            <button onClick={() => navigate('/actions')} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              Manage All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="card shadow-soft">
            {actions.filter(a => a.status === 'Open').length === 0 ? (
              <p className="text-slate-500 text-sm">No open corrective actions.</p>
            ) : (
              <div className="space-y-2">
                {actions.filter(a => a.status === 'Open').slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{a.action}</p>
                      <div className="text-xs text-slate-500 mt-0.5">Owner: <span className="text-slate-700 font-medium">{a.owner}</span> · Due: <span className="text-slate-700 font-medium font-mono">{a.due_date}</span></div>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${
                      a.priority === 'Critical' ? 'text-red-600' : a.priority === 'High' ? 'text-orange-600' : 'text-amber-600'
                    }`}>{a.priority} Priority</span>
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
