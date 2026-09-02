import { useApp } from '../context/AppContext';
import { Shield, User, Database, Info, Trash2, Download } from 'lucide-react';
import { generateDemoReports } from '../data/demoData';

export default function SettingsPage() {
  const { user, dataset, isDemo, reports, dispatch } = useApp();

  function clearDataset() {
    if (confirm('Clear the current dataset? This will remove all loaded reports.')) {
      dispatch({ type: 'CLEAR_DATASET' });
    }
  }

  function exportReports() {
    const headers = ['id','report_type','report_text','activity','site','location','date','severity','sif_potential','risk_level','risk_score','life_saving_rule','barrier_failure','recommended_action'];
    const csv = [headers.join(','), ...reports.map(r =>
      headers.map(h => `"${String((r as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'safesense_export.csv'; a.click();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-sub">Account information, data management, and platform configuration.</p>
      </div>

      {/* User info */}
      <div className="card">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4"><User className="w-4 h-4 text-blue-400" />Account</h2>
        {user ? (
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500 text-xs block">Name</span><span className="text-slate-200">{user.name}</span></div>
            <div><span className="text-slate-500 text-xs block">Email</span><span className="text-slate-200">{user.email}</span></div>
            <div><span className="text-slate-500 text-xs block">Role</span><span className="text-slate-200">{user.role}</span></div>
            <div><span className="text-slate-500 text-xs block">Site</span><span className="text-slate-200">{user.site || 'All Sites'}</span></div>
          </div>
        ) : <p className="text-slate-400 text-sm">Not logged in.</p>}
      </div>

      {/* Dataset info */}
      <div className="card">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4"><Database className="w-4 h-4 text-blue-400" />Current Dataset</h2>
        {dataset ? (
          <div className="space-y-3">
            {isDemo && (
              <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs">
                ⚠ Synthetic Demo Data — Not Real Organizational Data
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-slate-500 text-xs block">Filename</span><span className="text-slate-200 truncate">{dataset.filename}</span></div>
              <div><span className="text-slate-500 text-xs block">Records</span><span className="text-slate-200">{dataset.rows}</span></div>
              <div><span className="text-slate-500 text-xs block">Health Score</span><span className={`font-bold ${dataset.quality.health_score >= 80 ? 'text-green-400' : dataset.quality.health_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{dataset.quality.health_score}/100</span></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={exportReports} className="btn-secondary text-sm"><Download className="w-4 h-4" />Export Reports</button>
              <button onClick={clearDataset} className="btn-danger text-sm"><Trash2 className="w-4 h-4" />Clear Dataset</button>
            </div>
          </div>
        ) : <p className="text-slate-400 text-sm">No dataset loaded.</p>}
      </div>

      {/* Model info */}
      <div className="card">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-blue-400" />AI Engine</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-slate-700/50">
            <span className="text-slate-400">Analysis Mode</span>
            <span className="text-slate-200">Prototype Rule-Based Engine</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-700/50">
            <span className="text-slate-400">Life-Saving Rule Detection</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-700/50">
            <span className="text-slate-400">Barrier Failure Detection</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-700/50">
            <span className="text-slate-400">Risk Scoring</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-700/50">
            <span className="text-slate-400">Pattern Discovery</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-400">ML Model (Transformers)</span>
            <span className="text-slate-500">Backend required</span>
          </div>
        </div>
      </div>

      {/* Important notices */}
      <div className="card border-amber-500/20 bg-amber-900/5">
        <h2 className="font-semibold text-amber-400 flex items-center gap-2 mb-3"><Info className="w-4 h-4" />Important Notices</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            Risk scores are prototype calculations. They are not certified safety metrics.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            SIF potential indicates elevated risk precursors — it does not predict that a fatality will occur.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            All final safety decisions must be made by authorized, qualified HSE personnel.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            Uploaded data is processed in-browser and not transmitted to external services.
          </li>
        </ul>
      </div>
    </div>
  );
}
