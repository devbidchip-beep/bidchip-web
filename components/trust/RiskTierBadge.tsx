'use client';

interface RiskTierBadgeProps {
  tier: 'green' | 'yellow' | 'red';
  showLabel?: boolean;
}

const TIER_CONFIG = {
  green: {
    classes: 'bg-green-100 text-green-800 border border-green-200',
    label: 'Low Risk',
  },
  yellow: {
    classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    label: 'Medium Risk',
  },
  red: {
    classes: 'bg-red-100 text-red-800 border border-red-200',
    label: 'High Risk',
  },
};

export function RiskTierBadge({ tier, showLabel = true }: RiskTierBadgeProps) {
  const config = TIER_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.classes}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tier === 'green' ? 'bg-green-500' : tier === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
        }`}
      />
      {showLabel && config.label}
    </span>
  );
}
