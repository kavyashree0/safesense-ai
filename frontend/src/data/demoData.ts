import { SafetyReport, ReportType } from '../types';

// ─── Synthetic Demo Data Generator ───────────────────────────────────────────
// All data is synthetic and does NOT represent real organizational incidents.

const SITES = ['Site Alpha', 'Site Beta', 'Site Gamma', 'Site Delta', 'Site Epsilon'];
const LOCATIONS = ['Unit 3 Process Area', 'Substation B', 'Tank Farm North', 'Maintenance Bay', 'Workshop 2', 'Pump House', 'Reactor Area', 'Loading Bay', 'Compressor House', 'Utilities Block'];

const reportTemplates: Array<{
  report_type: ReportType;
  activity: string;
  life_saving_rule: string;
  barrier_failure: string;
  sif_potential: 'YES' | 'NO';
  severity: string;
  texts: string[];
  recommended_action: string;
}> = [
  {
    report_type: 'Unsafe Act',
    activity: 'Confined Space Entry',
    life_saving_rule: 'Confined Space',
    barrier_failure: 'Gas Testing Not Completed',
    sif_potential: 'YES',
    severity: 'Critical',
    texts: [
      'Worker entered a confined space without completing required gas testing and permit verification. No attendant was stationed outside.',
      'Technician observed entering vessel without valid confined space entry permit. Atmospheric testing had not been conducted prior to entry.',
      'Worker found inside drain chamber without gas monitoring equipment. Permit was not obtained before entry commenced.',
      'Two workers entered pump sump for inspection without completing pre-entry atmosphere checks. No standby person assigned.',
      'Operator entered catalyst regenerator without completing required confined space checklist. Gas detector was not calibrated.',
    ],
    recommended_action: 'Stop entry immediately. Complete atmospheric gas testing. Obtain valid confined space entry permit. Assign a trained standby person. Verify all controls before resuming work.',
  },
  {
    report_type: 'Unsafe Act',
    activity: 'Maintenance - Electrical',
    life_saving_rule: 'Energy Isolation',
    barrier_failure: 'Isolation Not Applied',
    sif_potential: 'YES',
    severity: 'Critical',
    texts: [
      'Maintenance technician began electrical work on a control panel without applying lockout/tagout. Panel was still energized.',
      'Worker observed working on a live electrical circuit without isolating the energy source. No lockout tag was applied to the isolation point.',
      'Electrician removed protective cover from 11kV switchgear without confirming isolation and applying personal lock.',
      'Maintenance crew started work on conveyor motor without completing energy isolation procedure. Motor starter was still in service.',
      'Technician performing pump maintenance found working without verifying de-energization. No isolation certificate was issued.',
    ],
    recommended_action: 'Stop work immediately. Apply lockout/tagout to all energy sources. Verify zero energy state. Issue isolation certificate. Conduct toolbox talk on energy isolation requirements.',
  },
  {
    report_type: 'Near Miss',
    activity: 'Maintenance - Electrical',
    life_saving_rule: 'Energy Isolation',
    barrier_failure: 'Lockout/Tagout Not Completed',
    sif_potential: 'YES',
    severity: 'High',
    texts: [
      'Near miss during maintenance: equipment nearly started while technician was still working inside. Energy isolation procedure had not been fully completed.',
      'Worker narrowly avoided electrical shock when circuit was unexpectedly re-energized during maintenance. LOTO procedure was not followed.',
      'Near miss reported when contractor began work on motor without isolating power. Supervisors were unaware the work had started.',
      'Flash-hazard near miss during panel testing. Isolation had been partially completed but ground fault protection was still active.',
    ],
    recommended_action: 'Re-enforce energy isolation procedure. Review permit requirements with all maintenance personnel. Conduct immediate audit of all active LOTO points.',
  },
  {
    report_type: 'Unsafe Condition',
    activity: 'Hot Work',
    life_saving_rule: 'Hot Work',
    barrier_failure: 'Hot Work Permit Not Obtained',
    sif_potential: 'YES',
    severity: 'Critical',
    texts: [
      'Welding observed in a classified hazardous area without a valid hot work permit. Flammable vapors were detected nearby.',
      'Contractor performing cutting operations near storage tanks without required hot work authorization. No fire watch was in place.',
      'Hot work was carried out adjacent to active pipework containing flammable gas without gas detection checks or permit.',
      'Grinding sparks observed near open hydrocarbon drain. Hot work permit not issued. Fire extinguisher unavailable on site.',
      'Welding fumes and arc flashes observed near chemical storage. Worker had not obtained hot work permit from HSE officer.',
    ],
    recommended_action: 'Stop hot work immediately. Obtain hot work permit. Conduct gas testing. Position a trained fire watch. Ensure fire suppression equipment is available before resuming.',
  },
  {
    report_type: 'Unsafe Act',
    activity: 'Working at Height',
    life_saving_rule: 'Working at Height',
    barrier_failure: 'Fall Protection Not Used',
    sif_potential: 'YES',
    severity: 'High',
    texts: [
      'Worker observed working at 6-meter height without harness or fall-arrest equipment. No edge protection was installed.',
      'Painter working from an improperly secured ladder at roof level. Personal fall protection equipment was not worn.',
      'Maintenance crew on elevated platform without guardrails. Workers were moving tools and materials close to unprotected edge.',
      'Scaffolding erected for maintenance was not inspected and lacked toe boards and handrails at upper working level.',
      'Technician climbing storage tank without safety harness. No anchor points had been identified or rigged.',
    ],
    recommended_action: 'Stop work at height. Conduct fall-protection assessment. Ensure all workers are fitted with inspected harness. Install guardrails and anchor points before resuming.',
  },
  {
    report_type: 'Unsafe Condition',
    activity: 'Vehicle Movement',
    life_saving_rule: 'Vehicle Movement',
    barrier_failure: 'Pedestrian Segregation Not Maintained',
    sif_potential: 'YES',
    severity: 'High',
    texts: [
      'Forklift operating in pedestrian walkway without segregation controls. Reversing alarms were not functioning.',
      'Heavy vehicle reversed toward workers without a banksman. Pedestrian barriers in loading bay were removed for maintenance.',
      'Workers observed in the path of moving HGV during shift change. Pedestrian crossing signage was missing.',
      'Near miss between forklift and worker in warehouse. Travel route was not clearly marked and lighting was poor.',
      'Excavator operating within 2 meters of workers on foot without spotter or segregation barrier.',
    ],
    recommended_action: 'Re-establish pedestrian segregation. Repair reversing alarms. Appoint banksman for reversing operations. Review vehicle traffic plan and reinstate barriers.',
  },
  {
    report_type: 'Near Miss',
    activity: 'Lifting Operations',
    life_saving_rule: 'Line of Fire',
    barrier_failure: 'Exclusion Zone Not Established',
    sif_potential: 'YES',
    severity: 'High',
    texts: [
      'Near miss during crane lift: worker walked under suspended load. Exclusion zone had not been established around lift area.',
      'Load swung unexpectedly during crane operation and passed within 1 meter of worker on scaffold. No exclusion zone was marked.',
      'Near miss: rigging sling snapped during lift. Worker standing in line-of-fire received minor injury. No exclusion zone in place.',
      'Suspended load was left unattended when crane operator took a break. Workers entered area under load.',
    ],
    recommended_action: 'Establish exclusion zone around all lifting operations. Conduct lift plan review. Brief all workers on line-of-fire hazards. Inspect all rigging equipment.',
  },
  {
    report_type: 'Unsafe Condition',
    activity: 'Chemical Handling',
    life_saving_rule: 'Chemical Handling',
    barrier_failure: 'PPE Not Available',
    sif_potential: 'YES',
    severity: 'High',
    texts: [
      'Worker handling concentrated sulfuric acid without face shield or chemical-resistant gloves. PPE station was out of stock.',
      'Chemical decanting observed without proper containment. Spill kit unavailable in the work area.',
      'Operator exposed to chlorine gas leak without respiratory protection. Emergency shower was obstructed by stored materials.',
      'Technician mixing cleaning chemicals without reviewing SDS. Incompatible chemicals stored together in cabinet.',
    ],
    recommended_action: 'Stop chemical handling. Restock PPE station. Conduct chemical hazard briefing. Review SDS compliance. Ensure emergency shower access is unobstructed.',
  },
  {
    report_type: 'Unsafe Act',
    activity: 'Fire Safety',
    life_saving_rule: 'Fire Prevention',
    barrier_failure: 'Fire Detection Disabled',
    sif_potential: 'YES',
    severity: 'Critical',
    texts: [
      'Fire suppression system was manually isolated during maintenance and not reinstated after work completion.',
      'Smoke detector found covered with plastic bag in server room. System had been disabled without documented authorization.',
      'Fire alarm panel showing faults was not reported for 3 days. Fire marshal was unaware of degraded protection status.',
      'Combustible materials stored adjacent to hot equipment. Fire extinguishers in the area were expired.',
    ],
    recommended_action: 'Reinstate fire suppression system. Remove obstruction from detectors. Conduct fire system audit. Ensure all defects are reported within 4 hours.',
  },
  {
    report_type: 'Unsafe Condition',
    activity: 'General Inspection',
    life_saving_rule: 'General Safety',
    barrier_failure: 'Housekeeping Standards Not Met',
    sif_potential: 'NO',
    severity: 'Low',
    texts: [
      'Trip hazard identified from trailing cables across walkway in workshop. No cable management in place.',
      'Spilled oil on floor of pump house not cleaned up. Area marked with cones but no corrective action taken.',
      'Poor lighting observed in stairwell area. Several lamps were out and had not been replaced.',
      'Tools left unsecured on elevated platform. Items could fall and cause injury to workers below.',
    ],
    recommended_action: 'Clean spill immediately. Restore lighting. Secure trailing cables. Remove items from elevated surfaces. Conduct housekeeping inspection.',
  },
  {
    report_type: 'Incident',
    activity: 'Confined Space Entry',
    life_saving_rule: 'Confined Space',
    barrier_failure: 'Rescue Plan Not Available',
    sif_potential: 'YES',
    severity: 'Critical',
    texts: [
      'Incident: worker became incapacitated inside confined space due to oxygen-deficient atmosphere. Rescue team was not on standby.',
      'Worker rescued from confined space after losing consciousness. Atmospheric monitoring had failed to detect low oxygen levels.',
      'Incident in drain pit: worker exposed to H2S. Gas detector was malfunctioning. Emergency rescue was delayed due to no standby team.',
    ],
    recommended_action: 'Stop all confined space work. Investigate incident. Review rescue procedures. Calibrate all gas detectors. Ensure rescue team is on standby before any future entry.',
  },
  {
    report_type: 'Near Miss',
    activity: 'Working at Height',
    life_saving_rule: 'Working at Height',
    barrier_failure: 'Scaffold Not Inspected',
    sif_potential: 'YES',
    severity: 'High',
    texts: [
      'Scaffold board broke under worker at 4m height. Worker fell but was caught by harness. Board had not been inspected after rain.',
      'Near miss: platform gave way when two workers stood on same span. Scaffold was not rated for combined load.',
      'Worker nearly fell from roof access ladder. Ladder footing was on uneven ground and had not been secured at top.',
    ],
    recommended_action: 'Immediately inspect all scaffolding. Replace damaged boards. Verify scaffold is erected per design. Conduct refresher training on working-at-height requirements.',
  },
  {
    report_type: 'Unsafe Condition',
    activity: 'Maintenance - Mechanical',
    life_saving_rule: 'Energy Isolation',
    barrier_failure: 'Pressure Not Released',
    sif_potential: 'YES',
    severity: 'Critical',
    texts: [
      'Maintenance crew opened pipework that was still under pressure. Pressure had not been released or verified before opening.',
      'Bolts removed from pressurized flange during planned maintenance. Line had not been depressurized or drained.',
      'Technician broke pipe joint while system was pressurized. Stored energy release caused minor injury and chemical exposure.',
    ],
    recommended_action: 'Stop mechanical maintenance on pressurized systems. Verify zero pressure before opening. Issue energy isolation certificate. Conduct pressure relief training.',
  },
  {
    report_type: 'Unsafe Act',
    activity: 'Driving / Vehicle',
    life_saving_rule: 'Vehicle Movement',
    barrier_failure: 'Seat Belt Not Worn',
    sif_potential: 'NO',
    severity: 'Medium',
    texts: [
      'Company driver observed not wearing seat belt while driving site vehicle. No supervisor was present.',
      'Three workers transported in a vehicle without seat belts. Overcrowding noted in vehicle cab.',
      'Speeding observed on site road. Vehicle travelling at approximately 40 km/h in a 15 km/h zone.',
    ],
    recommended_action: 'Reinforce seat-belt policy. Brief drivers on site speed limits. Issue advisory notice. Conduct spot checks on driver compliance.',
  },
  {
    report_type: 'Unsafe Condition',
    activity: 'Electrical Work',
    life_saving_rule: 'Energy Isolation',
    barrier_failure: 'Exposed Live Parts',
    sif_potential: 'YES',
    severity: 'Critical',
    texts: [
      'Exposed live electrical terminal found in control panel during routine inspection. Panel door had been left open after earlier maintenance.',
      'Junction box with exposed 415V conductors found in cable trench. Cover was missing and area was accessible.',
      'Temporary electrical connection found with bare conductors in a wet area. No insulation or protection was applied.',
    ],
    recommended_action: 'De-energize and cover exposed conductors immediately. Conduct electrical safety audit. Investigate why panel was left open. Add to action tracking.',
  },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

export function generateDemoReports(): SafetyReport[] {
  const reports: SafetyReport[] = [];
  const start = new Date('2024-01-01');
  const end = new Date('2026-08-31');
  let id = 1;

  // Generate enough to hit 200+
  for (let i = 0; i < 3; i++) {
    for (const template of reportTemplates) {
      const textList = template.texts;
      const numToGenerate = Math.ceil(200 / reportTemplates.length / 3) + (template.sif_potential === 'YES' ? 2 : 0);

      for (let j = 0; j < numToGenerate; j++) {
        const site = randomFrom(SITES);
        const location = randomFrom(LOCATIONS);
        const text = textList[j % textList.length];
        reports.push({
          id: `RPT-${String(id).padStart(4, '0')}`,
          report_id: `RPT-${String(id).padStart(4, '0')}`,
          report_type: template.report_type,
          report_text: text,
          activity: template.activity,
          location,
          site,
          date: randomDate(start, end),
          severity: template.severity,
          sif_potential: template.sif_potential,
          life_saving_rule: template.life_saving_rule,
          barrier_failure: template.barrier_failure,
          recommended_action: template.recommended_action,
          analyzed: true,
        });
        id++;
      }
    }
  }

  // Shuffle and cap at 250
  const shuffled = reports.sort(() => Math.random() - 0.5).slice(0, 250);

  // Re-assign sequential IDs after shuffle
  return shuffled.map((r, idx) => ({
    ...r,
    id: `RPT-${String(idx + 1).padStart(4, '0')}`,
    report_id: `RPT-${String(idx + 1).padStart(4, '0')}`,
  }));
}

export const DEMO_COLUMN_MAPPING = {
  report_text: 'report_text',
  sif_label: 'sif_potential',
  severity: 'severity',
  report_type: 'report_type',
  location: 'location',
  activity: 'activity',
  site: 'site',
  date: 'date',
  barrier_failure: 'barrier_failure',
  recommended_action: 'recommended_action',
  life_saving_rule: 'life_saving_rule',
};
