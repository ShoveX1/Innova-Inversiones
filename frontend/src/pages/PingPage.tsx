// Página simple para recibir pings y mantener despierto el servicio
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function PingPage() {
  const [status, setStatus] = useState('checking');
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        setStatus('pinging');
        setTimestamp(new Date().toISOString());
        
        // Hacer ping al backend para mantenerlo despierto
        const response = await api.get('api/maps/lotes/');
        
        if (response && Array.isArray(response)) {
          setBackendStatus('ok');
          setStatus('success');
        } else {
          setBackendStatus('error');
          setStatus('error');
        }
      } catch (error) {
        console.error('Error pinging backend:', error);
        setBackendStatus('error');
        setStatus('error');
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🏓 Servicio de Ping
        </h1>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Estado del Frontend:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              status === 'success' ? 'bg-green-100 text-green-800' :
              status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {status === 'success' ? '✅ Activo' :
               status === 'error' ? '❌ Error' :
               '⏳ Verificando...'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Estado del Backend:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              backendStatus === 'ok' ? 'bg-green-100 text-green-800' :
              backendStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {backendStatus === 'ok' ? '✅ Conectado' :
               backendStatus === 'error' ? '❌ Desconectado' :
               '⏳ Desconocido'}
            </span>
          </div>
          
          {timestamp && (
            <div className="text-sm text-gray-500">
              Último ping: {new Date(timestamp).toLocaleString('es-CO')}
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Servicio Keep-Alive:</strong> Esta página está diseñada para recibir pings 
            de servicios externos y mantener activos tanto el frontend como el backend.
          </p>
        </div>
      </div>
    </div>
  );
}
