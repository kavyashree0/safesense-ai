import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Database, Eye, ChevronLeft, ChevronRight, Search, ArrowUpDown, Download, Languages, Globe } from 'lucide-react';
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
      headers.map(h => `"${String((r as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'demo_safety_reports.csv'; a.click();
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
    <div className="p-6 max-w-5xl mx-auto animate-in">
      <div className="mb-6">
        <h1 className="section-title">Upload Safety Reports</h1>
        <p className="section-sub">Upload a CSV or Excel file containing safety observations, or use the built-in demo dataset.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload','preview','mapping','quality','done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-blue-600 text-white' :
              (['upload','preview','mapping','quality','done'].indexOf(step) > i) ? 'bg-green-600 text-white' :
              'bg-slate-700 text-slate-400'
            }`}>{i + 1}</div>
            <span className={`text-xs hidden sm:block capitalize ${step === s ? 'text-white' : 'text-slate-500'}`}>{s}</span>
            {i < 4 && <div className="w-6 h-px bg-slate-700" />}
          </div>
        ))}
      </div>

      {/* ─── Step: Upload ─── */}
      {step === 'upload' && (
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              dragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg mb-1">Drop your file here or click to browse</p>
            <p className="text-slate-400 text-sm">Supports CSV and Excel (.xlsx, .xls) files</p>
            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                Parsing file...
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Demo section */}
          <div className="card border-amber-500/20 bg-amber-900/5">
            <div className="flex items-start gap-4">
              <Database className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Use Synthetic Demo Dataset</h3>
                <p className="text-slate-400 text-sm mb-1">250+ synthetic industrial safety reports covering Confined Space, Energy Isolation, Hot Work, Working at Height, and more.</p>
                <p className="text-amber-400/80 text-xs mb-3">⚠ Synthetic Demo Data — Not Real Organizational Data</p>
                <div className="flex gap-3">
                  <button onClick={loadDemo} className="btn-primary text-sm">
                    <Database className="w-4 h-4" />
                    Use Demo Dataset
                  </button>
                  <button onClick={downloadDemo} className="btn-secondary text-sm">
                    <Download className="w-4 h-4" />
                    Download Demo CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Multilingual demo section */}
          <div className="card border-violet-500/20 bg-violet-900/5">
            <div className="flex items-start gap-4">
              <Languages className="w-6 h-6 text-violet-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                  Multilingual Sample Dataset
                  <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">NEW</span>
                </h3>
                <p className="text-slate-400 text-sm mb-1">
                  30 synthetic safety reports in <LanguageBadge language="en" size="sm" />{' '}
                  <LanguageBadge language="kn" size="sm" />{' '}
                  <LanguageBadge language="hi" size="sm" />{' '}
                  covering Confined Space, Energy Isolation, Hot Work, and more.
                </p>
                <p className="text-slate-500 text-xs mb-3">
                  Non-English reports are automatically detected and translated to English before SIF analysis.
                </p>
                <p className="text-amber-400/80 text-xs mb-3">⚠ Synthetic Demo Data — Not Real Organizational Data</p>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={loadMultilingualDemo} className="btn-primary text-sm">
                    <Globe className="w-4 h-4" />
                    Use Multilingual Demo
                  </button>
                  <button onClick={downloadMultilingualDemo} className="btn-secondary text-sm">
                    <Download className="w-4 h-4" />
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
          <div className="card border-green-500/20 bg-green-900/5 flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-white">{filename}</div>
              <div className="text-sm text-slate-400">{formatFileSize(filesize)} · {rawRows.length} rows · {columns.length} columns</div>
            </div>
            <button onClick={() => setStep('upload')} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & table */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2"><Eye className="w-4 h-4" />Data Preview</h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPreviewPage(0); }}
                  className="input-field pl-8 py-1.5 text-sm w-48"
                  placeholder="Search..."
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    {columns.map(col => (
                      <th
                        key={col}
                        className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap cursor-pointer hover:text-white"
                        onClick={() => { setSortCol(col); setSortDir(sd => sd === 'asc' ? 'desc' : 'asc'); }}
                      >
                        <span className="flex items-center gap-1">{col} <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paginated.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/50">
                      {columns.map(col => (
                        <td key={col} className="px-3 py-2 text-slate-300 max-w-xs truncate whitespace-nowrap">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
              <span className="text-xs text-slate-500">Showing {previewPage * PAGE_SIZE + 1}–{Math.min((previewPage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 px-2">{previewPage + 1}/{totalPages}</span>
                <button onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage >= totalPages - 1} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={proceedToMapping} className="btn-primary">
              Continue to Column Mapping →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Mapping ─── */}
      {step === 'mapping' && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="font-semibold text-white mb-1">Column Mapping</h3>
            <p className="text-slate-400 text-sm mb-5">Map your dataset columns to the expected fields. Columns were auto-detected — adjust if needed.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {MAPPING_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
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
          <div className="card border-violet-500/20 bg-violet-900/5">
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-white text-sm">Language Processing</h3>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-slate-300">Language Detection</p>
                <p className="text-xs text-slate-500">Automatically detect English, Kannada, and Hindi reports</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Auto Detect
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={translateEnabled}
                  onChange={e => setTranslateEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${translateEnabled ? 'bg-violet-600' : 'bg-slate-600'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${translateEnabled ? 'translate-x-5' : ''}`} />
              </div>
              <div>
                <p className="text-sm text-slate-300 font-medium">Translate non-English reports to English</p>
                <p className="text-xs text-slate-500">
                  {translateEnabled
                    ? 'Kannada and Hindi reports will be translated before SIF analysis. Original text is preserved.'
                    : 'Only language detection will run. Original text will be used for analysis.'}
                </p>
              </div>
            </label>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>Supported:</span>
              <LanguageBadge language="en" size="sm" />
              <LanguageBadge language="kn" size="sm" />
              <LanguageBadge language="hi" size="sm" />
              <span className="text-slate-600">· Client-side processing · No data sent externally</span>
            </div>
          </div>

          {!mapping.sif_label && (
            <div className="flex items-start gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              No SIF label column mapped. Running AI/rule-based prototype analysis mode.
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep('preview')} className="btn-secondary">← Back</button>
            <button onClick={proceedToQuality} className="btn-primary">Analyze Quality →</button>
          </div>
        </div>
      )}

      {/* ─── Step: Quality ─── */}
      {step === 'quality' && quality && (
        <div className="space-y-5">
          {/* Health score */}
          <div className="card border-blue-500/20 bg-blue-900/5">
            <div className="flex items-center gap-5">
              <div className="text-center">
                <div className={`text-5xl font-bold ${quality.health_score >= 80 ? 'text-green-400' : quality.health_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {quality.health_score}
                </div>
                <div className="text-slate-500 text-xs">/100</div>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Dataset Health Score</h3>
                <p className="text-slate-400 text-sm">
                  {quality.health_score >= 80 ? 'Good quality dataset for prototype analysis.' :
                   quality.health_score >= 60 ? 'Moderate quality — some data gaps detected.' :
                   'Low quality — significant data gaps. Review warnings below.'}
                </p>
              </div>
            </div>
          </div>

          {/* Multilingual stats banner — shown only when non-English is detected */}
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
              { label: 'Sites', value: quality.unique_sites || 'N/A' },
              { label: 'Activities', value: quality.unique_activities || 'N/A' },
            ].map(m => (
              <div key={m.label} className="card text-center">
                <div className="text-xl font-bold text-white">{m.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {quality.warnings.length > 0 && (
            <div className="card border-amber-500/20 bg-amber-900/5">
              <h4 className="font-semibold text-amber-400 mb-2 text-sm">Warnings</h4>
              <ul className="space-y-1.5">
                {quality.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
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
              Load Dataset & Analyze
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
