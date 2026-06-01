'use client';

import { useState } from 'react';
import { Pencil, Trash2, ExternalLink, CalendarDays, MapPin, Link2 } from 'lucide-react';
import { Button }       from '@/components/ui/button';
import { NeonBadge }    from '@/components/shared/NeonBadge';
import { EventModal }   from './EventModal';
import { deleteEvento } from '@/lib/api';
import { Evento }       from '@/lib/types';
import { notify, confirmDelete, showLoading, closeAlert } from '@/lib/swal';

interface EventsTableProps {
  eventos:   Evento[];
  onRefresh: () => void;
}

/**
 * Indicador de que el evento esta registrado en la blockchain.
 * Muestra "On-chain ✓" con el hash de la transaccion truncado; al hacer clic copia
 * el hash completo (Ganache es local y no tiene explorador publico, asi que el hash
 * se verifica en la GUI de Ganache o en Remix).
 */
function OnChainBadge({ txHash }: { txHash?: string | null }) {
  if (!txHash) {
    return <span className="text-xs text-slate-600">—</span>;
  }
  const short = `${txHash.slice(0, 6)}…${txHash.slice(-4)}`;
  const copy = () => {
    navigator.clipboard.writeText(txHash);
    notify('success', 'Tx hash copiado al portapapeles');
  };
  return (
    <button
      onClick={copy}
      title={`On-chain · ${txHash} (clic para copiar)`}
      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors"
    >
      <Link2 size={11} />
      {short}
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/5 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function EventsTable({ eventos, onRefresh }: EventsTableProps) {
  const [editEvento, setEditEvento] = useState<Evento | null>(null);
  const [loading]                   = useState(false);

  // Confirma con SweetAlert2 y elimina mostrando overlay de carga.
  const askDelete = async (ev: Evento) => {
    const confirmado = await confirmDelete(ev.name);
    if (!confirmado) return;
    try {
      showLoading('Eliminando evento...');
      await deleteEvento(ev.id);
      closeAlert();
      notify('success', `"${ev.name}" eliminado`);
      onRefresh();
    } catch {
      closeAlert();
      notify('error', 'No se pudo eliminar el evento');
    }
  };

  const handleSaved = (saved: Evento) => {
    notify('success', `${saved.name} ${editEvento ? 'actualizado' : 'creado'} ✓`);
    setEditEvento(null);
    onRefresh();
  };

  const formatFecha = (f: string) => {
    try {
      return new Date(f).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return f; }
  };

  if (loading) {
    return (
      <table className="w-full text-sm">
        <tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
      </table>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
        <span className="text-6xl">🎫</span>
        <p className="text-lg font-medium text-slate-500">No hay eventos aún</p>
        <p className="text-sm">Crea el primer evento usando el botón superior</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-slate-500 uppercase text-xs tracking-wider">
              <th className="px-4 py-3 text-left">Banner</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Lugar</th>
              <th className="px-4 py-3 text-left">Género</th>
              <th className="px-4 py-3 text-right">Precio Ξ</th>
              <th className="px-4 py-3 text-right">Aforo</th>
              <th className="px-4 py-3 text-center">On-chain</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr
                key={ev.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-4 py-3">
                  {ev.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.banner}
                      alt={ev.name}
                      className="w-12 h-12 object-cover rounded-lg border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-600">
                      🎫
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-100 group-hover:text-white">{ev.name}</p>
                  {ev.ciudad && <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1"><MapPin size={10} />{ev.ciudad}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CalendarDays size={13} className="text-slate-600" />
                    {formatFecha(ev.fecha)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{ev.lugar}</td>
                <td className="px-4 py-3">
                  <NeonBadge label={ev.genero} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400">
                  Ξ {Number(ev.precio_eth).toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {Number(ev.aforo).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <OnChainBadge txHash={ev.txHash} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <a
                      href={ev.metadataPath}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Ver metadata NFT"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => setEditEvento(ev)}
                      className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-violet-400 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => askDelete(ev)}
                      className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {eventos.map((ev) => (
          <div key={ev.id} className="rounded-xl border border-white/5 bg-[#12121a] overflow-hidden">
            {ev.banner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ev.banner} alt={ev.name} className="w-full h-36 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-100">{ev.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ev.lugar} · {ev.ciudad}</p>
                </div>
                <NeonBadge label={ev.genero} />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-slate-500">{formatFecha(ev.fecha)}</span>
                <span className="font-mono text-emerald-400">Ξ {Number(ev.precio_eth).toFixed(4)}</span>
              </div>
              {ev.txHash && (
                <div className="mt-2">
                  <OnChainBadge txHash={ev.txHash} />
                </div>
              )}
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                <Button size="sm" variant="ghost" className="flex-1 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10" onClick={() => setEditEvento(ev)}>
                  <Pencil size={13} className="mr-1" /> Editar
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => askDelete(ev)}>
                  <Trash2 size={13} className="mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edición (el borrado usa SweetAlert2) */}
      <EventModal
        open={!!editEvento}
        evento={editEvento}
        onClose={() => setEditEvento(null)}
        onSaved={handleSaved}
      />
    </>
  );
}
