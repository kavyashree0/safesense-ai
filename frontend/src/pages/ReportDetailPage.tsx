import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RiskBadge, SIFBadge } from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import { analyzeReport } from '../utils/riskEngine';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Shield, MessageSquare } from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { reports, dispatch } = useApp();
  const navigate = useNavigate();
  const report = reports.find(r => r.id === id);
  const [comment, setComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState(report?.reviewer_status || 'Pending');

  const analysis = useMemo(() => report ? analyzeReport(report) : null, [report]);

  const similarReports = useMemo(() => {
    if (!report || !analysis) return [];
    return reports
      .filter(r => r.id !== report.id && r.life_saving_rule === analysis.life_saving_rule)
      .slice(0, 4);
  }, [report, reports, analysis]);

  if (!report) return (
    <div className="p-6 bg-[#F8FAFC]">
      <button onClick={() => navigate('/reports')} className="btn-secondary text-sm mb-4"><ArrowLeft className="w-4 h-4" />Back to Reports</button>
      <div className="card text-slate-500">Report not found.</div>
    </div>
  );

  function submitReview(decision: 'Confirmed' | 'Corrected' | 'Rejected') {
    if (!report) return;
    setReviewStatus(decision);
    dispatch({
      type: 'UPDATE_REPORT',
      payload: { ...report, reviewer_status: decision, reviewer_comment: comment }
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in bg-[#F8FAFC]">
      <button onClick={() => navigate('/reports')} className="btn-secondary text-sm mb-5"><ArrowLeft className="w-4 h-4" />Back to Reports</button>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Report header */}
          <div className="card shadow-soft">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
              {analysis && <RiskGauge score={analysis.risk_score} size={90} />}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2.5 flex-wrap">
                  <span className="text-slate-700 font-mono text-sm font-bold bg-slate-100 px-2 py-0.5 rounded-md">{report.id}</span>
                  {report.sif_potential && <SIFBadge potential={report.sif_potential} />}
                  {analysis && <RiskBadge level={analysis.risk_level} />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400 font-bold uppercase">Type: </span><span className="text-slate-800 font-semibold">{report.report_type}</span></div>
                  <div><span className="text-slate-400 font-bold uppercase">Date: </span><span className="text-slate-800 font-medium font-mono">{report.date || '—'}</span></div>
                  <div><span className="text-slate-400 font-bold uppercase">Site: </span><span className="text-slate-800 font-semibold">{report.site || '—'}</span></div>
                  <div><span className="text-slate-400 font-bold uppercase">Activity: </span><span className="text-slate-800 font-semibold">{report.activity || '—'}</span></div>
                  <div><span className="text-slate-400 font-bold uppercase">Location: </span><span className="text-slate-800 font-medium">{report.location || '—'}</span></div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Original Safety Observation</h3>
              <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">{report.report_text}</p>
            </div>
          </div>

          {/* AI Analysis */}
          {analysis && (
            <div className="card shadow-soft space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />AI Automated Findings
                <span className="text-xs text-slate-400 font-normal ml-auto">Prototype rule-based</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                  <span className="text-xs text-indigo-600 font-bold uppercase block mb-1">Life-Saving Rule</span>
                  <span className="text-indigo-950 font-bold">{analysis.life_saving_rule}</span>
                </div>
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
                  <span className="text-xs text-red-600 font-bold uppercase block mb-1">Failed Barrier</span>
                  <span className="text-red-950 font-bold">{analysis.barrier_failure}</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                  <span className="text-xs text-amber-600 font-bold uppercase block mb-1">Hazard Detected</span>
                  <span className="text-amber-950 font-bold">{analysis.hazard_detected}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
                  <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Activity Detected</span>
                  <span className="text-slate-900 font-bold">{analysis.activity_detected}</span>
                </div>
              </div>

              {/* Evidence */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Key Evidence Phrases</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.evidence_phrases.map((p, i) => (
                    <span key={i} className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold">✓ "{p}"</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Explanation</h4>
                <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{analysis.explanation}</p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Recommended Actions</h4>
                <ol className="space-y-1.5">
                  {analysis.recommended_actions.slice(0, 5).map((a, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-indigo-600 font-bold flex-shrink-0">{i + 1}.</span>
                      <span className="font-medium">{a}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Human Review */}
          <div className="card border-purple-100 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/20 shadow-soft">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />HSE Review Workflow
            </h3>
            <p className="text-xs text-slate-500 mb-3">AI supports HSE decision-making. Final authority remains with authorized safety personnel.</p>
            <div className={`text-xs px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3 font-semibold ${
              reviewStatus === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              reviewStatus === 'Corrected' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              reviewStatus === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              Current Status: {reviewStatus}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="input-field text-sm min-h-[75px] resize-none mb-3"
              placeholder="Add reviewer comments or verification notes..."
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => submitReview('Confirmed')} className="btn-accent text-xs px-3.5 py-2">
                <CheckCircle className="w-4 h-4" />Confirm Finding
              </button>
              <button onClick={() => submitReview('Corrected')} className="btn-secondary text-xs px-3.5 py-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />Correct Data
              </button>
              <button onClick={() => submitReview('Rejected')} className="btn-danger text-xs px-3.5 py-2">
                <XCircle className="w-4 h-4" />Reject
              </button>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          {/* Risk factors */}
          {analysis && (
            <div className="card shadow-soft">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Risk Factor Breakdown</h3>
              <div className="space-y-3">
                {analysis.risk_factors.map(f => (
                  <div key={f.name}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-700">{f.name}</span>
                      <span className="text-indigo-600 font-bold">{f.score}/{f.max_score}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" style={{ width: `${(f.score / f.max_score) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar reports */}
          {similarReports.length > 0 && (
            <div className="card shadow-soft">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Similar Reports ({similarReports.length})</h3>
              <div className="space-y-2">
                {similarReports.map(r => (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 cursor-pointer transition-colors" onClick={() => navigate(`/reports/${r.id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-indigo-600 font-mono font-bold">{r.id}</span>
                      {r.sif_potential && <SIFBadge potential={r.sif_potential} size="sm" />}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{r.report_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
