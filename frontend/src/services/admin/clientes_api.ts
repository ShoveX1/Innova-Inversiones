import { api } from '../api_base';

export const clientesApi = {
  listar: () => api.get('api/admin/clientes/listar/'),
  crear: (data: any) => api.post('api/admin/clientes/crear/', data),
  obtener: (id: string) => api.get(`api/admin/clientes/obtener/${id}/`),
  actualizar: (id: string, data: any) => api.request(`api/admin/clientes/actualizar/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminar: (id: string, hardDelete: boolean = false) => {
    const url = hardDelete 
      ? `api/admin/clientes/eliminar/${id}/?hard=true`
      : `api/admin/clientes/eliminar/${id}/`;
    return api.delete(url);
  },
  activar: (id: string) => api.put(`api/admin/clientes/activar/${id}/`, {}),
};
