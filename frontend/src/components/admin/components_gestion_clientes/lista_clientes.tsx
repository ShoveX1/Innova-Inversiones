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
    lotes: Lote[];
}

interface Lote {
    id: number;
    codigo: string;
    manzana: string;
    lote_numero: string;
    estado: number;
    area_lote: number;
    precio: number | null;
    tipo_relacion?: string;
    porcentaje_participacion?: number;
}

export default function ListaClientes(){
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <section className="p-2 m-4 bg-gray-50 rounded-xl">
                {/*mensaje de error*/}
                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        Error al cargar los clientes: {error}
                    </div>
                )}
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
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                            <span className="ml-3">Cargando clientes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                        No hay clientes registrados
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((cliente) => (
                                    <tr key={cliente.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="px-2 py-2 border border-blue-500">{cliente.nombre}</td>
                                        <td className="px-2 py-2 border border-blue-500">{cliente.apellidos}</td>
                                        <td className="px-2 py-2 border border-blue-500 truncate" title={cliente.email}>{cliente.email || '--'}</td>
                                        <td className="px-2 py-2 border border-blue-500 truncate" title={cliente.direccion}>{cliente.direccion || '--'}</td>
                                        <td className="px-2 py-2 border border-blue-500">{cliente.dni}</td>
                                        <td className="px-2 py-2 border border-blue-500">{cliente.telefono || '--'}</td>
                                        <td className="px-2 py-2 border border-blue-500">{cliente.fecha_nacimiento}</td>
                                        <td className="px-2 py-2 border border-blue-500">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                cliente.estado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {cliente.estado ? 'Activo' : 'Prospecto'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 border border-blue-500 truncate" title={cliente.lotes?.length ? `Lotes: ${cliente.lotes.map(l => l.codigo).join(', ')}` : ''}>
                                            {cliente.lotes?.length ? (
                                                cliente.lotes.length === 1 
                                                    ? cliente.lotes[0].codigo 
                                                    : `${cliente.lotes[0].codigo} (+${cliente.lotes.length - 1})`
                                            ) : '--'}
                                        </td>
                                        <td className="px-4 py-3 text-center border border-blue-500">
                                            <div className="flex gap-2 justify-center">
                                                <button className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors">
                                                    ✏️
                                                </button>
                                                <button className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-200 hover:border-red-500 transition-colors">
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
        </section>
    </div>
  );
}