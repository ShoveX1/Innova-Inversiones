import { useState, useEffect } from 'react';
import { clientesApi } from '@/services';
import EditarCliente from './editar_cliente';
import { Pencil, Trash2, Loader2 } from 'lucide-react';

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
    const [clienteEditando, setClienteEditando] = useState<string | null>(null);
    const [clienteEliminando, setClienteEliminando] = useState<string | null>(null);

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

    useEffect(() => {
        cargarClientes();
    }, []);

    const handleEditar = (clienteId: string) => {
        setClienteEditando(clienteId);
    };

    const handleEliminar = async (clienteId: string, nombreCompleto: string) => {
        const confirmar = window.confirm(
            `¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE al cliente "${nombreCompleto}"?\n\n` +
            `⚠️ ADVERTENCIA: Esta acción no se puede deshacer. El cliente será eliminado completamente de la base de datos.`
        );

        if (!confirmar) {
            return;
        }

        try {
            setClienteEliminando(clienteId);
            // Eliminación física (hard delete)
            await clientesApi.eliminar(clienteId, true);
            // Recargar la lista de clientes
            await cargarClientes();
            alert('Cliente eliminado permanentemente');
        } catch (err: any) {
            console.error('Error al eliminar el cliente:', err);
            const errorMessage = err?.response?.data?.error || err?.message || 'Error al eliminar el cliente';
            alert(`Error: ${errorMessage}`);
        } finally {
            setClienteEliminando(null);
        }
    };

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
                                        <td className="px-2 py-2 border border-blue-500 min-w-24">
                                            {cliente.lotes?.length ? (
                                                <div className="grid grid-cols-2 gap-1">
                                                    {cliente.lotes.map((lote, index) => (
                                                        <span 
                                                            key={lote.id || index}
                                                            className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-medium text-center min-w-10"
                                                            title={`Lote: ${lote.codigo}`}
                                                        >
                                                            {lote.codigo}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">--</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center border border-blue-500">
                                            <div className="flex gap-2 justify-center">
                                                <button 
                                                    onClick={() => handleEditar(cliente.id)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center justify-center"
                                                    title="Editar cliente"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEliminar(cliente.id, `${cliente.nombre} ${cliente.apellidos}`)}
                                                    disabled={clienteEliminando === cliente.id}
                                                    className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center justify-center ${
                                                        clienteEliminando === cliente.id
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : 'bg-red-500 text-white hover:bg-red-600'
                                                    }`}
                                                    title="Eliminar cliente"
                                                >
                                                    {clienteEliminando === cliente.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
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
        
        {/* Modal de edición */}
        {clienteEditando && (
            <EditarCliente
                clienteId={clienteEditando}
                isOpen={true}
                onClose={() => setClienteEditando(null)}
                onSuccess={() => {
                    cargarClientes();
                }}
            />
        )}
    </div>
  );
}