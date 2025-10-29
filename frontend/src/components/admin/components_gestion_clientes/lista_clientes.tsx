import { useState, useEffect } from 'react';
import { clientesApi } from '@/services';

interface Cliente {
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    fecha_nacimiento?: string;
    estado: boolean;
    creado_en: string;
    actualizado_en: string;
}

export default function ListaClientes(){
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Contadores
    const clientesActivos = clientes.filter(cliente => cliente.estado === true).length;
    const clientesInactivos = clientes.filter(cliente => cliente.estado === false).length;
    const clientesTotales = clientes.length;

    useEffect(() => {
        const cargarClientes = async () => {
            try {
                setLoading(true);
                const response = await clientesApi.listar();
                // El backend devuelve { count: number, clientes: Cliente[] }
                const data = response as { count: number; clientes: Cliente[] };
                setClientes(data.clientes || []);
                setError(null);
            } catch (err) {
                console.error('Error al cargar clientes:', err);
                setError('Error al cargar los clientes');
            } finally {
                setLoading(false);
            }
        };

        cargarClientes();
    }, []);

    return (
        <div>
            <section className="p-6 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Clientes Activos */}
                    <article className="bg-white rounded-lg p-4 shadow-sm flex flex-row justify-start items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" className="w-10 h-10 bg-green-200 rounded-lg p-2">
                            <path fill="green" d="M12 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7ZM6.5 7.5a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0ZM3 19a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3H3v-3Zm5-3a3 3 0 0 0-3 3v1h14v-1a3 3 0 0 0-3-3H8Z"/>
                        </svg>
                        <div className="flex flex-col justify-center items-start">
                            <h3 className="text-gray-500 text-sm">Clientes Activos</h3>
                            {loading ? (
                                <p className="text-2xl font-bold text-gray-400">...</p>
                            ) : (
                                <p className="text-2xl font-bold text-black">{clientesActivos}</p>
                            )}
                        </div>
                    </article>

                    {/* Clientes Inactivos */}
                    <article className="bg-white rounded-lg p-4 shadow-sm flex flex-row justify-start items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" className="w-10 h-10 bg-yellow-100 rounded-lg p-2">
                            <path fill="orange" d="M12 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7ZM6.5 7.5a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0ZM3 19a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3H3v-3Zm5-3a3 3 0 0 0-3 3v1h14v-1a3 3 0 0 0-3-3H8Z"/>
                        </svg>
                        <div className="flex flex-col justify-center items-start">
                            <h3 className="text-gray-500 text-sm">Prospectos</h3>
                            {loading ? (
                                <p className="text-2xl font-bold text-gray-400">...</p>
                            ) : (
                                <p className="text-2xl font-bold text-black">{clientesInactivos}</p>
                            )}
                        </div>
                    </article>

                    {/* Clientes Totales */}
                    <article className="bg-white rounded-lg p-4 shadow-sm flex flex-row justify-start items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" className="w-10 h-10 bg-blue-200 rounded-lg p-2">
                            <path fill="blue" d="M12 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7ZM6.5 7.5a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0ZM3 19a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3H3v-3Zm5-3a3 3 0 0 0-3 3v1h14v-1a3 3 0 0 0-3-3H8Z"/>
                        </svg>
                        <div className="flex flex-col justify-center items-start">
                            <h3 className="text-gray-500 text-sm">Clientes Totales</h3>
                            {loading ? (
                                <p className="text-2xl font-bold text-gray-400">...</p>
                            ) : (
                                <p className="text-2xl font-bold text-black">{clientesTotales}</p>
                            )}
                        </div>
                    </article>
                </div>

                {/* Mensaje de error si hay */}
                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
            </section>
            <section className="p-2 m-4 bg-gray-50 rounded-xl">
                <div className="overflow-x-auto rounded-t-lg border border-blue-500">
                    <table className="w-full text-black border-collapse ">
                        <thead className="bg-blue-200">
                            <tr className="text-blue-600">
                                <th className="px-2 py-3 text-center font-semibold w-32 border-r border-blue-500">Nombres</th>
                                <th className="px-2 py-3 text-center font-semibold w-32 border-x border-blue-500">Apellidos</th>
                                <th className="px-2 py-3 text-center font-semibold w-48 border-x border-blue-500">Email</th>
                                <th className="px-2 py-3 text-center font-semibold w-40 border-x border-blue-500">Dirección</th>
                                <th className="px-2 py-3 text-center font-semibold w-24 border-x border-blue-500">DNI</th>
                                <th className="px-2 py-3 text-center font-semibold w-28 border-x border-blue-500">Teléfono</th>
                                <th className="px-2 py-3 text-center font-semibold w-40 border-x border-blue-500">Fecha de Nacimiento</th>
                                <th className="px-2 py-3 text-center font-semibold w-24 border-x border-blue-500">Estado</th>
                                <th className="px-2 py-3 text-center font-semibold w-24 border-x border-blue-500">Lote</th>
                                <th className="px-2 py-3 text-center font-semibold w-28 border-l border-blue-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((cliente) => (
                                <tr key={cliente.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="px-2 py-2 border border-blue-500">{cliente.nombre}</td>
                                    <td className="px-2 py-2 border border-blue-500">{cliente.apellidos}</td>
                                    <td className="px-2 py-2 border border-blue-500 truncate" title={cliente.email}>{cliente.email}</td>
                                    <td className="px-2 py-2 border border-blue-500 truncate" title={cliente.direccion}>{cliente.direccion}</td>
                                    <td className="px-2 py-2 border border-blue-500">{cliente.dni}</td>
                                    <td className="px-2 py-2 border border-blue-500">{cliente.telefono}</td>
                                    <td className="px-2 py-2 border border-blue-500">{cliente.fecha_nacimiento}</td>
                                    <td className="px-2 py-2 border border-blue-500">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            cliente.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {cliente.estado ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 border border-blue-500 truncate">En Desarrollo Foraneo</td>
                                    <td className="px-4 py-3 text-center border border-blue-500">
                                        <div className="flex gap-2 justify-center">
                                            <button className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors">
                                                ✏️
                                            </button>
                                            <button className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-200  hover:border-red-500 transition-colors">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
        </section>
    </div>
  );
}