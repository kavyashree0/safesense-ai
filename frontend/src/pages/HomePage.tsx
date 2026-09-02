import { useNavigate } from 'react-router-dom';
import { Shield, Brain, TrendingUp, AlertTriangle, GitBranch, CheckCircle, ArrowRight, Upload, Database, Play, Zap, Target, Eye, BarChart2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateDemoReports, DEMO_COLUMN_MAPPING } from '../data/demoData';
import { analyzeDatasetQuality } from '../utils/datasetUtils';

const PIPELINE_STEPS = [
  { icon: '📋', label: 'Safety Reports', sub: 'Unsafe Act · Near Miss · Incident' },
  { icon: '🤖', label: 'AI / NLP Engine', sub: 'Text Processing · Entity Extraction' },
  { icon: '⚠️', label: 'Risk Detection', sub: 'SIF Potential · Risk Score' },
  { icon: '📌', label: 'Safety Rule Mapping', sub: 'Life-Saving Rules · Barriers' },
  { icon: '🔁', label: 'Pattern Discovery', sub: 'Recurring Precursors · Clusters' },
  { icon: '✅', label: 'Preventive Action', sub: 'Recommendations · Review' },
];

const REPORT_TYPES = [
  { icon: '⚡', title: 'Unsafe Act', color: 'border-orange-500/40 bg-orange-900/10', textColor: 'text-orange-400', desc: 'A person doing something unsafe — deviation from an established safety procedure or accepted safe practice.' },
  { icon: '🏗️', title: 'Unsafe Condition', color: 'border-yellow-500/40 bg-yellow-900/10', textColor: 'text-yellow-400', desc: 'A physical condition or environment that increases the probability of an accident or incident occurring.' },
  { icon: '🔶', title: 'Near Miss', color: 'border-amber-500/40 bg-amber-900/10', textColor: 'text-amber-400', desc: 'An unplanned event that did not result in injury or damage but had the potential to do so — a warning signal.' },
  { icon: '🚨', title: 'Incident', color: 'border-red-500/40 bg-red-900/10', textColor: 'text-red-400', desc: 'An unplanned event that caused or could have caused injury, illness, or damage. A critical learning opportunity.' },
];

const SIF_EXAMPLES = [
  'Confined-space entry without required atmospheric testing',
  'Maintenance performed without energy isolation (LOTO)',
  'Hot work carried out without a valid permit or fire watch',
  'Worker positioned in the line of fire of a suspended load',
  'Working at height without fall-arrest protection',
  'Exposure to live electrical conductors without isolation',
];

const FEATURES = [
  { icon: Brain, title: 'AI-Powered NLP Analysis', desc: 'Natural language processing reads, understands, and classifies safety observations automatically.' },
  { icon: Target, title: 'SIF Precursor Detection', desc: 'Identifies conditions that may indicate elevated potential for a serious injury or fatality.' },
  { icon: Eye, title: 'Explainable AI', desc: 'Shows exactly which phrases triggered the risk flag and why — no black-box decisions.' },
  { icon: GitBranch, title: 'Pattern Discovery', desc: 'Discovers recurring safety failure patterns across sites and activities using clustering.' },
  { icon: TrendingUp, title: 'Trend Intelligence', desc: 'Detects rising frequencies of safety precursors over time to enable earlier intervention.' },
  { icon: BarChart2, title: 'Executive Dashboard', desc: 'KPI-driven dashboard for HSE leadership to prioritize action and track safety performance.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  function loadDemo() {
    const reports = generateDemoReports();
    const columns = ['report_id','report_type','report_text','activity','location','site','date','severity','sif_potential','life_saving_rule','barrier_failure','recommended_action'];
    const rows = reports.map(r => ({ ...r })) as Record<string, unknown>[];
    const quality = analyzeDatasetQuality(rows, columns, DEMO_COLUMN_MAPPING as never);
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
    <div className="animate-in">
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Enterprise Safety Intelligence Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            From Safety Reports to
            <span className="text-gradient block">Preventive Action</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered safety intelligence for identifying serious-risk precursors before they become serious incidents.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/analysis')} className="btn-primary text-base px-7 py-3">
              <Brain className="w-5 h-5" />
              Analyze a Report
            </button>
            <button onClick={() => navigate('/upload')} className="btn-secondary text-base px-7 py-3">
              <Upload className="w-5 h-5" />
              Upload Dataset
            </button>
            <button onClick={loadDemo} className="btn-secondary text-base px-7 py-3 border border-blue-500/40 text-blue-400 hover:bg-blue-900/20">
              <Database className="w-5 h-5" />
              Explore Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ─── Pipeline ────────────────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-2">How SafeSense AI Works</h2>
          <p className="text-slate-400 text-center mb-10 text-sm">From raw safety report text to actionable intelligence — in seconds.</p>
          <div className="flex flex-wrap justify-center items-center gap-2">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="pipeline-node flex flex-col items-center min-w-[130px] hover:border-blue-400/60 transition-colors cursor-default">
                  <span className="text-2xl mb-1">{step.icon}</span>
                  <span className="font-semibold text-white text-xs">{step.label}</span>
                  <span className="text-slate-500 text-xs mt-0.5">{step.sub}</span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-blue-500/50 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why it matters ──────────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Why Safety Intelligence Matters</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                Organizations receive large volumes of safety observations, unsafe-act reports, near-miss records, and incident reports every day. Critical high-risk information can be buried within large amounts of unstructured text.
              </p>
              <p className="text-slate-400 leading-relaxed mb-6">
                Manual review is slow, inconsistent, and can miss patterns that only become visible across hundreds of reports. SafeSense AI helps safety teams:
              </p>
              <ul className="space-y-2">
                {[
                  'Find high-risk reports faster with AI classification',
                  'Understand why a report is risky with explainable evidence',
                  'Identify repeated precursor patterns across sites',
                  'Detect failed safety controls before they lead to incidents',
                  'Prioritize corrective actions with confidence',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {REPORT_TYPES.map(rt => (
                <div key={rt.title} className={`card border ${rt.color} hover:scale-105 transition-transform cursor-default`}>
                  <div className="text-2xl mb-2">{rt.icon}</div>
                  <div className={`font-bold text-sm mb-1 ${rt.textColor}`}>{rt.title}</div>
                  <p className="text-slate-400 text-xs leading-relaxed">{rt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── What is SIF ─────────────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="card border border-red-500/20 bg-red-900/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-white">What is SIF?</h2>
                  <span className="badge-sif">SIF = Serious Injury or Fatality</span>
                </div>
                <p className="text-slate-300 mb-4 leading-relaxed">
                  A <strong className="text-red-400">SIF precursor</strong> is a warning sign or unsafe condition that may indicate the potential for a serious injury or fatality. SafeSense AI identifies these precursors in safety reports — <em>not</em> to predict that a fatality will definitely occur, but to help safety teams recognize elevated-risk conditions earlier and act preventively.
                </p>
                <div>
                  <p className="text-sm font-semibold text-slate-300 mb-3">Examples of SIF precursors:</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {SIF_EXAMPLES.map((ex, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Platform Capabilities</h2>
          <p className="text-slate-400 text-center text-sm mb-10">Everything an HSE team needs in one intelligent platform.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover group">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-3 group-hover:bg-blue-600/30 transition-colors">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card border-blue-500/30 bg-blue-900/10">
            <Zap className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Start with Demo Data</h2>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Load 250+ synthetic industrial safety reports and see the full platform in action — AI analysis, risk scoring, pattern discovery, early warnings, and corrective actions.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full mb-5">
              ⚠ Synthetic Demo Data — Not Real Organizational Data
            </div>
            <br />
            <button onClick={loadDemo} className="btn-primary mx-auto text-base px-8 py-3">
              <Play className="w-5 h-5" />
              Start Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-white">SafeSense AI</span>
        </div>
        <p className="text-slate-500 text-xs">Enterprise Safety Intelligence Platform · AI supports HSE decision-making. Final decisions remain with authorized safety personnel.</p>
      </footer>
    </div>
  );
}
