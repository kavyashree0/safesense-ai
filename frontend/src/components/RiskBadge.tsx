import { RiskLevel, SIFPotential } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';
  const cls: Record<RiskLevel, string> = {
    CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    LOW: 'bg-green-500/20 text-green-400 border border-green-500/30',
  };
  return (
    <span className={`${cls[level]} ${sizeClass} rounded-full font-semibold uppercase tracking-wide inline-flex items-center`}>
      {level}
    </span>
  );
}

interface SIFBadgeProps {
  potential: SIFPotential;
  size?: 'sm' | 'md' | 'lg';
}
export function SIFBadge({ potential, size = 'md' }: SIFBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';
  const cls: Record<SIFPotential, string> = {
    YES: 'bg-red-600/20 text-red-300 border border-red-500/40',
    NO: 'bg-green-600/20 text-green-300 border border-green-500/40',
    UNKNOWN: 'bg-slate-600/20 text-slate-400 border border-slate-500/40',
  };
  return (
    <span className={`${cls[potential]} ${sizeClass} rounded-full font-bold uppercase tracking-widest inline-flex items-center gap-1`}>
      {potential === 'YES' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />}
      SIF: {potential}
    </span>
  );
}
