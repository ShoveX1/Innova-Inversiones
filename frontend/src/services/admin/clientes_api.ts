import { api } from '../api_base';

export const clientesApi = {
  listar: () => api.get('api/admin/clientes/listar/'),
  crear: (data: any) => api.post('api/admin/clientes/crear/', data),
  obtener: (id: string) => api.get(`api/admin/clientes/obtener/${id}/`),
  actualizar: (id: string, data: any) => api.put(`api/admin/clientes/actualizar/${id}/`, data),
  eliminar: (id: string) => api.delete(`api/admin/clientes/eliminar/${id}/`),
  activar: (id: string) => api.put(`api/admin/clientes/activar/${id}/`, {}),
};
