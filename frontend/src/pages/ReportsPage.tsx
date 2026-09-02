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
      const av = String((a as Record<string, unknown>)[sortCol] ?? '');
      const bv = String((b as Record<string, unknown>)[sortCol] ?? '');
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
      headers.map(h => `"${String((r as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'safety_reports_export.csv'; a.click();
  }

  if (!dataset) return <div className="p-6"><EmptyState /></div>;

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Safety Reports</h1>
          <p className="section-sub">{sorted.length} reports · {reports.filter(r => r.sif_potential === 'YES').length} with SIF potential</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="input-field pl-8 py-2 text-sm w-52"
            placeholder="Search reports..."
          />
        </div>
        <Filter className="w-4 h-4 text-slate-500" />
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }} className="input-field text-sm py-2 w-40">
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSIF} onChange={e => { setFilterSIF(e.target.value); setPage(0); }} className="input-field text-sm py-2 w-40">
          <option value="">All SIF</option>
          <option value="YES">SIF: YES</option>
          <option value="NO">SIF: NO</option>
        </select>
        <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setPage(0); }} className="input-field text-sm py-2 w-36">
          <option value="">All Severity</option>
          {['Critical','High','Medium','Low'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterType || filterSIF || filterSeverity) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterSIF(''); setFilterSeverity(''); setPage(0); }} className="text-xs text-slate-400 hover:text-white">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
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
                <th key={col.key} className={`text-left text-xs font-medium text-slate-500 pb-2 px-2 whitespace-nowrap ${col.key ? 'cursor-pointer hover:text-slate-300' : ''}`} onClick={() => col.key && handleSort(col.key)}>
                  <span className="flex items-center gap-1">{col.label} {col.key && <ArrowUpDown className="w-3 h-3" />}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {paginated.map(report => (
              <tr key={report.id} className="hover:bg-slate-800/50 cursor-pointer" onClick={() => navigate(`/reports/${report.id}`)}>
                <td className="px-2 py-2.5 text-blue-400 font-mono text-xs">{report.id}</td>
                <td className="px-2 py-2.5 text-slate-400 text-xs whitespace-nowrap">{report.report_type}</td>
                <td className="px-2 py-2.5 text-slate-300 max-w-xs">
                  <p className="truncate text-xs">{report.report_text}</p>
                </td>
                <td className="px-2 py-2.5 text-slate-400 text-xs whitespace-nowrap">{report.activity || '—'}</td>
                <td className="px-2 py-2.5 text-slate-400 text-xs whitespace-nowrap">{report.site || '—'}</td>
                <td className="px-2 py-2.5 text-slate-400 text-xs whitespace-nowrap">{report.date || '—'}</td>
                <td className="px-2 py-2.5">{report.sif_potential && <SIFBadge potential={report.sif_potential} size="sm" />}</td>
                <td className="px-2 py-2.5">
                  {report.severity && (
                    <span className={`text-xs font-medium ${
                      report.severity === 'Critical' ? 'text-red-400' :
                      report.severity === 'High' ? 'text-orange-400' :
                      report.severity === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>{report.severity}</span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-slate-400 text-xs whitespace-nowrap max-w-[100px] truncate">{report.life_saving_rule || '—'}</td>
                <td className="px-2 py-2.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
          <span className="text-xs text-slate-500">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 px-2">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
