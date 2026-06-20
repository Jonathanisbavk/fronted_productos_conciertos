'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Zap, Wallet } from 'lucide-react';
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
    notify('success', `"${ev.name}" creado exitosamente 🎫`);
    setCreateOpen(false);
    fetchData(true);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-slate-100">

      {/* Glow decorativo de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 0%, rgba(124,58,237,0.18) 0%, rgba(34,211,238,0.06) 45%, transparent 75%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-white/10">
              <Zap size={18} className="text-violet-400" />
            </div>
            <span className="font-bold tracking-tight bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
              TicketChain
            </span>
            <span className="hidden sm:inline text-slate-600 text-sm">/ Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Estado de la wallet (MetaMask), como el "Cuenta conectada" del lab */}
            {account ? (
              <span
                title={account}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-mono text-emerald-400"
              >
                <Wallet size={13} />
                {`${account.slice(0, 6)}…${account.slice(-4)}`}
              </span>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={connecting}
                variant="outline"
                className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Wallet size={15} />
                <span className="hidden sm:inline">{connecting ? 'Conectando…' : 'Conectar wallet'}</span>
              </Button>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
              title="Refrescar"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white gap-2 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Crear Evento</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Dashboard de Eventos
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Gestión de conciertos y eventos para el sistema de tickets blockchain
          </p>
        </div>

        {/* Stats */}
        <StatsBar eventos={eventos} />

        {/* Table section */}
        <div className="rounded-xl border border-white/5 bg-[#0d0d14]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Eventos
            </h2>
            <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
              {eventos.length} registros
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-600">
                <RefreshCw size={18} className="animate-spin" />
                <span>Cargando eventos...</span>
              </div>
            ) : (
              <EventsTable eventos={eventos} onRefresh={() => fetchData(true)} />
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-700 mt-8">
          API · <span className="font-mono">http://localhost:3000</span>
          {' '}· MariaDB · mod_02_productos
        </p>
      </main>

      {/* Create modal */}
      <EventModal
        open={createOpen}
        evento={null}
        onClose={() => setCreateOpen(false)}
        onSaved={handleCreated}
      />
    </div>
  );
}
