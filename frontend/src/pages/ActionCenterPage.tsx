import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, Plus, Clock, AlertTriangle, CheckCircle, X, Calendar, User } from 'lucide-react';
import { CorrectiveAction } from '../types';

const STATUS_COLORS = {
  'Open': 'text-indigo-700 bg-indigo-50 border-indigo-200',
  'In Progress': 'text-amber-700 bg-amber-50 border-amber-200',
  'Completed': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Overdue': 'text-red-700 bg-red-50 border-red-200',
};
const PRIORITY_COLORS = {
  'Critical': 'text-red-600',
  'High': 'text-orange-600',
  'Medium': 'text-amber-600',
  'Low': 'text-emerald-600',
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in">
      <div className="card w-full max-w-md shadow-soft-lg border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 text-lg">New Corrective Action</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Action Description *</label>
            <textarea
              value={form.action}
              onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
              className="input-field text-sm min-h-[90px] resize-none"
              placeholder="Describe the preventive or corrective action..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Owner *</label>
              <input
                value={form.owner}
                onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                className="input-field text-sm"
                placeholder="Name or team"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as CorrectiveAction['priority'] }))}
                className="input-field text-sm"
              >
                {['Critical','High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Due Date *</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="input-field text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as CorrectiveAction['status'] }))}
                className="input-field text-sm"
              >
                {['Open','In Progress','Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Related Report ID (optional)</label>
            <input
              value={form.report_id}
              onChange={e => setForm(f => ({ ...f, report_id: e.target.value }))}
              className="input-field text-sm"
              placeholder="e.g. RPT-0042"
            />
          </div>
          <div className="flex gap-2.5 pt-3">
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

  const filtered = filter === 'All' ? actions : actions.filter(a => a.status === filter);

  function saveAction(data: Omit<CorrectiveAction, 'id' | 'created_at'>) {
    const action: CorrectiveAction = {
      ...data,
      id: `ACT-${Date.now().toString().slice(-4)}`,
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
    <div className="p-6 space-y-6 animate-in bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Action Center</h1>
          <p className="section-sub mb-0">Track and manage corrective actions from safety report findings.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          New Action
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, color: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600', borderTop: 'border-t-4 border-t-indigo-600', icon: CheckSquare },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600', borderTop: 'border-t-4 border-t-amber-500', icon: Clock },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600', borderTop: 'border-t-4 border-t-emerald-500', icon: CheckCircle },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-600', iconBg: 'bg-red-50 text-red-600', borderTop: 'border-t-4 border-t-red-500', icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className={`card ${s.borderTop} text-center hover:-translate-y-1 transition-all duration-200 cursor-default`}>
            <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center mx-auto mb-2 shadow-xs`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className={`text-3xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex-wrap gap-1">
        {['All','Open','In Progress','Completed','Overdue'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === f ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Actions list */}
      {filtered.length === 0 ? (
        <div className="card text-slate-500 text-sm text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3 shadow-xs">
            <CheckSquare className="w-7 h-7" />
          </div>
          <p className="font-bold text-slate-800 text-base">{filter === 'All' ? 'No corrective actions created yet.' : `No ${filter} actions.`}</p>
          <p className="text-slate-500 text-xs mt-1">Assign corrective actions to teams to drive preventive safety execution.</p>
          {filter === 'All' && <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4 text-sm"><Plus className="w-4 h-4" />Create First Action</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(action => (
            <div key={action.id} className="card card-hover">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">{action.id}</span>
                    <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${STATUS_COLORS[action.status]}`}>{action.status}</span>
                    <span className={`text-xs font-bold ${PRIORITY_COLORS[action.priority]}`}>{action.priority} Priority</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-2 leading-relaxed">{action.action}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /><strong className="text-slate-700">Owner:</strong> {action.owner}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /><strong className="text-slate-700">Due:</strong> {action.due_date}</span>
                    {action.report_id && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">Report: {action.report_id}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0 self-start sm:self-center">
                  <select
                    value={action.status}
                    onChange={e => updateStatus(action.id, e.target.value as CorrectiveAction['status'])}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs hover:bg-slate-100 transition-colors"
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
