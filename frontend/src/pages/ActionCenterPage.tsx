import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, Plus, Clock, AlertTriangle, CheckCircle, X, Calendar, User } from 'lucide-react';
import { CorrectiveAction } from '../types';

const STATUS_COLORS = {
  'Open': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'In Progress': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Completed': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Overdue': 'text-red-400 bg-red-500/10 border-red-500/20',
};
const PRIORITY_COLORS = {
  'Critical': 'text-red-400',
  'High': 'text-orange-400',
  'Medium': 'text-yellow-400',
  'Low': 'text-green-400',
};

function ActionModal({ onClose, onSave }: { onClose: () => void; onSave: (a: Omit<CorrectiveAction, 'id' | 'created_at'>) => void }) {
  const [form, setForm] = useState({
    action: '',
    owner: '',
    priority: 'High' as CorrectiveAction['priority'],
    due_date: '',
    status: 'Open' as CorrectiveAction['status'],
    report_id: '',
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.action || !form.owner || !form.due_date) return;
    onSave(form);
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md border-slate-600">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">New Corrective Action</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Action Description *</label>
            <textarea value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} className="input-field text-sm min-h-[80px] resize-none" placeholder="Describe the corrective action..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Owner *</label>
              <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} className="input-field text-sm" placeholder="Name or team" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as CorrectiveAction['priority'] }))} className="input-field text-sm">
                {['Critical','High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Due Date *</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input-field text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CorrectiveAction['status'] }))} className="input-field text-sm">
                {['Open','In Progress','Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Related Report ID (optional)</label>
            <input value={form.report_id} onChange={e => setForm(f => ({ ...f, report_id: e.target.value }))} className="input-field text-sm" placeholder="e.g. RPT-0042" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Save Action</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ActionCenterPage() {
  const { actions, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [updateId, setUpdateId] = useState<string | null>(null);

  const filtered = filter === 'All' ? actions : actions.filter(a => a.status === filter);

  function saveAction(data: Omit<CorrectiveAction, 'id' | 'created_at'>) {
    const action: CorrectiveAction = {
      ...data,
      id: `ACT-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ACTION', payload: action });
    setShowModal(false);
  }

  function updateStatus(id: string, status: CorrectiveAction['status']) {
    const action = actions.find(a => a.id === id);
    if (action) dispatch({ type: 'UPDATE_ACTION', payload: { ...action, status } });
  }

  const stats = {
    open: actions.filter(a => a.status === 'Open').length,
    inProgress: actions.filter(a => a.status === 'In Progress').length,
    completed: actions.filter(a => a.status === 'Completed').length,
    overdue: actions.filter(a => a.status === 'Overdue').length,
  };

  return (
    <div className="p-6 space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Action Center</h1>
          <p className="section-sub">Track and manage corrective actions from safety report findings.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Action
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, color: 'text-blue-400', icon: CheckSquare },
          { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-400', icon: Clock },
          { label: 'Completed', value: stats.completed, color: 'text-green-400', icon: CheckCircle },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400', icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All','Open','In Progress','Completed','Overdue'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Actions list */}
      {filtered.length === 0 ? (
        <div className="card text-slate-400 text-sm text-center py-12">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p>{filter === 'All' ? 'No corrective actions created yet.' : `No ${filter} actions.`}</p>
          {filter === 'All' && <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-3 text-sm"><Plus className="w-4 h-4" />Create First Action</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(action => (
            <div key={action.id} className="card hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="text-xs font-mono text-slate-500 flex-shrink-0">{action.id}</span>
                    <span className={`text-xs font-bold border px-2 py-0.5 rounded-full ${STATUS_COLORS[action.status]}`}>{action.status}</span>
                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[action.priority]}`}>{action.priority}</span>
                  </div>
                  <p className="text-sm text-slate-200 mb-2">{action.action}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{action.owner}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {action.due_date}</span>
                    {action.report_id && <span>Report: {action.report_id}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={action.status}
                    onChange={e => updateStatus(action.id, e.target.value as CorrectiveAction['status'])}
                    className="text-xs bg-slate-700 border border-slate-600 text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    {['Open','In Progress','Completed','Overdue'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ActionModal onClose={() => setShowModal(false)} onSave={saveAction} />}
    </div>
  );
}
