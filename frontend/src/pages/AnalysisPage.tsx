import { useState, useMemo } from 'react';
import { Brain, Play, AlertTriangle, Shield, CheckCircle, Info, Zap, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeReport, calculateRiskScore, detectLSR } from '../utils/riskEngine';
import { ReportAnalysis, SafetyReport } from '../types';
import RiskGauge from '../components/RiskGauge';
import { RiskBadge, SIFBadge } from '../components/RiskBadge';
import WhatIfSimulator from '../components/WhatIfSimulator';

const EXAMPLE_REPORTS = [
  'Worker entered a confined space without completing required gas testing and permit verification.',
  'Maintenance technician began electrical work on a control panel without applying lockout/tagout. Panel was still energized.',
  'Welding observed in a hazardous area without a valid hot work permit. Flammable vapors were detected nearby.',
  'Worker observed working at 6-meter height without harness or fall-arrest equipment. No edge protection was installed.',
  'Near miss during crane lift: worker walked under suspended load. Exclusion zone had not been established.',
  'Forklift operating in pedestrian walkway without segregation controls. Reversing alarms were not functioning.',
];

export default function AnalysisPage() {
  const { reports } = useApp();
  const [inputText, setInputText] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [sourceReport, setSourceReport] = useState<SafetyReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFactors, setShowFactors] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const similarReports = useMemo(() => {
    if (!analysis || !reports.length) return [];
    const lsr = analysis.life_saving_rule;
    return reports
      .filter(r => r.id !== sourceReport?.id && (r.life_saving_rule === lsr || (r.activity || '').includes(analysis.activity_detected)))
      .slice(0, 5);
  }, [analysis, reports, sourceReport]);

  async function runAnalysis() {
    const text = selectedReportId
      ? reports.find(r => r.id === selectedReportId)?.report_text || ''
      : inputText.trim();

    if (!text) return;
    setIsAnalyzing(true);

    await new Promise(r => setTimeout(r, 1200)); // Simulate processing

    const report = selectedReportId
      ? reports.find(r => r.id === selectedReportId)
      : undefined;

    const result = analyzeReport(report || { report_text: text });
    setAnalysis(result);
    setSourceReport(report || null);
    setIsAnalyzing(false);
    setShowSimulator(false);
  }

  const activeText = selectedReportId
    ? reports.find(r => r.id === selectedReportId)?.report_text || ''
    : inputText;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in">
      <div className="mb-6">
        <h1 className="section-title">AI Report Analysis</h1>
        <p className="section-sub">Enter a safety report or select one from the uploaded dataset to run AI analysis.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          {/* Select from dataset */}
          {reports.length > 0 && (
            <div className="card">
              <label className="text-xs font-medium text-slate-400 block mb-2">Select from Uploaded Dataset</label>
              <select
                value={selectedReportId}
                onChange={e => { setSelectedReportId(e.target.value); setInputText(''); setAnalysis(null); }}
                className="input-field text-sm"
              >
                <option value="">— Select a report —</option>
                {reports.slice(0, 100).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.report_type} · {r.report_text.slice(0, 60)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Text input */}
          <div className="card">
            <label className="text-xs font-medium text-slate-400 block mb-2">Or Enter Report Text Manually</label>
            <textarea
              value={inputText}
              onChange={e => { setInputText(e.target.value); setSelectedReportId(''); setAnalysis(null); }}
              className="input-field min-h-[140px] text-sm resize-none"
              placeholder="Paste or type a safety report observation here..."
            />
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-2">Quick examples:</p>
              <div className="space-y-1.5">
                {EXAMPLE_REPORTS.slice(0, 3).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setInputText(ex); setSelectedReportId(''); setAnalysis(null); }}
                    className="block w-full text-left text-xs text-slate-400 hover:text-blue-400 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors truncate"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={!activeText || isAnalyzing}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Report...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Analyze Report
              </>
            )}
          </button>

          {/* Animated processing */}
          {isAnalyzing && (
            <div className="card border-blue-500/20 bg-blue-900/5">
              <div className="space-y-2">
                {['Tokenizing text...', 'Extracting safety concepts...', 'Identifying life-saving rule...', 'Calculating risk score...', 'Generating explanation...'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.15}s` }} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div>
          {!analysis && !isAnalyzing && (
            <div className="card border-dashed border-slate-600 flex flex-col items-center justify-center py-16 text-center">
              <Brain className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-500">Analysis results will appear here</p>
              <p className="text-slate-600 text-sm mt-1">Enter a report and click Analyze Report</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4 animate-in">
              {/* Risk overview */}
              <div className="card border border-slate-700">
                <div className="flex items-start gap-5">
                  <RiskGauge score={analysis.risk_score} size={110} />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <SIFBadge potential={analysis.sif_potential} size="lg" />
                      <RiskBadge level={analysis.risk_level} size="lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs block">Activity Detected</span>
                        <span className="text-white font-medium">{analysis.activity_detected}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block">Hazard Type</span>
                        <span className="text-white font-medium">{analysis.hazard_detected}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block">Failed Barrier</span>
                        <span className="text-orange-400 font-medium">{analysis.barrier_failure}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block">Life-Saving Rule</span>
                        <span className="text-blue-400 font-medium">{analysis.life_saving_rule}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prototype label */}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                Prototype rule-based analysis · Not a certified safety calculation
              </div>

              {/* Evidence phrases */}
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Why did the AI flag this report?
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {analysis.evidence_phrases.map((phrase, i) => (
                    <span key={i} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                      ✓ "{phrase}"
                    </span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.explanation}</p>
              </div>

              {/* Risk factors */}
              <div className="card">
                <button
                  onClick={() => setShowFactors(!showFactors)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-white"
                >
                  <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-blue-400" />Risk Factor Breakdown</span>
                  {showFactors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showFactors && (
                  <div className="mt-3 space-y-3">
                    {analysis.risk_factors.map(f => (
                      <div key={f.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">{f.name}</span>
                          <span className="text-slate-400">{f.score}/{f.max_score}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${(f.score / f.max_score) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended actions */}
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Recommended Actions
                </h3>
                <ol className="space-y-2">
                  {analysis.recommended_actions.slice(0, 6).map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Similar reports */}
              {similarReports.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-white mb-3">Similar Historical Reports ({similarReports.length})</h3>
                  <div className="space-y-2">
                    {similarReports.map(r => (
                      <div key={r.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer">
                        <div className="text-xs text-slate-500 font-mono flex-shrink-0 mt-0.5">{r.id}</div>
                        <p className="text-xs text-slate-300 line-clamp-2 flex-1">{r.report_text}</p>
                        {r.sif_potential && <SIFBadge potential={r.sif_potential} size="sm" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What-if simulator toggle */}
              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className="btn-secondary w-full justify-center text-sm"
              >
                <Sliders className="w-4 h-4" />
                {showSimulator ? 'Hide' : 'Open'} Safety Control Simulator
              </button>

              {showSimulator && analysis && (
                <WhatIfSimulator
                  originalScore={analysis.risk_score}
                  activity={analysis.activity_detected}
                  lsr={analysis.life_saving_rule}
                  barrier={analysis.barrier_failure}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
