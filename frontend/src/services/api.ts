const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Método genérico para requests
  request: async (endpoint: string, options: RequestInit = {}) => {
    // Normalizar base y endpoint para evitar // o /api/api
    const base = String(API_URL || '').replace(/\/+$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${path}`;
    const response = await fetch(url, {
      // Forzar no usar caché del navegador; siempre traer datos frescos
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Spread al final para permitir overrides explícitos en llamadas puntuales
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Métodos específicos
  get: (endpoint: string) => api.request(endpoint),
  post: (endpoint: string, data: any) => 
    api.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) => 
    api.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) => 
    api.request(endpoint, { method: 'DELETE' }),
};