'use client';

/**
 * Capa web3 del frontend (flujo MetaMask), equivalente a lo que el lab de facturas
 * hacía con web3.js. Aquí usamos ethers v6 (mismo motor que el backend) para:
 *   1. conectar la wallet del usuario (MetaMask),
 *   2. firmar la transacción `crearEvento(...)` del contrato Events DESDE el navegador,
 *   3. devolver el txHash + el id on-chain para guardarlos en la BD del backend.
 *
 * Toda la lógica web3 vive aquí; los componentes solo llaman a estas funciones.
 */
import { BrowserProvider, Contract, parseEther, formatEther, type Eip1193Provider } from 'ethers';
import { EVENTS_ABI, CONTRACT_ADDRESS } from './contract';
import type { Evento } from './types';

// MetaMask inyecta `window.ethereum`. Lo tipamos como proveedor EIP-1193 de ethers.
declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

/** ¿Hay una wallet (MetaMask) disponible en el navegador? */
export function hasWallet(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

/** Pide a MetaMask conectar la cuenta. Devuelve la dirección conectada. */
export async function connectWallet(): Promise<string> {
  if (!hasWallet()) throw new Error('MetaMask no está instalado. Instálalo para continuar.');
  const accounts = (await window.ethereum!.request({
    method: 'eth_requestAccounts',
  })) as string[];
  if (!accounts?.length) throw new Error('No se autorizó ninguna cuenta');
  return accounts[0];
}

/** Devuelve la cuenta ya conectada (sin abrir el popup), o null si no hay. */
export async function getConnectedAccount(): Promise<string | null> {
  if (!hasWallet()) return null;
  const accounts = (await window.ethereum!.request({ method: 'eth_accounts' })) as string[];
  return accounts?.[0] ?? null;
}

/**
 * Registra un evento ON-CHAIN firmando con MetaMask y devuelve la prueba.
 * Convierte los datos al formato que espera Solidity (igual que el backend):
 *   - precio_eth (ETH)  -> wei
 *   - fecha (ISO/Date)  -> timestamp UNIX en segundos
 * @returns { txHash, onchainId }
 */
export async function enviarEventoOnChain(
  evento: Pick<Evento, 'lugar' | 'fecha' | 'precio_eth' | 'aforo'>,
): Promise<{ txHash: string; onchainId: number }> {
  if (!hasWallet()) throw new Error('MetaMask no está instalado');
  if (!CONTRACT_ADDRESS) {
    throw new Error('Falta NEXT_PUBLIC_CONTRACT_ADDRESS en .env.local (ejecuta el deploy primero)');
  }

  const provider = new BrowserProvider(window.ethereum!);
  const signer = await provider.getSigner();              // abre MetaMask si hace falta
  const contrato = new Contract(CONTRACT_ADDRESS, EVENTS_ABI, signer);

  const fechaUnix = Math.floor(new Date(evento.fecha).getTime() / 1000);
  const precioWei = parseEther(String(evento.precio_eth));
  const capacidad = BigInt(evento.aforo);

  const tx = await contrato.crearEvento(evento.lugar, fechaUnix, precioWei, capacidad);
  const receipt = await tx.wait();                        // espera a que se mine en Ganache

  const onchainId = Number(await contrato.total());       // el nuevo total == id asignado
  return { txHash: receipt.hash, onchainId };
}

/** Una comparación campo a campo entre lo que hay en la BD y lo que hay on-chain. */
export interface ChequeoValidacion {
  campo: string;
  bd: string;
  chain: string;
  ok: boolean;
}

export interface ResultadoValidacion {
  ok: boolean;                 // true si TODOS los campos coinciden
  organizador: string;         // wallet que firmó el registro on-chain
  checks: ChequeoValidacion[]; // detalle por campo
}

/**
 * VALIDA un evento leyendo sus datos directamente del contrato en Ganache
 * (llamada de solo-lectura `getEvento`, no gasta gas ni abre MetaMask) y los
 * compara con los datos de la base de datos. Sirve para demostrar que lo guardado
 * on-chain coincide con la BD y no fue manipulado.
 */
export async function validarEventoOnChain(
  evento: Pick<Evento, 'lugar' | 'precio_eth' | 'aforo' | 'onchainId'>,
): Promise<ResultadoValidacion> {
  if (!hasWallet()) throw new Error('MetaMask no está instalado');
  if (!CONTRACT_ADDRESS) {
    throw new Error('Falta NEXT_PUBLIC_CONTRACT_ADDRESS en .env.local');
  }
  if (!evento.onchainId) {
    throw new Error('Este evento aún no está registrado on-chain');
  }

  const provider = new BrowserProvider(window.ethereum!);
  const contrato = new Contract(CONTRACT_ADDRESS, EVENTS_ABI, provider);
  const e = await contrato.getEvento(evento.onchainId);   // solo lectura

  const chainLugar     = e.lugar as string;
  const chainPrecioWei = e.precioWei as bigint;
  const chainCapacidad = Number(e.capacidad);

  const bdPrecioWei = parseEther(String(evento.precio_eth));

  const checks: ChequeoValidacion[] = [
    {
      campo: 'Lugar',
      bd: evento.lugar,
      chain: chainLugar,
      ok: evento.lugar === chainLugar,
    },
    {
      campo: 'Precio (ETH)',
      bd: String(evento.precio_eth),
      chain: formatEther(chainPrecioWei),
      ok: bdPrecioWei === chainPrecioWei,
    },
    {
      campo: 'Aforo',
      bd: String(evento.aforo),
      chain: String(chainCapacidad),
      ok: Number(evento.aforo) === chainCapacidad,
    },
  ];

  return {
    ok: checks.every((c) => c.ok),
    organizador: e.organizador as string,
    checks,
  };
}
