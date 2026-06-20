/**
 * Configuración del contrato `Events` para el frontend (flujo MetaMask).
 *
 * La DIRECCIÓN del contrato se lee de la variable de entorno
 * NEXT_PUBLIC_CONTRACT_ADDRESS (ver .env.local). Esa dirección la imprime el script
 * de despliegue del backend (`npm run deploy`) y también queda guardada en
 * `mod_02_productos/src/blockchain/contract-info.json`. Pega ese valor en .env.local.
 *
 * El ABI son solo las funciones que el navegador necesita para registrar un evento
 * on-chain y leer el id resultante; está recortado a partir de contracts/Events.sol.
 */

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';

export const EVENTS_ABI = [
  {
    inputs: [
      { internalType: 'string',  name: 'lugar',     type: 'string'  },
      { internalType: 'uint256', name: 'fecha',     type: 'uint256' },
      { internalType: 'uint256', name: 'precioWei', type: 'uint256' },
      { internalType: 'uint256', name: 'capacidad', type: 'uint256' },
    ],
    name: 'crearEvento',
    outputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'total',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'getEvento',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id',          type: 'uint256' },
          { internalType: 'string',  name: 'lugar',       type: 'string'  },
          { internalType: 'uint256', name: 'fecha',       type: 'uint256' },
          { internalType: 'uint256', name: 'precioWei',   type: 'uint256' },
          { internalType: 'uint256', name: 'capacidad',   type: 'uint256' },
          { internalType: 'address', name: 'organizador', type: 'address' },
        ],
        internalType: 'struct Events.Evento',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
