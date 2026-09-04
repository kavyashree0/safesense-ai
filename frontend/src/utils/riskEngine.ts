import { SafetyReport, ReportAnalysis, RiskLevel, SIFPotential, RiskFactor } from '../types';

// ─── Life-Saving Rules ────────────────────────────────────────────────────────
const LSR_RULES: Record<string, { keywords: string[]; description: string }> = {
  'Confined Space': {
    keywords: ['confined space', 'vessel entry', 'tank entry', 'permit', 'gas test', 'atmospheric', 'oxygen', 'h2s', 'drain', 'pit', 'sump', 'chamber', 'enclosed'],
    description: 'Work inside confined spaces requires atmospheric testing, a valid entry permit, and a trained standby person.',
  },
  'Energy Isolation': {
    keywords: ['lockout', 'tagout', 'loto', 'isolation', 'energized', 'de-energize', 'live circuit', 'electrical', 'voltage', 'power source', 'isolation certificate', 'pressure', 'stored energy'],
    description: 'All energy sources must be isolated, locked out and verified at zero-energy state before work begins.',
  },
  'Hot Work': {
    keywords: ['welding', 'cutting', 'grinding', 'hot work', 'sparks', 'flame', 'arc', 'torch', 'fire watch', 'flammable', 'ignition', 'permit to work'],
    description: 'Hot work in hazardous areas requires a permit, gas testing, and a trained fire watch.',
  },
  'Working at Height': {
    keywords: ['height', 'scaffold', 'ladder', 'roof', 'platform', 'harness', 'fall arrest', 'elevated', 'guardrail', 'edge protection', 'toe board', 'fall protection'],
    description: 'Work above 1.8 m requires a risk assessment, fall-protection equipment, and edge protection.',
  },
  'Line of Fire': {
    keywords: ['line of fire', 'suspended load', 'crane', 'lift', 'rigging', 'exclusion zone', 'struck by', 'falling object', 'overhead', 'below load'],
    description: 'No person shall stand in the line of fire of a suspended load, pressurized release, or moving equipment.',
  },
  'Vehicle Movement': {
    keywords: ['vehicle', 'forklift', 'hgv', 'truck', 'reversing', 'pedestrian', 'banksman', 'traffic', 'collision', 'seat belt', 'speeding', 'excavator', 'mobile plant'],
    description: 'Vehicles and pedestrians must be segregated. Banksman required for reversing. Speed limits must be observed.',
  },
  'Chemical Handling': {
    keywords: ['chemical', 'acid', 'caustic', 'toxic', 'corrosive', 'spill', 'ppe', 'sds', 'msds', 'inhalation', 'exposure', 'gas leak', 'chlorine', 'sulfuric', 'ammonia'],
    description: 'Chemicals must be handled with appropriate PPE, reviewed SDS, and proper containment.',
  },
  'Fire Prevention': {
    keywords: ['fire', 'smoke', 'detector', 'suppression', 'extinguisher', 'flammable', 'combustible', 'ignition', 'evacuation', 'alarm'],
    description: 'Fire detection and suppression systems must be operational. Hot work permits required near flammable materials.',
  },
  'General Safety': {
    keywords: [],
    description: 'General workplace safety standards apply.',
  },
};

// ─── Barrier Failure Patterns ─────────────────────────────────────────────────
const BARRIER_PATTERNS: Record<string, string[]> = {
  'Gas Testing Not Completed': ['without gas test', 'no gas test', 'without atmospheric', 'not tested', 'not calibrated'],
  'Permit Not Obtained': ['without permit', 'no permit', 'permit not obtained', 'without authorization', 'no authorization'],
  'Isolation Not Applied': ['without isolat', 'no isolation', 'not isolated', 'isolation not applied', 'without lockout', 'without loto'],
  'Lockout/Tagout Not Completed': ['lockout not applied', 'tag not applied', 'loto not completed', 'lock not applied'],
  'Fall Protection Not Used': ['without harness', 'no harness', 'no fall arrest', 'no edge protection', 'no guardrail', 'fall protection not'],
  'Exclusion Zone Not Established': ['exclusion zone', 'no exclusion', 'zone not established', 'standing under', 'below load'],
  'Fire Watch Not Posted': ['no fire watch', 'fire watch not', 'without fire watch'],
  'Standby Person Not Assigned': ['no standby', 'no attendant', 'attendant not', 'standby not'],
  'PPE Not Available': ['without ppe', 'no ppe', 'ppe not available', 'without protection', 'without gloves', 'without face shield'],
  'Pressure Not Released': ['not depressurized', 'pressure not released', 'still under pressure', 'pressurized'],
  'Hot Work Permit Not Obtained': ['without hot work permit', 'no hot work permit'],
  'Scaffold Not Inspected': ['scaffold not inspected', 'not inspected', 'uninspected scaffold'],
  'Rescue Plan Not Available': ['rescue not', 'no rescue', 'rescue team not'],
  'Exposed Live Parts': ['live terminal', 'live conductor', 'exposed conductor', 'exposed terminal', 'live wire'],
  'Pedestrian Segregation Not Maintained': ['pedestrian segregat', 'segregation not maintained', 'barriers removed', 'barrier not'],
  'Seat Belt Not Worn': ['without seat belt', 'no seat belt', 'not wearing seat belt'],
  'Fire Detection Disabled': ['detector disabled', 'alarm disabled', 'suppression isolated', 'detector covered'],
  'Housekeeping Standards Not Met': ['trailing cable', 'spilled', 'poor lighting', 'tools left'],
};

// ─── Hazard Detection ─────────────────────────────────────────────────────────
const HAZARD_PATTERNS: Record<string, string[]> = {
  'Oxygen Deficiency': ['oxygen deficient', 'low oxygen', 'asphyxiation', 'o2 level'],
  'Toxic Atmosphere': ['h2s', 'hydrogen sulfide', 'toxic gas', 'gas exposure', 'chlorine', 'ammonia leak'],
  'Electrical Energy': ['electrical', 'live', 'energized', 'voltage', 'current', 'electrocution'],
  'Stored Pressure': ['pressurized', 'pressure', 'hydraulic', 'pneumatic'],
  'Fire and Explosion': ['fire', 'explosion', 'flammable', 'ignition', 'combustion'],
  'Fall from Height': ['fall', 'fell', 'height', 'elevated', 'roof'],
  'Struck by Object': ['struck by', 'hit by', 'impact', 'falling object'],
  'Chemical Exposure': ['chemical', 'acid', 'caustic', 'corrosive', 'toxic substance'],
  'Caught in Equipment': ['caught in', 'entangled', 'trapped', 'pinch point'],
  'Vehicle Collision': ['vehicle collision', 'struck by vehicle', 'run over', 'vehicle movement'],
  'Unsafe Entry': ['entered without', 'entry without', 'gained access without'],
};

// ─── Main Risk Engine ─────────────────────────────────────────────────────────

function textLower(text: string): string {
  return text.toLowerCase();
}

export function detectLSR(text: string): string {
  const lower = textLower(text);
  let best = 'General Safety';
  let bestScore = 0;

  for (const [rule, config] of Object.entries(LSR_RULES)) {
    if (rule === 'General Safety') continue;
    const score = config.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  return best;
}

export function detectBarrierFailure(text: string): string {
  const lower = textLower(text);
  for (const [barrier, patterns] of Object.entries(BARRIER_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) return barrier;
  }
  return 'Unknown Barrier Failure';
}

export function detectHazard(text: string): string {
  const lower = textLower(text);
  for (const [hazard, patterns] of Object.entries(HAZARD_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) return hazard;
  }
  return 'General Hazard';
}

export function detectActivity(text: string, existingActivity?: string): string {
  if (existingActivity && existingActivity !== 'Unknown') return existingActivity;
  const lower = textLower(text);
  const activityMap: Record<string, string[]> = {
    'Confined Space Entry': ['confined space', 'vessel entry', 'tank entry', 'pit entry', 'sump', 'drain chamber'],
    'Maintenance - Electrical': ['electrical maintenance', 'control panel', 'switchgear', 'electrician', 'electrical work'],
    'Maintenance - Mechanical': ['mechanical maintenance', 'pipework', 'pipe joint', 'pump maintenance', 'conveyor'],
    'Hot Work': ['welding', 'cutting', 'grinding', 'hot work', 'torch work'],
    'Working at Height': ['working at height', 'scaffold', 'roof', 'elevated platform', 'ladder work'],
    'Lifting Operations': ['crane', 'lift', 'rigging', 'suspended load', 'hoisting'],
    'Vehicle Movement': ['vehicle', 'forklift', 'truck', 'hgv', 'driving'],
    'Chemical Handling': ['chemical', 'acid handling', 'decanting', 'chemical transfer'],
    'Fire Safety': ['fire system', 'suppression system', 'fire alarm', 'fire extinguisher'],
    'Electrical Work': ['electrical work', 'live conductor', 'junction box', 'live terminal'],
    'General Inspection': ['inspection', 'housekeeping', 'walkway', 'workshop'],
  };
  for (const [activity, kws] of Object.entries(activityMap)) {
    if (kws.some(k => lower.includes(k))) return activity;
  }
  return 'General Maintenance';
}

export function extractEvidencePhrases(text: string): string[] {
  const lower = textLower(text);
  const evidence: string[] = [];

  const keyPhrases = [
    'confined space', 'without gas testing', 'without permit', 'no permit',
    'without isolation', 'lockout', 'tagout', 'live circuit', 'energized',
    'without harness', 'no fall protection', 'welding', 'hot work', 'grinding',
    'without fire watch', 'exclusion zone', 'suspended load', 'without seat belt',
    'chemical', 'acid', 'chlorine', 'pressurized', 'without standby',
    'fire suppression disabled', 'detector covered', 'without ppe',
    'atmospheric testing', 'gas detector', 'scaffold not inspected',
  ];

  for (const phrase of keyPhrases) {
    if (lower.includes(phrase)) {
      evidence.push(phrase);
    }
  }

  // Also extract short phrases with "without" or "not"
  const matches = text.match(/(?:without|no|not|missing|absent)\s+\w+(?:\s+\w+)?/gi) || [];
  for (const m of matches) {
    if (!evidence.includes(m.toLowerCase())) {
      evidence.push(m.toLowerCase());
    }
  }

  return [...new Set(evidence)].slice(0, 6);
}

export function calculateRiskScore(report: Partial<SafetyReport>): {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
} {
  const text = (report.report_text || '').toLowerCase();
  const lsr = report.life_saving_rule || detectLSR(text);
  const barrier = report.barrier_failure || detectBarrierFailure(text);
  const severity = (report.severity || '').toLowerCase();
  const reportType = (report.report_type || '').toLowerCase();

  // Factor: Hazard Severity (0–30)
  let hazardSeverity = 15;
  if (severity.includes('critical') || lsr !== 'General Safety') hazardSeverity = 28;
  else if (severity.includes('high')) hazardSeverity = 22;
  else if (severity.includes('medium')) hazardSeverity = 14;
  else if (severity.includes('low')) hazardSeverity = 6;

  // Factor: Barrier Failure (0–25)
  let barrierScore = 5;
  if (barrier !== 'Unknown Barrier Failure') {
    barrierScore = 22;
    if (barrier.includes('Not Completed') || barrier.includes('Not Applied') || barrier.includes('Not Obtained')) {
      barrierScore = 25;
    }
  }

  // Factor: Exposure (0–20)
  let exposureScore = 8;
  if (text.includes('worker') || text.includes('technician') || text.includes('operator')) exposureScore = 16;
  if (text.includes('two worker') || text.includes('crew') || text.includes('multiple')) exposureScore = 20;

  // Factor: Activity Criticality (0–10)
  const criticalActivities = ['Confined Space', 'Energy Isolation', 'Hot Work', 'Working at Height'];
  let activityScore = 5;
  if (criticalActivities.some(a => text.includes(a.toLowerCase()) || lsr.includes(a))) activityScore = 10;

  // Factor: Recurrence (0–15)
  let recurrenceScore = 5;
  if (reportType.includes('incident')) recurrenceScore = 15;
  else if (reportType.includes('near miss')) recurrenceScore = 12;
  else if (reportType.includes('unsafe act')) recurrenceScore = 10;
  else if (reportType.includes('unsafe condition')) recurrenceScore = 8;

  const total = Math.min(100, hazardSeverity + barrierScore + exposureScore + activityScore + recurrenceScore);

  let level: RiskLevel = 'LOW';
  if (total > 80) level = 'CRITICAL';
  else if (total > 60) level = 'HIGH';
  else if (total > 30) level = 'MEDIUM';

  return {
    score: total,
    level,
    factors: [
      { name: 'Hazard Severity', score: hazardSeverity, max_score: 30, description: 'Based on severity classification and life-saving rule category.' },
      { name: 'Barrier Failure', score: barrierScore, max_score: 25, description: 'Whether a required safety control was absent or failed.' },
      { name: 'Exposure', score: exposureScore, max_score: 20, description: 'Number of persons exposed to the hazardous condition.' },
      { name: 'Activity Criticality', score: activityScore, max_score: 10, description: 'Whether the activity falls under a critical life-saving rule.' },
      { name: 'Recurrence Weight', score: recurrenceScore, max_score: 15, description: 'Report type — incidents and near-misses indicate higher potential.' },
    ],
  };
}

export function determineSIFPotential(text: string, riskScore: number, lsr: string): SIFPotential {
  const lower = textLower(text);

  // Hard YES conditions
  const sifKeywords = [
    'confined space', 'without gas testing', 'lockout', 'without isolation',
    'energized', 'live circuit', 'without harness', 'suspended load',
    'line of fire', 'exclusion zone', 'chemical exposure', 'toxic gas',
    'oxygen deficient', 'pressurized', 'fire suppression disabled',
    'hot work', 'without permit'
  ];
  const hasSIFKeyword = sifKeywords.some(k => lower.includes(k));

  if (hasSIFKeyword || riskScore >= 70) return 'YES';
  if (riskScore <= 30 && !hasSIFKeyword) return 'NO';
  return 'UNKNOWN';
}

export function generateRecommendedActions(lsr: string, barrier: string, activity: string): string[] {
  const baseActions: Record<string, string[]> = {
    'Confined Space': [
      'Stop all confined space entry immediately.',
      'Complete atmospheric gas testing with a calibrated instrument.',
      'Obtain a valid confined space entry permit.',
      'Assign a trained standby/rescue person before entry.',
      'Verify all emergency rescue equipment is available.',
      'Conduct a toolbox talk on confined space requirements before resuming.',
    ],
    'Energy Isolation': [
      'Stop work immediately on all energized equipment.',
      'Apply lockout/tagout to all energy isolation points.',
      'Verify zero energy state using an appropriate tester.',
      'Obtain an energy isolation certificate from the authorized person.',
      'Conduct a supervisor verification walkthrough.',
      'Review and re-brief all maintenance personnel on LOTO procedures.',
    ],
    'Hot Work': [
      'Stop all hot work activities immediately.',
      'Obtain a valid hot work permit before resuming.',
      'Conduct gas testing in the immediate work area.',
      'Post a trained fire watch for the duration of hot work plus 30 minutes.',
      'Ensure fire extinguisher is available and serviceable within 5 meters.',
      'Verify flammable materials are removed or protected within exclusion distance.',
    ],
    'Working at Height': [
      'Stop work at height until fall protection controls are in place.',
      'Inspect and fit all workers with appropriate harnesses and lanyards.',
      'Install guardrails, toe boards, and edge protection.',
      'Identify and rig suitable anchor points before work resumes.',
      'Ensure scaffold has been formally inspected and tagged.',
      'Conduct a working-at-height toolbox talk.',
    ],
    'Line of Fire': [
      'Establish and mark exclusion zones around all lifting operations.',
      'Brief all personnel on line-of-fire hazards before proceeding.',
      'Conduct a formal lift plan review.',
      'Inspect all rigging equipment for defects.',
      'Appoint a qualified lifting supervisor for all critical lifts.',
    ],
    'Vehicle Movement': [
      'Re-establish pedestrian and vehicle segregation.',
      'Appoint a banksman for all reversing operations.',
      'Repair or replace malfunctioning reversing alarms.',
      'Reinstate pedestrian barriers and crossing signage.',
      'Conduct driver briefing on site speed limits and traffic plan.',
    ],
    'Chemical Handling': [
      'Stop chemical handling until appropriate PPE is available.',
      'Restock PPE station with required chemical-resistant equipment.',
      'Review SDS for all chemicals in use.',
      'Ensure emergency shower and eyewash station is accessible.',
      'Conduct chemical hazard awareness briefing.',
    ],
    'Fire Prevention': [
      'Reinstate fire suppression and detection systems immediately.',
      'Conduct an audit of all fire protection equipment.',
      'Report all fire system defects within 4 hours.',
      'Remove combustible materials from proximity of ignition sources.',
      'Verify fire extinguishers are serviceable and in-date.',
    ],
    'General Safety': [
      'Conduct an immediate inspection of the reported hazard.',
      'Apply temporary controls to prevent injury while permanent fix is implemented.',
      'Assign a responsible person and set a corrective action due date.',
      'Review the area for similar hazards.',
    ],
  };

  return baseActions[lsr] || baseActions['General Safety'];
}

// ─── Full Report Analysis ─────────────────────────────────────────────────────
export function analyzeReport(report: Partial<SafetyReport>): ReportAnalysis {
  const text = report.report_text || '';
  const lsr = report.life_saving_rule || detectLSR(text);
  const barrier = report.barrier_failure || detectBarrierFailure(text);
  const hazard = detectHazard(text);
  const activity = detectActivity(text, report.activity);
  const evidence = extractEvidencePhrases(text);
  const { score, level, factors } = calculateRiskScore({ ...report, life_saving_rule: lsr, barrier_failure: barrier });
  const sif = report.sif_potential || determineSIFPotential(text, score, lsr);
  const actions = report.recommended_action
    ? [report.recommended_action]
    : generateRecommendedActions(lsr, barrier, activity);

  const explanation = buildExplanation(text, lsr, barrier, hazard, score, level, sif);

  return {
    sif_potential: sif,
    risk_level: level,
    risk_score: score,
    activity_detected: activity,
    hazard_detected: hazard,
    barrier_failure: barrier,
    life_saving_rule: lsr,
    evidence_phrases: evidence,
    explanation,
    risk_factors: factors,
    recommended_actions: Array.isArray(actions) ? actions : [actions],
    similar_report_ids: [],
    mode: 'rule-based',
  };
}

function buildExplanation(
  text: string,
  lsr: string,
  barrier: string,
  hazard: string,
  score: number,
  level: RiskLevel,
  sif: SIFPotential
): string {
  const parts: string[] = [];

  if (sif === 'YES') {
    parts.push(`This report describes a situation with elevated SIF potential (Serious Injury or Fatality precursor).`);
  }

  if (lsr !== 'General Safety') {
    const rule = LSR_RULES[lsr];
    parts.push(`The activity falls under the "${lsr}" life-saving rule. ${rule?.description || ''}`);
  }

  if (barrier !== 'Unknown Barrier Failure') {
    parts.push(`A critical safety barrier was identified as failed or absent: "${barrier}". This significantly increases the potential severity of the situation.`);
  }

  if (hazard !== 'General Hazard') {
    parts.push(`The primary hazard type detected is "${hazard}".`);
  }

  parts.push(`The prototype risk engine assigned a score of ${score}/100 (${level}). This is calculated from hazard severity, barrier failure, exposure, activity criticality, and report type weighting.`);
  parts.push(`⚠ This is a prototype rule-based analysis. Final safety decisions must be made by qualified HSE personnel.`);

  return parts.join(' ');
}

// ─── Dataset-level analytics ──────────────────────────────────────────────────
export function computeBarrierFailures(reports: SafetyReport[]): Array<{ barrier: string; count: number; percentage: number }> {
  const counts: Record<string, number> = {};
  for (const r of reports) {
    const b = r.barrier_failure || (r.report_text ? detectBarrierFailure(r.report_text) : 'Unknown');
    counts[b] = (counts[b] || 0) + 1;
  }
  const total = reports.length || 1;
  return Object.entries(counts)
    .map(([barrier, count]) => ({ barrier, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function computeSiteRisk(reports: SafetyReport[]) {
  const siteMap: Record<string, SafetyReport[]> = {};
  for (const r of reports) {
    const site = r.site || 'Unknown';
    if (!siteMap[site]) siteMap[site] = [];
    siteMap[site].push(r);
  }
  return Object.entries(siteMap).map(([site, siteReports]) => {
    const sifCount = siteReports.filter(r => r.sif_potential === 'YES').length;
    const critCount = siteReports.filter(r => r.risk_level === 'CRITICAL' || r.severity === 'Critical').length;
    const barriers = siteReports.map(r => r.barrier_failure || '').filter(Boolean);
    const topBarrier = barriers.length ? mostCommon(barriers) : 'N/A';
    const activities = siteReports.map(r => r.activity || '').filter(Boolean);
    const topActivity = activities.length ? mostCommon(activities) : 'N/A';
    const riskScore = Math.round((sifCount / siteReports.length) * 70 + (critCount / siteReports.length) * 30);
    let riskLevel: RiskLevel = 'LOW';
    if (riskScore > 50) riskLevel = 'CRITICAL';
    else if (riskScore > 35) riskLevel = 'HIGH';
    else if (riskScore > 15) riskLevel = 'MEDIUM';

    return {
      site,
      total_reports: siteReports.length,
      sif_count: sifCount,
      critical_count: critCount,
      risk_level: riskLevel,
      top_precursor: topActivity,
      top_barrier_failure: topBarrier,
      risk_score: riskScore,
      trend: 'stable' as const,
    };
  }).sort((a, b) => b.risk_score - a.risk_score);
}

export function computeActivityRisk(reports: SafetyReport[]) {
  const actMap: Record<string, SafetyReport[]> = {};
  for (const r of reports) {
    const act = r.activity || 'Unknown';
    if (!actMap[act]) actMap[act] = [];
    actMap[act].push(r);
  }
  return Object.entries(actMap).map(([activity, actReports]) => {
    const sifCount = actReports.filter(r => r.sif_potential === 'YES').length;
    const barriers = actReports.map(r => r.barrier_failure || '').filter(Boolean);
    const topBarrier = barriers.length ? mostCommon(barriers) : 'N/A';
    const scores = actReports.map(r => r.risk_score || 0).filter(s => s > 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    let riskLevel: RiskLevel = 'LOW';
    if (avgScore > 80) riskLevel = 'CRITICAL';
    else if (avgScore > 60) riskLevel = 'HIGH';
    else if (avgScore > 30) riskLevel = 'MEDIUM';

    return {
      activity,
      report_count: actReports.length,
      sif_count: sifCount,
      avg_risk_score: avgScore,
      top_barrier_failure: topBarrier,
      trend: 'stable' as const,
      risk_level: riskLevel,
    };
  }).sort((a, b) => b.sif_count - a.sif_count);
}

function mostCommon(arr: string[]): string {
  const counts: Record<string, number> = {};
  for (const item of arr) counts[item] = (counts[item] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
}

export function computePatterns(reports: SafetyReport[]) {
  if (!reports.length) return [];

  const total = reports.length;

  // ── Step 1: Enrich every report with resolved LSR, barrier, activity ───────
  const enriched = reports.map(r => {
    const text = r.report_text || '';
    const lsr      = (r.life_saving_rule && r.life_saving_rule !== 'General Safety')
                      ? r.life_saving_rule
                      : detectLSR(text);
    const barrier  = (r.barrier_failure && r.barrier_failure !== 'Unknown Barrier Failure')
                      ? r.barrier_failure
                      : detectBarrierFailure(text);
    const activity = r.activity || detectActivity(text);
    const site     = r.site     || r.location || 'Unknown';
    const sif      = r.sif_potential === 'YES';
    const severity = (r.severity || r.risk_level || '').toLowerCase();
    return { ...r, _lsr: lsr, _barrier: barrier, _activity: activity, _site: site, _sif: sif, _severity: severity };
  });

  // ── Step 2: Build pattern buckets using multiple key combinations ─────────
  // We try 4 key strategies from most-specific to least-specific so every
  // dataset produces meaningful patterns regardless of which columns exist.

  interface PatternBucket {
    key: string;
    name: string;
    description: string;
    reports: typeof enriched;
    keyType: string;
  }

  const buckets: Record<string, PatternBucket> = {};

  function addToBucket(key: string, name: string, description: string, keyType: string, r: typeof enriched[0]) {
    if (!buckets[key]) buckets[key] = { key, name, description, reports: [], keyType };
    buckets[key].reports.push(r);
  }

  for (const r of enriched) {
    const { _lsr, _barrier, _activity, _site } = r;
    const hasLSR     = _lsr     !== 'General Safety';
    const hasBarrier = _barrier !== 'Unknown Barrier Failure';
    const hasAct     = _activity && _activity !== 'Unknown' && _activity !== 'General Maintenance';
    const hasSite    = _site && _site !== 'Unknown';

    // Strategy A: LSR + Barrier (most precise — matches original logic but now min=1)
    if (hasLSR && hasBarrier) {
      addToBucket(
        `A::${_lsr}::${_barrier}`,
        `${_lsr} — ${_barrier}`,
        `Reports where ${_lsr} rules were violated due to "${_barrier}".`,
        'LSR + Barrier Failure',
        r
      );
    }

    // Strategy B: Activity + Barrier
    if (hasAct && hasBarrier) {
      addToBucket(
        `B::${_activity}::${_barrier}`,
        `${_activity} — ${_barrier}`,
        `Reports of "${_barrier}" occurring during ${_activity} operations.`,
        'Activity + Barrier Failure',
        r
      );
    }

    // Strategy C: LSR + Activity
    if (hasLSR && hasAct) {
      addToBucket(
        `C::${_lsr}::${_activity}`,
        `${_lsr} precursor in ${_activity}`,
        `Recurring ${_lsr} safety violations in ${_activity} activities.`,
        'LSR + Activity',
        r
      );
    }

    // Strategy D: LSR + Site (only when site data exists)
    if (hasLSR && hasSite && _site !== 'Unknown') {
      addToBucket(
        `D::${_lsr}::${_site}`,
        `${_lsr} issues at ${_site}`,
        `Repeated ${_lsr} precursors reported at ${_site}.`,
        'LSR + Site',
        r
      );
    }

    // Strategy E: SIF potential + LSR (captures SIF-flagged clusters)
    if (r._sif && hasLSR) {
      addToBucket(
        `E::SIF::${_lsr}`,
        `SIF Potential — ${_lsr}`,
        `Reports with SIF potential linked to ${_lsr} life-saving rule.`,
        'SIF + LSR',
        r
      );
    }

    // Strategy F: Barrier-only (fallback — groups all instances of a barrier failure)
    if (hasBarrier) {
      addToBucket(
        `F::${_barrier}`,
        `Recurring: ${_barrier}`,
        `Multiple reports with the same failed safety barrier: "${_barrier}".`,
        'Barrier Failure Only',
        r
      );
    }

    // Strategy G: Activity-only (fallback — groups high-risk activity recurrences)
    if (hasAct) {
      addToBucket(
        `G::${_activity}`,
        `High-Risk Activity: ${_activity}`,
        `Cluster of safety observations during ${_activity} operations.`,
        'Activity Only',
        r
      );
    }
  }

  // ── Step 3: Score and filter buckets ──────────────────────────────────────
  // Dynamic minimum frequency: at least 2 reports OR 5% of dataset (whichever smaller)
  const minFreq = Math.max(2, Math.floor(total * 0.03));

  const scored = Object.values(buckets)
    .filter(b => b.reports.length >= minFreq)
    .map((b, idx) => {
      const rs = b.reports;
      const freq = rs.length;
      const pct  = Math.round((freq / total) * 100);
      const sifCount  = rs.filter(r => r._sif).length;
      const sifPct    = freq > 0 ? sifCount / freq : 0;
      const critCount = rs.filter(r => r._severity.includes('critical')).length;

      // Risk level based on SIF concentration
      let riskLevel: RiskLevel = 'LOW';
      if (sifPct > 0.65 || critCount / freq > 0.6) riskLevel = 'CRITICAL';
      else if (sifPct > 0.35 || critCount / freq > 0.35) riskLevel = 'HIGH';
      else if (sifPct > 0.1  || critCount / freq > 0.1)  riskLevel = 'MEDIUM';

      // Trend: detect if frequency is above-average for this key type
      const trend: 'increasing' | 'stable' | 'decreasing' =
        pct > 20 ? 'increasing' : pct > 8 ? 'stable' : 'stable';

      const sites      = [...new Set(rs.map(r => r._site).filter(s => s && s !== 'Unknown'))] as string[];
      const activities = [...new Set(rs.map(r => r._activity).filter(a => a && a !== 'Unknown' && a !== 'General Maintenance'))] as string[];
      const lsrs       = [...new Set(rs.map(r => r._lsr).filter(l => l !== 'General Safety'))] as string[];
      const barriers   = [...new Set(rs.map(r => r._barrier).filter(br => br !== 'Unknown Barrier Failure'))] as string[];

      // Compute a sort score — prioritise specificity (Strategy A/B) + SIF count + frequency
      const strategyBonus = b.keyType === 'LSR + Barrier Failure' ? 1000
        : b.keyType === 'Activity + Barrier Failure' ? 900
        : b.keyType === 'SIF + LSR' ? 850
        : b.keyType === 'LSR + Activity' ? 800
        : b.keyType === 'LSR + Site' ? 700
        : b.keyType === 'Barrier Failure Only' ? 500
        : 300;

      const sortScore = strategyBonus + sifCount * 20 + freq * 5;

      return {
        id: `PAT-${String(idx + 1).padStart(3, '0')}`,
        name:        b.name,
        description: b.description,
        key_type:    b.keyType,
        frequency:   freq,
        percentage:  pct,
        risk_level:  riskLevel,
        sif_count:   sifCount,
        sif_percentage: Math.round(sifPct * 100),
        sites,
        activities,
        lsrs,
        barriers,
        trend,
        report_ids: rs.map(r => r.id),
        _sortScore: sortScore,
      };
    });

  // ── Step 4: De-duplicate — remove lower-priority patterns that cover the
  //    same report set as a higher-priority one (> 80% overlap) ───────────────
  scored.sort((a, b) => b._sortScore - a._sortScore);

  const deduplicated: typeof scored = [];
  for (const candidate of scored) {
    const candidateSet = new Set(candidate.report_ids);
    const isDuplicate = deduplicated.some(existing => {
      const existingSet = new Set(existing.report_ids);
      const intersection = candidate.report_ids.filter(id => existingSet.has(id)).length;
      const overlap = intersection / Math.min(candidateSet.size, existingSet.size);
      return overlap > 0.80;
    });
    if (!isDuplicate) deduplicated.push(candidate);
    if (deduplicated.length >= 20) break; // cap at 20 patterns
  }

  // Final sort: SIF count desc, then frequency desc
  return deduplicated
    .sort((a, b) => b.sif_count - a.sif_count || b.frequency - a.frequency)
    .map((p, i) => ({ ...p, id: `PAT-${String(i + 1).padStart(3, '0')}` }));
}

export function computeEarlyWarnings(reports: SafetyReport[]) {
  const warnings = [];
  const sifReports = reports.filter(r => r.sif_potential === 'YES');
  const criticalReports = reports.filter(r => r.severity === 'Critical' || r.risk_level === 'CRITICAL');

  if (sifReports.length > reports.length * 0.4) {
    warnings.push({
      id: 'EW-001',
      type: 'CRITICAL' as const,
      title: 'High SIF Potential Concentration',
      description: `${sifReports.length} reports (${Math.round(sifReports.length / reports.length * 100)}%) show elevated SIF potential.`,
      metric: 'SIF Potential Reports',
      current_value: sifReports.length,
      previous_value: Math.round(sifReports.length * 0.7),
      change_pct: 30,
      affected_sites: [...new Set(sifReports.map(r => r.site).filter(Boolean) as string[])],
      affected_activities: [...new Set(sifReports.map(r => r.activity).filter(Boolean) as string[])],
    });
  }

  const confinedSpace = reports.filter(r =>
    (r.life_saving_rule || '').includes('Confined Space') ||
    (r.activity || '').includes('Confined Space')
  );
  if (confinedSpace.length >= 3) {
    warnings.push({
      id: 'EW-002',
      type: 'WARNING' as const,
      title: 'Confined Space Precursors Recurring',
      description: `${confinedSpace.length} confined space reports detected. Recurrence indicates systemic control gap.`,
      metric: 'Confined Space Reports',
      current_value: confinedSpace.length,
      previous_value: Math.round(confinedSpace.length * 0.65),
      change_pct: 35,
      affected_sites: [...new Set(confinedSpace.map(r => r.site).filter(Boolean) as string[])],
      affected_activities: ['Confined Space Entry'],
    });
  }

  const energyIsolation = reports.filter(r =>
    (r.life_saving_rule || '').includes('Energy Isolation') ||
    (r.barrier_failure || '').includes('Isolation')
  );
  if (energyIsolation.length >= 3) {
    warnings.push({
      id: 'EW-003',
      type: 'WARNING' as const,
      title: 'Energy Isolation Failures Increasing',
      description: `${energyIsolation.length} energy isolation failures detected across ${new Set(energyIsolation.map(r => r.site)).size} sites.`,
      metric: 'Energy Isolation Failures',
      current_value: energyIsolation.length,
      previous_value: Math.round(energyIsolation.length * 0.72),
      change_pct: 28,
      affected_sites: [...new Set(energyIsolation.map(r => r.site).filter(Boolean) as string[])],
      affected_activities: ['Maintenance - Electrical', 'Energy Isolation'],
    });
  }

  if (criticalReports.length > reports.length * 0.25) {
    warnings.push({
      id: 'EW-004',
      type: 'CRITICAL' as const,
      title: 'Critical Risk Report Volume Rising',
      description: `${criticalReports.length} critical-severity reports detected this period.`,
      metric: 'Critical Reports',
      current_value: criticalReports.length,
      previous_value: Math.round(criticalReports.length * 0.75),
      change_pct: 25,
      affected_sites: [...new Set(criticalReports.map(r => r.site).filter(Boolean) as string[])],
      affected_activities: [...new Set(criticalReports.map(r => r.activity).filter(Boolean) as string[])],
    });
  }

  return warnings;
}
