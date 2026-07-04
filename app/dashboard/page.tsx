'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Ticket, Wallet } from 'lucide-react';
import { Button }      from '@/components/ui/button';
import { StatsBar }    from '@/components/dashboard/StatsBar';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { EventModal }  from '@/components/dashboard/EventModal';
import { getEventos }  from '@/lib/api';
import { Evento }      from '@/lib/types';
import { notify }      from '@/lib/swal';
import { useWallet }   from '@/lib/useWallet';

export default function DashboardPage() {
  const [eventos,      setEventos]      = useState<Evento[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);

  const { account, connect, connecting } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
      notify('success', 'Wallet conectada ✓');
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'No se pudo conectar la wallet');
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getEventos();
      setEventos(data);
    } catch {
      notify('error', 'No se pudo conectar con la API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreated = (ev: Evento) => {
    notify('success', `"${ev.name}" abierto en taquilla 🎫`);
    setCreateOpen(false);
    fetchData(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Marquesina (cabecera de taquilla) ───────────────────── */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Ticket size={20} className="text-primary" strokeWidth={2} />
            <span className="font-display text-lg font-semibold uppercase tracking-[0.22em] text-paper">
              TicketChain
            </span>
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground sm:inline">
              · Taquilla
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Will-call: estado de la wallet (MetaMask) */}
            {account ? (
              <span
                title={account}
                className="hidden items-center gap-1.5 rounded-sm border border-valid/40 bg-valid/10 px-2.5 py-1.5 font-mono text-xs text-valid sm:inline-flex"
              >
                <Wallet size={13} />
                {`${account.slice(0, 6)}…${account.slice(-4)}`}
              </span>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={connecting}
                variant="outline"
                size="lg"
                className="gap-1.5 border-valid/40 text-valid hover:bg-valid/10 hover:text-valid"
              >
                <Wallet size={15} />
                <span className="hidden sm:inline">{connecting ? 'Conectando…' : 'Conectar wallet'}</span>
              </Button>
            )}
            <Button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              variant="ghost"
              size="icon-lg"
              className="text-muted-foreground hover:text-paper"
              title="Refrescar cartelera"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              size="lg"
              className="gap-2 font-semibold"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Abrir taquilla</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>
        {/* Línea de corte del boleto */}
        <div className="perf-rule perf-rule-gold" aria-hidden />
      </header>

      {/* ── Contenido ───────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        {/* Banda "cartelera" */}
        <div className="mb-9 animate-rise">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-gold">
            Box Office · Registro on-chain
          </p>
          <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-paper sm:text-6xl">
            Cartelera
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Cada función se emite como un boleto NFT y queda sellada en la cadena.
            Crea, edita y verifica que la taquilla coincide con el registro.
          </p>
        </div>

        {/* Talones de resumen */}
        <div className="mb-10">
          <StatsBar eventos={eventos} />
        </div>

        {/* Manifiesto / ledger */}
        <section className="overflow-hidden rounded-md bg-card ring-1 ring-border">
          <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Manifiesto
            </h2>
            <span className="font-mono text-[0.7rem] tracking-wide text-gold">
              {eventos.length.toString().padStart(3, '0')} entradas
            </span>
          </div>
          <div className="perf-rule" aria-hidden />

          <div className="p-3 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-20 font-mono text-sm text-muted-foreground">
                <RefreshCw size={16} className="animate-spin" />
                <span>Abriendo taquilla…</span>
              </div>
            ) : (
              <EventsTable eventos={eventos} onRefresh={() => fetchData(true)} account={account} />
            )}
          </div>
        </section>

        {/* Pie técnico */}
        <p className="mt-8 text-center font-mono text-[0.7rem] text-muted-foreground/70">
          API <span className="text-muted-foreground">localhost:3000</span>
          {'  ·  '}MariaDB{'  ·  '}mod_02_productos
        </p>
      </main>

      {/* Modal de emisión */}
      <EventModal
        open={createOpen}
        evento={null}
        onClose={() => setCreateOpen(false)}
        onSaved={handleCreated}
      />
    </div>
  );
}
