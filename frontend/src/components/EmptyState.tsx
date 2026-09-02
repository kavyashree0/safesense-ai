import { useNavigate } from 'react-router-dom';
import { Upload, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateDemoReports, DEMO_COLUMN_MAPPING } from '../data/demoData';
import { analyzeDatasetQuality } from '../utils/datasetUtils';

interface EmptyStateProps {
  title?: string;
  message?: string;
  showActions?: boolean;
}

export default function EmptyState({
  title = 'No safety dataset uploaded yet',
  message = 'Upload a CSV or Excel file, or use the built-in synthetic demo dataset to explore the platform.',
  showActions = true,
}: EmptyStateProps) {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  function loadDemo() {
    const reports = generateDemoReports();
    const columns = ['report_id','report_type','report_text','activity','location','site','date','severity','sif_potential','life_saving_rule','barrier_failure','recommended_action'];
    const rows = reports.map(r => ({ ...r })) as Record<string, unknown>[];
    const quality = analyzeDatasetQuality(rows, columns, DEMO_COLUMN_MAPPING as Record<string, string> as never);
    dispatch({
      type: 'SET_DATASET',
      payload: {
        reports,
        isDemo: true,
        dataset: {
          filename: 'demo_safety_reports.csv',
          filesize: 0,
          rows: reports.length,
          columns,
          preview: rows.slice(0, 10),
          column_mapping: DEMO_COLUMN_MAPPING,
          quality,
          is_demo: true,
        },
      },
    });
    navigate('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
        <Database className="w-9 h-9 text-slate-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-8 text-sm leading-relaxed">{message}</p>
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/upload')} className="btn-primary">
            <Upload className="w-4 h-4" />
            Upload Dataset
          </button>
          <button onClick={loadDemo} className="btn-secondary">
            <Database className="w-4 h-4" />
            Use Demo Dataset
          </button>
        </div>
      )}
    </div>
  );
}
