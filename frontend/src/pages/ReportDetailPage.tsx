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
    <div className="p-6">
      <button onClick={() => navigate('/reports')} className="btn-secondary text-sm mb-4"><ArrowLeft className="w-4 h-4" />Back</button>
      <div className="card text-slate-400">Report not found.</div>
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
    <div className="p-6 max-w-5xl mx-auto animate-in">
      <button onClick={() => navigate('/reports')} className="btn-secondary text-sm mb-5"><ArrowLeft className="w-4 h-4" />Back to Reports</button>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Report header */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              {analysis && <RiskGauge score={analysis.risk_score} size={90} />}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-slate-400 font-mono text-sm">{report.id}</span>
                  {report.sif_potential && <SIFBadge potential={report.sif_potential} />}
                  {analysis && <RiskBadge level={analysis.risk_level} />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Type: </span><span className="text-slate-300">{report.report_type}</span></div>
                  <div><span className="text-slate-500">Date: </span><span className="text-slate-300">{report.date || '—'}</span></div>
                  <div><span className="text-slate-500">Site: </span><span className="text-slate-300">{report.site || '—'}</span></div>
                  <div><span className="text-slate-500">Activity: </span><span className="text-slate-300">{report.activity || '—'}</span></div>
                  <div><span className="text-slate-500">Location: </span><span className="text-slate-300">{report.location || '—'}</span></div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Report Text</h3>
              <p className="text-slate-200 text-sm leading-relaxed">{report.report_text}</p>
            </div>
          </div>

          {/* AI Analysis */}
          {analysis && (
            <div className="card space-y-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />AI Analysis
                <span className="text-xs text-slate-500 font-normal ml-auto">Prototype rule-based · Not certified</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-800 rounded-lg p-3">
                  <span className="text-xs text-slate-500 block mb-1">Life-Saving Rule</span>
                  <span className="text-blue-400 font-semibold">{analysis.life_saving_rule}</span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <span className="text-xs text-slate-500 block mb-1">Failed Barrier</span>
                  <span className="text-orange-400 font-semibold">{analysis.barrier_failure}</span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <span className="text-xs text-slate-500 block mb-1">Hazard Detected</span>
                  <span className="text-yellow-400 font-semibold">{analysis.hazard_detected}</span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <span className="text-xs text-slate-500 block mb-1">Activity Detected</span>
                  <span className="text-slate-200 font-semibold">{analysis.activity_detected}</span>
                </div>
              </div>

              {/* Evidence */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Key Evidence Phrases</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.evidence_phrases.map((p, i) => (
                    <span key={i} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-2.5 py-1 rounded-lg text-xs">"{p}"</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Explanation</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.explanation}</p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Recommended Actions</h4>
                <ol className="space-y-1">
                  {analysis.recommended_actions.slice(0, 5).map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>{a}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Human Review */}
          <div className="card border-violet-500/20 bg-violet-900/5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-violet-400" />HSE Review
              <span className="text-xs text-slate-500 font-normal">AI supports HSE decisions — final authority rests with qualified personnel.</span>
            </h3>
            <div className={`text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3 ${
              reviewStatus === 'Confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              reviewStatus === 'Corrected' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
              reviewStatus === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}>
              Current status: {reviewStatus}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="input-field text-sm min-h-[70px] resize-none mb-3"
              placeholder="Add reviewer comment (optional)..."
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => submitReview('Confirmed')} className="btn-primary text-sm px-3 py-2">
                <CheckCircle className="w-4 h-4" />Confirm
              </button>
              <button onClick={() => submitReview('Corrected')} className="btn-secondary text-sm px-3 py-2">
                <RotateCcw className="w-4 h-4" />Correct
              </button>
              <button onClick={() => submitReview('Rejected')} className="btn-danger text-sm px-3 py-2">
                <XCircle className="w-4 h-4" />Reject
              </button>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          {/* Risk factors */}
          {analysis && (
            <div className="card">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Risk Factor Breakdown</h3>
              <div className="space-y-3">
                {analysis.risk_factors.map(f => (
                  <div key={f.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{f.name}</span>
                      <span className="text-slate-400">{f.score}/{f.max_score}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(f.score / f.max_score) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar reports */}
          {similarReports.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Similar Reports ({similarReports.length})</h3>
              <div className="space-y-2">
                {similarReports.map(r => (
                  <div key={r.id} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer" onClick={() => navigate(`/reports/${r.id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-blue-400 font-mono">{r.id}</span>
                      {r.sif_potential && <SIFBadge potential={r.sif_potential} size="sm" />}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{r.report_text}</p>
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
