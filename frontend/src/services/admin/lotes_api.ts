import { api } from '../api_base';

export const lotesApi = {
    listar: (search?: string) => {
        let url = 'api/admin/lotes/listar/';
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        return api.get(url);
    },
};