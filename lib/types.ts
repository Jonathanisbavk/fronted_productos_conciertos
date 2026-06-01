export interface Evento {
  id: number;
  name: string;
  description: string;
  fecha: string;
  lugar: string;
  genero: string;
  ciudad: string;
  precio_eth: string | number;
  aforo: number;
  banner: string;
  metadataPath: string;
  txHash?: string | null;     // prueba on-chain: hash de la transaccion en la blockchain
  onchainId?: number | null;  // id del evento dentro del contrato Events
  createdAt: string;
}

export interface CreateEventoDTO {
  name: string;
  description?: string;
  fecha: string;
  lugar: string;
  ciudad?: string;
  genero?: string;
  precio_eth: string;
  aforo: number;
  banner?: File;
}
