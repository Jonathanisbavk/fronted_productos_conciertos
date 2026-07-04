import { Evento, CreateEventoDTO } from './types';

const BASE = '/api/eventos';

export async function getEventos(): Promise<Evento[]> {
  const res = await fetch(BASE, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener eventos');
  return res.json();
}

export async function getEventoById(id: number): Promise<Evento> {
  const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Evento no encontrado');
  return res.json();
}

export async function createEvento(data: CreateEventoDTO): Promise<Evento> {
  const form = new FormData();
  form.append('name',       data.name);
  form.append('fecha',      data.fecha);
  form.append('lugar',      data.lugar);
  form.append('precio_eth', data.precio_eth);
  form.append('aforo',      String(data.aforo));
  if (data.description) form.append('description', data.description);
  if (data.ciudad)      form.append('ciudad',      data.ciudad);
  if (data.genero)      form.append('genero',      data.genero);
  if (data.banner)      form.append('banner',      data.banner);

  const res = await fetch(BASE, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al crear evento' }));
    throw new Error(err.error ?? 'Error al crear evento');
  }
  return res.json();
}

export async function updateEvento(id: number, data: Partial<CreateEventoDTO>): Promise<Evento> {
  const form = new FormData();
  if (data.name)        form.append('name',        data.name);
  if (data.fecha)       form.append('fecha',       data.fecha);
  if (data.lugar)       form.append('lugar',       data.lugar);
  if (data.precio_eth)  form.append('precio_eth',  data.precio_eth);
  if (data.aforo != null) form.append('aforo',     String(data.aforo));
  if (data.description) form.append('description', data.description);
  if (data.ciudad)      form.append('ciudad',      data.ciudad);
  if (data.genero)      form.append('genero',      data.genero);
  if (data.banner)      form.append('banner',      data.banner);

  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al actualizar' }));
    throw new Error(err.error ?? 'Error al actualizar evento');
  }
  return res.json();
}

export async function deleteEvento(id: number): Promise<Evento> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar evento');
  return res.json();
}

/**
 * Guarda en el backend la prueba on-chain (txHash + onchainId) después de que el
 * usuario firmó la transacción con MetaMask. Llama a PUT /api/eventos/:id/tx-hash.
 */
export async function updateTxHash(
  id: number,
  txHash: string,
  onchainId?: number,
): Promise<Evento> {
  const res = await fetch(`${BASE}/${id}/tx-hash`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txHash, onchainId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar el txHash' }));
    throw new Error(err.error ?? 'Error al guardar el txHash');
  }
  return res.json();
}

// --- Boleto NFT (contrato EventoNFT) ---

/** Config del contrato NFT (address + abi) que el frontend usa para acunar con MetaMask. */
export async function getNftConfig(): Promise<{ address: string; abi: unknown[] }> {
  const res = await fetch(`${BASE}/nft/config`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al obtener la config NFT' }));
    throw new Error(err.error ?? 'Error al obtener la config NFT');
  }
  return res.json();
}

/** Guarda en el backend el tokenId del boleto NFT (y su dueño) tras acunarlo. PUT /:id/nft */
export async function updateNftToken(id: number, tokenId: number, owner?: string): Promise<Evento> {
  const res = await fetch(`${BASE}/${id}/nft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, owner }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar el tokenId' }));
    throw new Error(err.error ?? 'Error al guardar el tokenId');
  }
  return res.json();
}

/** Registra en el backend el nuevo dueño del NFT tras transferirlo. PUT /:id/nft/transfer */
export async function transferNftOwner(id: number, owner: string): Promise<Evento> {
  const res = await fetch(`${BASE}/${id}/nft/transfer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al guardar el nuevo dueño' }));
    throw new Error(err.error ?? 'Error al guardar el nuevo dueño');
  }
  return res.json();
}
