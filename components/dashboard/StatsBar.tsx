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

  const stats = [
    { icon: Ticket, label: 'Eventos',       value: totalEventos.toLocaleString(), color: 'text-violet-400',  ring: 'hover:border-violet-500/30',  iconBg: 'from-violet-500/20 to-violet-500/5',   glow: 'shadow-violet-500/10' },
    { icon: Users,  label: 'Aforo total',   value: totalAforo.toLocaleString(),   color: 'text-cyan-400',    ring: 'hover:border-cyan-500/30',    iconBg: 'from-cyan-500/20 to-cyan-500/5',       glow: 'shadow-cyan-500/10'   },
    { icon: Coins,  label: 'Precio Ξ prom', value: `Ξ ${avgEth}`,                 color: 'text-emerald-400', ring: 'hover:border-emerald-500/30', iconBg: 'from-emerald-500/20 to-emerald-500/5', glow: 'shadow-emerald-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map(({ icon: Icon, label, value, color, ring, iconBg, glow }) => (
        <div
          key={label}
          className={`group flex items-center gap-4 rounded-xl border border-white/5 bg-[#12121a] px-5 py-4 shadow-lg ${glow} ${ring} transition-all duration-200 hover:-translate-y-0.5`}
        >
          <div className={`rounded-lg p-2.5 bg-gradient-to-br ${iconBg} ${color} ring-1 ring-white/5 transition-transform group-hover:scale-110`}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
