'use client';

/**
 * Capa web3 del BOLETO NFT (contrato EventoNFT / ERC-721) en el frontend.
 *
 * Es el equivalente a las funciones `mintNFT()` y `verificarNFT()` del `facturas.js`
 * del Lab 12, pero con ethers v6 (mismo motor que el resto del frontend).
 *
 * A diferencia del contrato `Events` (cuya address vive en NEXT_PUBLIC_CONTRACT_ADDRESS),
 * la config del NFT se pide al backend en tiempo de ejecucion:  GET /api/eventos/nft/config.
 * Asi, tras un `npm run deploy`, el frontend usa la nueva address sin tocar el .env.local
 * (idéntico a como el lab cargaba la config con `cargarConfiguracionNFT()`).
 */
import { BrowserProvider, Contract, solidityPackedKeccak256 } from 'ethers';
import type { InterfaceAbi } from 'ethers';
import { hasWallet } from './blockchain';
import { getNftConfig } from './api';
import type { Evento } from './types';

// Cache en memoria de la config del NFT (abi + address) para no pedirla en cada mint.
let nftConfigCache: { address: string; abi: InterfaceAbi } | null = null;

async function cargarNftConfig(): Promise<{ address: string; abi: InterfaceAbi }> {
  if (nftConfigCache) return nftConfigCache;
  const cfg = await getNftConfig();
  if (!cfg?.address || !cfg?.abi) {
    throw new Error('Config del contrato NFT no disponible. Ejecuta "npm run deploy" en el backend.');
  }
  nftConfigCache = { address: cfg.address, abi: cfg.abi as InterfaceAbi };
  return nftConfigCache;
}

/**
 * Acuna (mint) el boleto NFT de un evento firmando con MetaMask.
 * Reproduce el flujo del lab: genera un hash de los datos, llama a `mintEventoNFT`
 * y, tras minarse, lee el tokenId asignado para guardarlo en la BD.
 *
 * @returns { txHash, tokenId }
 */
export async function mintEventoNFT(
  evento: Pick<Evento, 'id' | 'name' | 'lugar' | 'precio_eth'>,
  account: string,
): Promise<{ txHash: string; tokenId: number }> {
  if (!hasWallet()) throw new Error('MetaMask no está instalado');
  if (!account) throw new Error('Primero conecta tu wallet (MetaMask)');

  const { address, abi } = await cargarNftConfig();

  const provider = new BrowserProvider(window.ethereum!);
  const signer = await provider.getSigner();          // abre MetaMask si hace falta
  const contrato = new Contract(address, abi, signer);

  const precio = String(evento.precio_eth);
  // Huella anti-manipulacion de los datos del boleto (equivale a soliditySha3 del lab).
  const hash = solidityPackedKeccak256(
    ['uint256', 'string', 'string'],
    [evento.id, evento.name, evento.lugar],
  );

  const tx = await contrato.mintEventoNFT(
    evento.id,
    evento.name,
    evento.lugar,
    precio,
    hash,
    account,               // la wallet que recibe (posee) el boleto NFT
  );
  const receipt = await tx.wait();                    // espera a que se mine en Ganache

  // El contrato asigna el tokenId; lo leemos por el id del evento para guardarlo en la BD.
  const tokenId = Number(await contrato.getTokenId(evento.id));
  return { txHash: receipt.hash, tokenId };
}

/**
 * Transfiere el boleto NFT del dueño actual a otra wallet (safeTransferFrom del ERC-721).
 * Lo firma el DUEÑO con MetaMask; la cuenta conectada debe ser la propietaria actual.
 * Ambas cuentas deben estar importadas en MetaMask desde Ganache.
 *
 * @param tokenId  id del token a transferir.
 * @param from     wallet dueña actual (== cuenta conectada).
 * @param to       wallet destino (otra cuenta de Ganache importada en MetaMask).
 * @returns { txHash }
 */
export async function transferirNFT(
  tokenId: number,
  from: string,
  to: string,
): Promise<{ txHash: string }> {
  if (!hasWallet()) throw new Error('MetaMask no está instalado');
  if (!from) throw new Error('Conecta la wallet dueña del boleto');
  if (!/^0x[0-9a-fA-F]{40}$/.test(to)) throw new Error('La dirección destino no es válida');
  if (to.toLowerCase() === from.toLowerCase()) {
    throw new Error('La dirección destino es la misma wallet actual');
  }

  const { address, abi } = await cargarNftConfig();
  const provider = new BrowserProvider(window.ethereum!);
  const signer = await provider.getSigner();
  const contrato = new Contract(address, abi, signer);

  // Comprobamos que la cuenta conectada es realmente la dueña antes de firmar.
  const ownerActual = (await contrato.ownerOf(tokenId)) as string;
  if (ownerActual.toLowerCase() !== from.toLowerCase()) {
    throw new Error('La cuenta conectada no es la dueña del boleto (conecta la wallet propietaria)');
  }

  // ERC-721: safeTransferFrom(from, to, tokenId). Usamos la firma de 3 argumentos.
  const tx = await contrato['safeTransferFrom(address,address,uint256)'](from, to, tokenId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

// --- Verificacion del NFT (solo lectura, la resuelve el backend) ---

export interface NFTVerification {
  hasNFT: boolean;
  tokenId: string | number;
  metadata: {
    eventoId: string;
    name: string;
    lugar: string;
    precio: string;
    hash: string;
    timestamp: string;
  } | null;
  ownership: { owner: string; isOwner: boolean } | null;
}

/**
 * Verifica el NFT de un evento (existencia + metadata + propiedad) preguntando al
 * backend, que lee el contrato on-chain. Equivale a `verificarNFT()` del lab.
 */
export async function verificarNFT(eventoId: number, account: string): Promise<NFTVerification> {
  const addr = account || '0x0000000000000000000000000000000000000000';
  const res = await fetch(`/api/eventos/nft/verify-complete/${eventoId}/${addr}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al verificar el NFT' }));
    throw new Error(err.error ?? 'Error al verificar el NFT');
  }
  return res.json();
}
