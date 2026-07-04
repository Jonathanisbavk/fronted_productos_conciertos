'use client';

import { Ticket, Users, Coins } from 'lucide-react';
import { Evento } from '@/lib/types';

interface StatsBarProps {
  eventos: Evento[];
}

export function StatsBar({ eventos }: StatsBarProps) {
  const totalEventos = eventos.length;
  const totalAforo   = eventos.reduce((sum, e) => sum + Number(e.aforo), 0);
  const avgEth       = totalEventos
    ? (eventos.reduce((sum, e) => sum + Number(e.precio_eth), 0) / totalEventos).toFixed(4)
    : '0.0000';

  // Cada stat es un talón de boleto: serie (icono) · perforación · cuerpo (dato).
  const stubs = [
    { icon: Ticket, serie: 'A',  label: 'Funciones',  value: totalEventos.toLocaleString('es-CO') },
    { icon: Users,  serie: 'B',  label: 'Aforo total', value: totalAforo.toLocaleString('es-CO') },
    { icon: Coins,  serie: 'Ξ',  label: 'Precio medio', value: avgEth, unit: 'ETH' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stubs.map(({ icon: Icon, serie, label, value, unit }, i) => (
        <div
          key={label}
          className="ticket-stub guilloche animate-rise flex items-stretch bg-card ring-1 ring-border"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {/* Talón: serie + icono (ancho = --stub: 72px) */}
          <div className="flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 py-4">
            <Icon size={18} className="text-gold" strokeWidth={1.75} />
            <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground">
              {serie}-{String(i + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Cuerpo del boleto */}
          <div className="flex flex-1 flex-col justify-center py-4 pl-5 pr-5">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-semibold leading-none tracking-tight text-paper tnum">
                {value}
              </span>
              {unit && (
                <span className="font-mono text-xs text-gold">{unit}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
