'use client';

/**
 * Hook de wallet (MetaMask) para el dashboard. Mantiene la cuenta conectada en estado,
 * la rehidrata al cargar y escucha cambios de cuenta (`accountsChanged`), igual que el
 * lab de facturas hacía en facturas.js.
 */
import { useCallback, useEffect, useState } from 'react';
import { connectWallet, getConnectedAccount, hasWallet } from './blockchain';

export function useWallet() {
  const [account, setAccount]       = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Al montar: si ya hay permiso previo, recupera la cuenta sin abrir el popup.
  useEffect(() => {
    if (!hasWallet()) return;
    getConnectedAccount().then(setAccount).catch(() => {});

    const handler = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAccount(accounts?.[0] ?? null);
    };
    window.ethereum?.on?.('accountsChanged', handler);
    return () => window.ethereum?.removeListener?.('accountsChanged', handler);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const acc = await connectWallet();
      setAccount(acc);
      return acc;
    } finally {
      setConnecting(false);
    }
  }, []);

  return { account, connect, connecting, hasWallet: hasWallet() };
}
