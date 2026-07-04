'use client';

import { useState } from 'react';
import { Pencil, Trash2, ExternalLink, CalendarDays, MapPin, Zap, ShieldCheck, Ticket, Sparkles, BadgeCheck, Send } from 'lucide-react';
import { Button }                  from '@/components/ui/button';
import { NeonBadge }               from '@/components/shared/NeonBadge';
import { EventModal }              from './EventModal';
import { deleteEvento, updateTxHash, updateNftToken, transferNftOwner } from '@/lib/api';
import { enviarEventoOnChain, validarEventoOnChain } from '@/lib/blockchain';
import { mintEventoNFT, verificarNFT, transferirNFT } from '@/lib/nft';
import { Evento }                  from '@/lib/types';
import { notify, confirmDelete, showLoading, closeAlert, showResult, escapeHtml, promptText } from '@/lib/swal';

// Cuenta de Ganache sugerida como destino por defecto al transferir (importada en MetaMask).
const DESTINO_SUGERIDO = '0xada53769c1679cc8A927806b7417Cc7B297Bcd9d';

interface EventsTableProps {
  eventos:   Evento[];
  onRefresh: () => void;
  account:   string | null;   // wallet conectada (necesaria para acunar/verificar el NFT)
}

/**
 * Indicador de que el evento esta registrado en la blockchain.
 * Muestra "On-chain ✓" con el hash de la transaccion truncado; al hacer clic copia
 * el hash completo (Ganache es local y no tiene explorador publico, asi que el hash
 * se verifica en la GUI de Ganache o en Remix).
 */
function OnChainBadge({ txHash }: { txHash?: string | null }) {
  if (!txHash) {
    return (
      <span className="inline-flex items-center rounded-sm border border-dashed border-border px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground/70">
        Sin emitir
      </span>
    );
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
      className="group/stamp inline-flex flex-col items-center gap-0.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-valid/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
    >
      <span className="stamp transition-transform group-hover/stamp:rotate-0">
        <ShieldCheck size={11} /> Verificado
      </span>
      <span className="font-mono text-[0.6rem] tracking-wide text-gold/70">{short}</span>
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-muted" />
        </td>
      ))}
    </tr>
  );
}

export function EventsTable({ eventos, onRefresh, account }: EventsTableProps) {
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

  // Flujo MetaMask (como el botón "ENVIAR A BLOCKCHAIN" del lab de facturas):
  // firma la transacción en el navegador y guarda el txHash en el backend.
  const enviarBlockchain = async (ev: Evento) => {
    try {
      showLoading('Confirma la transacción en MetaMask...');
      const { txHash, onchainId } = await enviarEventoOnChain(ev);
      await updateTxHash(ev.id, txHash, onchainId);
      closeAlert();
      notify('success', `On-chain ✓ ${txHash.slice(0, 10)}…`);
      onRefresh();
    } catch (e) {
      closeAlert();
      notify('error', e instanceof Error ? e.message : 'No se pudo enviar a la blockchain');
    }
  };

  // Valida contra la blockchain: lee los datos on-chain (solo lectura, sin firmar) y
  // los compara con la BD, mostrando una tabla con el resultado campo a campo.
  const validar = async (ev: Evento) => {
    try {
      showLoading('Leyendo datos on-chain...');
      const r = await validarEventoOnChain(ev);
      closeAlert();

      const filas = r.checks
        .map(
          (c) => `<tr style="border-top:1px solid #332b20">
            <td style="padding:6px 10px;text-align:left;color:#9b8d75">${escapeHtml(c.campo)}</td>
            <td style="padding:6px 10px;font-family:monospace;color:#ece3d0">${escapeHtml(c.bd)}</td>
            <td style="padding:6px 10px;font-family:monospace;color:#ece3d0">${escapeHtml(c.chain)}</td>
            <td style="padding:6px 10px;text-align:center">${c.ok ? '✓' : '✕'}</td>
          </tr>`,
        )
        .join('');

      const html = `
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
          <thead>
            <tr style="color:#d9a441;text-transform:uppercase;font-size:11px;letter-spacing:0.12em">
              <th style="padding:6px 10px;text-align:left">Campo</th>
              <th style="padding:6px 10px;text-align:left">Taquilla</th>
              <th style="padding:6px 10px;text-align:left">On-chain</th>
              <th style="padding:6px 10px">OK</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p style="margin-top:12px;font-size:12px;color:#9b8d75">
          Organizador on-chain:<br/>
          <span style="font-family:monospace;color:#79a88c">${escapeHtml(r.organizador)}</span>
        </p>`;

      showResult(
        r.ok ? 'success' : 'warning',
        r.ok ? 'Datos verificados on-chain ✓' : 'Hay diferencias con la cadena',
        html,
      );
    } catch (e) {
      closeAlert();
      notify('error', e instanceof Error ? e.message : 'No se pudo validar on-chain');
    }
  };

  // Acuna el boleto NFT (contrato EventoNFT) firmando con MetaMask, y guarda el tokenId
  // en la BD. Equivale al botón "MINT NFT" del lab de facturas.
  const mintNFT = async (ev: Evento) => {
    if (!account) {
      notify('error', 'Primero conecta tu wallet (MetaMask)');
      return;
    }
    try {
      showLoading('Confirma la acuñación en MetaMask...');
      const { txHash, tokenId } = await mintEventoNFT(ev, account);
      await updateNftToken(ev.id, tokenId, account);   // guarda tokenId + dueño inicial
      closeAlert();
      notify('success', `Boleto NFT #${tokenId} acuñado ✓ ${txHash.slice(0, 10)}…`);
      onRefresh();
    } catch (e) {
      closeAlert();
      notify('error', e instanceof Error ? e.message : 'No se pudo acuñar el NFT');
    }
  };

  // Verifica el NFT del evento (tokenId + metadata + propiedad). Equivale a
  // "VERIFICAR NFT" del lab de facturas; el backend lee el contrato on-chain.
  const verNFT = async (ev: Evento) => {
    try {
      showLoading('Verificando el boleto NFT...');
      const r = await verificarNFT(ev.id, account ?? '');
      closeAlert();

      if (!r.hasNFT || !r.metadata) {
        showResult('info', 'Sin boleto NFT', 'Este evento aún no tiene un boleto NFT acuñado.');
        return;
      }

      const esDueño = r.ownership?.isOwner;
      const fecha = new Date(Number(r.metadata.timestamp) * 1000).toLocaleString('es-CO');
      const html = `
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
          <tbody>
            <tr style="border-top:1px solid #332b20"><td style="padding:6px 10px;text-align:left;color:#9b8d75">Token ID</td><td style="padding:6px 10px;font-family:monospace;color:#d9a441">#${escapeHtml(String(r.tokenId))}</td></tr>
            <tr style="border-top:1px solid #332b20"><td style="padding:6px 10px;text-align:left;color:#9b8d75">Evento</td><td style="padding:6px 10px;font-family:monospace;color:#ece3d0">${escapeHtml(r.metadata.name)}</td></tr>
            <tr style="border-top:1px solid #332b20"><td style="padding:6px 10px;text-align:left;color:#9b8d75">Recinto</td><td style="padding:6px 10px;font-family:monospace;color:#ece3d0">${escapeHtml(r.metadata.lugar)}</td></tr>
            <tr style="border-top:1px solid #332b20"><td style="padding:6px 10px;text-align:left;color:#9b8d75">Precio</td><td style="padding:6px 10px;font-family:monospace;color:#ece3d0">Ξ ${escapeHtml(r.metadata.precio)}</td></tr>
            <tr style="border-top:1px solid #332b20"><td style="padding:6px 10px;text-align:left;color:#9b8d75">Acuñado</td><td style="padding:6px 10px;font-family:monospace;color:#ece3d0">${escapeHtml(fecha)}</td></tr>
          </tbody>
        </table>
        <p style="margin-top:12px;font-size:12px;color:#9b8d75">
          Propietario on-chain:<br/>
          <span style="font-family:monospace;color:${esDueño ? '#79a88c' : '#d9a441'}">${escapeHtml(r.ownership?.owner ?? '')}</span><br/>
          <span style="font-size:12px">${esDueño ? '✓ Este boleto te pertenece' : '⚠ Este boleto pertenece a otra wallet'}</span>
        </p>`;

      showResult(esDueño ? 'success' : 'warning',
        esDueño ? 'Boleto NFT verificado ✓' : 'Boleto NFT de otra wallet',
        html);
    } catch (e) {
      closeAlert();
      notify('error', e instanceof Error ? e.message : 'No se pudo verificar el NFT');
    }
  };

  // Transfiere el boleto NFT a otra wallet de Ganache (safeTransferFrom). La firma el
  // dueño actual con MetaMask; luego guardamos el nuevo dueño en la BD.
  const transferNFT = async (ev: Evento) => {
    if (!ev.nftTokenId) {
      notify('error', 'Este evento aún no tiene un boleto NFT acuñado');
      return;
    }
    if (!account) {
      notify('error', 'Conecta la wallet dueña del boleto (MetaMask)');
      return;
    }
    const destino = await promptText('Transferir boleto NFT', {
      html: `Boleto <b>#${ev.nftTokenId}</b> — "${escapeHtml(ev.name)}".<br/>` +
            `<span style="font-size:12px;color:#9b8d75">Pega la wallet destino (otra cuenta de Ganache importada en MetaMask). ` +
            `Firmarás la transferencia con la cuenta dueña actual.</span>`,
      value: DESTINO_SUGERIDO,
      placeholder: '0x…',
      confirmText: 'Transferir',
    });
    if (!destino) return;

    try {
      showLoading('Confirma la transferencia en MetaMask...');
      const { txHash } = await transferirNFT(ev.nftTokenId, account, destino);
      await transferNftOwner(ev.id, destino);          // guarda el nuevo dueño en la BD
      closeAlert();
      notify('success', `Boleto #${ev.nftTokenId} transferido ✓ ${txHash.slice(0, 10)}…`);
      onRefresh();
    } catch (e) {
      closeAlert();
      notify('error', e instanceof Error ? e.message : 'No se pudo transferir el NFT');
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
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Ticket size={40} className="text-border" strokeWidth={1.5} />
        <p className="font-display text-2xl uppercase tracking-wide text-muted-foreground">
          Taquilla cerrada
        </p>
        <p className="max-w-xs text-sm text-muted-foreground/70">
          Aún no hay funciones. Usa <span className="text-gold">Abrir taquilla</span> para emitir la primera.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Manifiesto — escritorio */}
      <div className="hidden overflow-x-auto rounded-sm ring-1 ring-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-bold">Boleto</th>
              <th className="px-4 py-2.5 text-left font-bold">Función</th>
              <th className="px-4 py-2.5 text-left font-bold">Fecha</th>
              <th className="px-4 py-2.5 text-left font-bold">Recinto</th>
              <th className="px-4 py-2.5 text-left font-bold">Sección</th>
              <th className="px-4 py-2.5 text-right font-bold">Precio Ξ</th>
              <th className="px-4 py-2.5 text-right font-bold">Aforo</th>
              <th className="px-4 py-2.5 text-center font-bold">Registro</th>
              <th className="px-4 py-2.5 text-center font-bold">Taquilla</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr
                key={ev.id}
                className="group border-t border-border transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  {ev.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.banner}
                      alt={ev.name}
                      className="h-12 w-12 rounded-sm border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted text-muted-foreground">
                      <Ticket size={18} strokeWidth={1.5} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-paper">{ev.name}</p>
                  {ev.ciudad && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={10} />{ev.ciudad}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <CalendarDays size={13} className="text-gold/70" />
                    {formatFecha(ev.fecha)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{ev.lugar}</td>
                <td className="px-4 py-3">
                  <NeonBadge label={ev.genero} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-paper tnum">
                  Ξ {Number(ev.precio_eth).toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground tnum">
                  {Number(ev.aforo).toLocaleString('es-CO')}
                </td>
                <td className="px-4 py-3 text-center">
                  <OnChainBadge txHash={ev.txHash} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-0.5">
                    {!ev.txHash ? (
                      <button
                        onClick={() => enviarBlockchain(ev)}
                        className="rounded-sm p-1.5 text-muted-foreground outline-none transition-colors hover:bg-primary/15 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
                        title="Emitir on-chain (firma con MetaMask)"
                        aria-label={`Emitir "${ev.name}" on-chain`}
                      >
                        <Zap size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => validar(ev)}
                        className="rounded-sm p-1.5 text-muted-foreground outline-none transition-colors hover:bg-valid/15 hover:text-valid focus-visible:ring-2 focus-visible:ring-valid/50"
                        title="Verificar contra la cadena"
                        aria-label={`Verificar "${ev.name}" contra la cadena`}
                      >
                        <ShieldCheck size={14} />
                      </button>
                    )}
                    {!ev.nftTokenId ? (
                      <button
                        onClick={() => mintNFT(ev)}
                        className="rounded-sm p-1.5 text-muted-foreground outline-none transition-colors hover:bg-gold/15 hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/50"
                        title="Acuñar boleto NFT (firma con MetaMask)"
                        aria-label={`Acuñar boleto NFT de "${ev.name}"`}
                      >
                        <Sparkles size={14} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => verNFT(ev)}
                          className="rounded-sm p-1.5 text-gold outline-none transition-colors hover:bg-gold/15 hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/50"
                          title={`Validar boleto NFT #${ev.nftTokenId}`}
                          aria-label={`Validar boleto NFT de "${ev.name}"`}
                        >
                          <BadgeCheck size={14} />
                        </button>
                        <button
                          onClick={() => transferNFT(ev)}
                          className="rounded-sm p-1.5 text-muted-foreground outline-none transition-colors hover:bg-primary/15 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
                          title={`Transferir boleto NFT #${ev.nftTokenId} a otra wallet`}
                          aria-label={`Transferir boleto NFT de "${ev.name}"`}
                        >
                          <Send size={14} />
                        </button>
                      </>
                    )}
                    <a
                      href={ev.metadataPath}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-sm p-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/50"
                      title="Ver metadata NFT"
                      aria-label={`Ver metadata NFT de "${ev.name}"`}
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => setEditEvento(ev)}
                      className="rounded-sm p-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-paper focus-visible:ring-2 focus-visible:ring-ring/50"
                      title="Editar"
                      aria-label={`Editar "${ev.name}"`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => askDelete(ev)}
                      className="rounded-sm p-1.5 text-muted-foreground outline-none transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/50"
                      title="Eliminar"
                      aria-label={`Eliminar "${ev.name}"`}
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

      {/* Manifiesto — móvil (boletos) */}
      <div className="space-y-3 md:hidden">
        {eventos.map((ev) => (
          <div key={ev.id} className="overflow-hidden rounded-sm bg-card ring-1 ring-border">
            {ev.banner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ev.banner} alt={ev.name} className="h-36 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold leading-tight text-paper">{ev.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ev.lugar} · {ev.ciudad}</p>
                </div>
                <NeonBadge label={ev.genero} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-muted-foreground">{formatFecha(ev.fecha)}</span>
                <span className="font-mono text-paper tnum">Ξ {Number(ev.precio_eth).toFixed(4)}</span>
              </div>
              {ev.txHash && (
                <div className="mt-2.5">
                  <OnChainBadge txHash={ev.txHash} />
                </div>
              )}
              <div className="perf-rule mt-3" aria-hidden />
              <div className="mt-3 flex gap-2">
                {!ev.txHash ? (
                  <Button size="sm" variant="ghost" className="flex-1 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => enviarBlockchain(ev)}>
                    <Zap size={13} className="mr-1" /> Emitir
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="flex-1 text-valid hover:bg-valid/10 hover:text-valid" onClick={() => validar(ev)}>
                    <ShieldCheck size={13} className="mr-1" /> Verificar
                  </Button>
                )}
                {!ev.nftTokenId ? (
                  <Button size="sm" variant="ghost" className="flex-1 text-gold hover:bg-gold/10 hover:text-gold" onClick={() => mintNFT(ev)}>
                    <Sparkles size={13} className="mr-1" /> Mint NFT
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" className="flex-1 text-gold hover:bg-gold/10 hover:text-gold" onClick={() => verNFT(ev)}>
                      <BadgeCheck size={13} className="mr-1" /> Validar
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => transferNFT(ev)}>
                      <Send size={13} className="mr-1" /> Transferir
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="flex-1 hover:bg-muted hover:text-paper" onClick={() => setEditEvento(ev)}>
                  <Pencil size={13} className="mr-1" /> Editar
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => askDelete(ev)}>
                  <Trash2 size={13} className="mr-1" /> Borrar
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
