import { api } from '../api_base';

export const clienteLoteApi = {
    listar: (params?: {
        cliente_id?: string;
        lote_id?: number;
        tipo_relacion?: string;
        codigo_lote?: string;
        nombre_cliente?: string;
        dni?: string;
        estado_lote?: string | number;
    }) => {
        let url = 'api/admin/cliente-lote/listar/';
        if (params) {
            const query = new URLSearchParams();
            if (params.cliente_id) query.append('cliente_id', params.cliente_id);
            if (params.lote_id !== undefined) query.append('lote_id', String(params.lote_id));
            if (params.tipo_relacion) query.append('tipo_relacion', params.tipo_relacion);
            if (params.codigo_lote) query.append('codigo_lote', params.codigo_lote);
            if (params.nombre_cliente) query.append('nombre_cliente', params.nombre_cliente);
            if (params.dni) query.append('dni', params.dni);
            if (params.estado_lote !== undefined) query.append('estado_lote', String(params.estado_lote));
            
            const queryString = query.toString();
            if (queryString) url += '?' + queryString;
        }
        return api.get(url);
    },
    asignar: (data: any) => api.post('api/admin/cliente-lote/asignar/', data),
    actualizar: (id: string, data: any) => api.request(`api/admin/cliente-lote/actualizar/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    eliminar: (id: string) => api.delete(`api/admin/cliente-lote/eliminar/${id}/`),
};