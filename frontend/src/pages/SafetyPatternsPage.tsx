import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { RiskBadge } from '../components/RiskBadge';
import { computePatterns } from '../utils/riskEngine';
import { GitBranch, TrendingUp, MapPin, Activity } from 'lucide-react';

export default function SafetyPatternsPage() {
  const { reports, dataset } = useApp();
  const patterns = useMemo(() => computePatterns(reports), [reports]);

  if (!dataset) return <div className="p-6"><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6 animate-in">
      <div>
        <h1 className="section-title">Safety Patterns</h1>
        <p className="section-sub">Recurring safety failure patterns discovered across the uploaded dataset using rule-based clustering.</p>
      </div>

      {patterns.length === 0 ? (
        <div className="card text-slate-400 text-sm">
          No significant recurring patterns detected. This may indicate low report volume or high variation in report types.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {patterns.map(pattern => (
            <div key={pattern.id} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <h3 className="font-semibold text-white text-sm">{pattern.name}</h3>
                </div>
                <RiskBadge level={pattern.risk_level} size="sm" />
              </div>
              <p className="text-slate-400 text-xs mb-3">{pattern.description}</p>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-slate-800 rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{pattern.frequency}</div>
                  <div className="text-xs text-slate-500">Reports</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2">
                  <div className="text-lg font-bold text-blue-400">{pattern.sites.length}</div>
                  <div className="text-xs text-slate-500">Sites</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2">
                  <div className={`text-lg font-bold ${pattern.trend === 'increasing' ? 'text-red-400' : pattern.trend === 'stable' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {pattern.trend === 'increasing' ? '↑' : pattern.trend === 'stable' ? '→' : '↓'}
                  </div>
                  <div className="text-xs text-slate-500">Trend</div>
                </div>
              </div>
              {pattern.sites.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  {pattern.sites.slice(0, 3).map(site => (
                    <span key={site} className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded">{site}</span>
                  ))}
                  {pattern.sites.length > 3 && <span className="text-xs text-slate-500">+{pattern.sites.length - 3} more</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
