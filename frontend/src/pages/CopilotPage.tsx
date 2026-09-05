import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Database, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CopilotMessage } from '../types';
import { computeSiteRisk, computeActivityRisk, computeBarrierFailures, computePatterns } from '../utils/riskEngine';

const SUGGESTED_QUESTIONS = [
  "What is the biggest safety risk in the dataset?",
  "Which site has the most SIF potential reports?",
  "Show all high-risk confined space reports.",
  "What is the most common failed safety barrier?",
  "Which life-saving rule appears most often?",
  "Which activity is showing the highest risk?",
  "How many critical reports are there?",
  "What are the top recurring safety patterns?",
];

function generateResponse(query: string, reports: ReturnType<typeof useApp>['reports']): { content: string; sourceIds: string[] } {
  if (reports.length === 0) {
    return {
      content: "No dataset is currently loaded. Please upload a safety dataset or use the demo dataset to ask questions about your safety data.",
      sourceIds: []
    };
  }

  const q = query.toLowerCase();
  const sifReports = reports.filter(r => r.sif_potential === 'YES');
  const criticalReports = reports.filter(r => r.severity === 'Critical' || r.risk_level === 'CRITICAL');
  const siteRisks = computeSiteRisk(reports);
  const activityRisks = computeActivityRisk(reports);
  const barriers = computeBarrierFailures(reports);
  const patterns = computePatterns(reports);

  // ─ Biggest risk ─
  if (q.includes('biggest') && (q.includes('risk') || q.includes('danger'))) {
    const topSite = siteRisks[0];
    const topActivity = activityRisks[0];
    const topBarrier = barriers[0];
    return {
      content: `Based on the current dataset of ${reports.length} reports:\n\n` +
        `**Highest-risk site:** ${topSite?.site || 'N/A'} (${topSite?.sif_count || 0} SIF potential reports, risk level: ${topSite?.risk_level || 'N/A'})\n\n` +
        `**Highest-risk activity:** ${topActivity?.activity || 'N/A'} (${topActivity?.sif_count || 0} SIF potential reports, avg risk score: ${topActivity?.avg_risk_score || 0})\n\n` +
        `**Most common barrier failure:** ${topBarrier?.barrier || 'N/A'} (found in ${topBarrier?.count || 0} reports, ${topBarrier?.percentage || 0}% of dataset)\n\n` +
        `**Overall:** ${sifReports.length} reports (${Math.round(sifReports.length / reports.length * 100)}%) show SIF potential, and ${criticalReports.length} are classified as critical.`,
      sourceIds: sifReports.slice(0, 5).map(r => r.id)
    };
  }

  // ─ Site risk ─
  if (q.includes('site') && (q.includes('most') || q.includes('highest') || q.includes('risk'))) {
    if (siteRisks.length === 0 || siteRisks[0].site === 'Unknown') {
      return { content: "Site data is not available in the current dataset. Please ensure your dataset has a site or location column.", sourceIds: [] };
    }
    const top = siteRisks.slice(0, 3);
    const content = `**Top Risk Sites:**\n\n` +
      top.map((s, i) => `${i + 1}. **${s.site}** — ${s.risk_level} risk · ${s.sif_count} SIF potential reports · ${s.total_reports} total reports · Top failure: ${s.top_barrier_failure}`).join('\n\n');
    return { content, sourceIds: sifReports.filter(r => r.site === top[0]?.site).slice(0, 5).map(r => r.id) };
  }

  // ─ Confined space ─
  if (q.includes('confined')) {
    const cs = reports.filter(r => (r.life_saving_rule || '').includes('Confined') || r.report_text.toLowerCase().includes('confined'));
    const csSif = cs.filter(r => r.sif_potential === 'YES');
    return {
      content: `Found **${cs.length} confined space reports** (${csSif.length} with SIF potential).\n\n` +
        `**Key precursor patterns:**\n` +
        `• Atmospheric gas testing not performed or out-of-calibration\n` +
        `• Missing or incomplete confined-space entry permits\n` +
        `• No standby person or emergency retrieval equipment stationed outside\n\n` +
        `**Recommendation:** Enforce permit verification gate before physical entry across all sites.`,
      sourceIds: cs.slice(0, 5).map(r => r.id)
    };
  }

  // ─ Barrier failure ─
  if (q.includes('barrier') || q.includes('control') || q.includes('fail')) {
    const top = barriers.slice(0, 5);
    const content = `**Top Failed Safety Barriers in the Dataset:**\n\n` +
      top.map((b, i) => `${i + 1}. **${b.barrier}** — ${b.count} occurrences (${b.percentage}% of reports)`).join('\n') +
      `\n\n*Barrier failures indicate recurring system weaknesses where safety controls were bypassed, inadequate, or not verified.*`;
    return { content, sourceIds: [] };
  }

  // ─ Life-saving rule ─
  if (q.includes('life-saving') || q.includes('rule') || q.includes('lsr')) {
    const counts: Record<string, number> = {};
    for (const r of reports) {
      if (r.life_saving_rule) counts[r.life_saving_rule] = (counts[r.life_saving_rule] || 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const content = `**Most Frequently Mapped Life-Saving Rules:**\n\n` +
      top.map(([rule, count], i) => `${i + 1}. **${rule}** — ${count} reports (${Math.round(count / reports.length * 100)}%)`).join('\n');
    return { content, sourceIds: [] };
  }

  // ─ Activity ─
  if (q.includes('activity') || q.includes('task') || q.includes('operation')) {
    const top = activityRisks.slice(0, 4);
    const content = `**Highest Risk Activities:**\n\n` +
      top.map((a, i) => `${i + 1}. **${a.activity}** — Avg Risk Score: ${a.avg_risk_score}/100 · ${a.sif_count} SIF potential · Top barrier: ${a.top_barrier_failure}`).join('\n\n');
    return { content, sourceIds: [] };
  }

  // ─ Critical count ─
  if (q.includes('how many') || q.includes('critical') || q.includes('total') || q.includes('count')) {
    return {
      content: `**Dataset Risk Overview:**\n\n` +
        `• **Total reports:** ${reports.length}\n` +
        `• **Critical risk:** ${criticalReports.length} reports\n` +
        `• **SIF potential:** ${sifReports.length} reports (${Math.round(sifReports.length / reports.length * 100)}%)\n` +
        `• **High risk:** ${reports.filter(r => r.severity === 'High' || r.risk_level === 'HIGH').length} reports\n` +
        `• **Medium risk:** ${reports.filter(r => r.severity === 'Medium' || r.risk_level === 'MEDIUM').length} reports\n` +
        `• **Low risk:** ${reports.filter(r => r.severity === 'Low' || r.risk_level === 'LOW').length} reports`,
      sourceIds: criticalReports.slice(0, 5).map(r => r.id)
    };
  }

  // ─ Patterns ─
  if (q.includes('pattern') || q.includes('recurring') || q.includes('trend')) {
    const top = patterns.slice(0, 3);
    const content = `**Top Recurring Safety Patterns:**\n\n` +
      top.map((p, i) => `${i + 1}. **${p.name}** (${p.risk_level} risk)\n   ${p.description}\n   Frequency: ${p.frequency} reports (${p.percentage}% of dataset)`).join('\n\n');
    return { content, sourceIds: [] };
  }

  // ─ Default / fallback ─
  return {
    content: `Based on your query regarding "${query}":\n\n` +
      `The safety dataset contains **${reports.length} reports** with **${sifReports.length} SIF potential precursors** identified.\n\n` +
      `Try asking more specific questions like:\n` +
      `• *"What is the biggest risk?"*\n` +
      `• *"Which site has the most SIF reports?"*\n` +
      `• *"What are the top barrier failures?"*\n` +
      `• *"Show confined space reports."*`,
    sourceIds: sifReports.slice(0, 3).map(r => r.id)
  };
}

export default function CopilotPage() {
  const { reports } = useApp();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your **SafeSense Safety Copilot**. I analyze your uploaded safety reports to answer questions about risk precursors, failed barriers, site comparisons, and life-saving rules.\n\nAsk me anything about your safety dataset or click one of the suggested questions on the right.",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: CopilotMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const { content, sourceIds } = generateResponse(text, reports);
    const assistantMsg: CopilotMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      source_reports: sourceIds,
    };
    setMessages(prev => [...prev, assistantMsg]);
    setLoading(false);
  }

  function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />;
    });
  }

  return (
    <div className="h-full flex flex-col p-6 animate-in bg-[#F8FAFC]">
      <div className="mb-4">
        <h1 className="section-title flex items-center gap-2"><MessageSquare className="w-6 h-6 text-indigo-600" />Safety Copilot</h1>
        <p className="section-sub mb-0">Ask questions about your safety dataset. Responses are generated from uploaded records.</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                  msg.role === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'
                }`}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  <div className={`rounded-2xl px-4 py-3 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-1.5">{renderContent(msg.content)}</div>
                    )}
                  </div>
                  {msg.source_reports && msg.source_reports.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap px-1">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500">Source reports:</span>
                      {msg.source_reports.map(id => (
                        <span key={id} className="text-[11px] bg-white text-indigo-700 border border-slate-200 px-1.5 py-0.5 rounded font-mono shadow-2xs">{id}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-xs">
                  <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm font-medium text-slate-600">Analyzing dataset...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-slate-100 p-3.5 bg-slate-50/50">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                className="input-field flex-1 text-sm bg-white"
                placeholder="Ask a question about safety risks, precursors, sites..."
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="btn-primary px-5">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggested questions sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="card h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Suggested Questions</h3>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-200 px-3 py-2.5 rounded-xl transition-all shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
                <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                AI supports HSE decision-making. Final decisions remain with authorized safety personnel.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
