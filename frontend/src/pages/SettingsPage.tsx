import { useApp } from '../context/AppContext';
import { Shield, User, Database, Info, Trash2, Download } from 'lucide-react';

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
      headers.map(h => `"${String((r as unknown as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'safesense_export.csv'; a.click();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in bg-[#F8FAFC]">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-sub mb-0">Account information, data management, and platform configuration.</p>
      </div>

      {/* User info */}
      <div className="card shadow-soft">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-4"><User className="w-4 h-4 text-indigo-600" />Account Profile</h2>
        {user ? (
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Name</span>
              <span className="text-slate-900 font-bold">{user.name}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Email</span>
              <span className="text-slate-900 font-semibold">{user.email}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Role</span>
              <span className="text-indigo-600 font-bold">{user.role}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Site Assignment</span>
              <span className="text-slate-900 font-semibold">{user.site || 'Enterprise / All Sites'}</span>
            </div>
          </div>
        ) : <p className="text-slate-500 text-sm">Not logged in.</p>}
      </div>

      {/* Dataset info */}
      <div className="card shadow-soft">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-4"><Database className="w-4 h-4 text-indigo-600" />Active Dataset</h2>
        {dataset ? (
          <div className="space-y-4">
            {isDemo && (
              <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs font-medium">
                ⚠ Synthetic Demo Data Active — Not Real Organizational Data
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Filename</span>
                <span className="text-slate-900 font-bold truncate block">{dataset.filename}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Total Records</span>
                <span className="text-slate-900 font-bold">{dataset.rows} reports</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Quality Health</span>
                <span className={`font-extrabold ${dataset.quality.health_score >= 80 ? 'text-emerald-600' : dataset.quality.health_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{dataset.quality.health_score}/100</span>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button onClick={exportReports} className="btn-secondary text-sm"><Download className="w-4 h-4 text-indigo-600" />Export Reports CSV</button>
              <button onClick={clearDataset} className="btn-danger text-sm"><Trash2 className="w-4 h-4" />Clear Dataset</button>
            </div>
          </div>
        ) : <p className="text-slate-500 text-sm">No dataset loaded.</p>}
      </div>

      {/* Model info */}
      <div className="card shadow-soft">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-indigo-600" />AI Intelligence Engine</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">NLP Analysis Engine</span>
            <span className="text-slate-900 font-semibold">Heuristic Rule-Based NLP + SIF Precursor Detection</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">Life-Saving Rule Detection</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">✓ Active</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">Barrier Failure Detection</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">✓ Active</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">Multilingual Processing (EN/KN/HI)</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">✓ Active</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">Dynamic Pattern Discovery</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">✓ Active</span>
          </div>
          <div className="flex justify-between py-2 font-medium">
            <span className="text-slate-600">Deep Learning (FastAPI Backend)</span>
            <span className="text-indigo-600 font-semibold">Available on port 8000</span>
          </div>
        </div>
      </div>

      {/* Important notices */}
      <div className="card border-amber-200 bg-amber-50/50 shadow-soft">
        <h2 className="font-bold text-amber-900 flex items-center gap-2 mb-3"><Info className="w-4 h-4 text-amber-600" />Important Safety Notices</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold flex-shrink-0">•</span>
            Risk scores are prototype calculations designed to surface elevated risk precursors; they are not certified safety metrics.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold flex-shrink-0">•</span>
            SIF potential indicates precursor presence — it does not predict that a fatality will occur.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold flex-shrink-0">•</span>
            All final safety decisions must be made by authorized, qualified HSE personnel.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold flex-shrink-0">•</span>
            Uploaded datasets are processed safely in-memory.
          </li>
        </ul>
      </div>
    </div>
  );
}
