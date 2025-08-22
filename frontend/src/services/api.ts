const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
  // Método genérico para requests
  request: async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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