import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Database, Eye, ChevronLeft, ChevronRight, Search, ArrowUpDown, Download, Languages, Globe, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { detectColumnMapping, analyzeDatasetQuality, rowsToReports, formatFileSize } from '../utils/datasetUtils';
import { processDataset, formatMultilingualSummary } from '../utils/multilingualUtils';
import { generateDemoReports, DEMO_COLUMN_MAPPING } from '../data/demoData';
import {
  MULTILINGUAL_SAMPLE_REPORTS, MULTILINGUAL_COLUMN_MAPPING,
  generateMultilingualCSV,
} from '../data/multilingualSampleData';
import { DatasetInfo, ColumnMapping, MultilingualStats, EMPTY_MULTILINGUAL_STATS } from '../types';
import { MultilingualStatsBanner, LanguageBadge } from '../components/MultilingualBadge';

type Step = 'upload' | 'preview' | 'mapping' | 'quality' | 'done';

export default function UploadPage() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [filesize, setFilesize] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [quality, setQuality] = useState<ReturnType<typeof analyzeDatasetQuality> | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  // ── Multilingual state ────────────────────────────────────────────────────
  const [translateEnabled, setTranslateEnabled] = useState(true);
  const [mlStats, setMlStats] = useState<MultilingualStats | null>(null);
  const PAGE_SIZE = 10;

  async function parseFile(file: File) {
    setLoading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: Record<string, unknown>[] = [];
      let cols: string[] = [];

      if (ext === 'csv') {
        const Papa = await import('papaparse');
        const text = await file.text();
        const result = Papa.default.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
        rows = result.data as Record<string, unknown>[];
        cols = result.meta.fields || [];
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
        if (data.length > 0) {
          cols = (data[0] as string[]).map(String);
          rows = data.slice(1).map(row => {
            const obj: Record<string, unknown> = {};
            cols.forEach((c, i) => { obj[c] = (row as unknown[])[i] ?? ''; });
            return obj;
          });
        }
      } else {
        throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
      }

      if (rows.length === 0) throw new Error('The file appears to be empty.');

      setRawRows(rows);
      setColumns(cols);
      setFilename(file.name);
      setFilesize(file.size);
      const detectedMapping = detectColumnMapping(cols);
      setMapping(detectedMapping);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    }
    setLoading(false);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  function loadDemo() {
    const reports = generateDemoReports();
    const cols = ['report_id','report_type','report_text','activity','location','site','date','severity','sif_potential','life_saving_rule','barrier_failure','recommended_action'];
    const rows = reports.map(r => ({ ...r })) as Record<string, unknown>[];
    const q = analyzeDatasetQuality(rows, cols, DEMO_COLUMN_MAPPING as never);
    const demoStats: MultilingualStats = { ...EMPTY_MULTILINGUAL_STATS, total: reports.length, english: reports.length, translate_enabled: true };
    dispatch({
      type: 'SET_DATASET',
      payload: {
        reports,
        isDemo: true,
        multilingualStats: demoStats,
        dataset: {
          filename: 'demo_safety_reports.csv',
          filesize: 0,
          rows: reports.length,
          columns: cols,
          preview: rows.slice(0, 10),
          column_mapping: DEMO_COLUMN_MAPPING,
          quality: q,
          is_demo: true,
        } as DatasetInfo,
      },
    });
    navigate('/dashboard');
  }

  function loadMultilingualDemo() {
    const rows = MULTILINGUAL_SAMPLE_REPORTS.map(r => ({ ...r })) as Record<string, unknown>[];
    const cols = Object.values(MULTILINGUAL_COLUMN_MAPPING);
    const q = analyzeDatasetQuality(rows, cols, MULTILINGUAL_COLUMN_MAPPING as never);
    const reports = rowsToReports(rows, MULTILINGUAL_COLUMN_MAPPING as ColumnMapping, true);

    // Compute actual multilingual stats
    const mlS: MultilingualStats = { ...EMPTY_MULTILINGUAL_STATS, total: reports.length, translate_enabled: true };
    for (const r of reports) {
      switch (r.detected_language) {
        case 'en': mlS.english++;  break;
        case 'kn': mlS.kannada++;  break;
        case 'hi': mlS.hindi++;    break;
        default:   mlS.unknown++;  break;
      }
      if (r.is_translated)     mlS.translated++;
      if (r.translation_error) mlS.translation_errors++;
    }

    dispatch({
      type: 'SET_DATASET',
      payload: {
        reports,
        isDemo: true,
        multilingualStats: mlS,
        dataset: {
          filename: 'SafeSense_multilingual_sample_dataset.csv',
          filesize: 0,
          rows: reports.length,
          columns: cols,
          preview: rows.slice(0, 10),
          column_mapping: MULTILINGUAL_COLUMN_MAPPING,
          quality: q,
          is_demo: true,
        } as DatasetInfo,
      },
    });
    navigate('/dashboard');
  }

  function downloadMultilingualDemo() {
    const csv = generateMultilingualCSV();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Unicode
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SafeSense_multilingual_sample_dataset.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadDemo() {
    const reports = generateDemoReports();
    const headers = ['report_id','report_type','report_text','activity','location','site','date','severity','sif_potential','life_saving_rule','barrier_failure','recommended_action'];
    const csv = [headers.join(','), ...reports.map(r =>
      headers.map(h => `"${String((r as unknown as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demo_safety_reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function proceedToMapping() {
    setStep('mapping');
  }

  function proceedToQuality() {
    const q = analyzeDatasetQuality(rawRows, columns, mapping as never);

    // ── Run multilingual detection now so we can show stats in quality step ──
    if (mapping.report_text) {
      const texts = rawRows.map(r => String(r[mapping.report_text!] || ''));
      const langColName = columns.find(c => ['language','lang','detected_language'].includes(c.toLowerCase()));
      const hints = langColName ? rawRows.map(r => String(r[langColName] || '') || undefined) : undefined;
      const { stats } = processDataset(texts, hints, translateEnabled);
      setMlStats({ ...stats, translate_enabled: translateEnabled });
    }

    setQuality(q);
    setStep('quality');
  }

  function finalize() {
    if (!quality) return;
    const reports = rowsToReports(rawRows, mapping, translateEnabled);

    // Compute final multilingual stats from processed reports
    const finalStats: MultilingualStats = { ...EMPTY_MULTILINGUAL_STATS, total: reports.length, translate_enabled: translateEnabled };
    for (const r of reports) {
      switch (r.detected_language) {
        case 'en': finalStats.english++;  break;
        case 'kn': finalStats.kannada++;  break;
        case 'hi': finalStats.hindi++;    break;
        default:   finalStats.unknown++;  break;
      }
      if (r.is_translated)     finalStats.translated++;
      if (r.translation_error) finalStats.translation_errors++;
    }

    dispatch({
      type: 'SET_DATASET',
      payload: {
        reports,
        isDemo: false,
        multilingualStats: finalStats,
        dataset: {
          filename,
          filesize,
          rows: rawRows.length,
          columns,
          preview: rawRows.slice(0, 10),
          column_mapping: mapping,
          quality,
          is_demo: false,
        } as DatasetInfo,
      },
    });
    navigate('/dashboard');
  }

  // Preview table
  const filtered = rawRows.filter(row =>
    !search || columns.some(c => String(row[c] || '').toLowerCase().includes(search.toLowerCase()))
  );
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortCol] || '');
        const bv = String(b[sortCol] || '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;
  const paginated = sorted.slice(previewPage * PAGE_SIZE, (previewPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const MAPPING_FIELDS: Array<{ key: keyof ColumnMapping; label: string; required?: boolean }> = [
    { key: 'report_text', label: 'Report Text Column', required: true },
    { key: 'report_type', label: 'Report Type Column' },
    { key: 'sif_label', label: 'SIF Label Column' },
    { key: 'severity', label: 'Severity Column' },
    { key: 'site', label: 'Site Column' },
    { key: 'location', label: 'Location Column' },
    { key: 'activity', label: 'Activity Column' },
    { key: 'date', label: 'Date Column' },
    { key: 'barrier_failure', label: 'Barrier Failure Column' },
    { key: 'recommended_action', label: 'Recommended Action Column' },
    { key: 'life_saving_rule', label: 'Life-Saving Rule Column' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in bg-[#F8FAFC]">
      <div className="mb-6">
        <h1 className="section-title">Upload Safety Reports</h1>
        <p className="section-sub mb-0">Upload a CSV or Excel file containing safety observations, or use the built-in demo datasets.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8 bg-white p-3 rounded-2xl border border-slate-200 shadow-soft overflow-x-auto">
        {(['upload','preview','mapping','quality','done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-indigo-600 text-white shadow-xs' :
              (['upload','preview','mapping','quality','done'].indexOf(step) > i) ? 'bg-emerald-500 text-white' :
              'bg-slate-100 text-slate-500'
            }`}>{i + 1}</div>
            <span className={`text-xs font-semibold capitalize ${step === s ? 'text-indigo-600' : 'text-slate-500'}`}>{s}</span>
            {i < 4 && <div className="w-8 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* ─── Step: Upload ─── */}
      {step === 'upload' && (
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer bg-white ${
              dragging ? 'border-indigo-500 bg-indigo-50/50 shadow-soft-md' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60 shadow-soft'
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-slate-900 font-bold text-lg mb-1 tracking-tight">Drop your CSV or Excel file here or click to browse</p>
            <p className="text-slate-500 text-sm">Supports CSV, .xlsx, and .xls files with automatic column detection</p>
            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 font-medium text-sm">
                <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                Parsing file contents...
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              {error}
            </div>
          )}

          {/* Demo section */}
          <div className="card border-amber-200 bg-amber-50/40 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5 shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Standard Synthetic Demo Dataset</h3>
                <p className="text-slate-600 text-sm mb-1">250+ synthetic industrial safety reports covering Confined Space, Energy Isolation, Hot Work, Working at Height, and more.</p>
                <p className="text-amber-800 text-xs font-semibold mb-3">⚠ Synthetic Demo Data — Not Real Organizational Data</p>
                <div className="flex gap-2.5 flex-wrap">
                  <button onClick={loadDemo} className="btn-primary text-xs">
                    <Database className="w-4 h-4" />
                    Load Demo Dataset
                  </button>
                  <button onClick={downloadDemo} className="btn-secondary text-xs">
                    <Download className="w-4 h-4 text-indigo-600" />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Multilingual demo section */}
          <div className="card border-purple-200 bg-purple-50/40 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5 shadow-xs">
                <Languages className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                  Multilingual Sample Dataset (EN/KN/HI)
                  <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold">MULTILINGUAL</span>
                </h3>
                <p className="text-slate-600 text-sm mb-1">
                  30 synthetic safety observations written in <LanguageBadge language="en" size="sm" />{' '}
                  <LanguageBadge language="kn" size="sm" />{' '}
                  <LanguageBadge language="hi" size="sm" />.
                </p>
                <p className="text-slate-500 text-xs mb-3">
                  Non-English reports are automatically detected and translated to English in-browser before AI analysis.
                </p>
                <div className="flex gap-2.5 flex-wrap">
                  <button onClick={loadMultilingualDemo} className="btn-primary text-xs">
                    <Globe className="w-4 h-4" />
                    Load Multilingual Demo
                  </button>
                  <button onClick={downloadMultilingualDemo} className="btn-secondary text-xs">
                    <Download className="w-4 h-4 text-purple-600" />
                    Download Multilingual CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step: Preview ─── */}
      {step === 'preview' && (
        <div className="space-y-5">
          {/* File info */}
          <div className="card border-emerald-200 bg-emerald-50/40 flex items-center gap-4 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 text-base">{filename}</div>
              <div className="text-xs text-slate-600 font-medium">{formatFileSize(filesize)} · {rawRows.length} rows parsed · {columns.length} columns</div>
            </div>
            <button onClick={() => setStep('upload')} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & table */}
          <div className="card shadow-soft p-0 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><Eye className="w-4 h-4 text-indigo-600" />Parsed Data Preview</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPreviewPage(0); }}
                  className="input-field pl-9 py-1.5 text-xs w-52 shadow-2xs"
                  placeholder="Filter preview..."
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {columns.map(col => (
                      <th
                        key={col}
                        className="text-left px-3.5 py-3 text-slate-600 font-bold whitespace-nowrap cursor-pointer hover:text-indigo-600 uppercase tracking-wider"
                        onClick={() => { setSortCol(col); setSortDir(sd => sd === 'asc' ? 'desc' : 'asc'); }}
                      >
                        <span className="flex items-center gap-1">{col} <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      {columns.map(col => (
                        <td key={col} className="px-3.5 py-2.5 text-slate-700 max-w-xs truncate whitespace-nowrap font-medium">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
              <span className="text-xs font-medium text-slate-500">Showing {previewPage * PAGE_SIZE + 1}–{Math.min((previewPage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0} className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-700 px-2">{previewPage + 1} / {totalPages || 1}</span>
                <button onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage >= totalPages - 1} className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={proceedToMapping} className="btn-primary">
              Continue to Column Mapping <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Mapping ─── */}
      {step === 'mapping' && (
        <div className="space-y-5">
          <div className="card shadow-soft">
            <h3 className="font-bold text-slate-900 text-base mb-1">Column Mapping</h3>
            <p className="text-slate-500 text-sm mb-5">Map your dataset columns to the expected fields. Columns were auto-detected — adjust if needed.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {MAPPING_FIELDS.map(field => (
                <div key={field.key} className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wide">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={(mapping as Record<string, string>)[field.key] || ''}
                    onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value || undefined }))}
                    className="input-field text-sm"
                  >
                    <option value="">— Not mapped —</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* ── Multilingual Processing Panel ─────────────────────────────── */}
          <div className="card border-purple-200 bg-purple-50/40 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">Multilingual Intelligence Configuration</h3>
            </div>
            <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-xl border border-purple-100">
              <div>
                <p className="text-sm font-bold text-slate-800">Language Detection</p>
                <p className="text-xs text-slate-500">Automatically identifies English, Kannada, and Hindi texts</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Active
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-xl border border-purple-100">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={translateEnabled}
                  onChange={e => setTranslateEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${translateEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${translateEnabled ? 'translate-x-5' : ''} shadow-xs`} />
              </div>
              <div>
                <p className="text-sm text-slate-900 font-bold">Translate non-English reports to English</p>
                <p className="text-xs text-slate-500">
                  {translateEnabled
                    ? 'Kannada and Hindi reports will be translated before SIF precursor analysis. Original texts are preserved.'
                    : 'Only language detection will run. Original text will be used for analysis.'}
                </p>
              </div>
            </label>
          </div>

          {!mapping.sif_label && (
            <div className="flex items-start gap-2.5 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              No SIF label column mapped. The platform will automatically calculate SIF potential and risk scores using the AI NLP engine.
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep('preview')} className="btn-secondary">← Back</button>
            <button onClick={proceedToQuality} className="btn-primary">Analyze Dataset Quality →</button>
          </div>
        </div>
      )}

      {/* ─── Step: Quality ─── */}
      {step === 'quality' && quality && (
        <div className="space-y-5">
          {/* Health score */}
          <div className="card border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-cyan-50/30 shadow-soft">
            <div className="flex items-center gap-6">
              <div className="text-center bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
                <div className={`text-5xl font-extrabold ${quality.health_score >= 80 ? 'text-emerald-600' : quality.health_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {quality.health_score}
                </div>
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">/ 100 Score</div>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Dataset Health Assessment</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  {quality.health_score >= 80 ? 'Excellent quality dataset. Well-suited for accurate SIF precursor and pattern intelligence.' :
                   quality.health_score >= 60 ? 'Moderate quality — minor data gaps detected. Review indicators below.' :
                   'Low quality — significant data gaps. Please review warnings before proceeding.'}
                </p>
              </div>
            </div>
          </div>

          {/* Multilingual stats banner */}
          {mlStats && <MultilingualStatsBanner stats={mlStats} />}

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Records', value: quality.total_records },
              { label: 'Columns', value: quality.total_columns },
              { label: 'Empty Reports', value: quality.empty_reports },
              { label: 'Duplicates', value: quality.duplicate_records },
              { label: 'Avg Report Length', value: `${quality.avg_report_length} chars` },
              { label: 'Report Types', value: quality.unique_report_types },
              { label: 'Unique Sites', value: quality.unique_sites || 'N/A' },
              { label: 'Activities', value: quality.unique_activities || 'N/A' },
            ].map(m => (
              <div key={m.label} className="card text-center shadow-xs">
                <div className="text-2xl font-bold text-slate-900">{m.value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {quality.warnings.length > 0 && (
            <div className="card border-amber-200 bg-amber-50/40 shadow-soft">
              <h4 className="font-bold text-amber-900 mb-2 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Data Quality Observations
              </h4>
              <ul className="space-y-1.5">
                {quality.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                    <span className="text-amber-600 font-bold">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep('mapping')} className="btn-secondary">← Back</button>
            <button onClick={finalize} className="btn-primary">
              <CheckCircle className="w-4 h-4" />
              Load Dataset & Launch Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
