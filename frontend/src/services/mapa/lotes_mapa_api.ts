import { api } from '../api_base';

export const lotesMapaApi = {
  listar: () => api.get('api/maps/lotes/'),
  detalle: (codigo: string) => api.get(`api/maps/lotes/${codigo}/`),
};
