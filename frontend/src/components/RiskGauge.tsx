interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export default function RiskGauge({ score, size = 120, showLabel = true }: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  // Only fill 3/4 of the circle (270 degrees)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (clampedScore / 100) * arcLength;

  const getColor = (s: number) => {
    if (s > 80) return '#ef4444';
    if (s > 60) return '#f97316';
    if (s > 30) return '#eab308';
    return '#22c55e';
  };

  const getLevel = (s: number) => {
    if (s > 80) return 'CRITICAL';
    if (s > 60) return 'HIGH';
    if (s > 30) return 'MEDIUM';
    return 'LOW';
  };

  const color = getColor(clampedScore);
  const level = getLevel(clampedScore);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          {clampedScore}
        </text>
        <text
          x={size / 2}
          y={size / 2 + size * 0.18}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize={size * 0.1}
          fontFamily="system-ui, sans-serif"
        >
          /100
        </text>
      </svg>
      {showLabel && (
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color }}
        >
          {level}
        </span>
      )}
    </div>
  );
}
