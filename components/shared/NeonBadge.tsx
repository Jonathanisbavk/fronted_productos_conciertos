'use client';

/**
 * Etiqueta de "sección" del boleto (por género musical).
 * Se conserva el nombre NeonBadge por compatibilidad de importaciones,
 * pero el estilo es el de un código de sección impreso: punto + texto en
 * versalitas mono, con tintes apagados dentro de la paleta de taquilla.
 */
const GENRE_DOT: Record<string, string> = {
  rock:        '#c084b5',
  pop:         '#d98aa6',
  jazz:        '#d9a441',
  reggaeton:   '#e0935a',
  electronica: '#7fae9c',
  clasica:     '#9aa6c4',
  default:     '#9b8d75',
};

interface NeonBadgeProps {
  label: string;
}

export function NeonBadge({ label }: NeonBadgeProps) {
  if (!label) return null;
  const key = label.toLowerCase().replace(/[áéíóúü]/g, (c) =>
    ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' })[c] ?? c,
  );
  const dot = GENRE_DOT[key] ?? GENRE_DOT.default;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted/50 px-2 py-0.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em] text-paper/80"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: dot, boxShadow: `0 0 6px ${dot}66` }}
      />
      {label}
    </span>
  );
}
