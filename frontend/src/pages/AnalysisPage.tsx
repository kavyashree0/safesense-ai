import { useState, useMemo } from 'react';
import { Brain, Play, AlertTriangle, Shield, CheckCircle, Info, Zap, ChevronDown, ChevronUp, Sliders, ArrowRight } from 'lucide-react';
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

    await new Promise(r => setTimeout(r, 800));

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
    <div className="p-6 max-w-6xl mx-auto animate-in bg-[#F8FAFC]">
      <div className="mb-6">
        <h1 className="section-title">AI Report Analysis</h1>
        <p className="section-sub mb-0">Enter a safety observation or select a record to run explainable AI risk scoring and precursor detection.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          {/* Select from dataset */}
          {reports.length > 0 && (
            <div className="card shadow-soft">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Select from Uploaded Dataset</label>
              <select
                value={selectedReportId}
                onChange={e => { setSelectedReportId(e.target.value); setInputText(''); setAnalysis(null); }}
                className="input-field text-sm"
              >
                <option value="">— Choose a dataset report —</option>
                {reports.slice(0, 100).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.report_type} · {r.report_text.slice(0, 60)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Text input */}
          <div className="card shadow-soft">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Or Enter Report Text Manually</label>
            <textarea
              value={inputText}
              onChange={e => { setInputText(e.target.value); setSelectedReportId(''); setAnalysis(null); }}
              className="input-field min-h-[140px] text-sm resize-none"
              placeholder="Paste or type a safety report observation here..."
            />
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Try quick example:</p>
              <div className="space-y-1.5">
                {EXAMPLE_REPORTS.slice(0, 3).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setInputText(ex); setSelectedReportId(''); setAnalysis(null); }}
                    className="block w-full text-left text-xs text-slate-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-200 px-3 py-2 rounded-xl transition-all truncate"
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
            className="btn-primary w-full justify-center py-3 text-base shadow-md"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
            <div className="card border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-cyan-50/30">
              <div className="space-y-2.5">
                {['Tokenizing text...', 'Extracting safety concepts...', 'Identifying life-saving rule...', 'Calculating risk score...', 'Generating explainable breakdown...'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                    <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.15}s` }} />
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
            <div className="card border-dashed border-slate-300 flex flex-col items-center justify-center py-20 text-center bg-white">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-slate-800 font-bold text-base">Analysis Results</p>
              <p className="text-slate-500 text-sm mt-1 max-w-xs">Select or type a safety report on the left and click "Analyze Report" to view insights.</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4 animate-in">
              {/* Risk overview */}
              <div className="card shadow-soft border-t-4 border-t-indigo-600">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <RiskGauge score={analysis.risk_score} size={110} />
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                      <SIFBadge potential={analysis.sif_potential} size="lg" />
                      <RiskBadge level={analysis.risk_level} size="lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[11px] font-bold uppercase block">Activity</span>
                        <span className="text-slate-900 font-bold">{analysis.activity_detected}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[11px] font-bold uppercase block">Hazard</span>
                        <span className="text-slate-900 font-bold">{analysis.hazard_detected}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[11px] font-bold uppercase block">Failed Barrier</span>
                        <span className="text-orange-600 font-bold">{analysis.barrier_failure}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[11px] font-bold uppercase block">Life-Saving Rule</span>
                        <span className="text-indigo-600 font-bold">{analysis.life_saving_rule}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prototype label */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-indigo-50/60 border border-indigo-100 rounded-xl px-3.5 py-2.5">
                <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                Prototype rule-based analysis · Demonstrates automated SIF precursor extraction.
              </div>

              {/* Evidence phrases */}
              <div className="card shadow-soft">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Why did the AI flag this report?
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {analysis.evidence_phrases.map((phrase, i) => (
                    <span key={i} className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-lg text-xs font-semibold shadow-2xs">
                      ✓ "{phrase}"
                    </span>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{analysis.explanation}</p>
              </div>

              {/* Risk factors */}
              <div className="card shadow-soft">
                <button
                  onClick={() => setShowFactors(!showFactors)}
                  className="flex items-center justify-between w-full text-sm font-bold text-slate-900"
                >
                  <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-indigo-600" />Risk Factor Breakdown</span>
                  {showFactors ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {showFactors && (
                  <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
                    {analysis.risk_factors.map(f => (
                      <div key={f.name}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-700">{f.name}</span>
                          <span className="text-indigo-600">{f.score}/{f.max_score}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
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
              <div className="card shadow-soft">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Recommended Corrective Actions
                </h3>
                <ol className="space-y-2">
                  {analysis.recommended_actions.slice(0, 6).map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-indigo-600 font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <span className="font-medium">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Similar reports */}
              {similarReports.length > 0 && (
                <div className="card shadow-soft">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Similar Historical Reports ({similarReports.length})</h3>
                  <div className="space-y-2">
                    {similarReports.map(r => (
                      <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 cursor-pointer transition-colors">
                        <div className="text-xs text-slate-500 font-mono font-semibold flex-shrink-0 mt-0.5">{r.id}</div>
                        <p className="text-xs text-slate-700 line-clamp-2 flex-1">{r.report_text}</p>
                        {r.sif_potential && <SIFBadge potential={r.sif_potential} size="sm" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What-if simulator toggle */}
              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className="btn-secondary w-full justify-center text-sm font-semibold py-2.5"
              >
                <Sliders className="w-4 h-4 text-indigo-600" />
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
