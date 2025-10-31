const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  request: async (endpoint: string, options: RequestInit = {}) => {
    const base = API_URL.replace(/\/+$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${path}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Intentar leer el JSON del error antes de lanzar la excepción
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(`HTTP error! status: ${response.status}`) as any;
      error.response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }

    return response.json();
  },

  get: (endpoint: string) => api.request(endpoint),
  post: (endpoint: string, data: any) =>
    api.request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any) =>
    api.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => api.request(endpoint, { method: 'DELETE' }),
};
