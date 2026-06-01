'use client';

const GENRE_COLORS: Record<string, string> = {
  rock:      'border-purple-500 text-purple-400 shadow-purple-500/30',
  pop:       'border-pink-500   text-pink-400   shadow-pink-500/30',
  jazz:      'border-yellow-500 text-yellow-400 shadow-yellow-500/30',
  reggaeton: 'border-orange-500 text-orange-400 shadow-orange-500/30',
  electronica:'border-cyan-500  text-cyan-400   shadow-cyan-500/30',
  clasica:   'border-blue-500   text-blue-400   shadow-blue-500/30',
  default:   'border-slate-500  text-slate-400  shadow-slate-500/30',
};

interface NeonBadgeProps {
  label: string;
}

export function NeonBadge({ label }: NeonBadgeProps) {
  if (!label) return null;
  const key = label.toLowerCase().replace(/[áéíóúü]/g, (c) =>
    ({ á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u' })[c] ?? c
  );
  const colors = GENRE_COLORS[key] ?? GENRE_COLORS.default;

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border shadow-sm ${colors}`}
    >
      {label}
    </span>
  );
}
