import { useState } from 'react';
import { Sliders, Info, TrendingDown } from 'lucide-react';
import RiskGauge from './RiskGauge';

interface Control {
  id: string;
  label: string;
  reduction: number;
  description: string;
}

const CONTROLS_BY_LSR: Record<string, Control[]> = {
  'Confined Space': [
    { id: 'gas_test', label: 'Gas Testing Completed', reduction: 25, description: 'Atmospheric testing with calibrated instrument' },
    { id: 'permit', label: 'Entry Permit Obtained', reduction: 20, description: 'Valid confined space entry permit issued' },
    { id: 'standby', label: 'Standby Person Assigned', reduction: 18, description: 'Trained rescue standby person stationed outside' },
    { id: 'ventilation', label: 'Forced Ventilation', reduction: 12, description: 'Continuous forced ventilation during entry' },
  ],
  'Energy Isolation': [
    { id: 'loto', label: 'Lockout/Tagout Applied', reduction: 30, description: 'All energy sources locked and tagged out' },
    { id: 'verify', label: 'Zero Energy Verified', reduction: 20, description: 'Energy state verified with test equipment' },
    { id: 'cert', label: 'Isolation Certificate', reduction: 15, description: 'Formal isolation certificate issued' },
    { id: 'supervisor', label: 'Supervisor Verification', reduction: 10, description: 'Supervisor conducted verification walkthrough' },
  ],
  'Hot Work': [
    { id: 'permit', label: 'Hot Work Permit', reduction: 25, description: 'Valid hot work permit obtained' },
    { id: 'gas_check', label: 'Gas Testing', reduction: 22, description: 'Atmosphere tested before and during work' },
    { id: 'fire_watch', label: 'Fire Watch Posted', reduction: 18, description: 'Trained fire watch stationed during work' },
    { id: 'extinguisher', label: 'Fire Extinguisher', reduction: 10, description: 'Serviceable extinguisher within 5 meters' },
  ],
  'Working at Height': [
    { id: 'harness', label: 'Harness & Lanyard', reduction: 28, description: 'Inspected fall-arrest harness and lanyard worn' },
    { id: 'anchor', label: 'Anchor Point Rigged', reduction: 20, description: 'Suitable anchor point identified and rigged' },
    { id: 'guardrail', label: 'Guardrails Installed', reduction: 18, description: 'Edge protection and guardrails in place' },
    { id: 'scaffold_inspect', label: 'Scaffold Inspected', reduction: 12, description: 'Scaffold formally inspected and tagged safe' },
  ],
  'Line of Fire': [
    { id: 'exclusion', label: 'Exclusion Zone', reduction: 30, description: 'Exclusion zone marked and enforced' },
    { id: 'lift_plan', label: 'Lift Plan Reviewed', reduction: 20, description: 'Formal lift plan completed and briefed' },
    { id: 'rig_inspect', label: 'Rigging Inspected', reduction: 15, description: 'All rigging equipment inspected before lift' },
    { id: 'supervisor', label: 'Lifting Supervisor', reduction: 12, description: 'Qualified lifting supervisor present' },
  ],
};

const DEFAULT_CONTROLS: Control[] = [
  { id: 'ptw', label: 'Permit to Work', reduction: 20, description: 'Valid permit to work obtained' },
  { id: 'ppe', label: 'PPE Worn', reduction: 12, description: 'Correct PPE identified and worn' },
  { id: 'toolbox', label: 'Toolbox Talk', reduction: 8, description: 'Pre-task toolbox talk conducted' },
  { id: 'supervisor', label: 'Supervision', reduction: 10, description: 'Adequate supervision in place' },
];

interface WhatIfSimulatorProps {
  originalScore: number;
  activity: string;
  lsr: string;
  barrier: string;
}

export default function WhatIfSimulator({ originalScore, activity, lsr }: WhatIfSimulatorProps) {
  const controls = CONTROLS_BY_LSR[lsr] || DEFAULT_CONTROLS;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [simulated, setSimulated] = useState<number | null>(null);

  function simulate() {
    let reduction = 0;
    for (const ctrl of controls) {
      if (selected.has(ctrl.id)) reduction += ctrl.reduction;
    }
    // Diminishing returns after 50%
    const capped = Math.min(reduction, 75);
    const result = Math.max(5, Math.round(originalScore * (1 - capped / 100)));
    setSimulated(result);
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSimulated(null);
  }

  const reduction = simulated !== null ? originalScore - simulated : 0;
  const reductionPct = simulated !== null ? Math.round((reduction / originalScore) * 100) : 0;

  return (
    <div className="card border-violet-500/20 bg-violet-900/5 space-y-4">
      <div className="flex items-center gap-2">
        <Sliders className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold text-white">Safety Control Impact Simulator</h3>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        Prototype simulation — not a certified safety calculation. Demonstrates the potential effect of controls.
      </div>

      <p className="text-sm text-slate-400">
        Select safety controls to see the estimated prototype risk score after implementation:
      </p>

      <div className="grid grid-cols-2 gap-2">
        {controls.map(ctrl => (
          <label
            key={ctrl.id}
            className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
              selected.has(ctrl.id)
                ? 'border-green-500/50 bg-green-900/15'
                : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(ctrl.id)}
              onChange={() => toggle(ctrl.id)}
              className="mt-0.5 accent-green-500 flex-shrink-0"
            />
            <div>
              <div className="text-sm font-medium text-slate-200">{ctrl.label}</div>
              <div className="text-xs text-slate-500">{ctrl.description}</div>
              <div className="text-xs text-green-400 mt-0.5">-{ctrl.reduction} pts potential</div>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={simulate}
        disabled={selected.size === 0}
        className="btn-primary w-full justify-center"
      >
        <Sliders className="w-4 h-4" />
        Simulate Risk Reduction
      </button>

      {simulated !== null && (
        <div className="flex items-center justify-around bg-slate-800 rounded-xl p-4 animate-in">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Before Controls</p>
            <RiskGauge score={originalScore} size={90} />
          </div>
          <div className="text-center px-4">
            <TrendingDown className="w-8 h-8 text-green-400 mx-auto mb-1" />
            <div className="text-green-400 font-bold text-lg">-{reductionPct}%</div>
            <div className="text-xs text-slate-500">est. reduction</div>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">After Controls</p>
            <RiskGauge score={simulated} size={90} />
          </div>
        </div>
      )}
    </div>
  );
}
