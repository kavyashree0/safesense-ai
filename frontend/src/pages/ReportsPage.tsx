import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { RiskBadge, SIFBadge } from '../components/RiskBadge';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, ExternalLink, Download } from 'lucide-react';

const PAGE_SIZE = 20;

export default function ReportsPage() {
  const { reports, dataset } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSIF, setFilterSIF] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const types = useMemo(() => [...new Set(reports.map(r => r.report_type).filter(Boolean))], [reports]);

  const filtered = useMemo(() => {
    let r = reports;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(rep =>
        rep.report_text?.toLowerCase().includes(s) ||
        rep.id?.toLowerCase().includes(s) ||
        rep.activity?.toLowerCase().includes(s) ||
        rep.site?.toLowerCase().includes(s) ||
        rep.life_saving_rule?.toLowerCase().includes(s)
      );
    }
    if (filterType) r = r.filter(rep => rep.report_type === filterType);
    if (filterSIF) r = r.filter(rep => rep.sif_potential === filterSIF);
    if (filterSeverity) r = r.filter(rep => rep.severity === filterSeverity);
    return r;
  }, [reports, search, filterType, filterSIF, filterSeverity]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortCol] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sortCol] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortCol, sortDir]);

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function exportCSV() {
    const headers = ['id','report_type','report_text','activity','site','location','date','severity','sif_potential','life_saving_rule','barrier_failure'];
    const csv = [headers.join(','), ...sorted.map(r =>
      headers.map(h => `"${String((r as unknown as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'safety_reports_export.csv'; a.click();
  }

  if (!dataset) return <div className="p-6"><EmptyState /></div>;

  return (
    <div className="p-6 space-y-5 animate-in bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Safety Reports</h1>
          <p className="section-sub mb-0">{sorted.length} reports · {reports.filter(r => r.sif_potential === 'YES').length} with SIF potential</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm self-start sm:self-auto">
          <Download className="w-4 h-4 text-indigo-600" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3.5 flex flex-wrap gap-2.5 items-center shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="input-field pl-9 py-2 text-xs w-52 shadow-2xs"
            placeholder="Search reports..."
          />
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-4 h-4 text-slate-400" />
        </div>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }} className="input-field text-xs py-2 w-40 shadow-2xs">
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSIF} onChange={e => { setFilterSIF(e.target.value); setPage(0); }} className="input-field text-xs py-2 w-36 shadow-2xs">
          <option value="">All SIF</option>
          <option value="YES">SIF: YES</option>
          <option value="NO">SIF: NO</option>
        </select>
        <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setPage(0); }} className="input-field text-xs py-2 w-36 shadow-2xs">
          <option value="">All Severity</option>
          {['Critical','High','Medium','Low'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterType || filterSIF || filterSeverity) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterSIF(''); setFilterSeverity(''); setPage(0); }} className="text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1.5">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card shadow-soft overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                { key: 'id', label: 'ID' },
                { key: 'report_type', label: 'Type' },
                { key: 'report_text', label: 'Report Text' },
                { key: 'activity', label: 'Activity' },
                { key: 'site', label: 'Site' },
                { key: 'date', label: 'Date' },
                { key: 'sif_potential', label: 'SIF' },
                { key: 'severity', label: 'Severity' },
                { key: 'life_saving_rule', label: 'LSR' },
                { key: '', label: '' },
              ].map(col => (
                <th
                  key={col.key}
                  className={`text-left text-xs font-bold text-slate-600 py-3.5 px-3.5 whitespace-nowrap uppercase tracking-wider ${col.key ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                  onClick={() => col.key && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1.5">{col.label} {col.key && <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map(report => (
              <tr key={report.id} className="hover:bg-slate-50/80 cursor-pointer transition-colors" onClick={() => navigate(`/reports/${report.id}`)}>
                <td className="px-3.5 py-3 text-indigo-600 font-mono text-xs font-bold">{report.id}</td>
                <td className="px-3.5 py-3 text-slate-600 text-xs font-medium whitespace-nowrap">{report.report_type}</td>
                <td className="px-3.5 py-3 text-slate-800 max-w-xs">
                  <p className="truncate text-xs font-medium">{report.report_text}</p>
                </td>
                <td className="px-3.5 py-3 text-slate-600 text-xs whitespace-nowrap">{report.activity || '—'}</td>
                <td className="px-3.5 py-3 text-slate-600 text-xs whitespace-nowrap">{report.site || '—'}</td>
                <td className="px-3.5 py-3 text-slate-500 text-xs whitespace-nowrap font-mono">{report.date || '—'}</td>
                <td className="px-3.5 py-3">{report.sif_potential && <SIFBadge potential={report.sif_potential} size="sm" />}</td>
                <td className="px-3.5 py-3">
                  {report.severity && (
                    <span className={`text-xs font-bold ${
                      report.severity === 'Critical' ? 'text-red-600' :
                      report.severity === 'High' ? 'text-orange-600' :
                      report.severity === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{report.severity}</span>
                  )}
                </td>
                <td className="px-3.5 py-3 text-slate-600 text-xs whitespace-nowrap max-w-[120px] truncate">{report.life_saving_rule || '—'}</td>
                <td className="px-3.5 py-3">
                  <ExternalLink className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
          <span className="text-xs font-medium text-slate-500">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length} records</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white shadow-2xs">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 px-2">{page + 1} / {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white shadow-2xs">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
