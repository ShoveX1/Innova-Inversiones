import { useState } from "react";
import { api } from "../../../../services/api_base";
import { clienteLoteApi, clientesApi } from '@/services';

interface Cliente {
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    email?: string;
    telefono?: string;
}

interface AsignarClienteProps {
    codigoLote: string;
    onCerrar: () => void;
    onClienteAsignado?: () => void;
}

export default function AsignarCliente({ 
    codigoLote, 
    onCerrar,
    onClienteAsignado
}: AsignarClienteProps) {
    const [clientesBusqueda, setClientesBusqueda] = useState<Cliente[]>([]);
    const [buscandoClientes, setBuscandoClientes] = useState(false);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [tipoRelacion, setTipoRelacion] = useState<string>('');
    const [porcentajeParticipacion, setPorcentajeParticipacion] = useState<string>('');
    const [asignando, setAsignando] = useState(false);
    const [errorModal, setErrorModal] = useState<string | null>(null);
    const [estadoLoteActual, setEstadoLoteActual] = useState<number>(1);

    const ESTADO_LABELS: Record<number, string> = {
        1: 'Disponible',
        2: 'Separado',
        3: 'Vendido',
        4: 'Bloqueado',
        5: 'Bloqueado Comercial',
        6: 'Separado comercial'
    };

    // Buscar lote por código
    async function buscarLote(codigo: string) {
        const response = await api.get(`/api/admin/lotes/listar/?search=${encodeURIComponent(codigo)}`);
        const lotes = response?.lotes || (Array.isArray(response) ? response : []);
        return Array.isArray(lotes) 
            ? lotes.find((l: any) => l.codigo?.toLowerCase() === codigo.toLowerCase())
            : null;
    }

    // Buscar ID del lote por código
    async function buscarLoteId(codigo: string) {
        const lote = await buscarLote(codigo);
        
        // Actualizar el estado del lote si está disponible
        if (lote?.estado) {
            setEstadoLoteActual(lote.estado);
        }
        
        return lote?.id || null;
    }

    // Buscar clientes
    async function buscarClientes(termino: string) {
        if (!termino || termino.length < 2) {
            setClientesBusqueda([]);
            return;
        }
        
        try {
            setBuscandoClientes(true);
            const response = await clientesApi.listar();
            const data = response as { count: number; clientes: Cliente[] };
            const todosClientes = data.clientes || [];
            
            const terminoLower = termino.toLowerCase();
            const terminoOriginal = termino.trim();
            
            const filtrados = todosClientes.filter(cliente => {
                const coincideNombre = cliente.nombre.toLowerCase().includes(terminoLower);
                const coincideApellidos = cliente.apellidos.toLowerCase().includes(terminoLower);
                const coincideDNI = cliente.dni?.includes(terminoOriginal) || false;
                
                return coincideNombre || coincideApellidos || coincideDNI;
            });
            
            setClientesBusqueda(filtrados.slice(0, 10));
        } catch(e: any) {
            setErrorModal('Error al buscar clientes');
            setClientesBusqueda([]);
        } finally {
            setBuscandoClientes(false);
        }
    }

    function seleccionarCliente(cliente: Cliente) {
        if (!cliente.id) {
            setErrorModal('Error: El cliente no tiene un ID válido');
            return;
        }
        setClienteSeleccionado(cliente);
        setBusquedaCliente(`${cliente.nombre} ${cliente.apellidos} (${cliente.dni})`);
        setClientesBusqueda([]);
    }

    async function asignarClienteALote() {
        if (!clienteSeleccionado || !tipoRelacion) {
            setErrorModal('Por favor complete todos los campos requeridos');
            return;
        }

        if (!clienteSeleccionado.id) {
            setErrorModal('Error: El cliente seleccionado no tiene un ID válido. Por favor, seleccione el cliente nuevamente.');
            return;
        }

        if (tipoRelacion === 'copropietario') {
            const porcentaje = parseFloat(porcentajeParticipacion);
            if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
                setErrorModal('El porcentaje de participación debe ser un número entre 0 y 100');
                return;
            }
        }

        try {
            setAsignando(true);
            setErrorModal(null);

            const loteId = await buscarLoteId(codigoLote);
            if (!loteId) {
                throw new Error(`No se encontró el lote con código: ${codigoLote}`);
            }

            const loteIdNumero = typeof loteId === 'string' ? parseInt(loteId, 10) : loteId;
            if (isNaN(loteIdNumero)) {
                throw new Error(`ID de lote inválido: ${loteId}`);
            }

            const clienteId = String(clienteSeleccionado.id).trim();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(clienteId)) {
                throw new Error(`El ID del cliente no es un UUID válido: ${clienteId}. Por favor, seleccione el cliente nuevamente.`);
            }

            const payload: any = {
                cliente: clienteId,
                lote: loteIdNumero,
                tipo_relacion: tipoRelacion,
            };

            if (tipoRelacion === 'copropietario' && porcentajeParticipacion) {
                payload.porcentaje_participacion = parseFloat(porcentajeParticipacion);
            }

            await clienteLoteApi.asignar(payload);
            
            onClienteAsignado?.();
            onCerrar();
        } catch(e: any) {
            let errorMessage = 'Error al asignar el cliente al lote';
            
            if (e.response?.data) {
                const errorData = e.response.data;
                
                if (errorData.detalles) {
                    const errores = Object.entries(errorData.detalles).map(([campo, mensajes]: [string, any]) => {
                        const mensaje = Array.isArray(mensajes) ? mensajes.join(', ') : String(mensajes);
                        return `${campo}: ${mensaje}`;
                    });
                    errorMessage = `Error de validación:\n${errores.join('\n')}`;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            } else if (e.message) {
                errorMessage = e.message;
            }
            
            setErrorModal(errorMessage);
        } finally {
            setAsignando(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Asignar Cliente a Lote {codigoLote}
                        </h3>
                        <button
                            onClick={onCerrar}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                            disabled={asignando}
                        >
                            ×
                        </button>
                    </div>

                    {/* Búsqueda de cliente */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar Cliente
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={clienteSeleccionado 
                                    ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellidos} (${clienteSeleccionado.dni})`
                                    : busquedaCliente
                                }
                                onChange={(e) => {
                                    const nuevoValor = e.target.value;
                                    setBusquedaCliente(nuevoValor);
                                    
                                    if (clienteSeleccionado && nuevoValor !== `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellidos} (${clienteSeleccionado.dni})`) {
                                        setClienteSeleccionado(null);
                                    }
                                    
                                    if (!nuevoValor) {
                                        setClienteSeleccionado(null);
                                        setClientesBusqueda([]);
                                    } else {
                                        buscarClientes(nuevoValor);
                                    }
                                }}
                                placeholder="Buscar por nombre, apellidos o DNI..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                                disabled={asignando}
                            />
                            {buscandoClientes && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>
                        
                        {/* Lista de resultados */}
                        {clientesBusqueda.length > 0 && !clienteSeleccionado && (
                            <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                                {clientesBusqueda.map((cliente) => (
                                    <button
                                        key={cliente.id}
                                        onClick={() => seleccionarCliente(cliente)}
                                        className="bg-white w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="font-medium text-sm text-gray-900">
                                            {cliente.nombre} {cliente.apellidos}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            DNI: {cliente.dni} {cliente.email && `| ${cliente.email}`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Cliente seleccionado */}
                        {clienteSeleccionado && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">
                                            {clienteSeleccionado.nombre} {clienteSeleccionado.apellidos}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            DNI: {clienteSeleccionado.dni}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setClienteSeleccionado(null);
                                            setBusquedaCliente('');
                                        }}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                        disabled={asignando}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tipo de relación */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Relación <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={tipoRelacion}
                            onChange={(e) => {
                                setTipoRelacion(e.target.value);
                                if (e.target.value !== 'copropietario') {
                                    setPorcentajeParticipacion('');
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-600"
                            disabled={asignando}
                        >
                            <option value="">Seleccione...</option>
                            <option value="Propietario">👤 Propietario</option>
                            <option value="reservante">📋 Reservante</option>
                            <option value="copropietario">👥 Copropietario</option>
                        </select>
                        {tipoRelacion && (
                            <p className="mt-1 text-xs text-gray-500">
                                Sugerido según estado del lote: {ESTADO_LABELS[estadoLoteActual] || 'Desconocido'}
                            </p>
                        )}
                    </div>

                    {/* Porcentaje de participación (solo para copropietarios) */}
                    {tipoRelacion === 'copropietario' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Porcentaje de Participación (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={porcentajeParticipacion}
                                onChange={(e) => setPorcentajeParticipacion(e.target.value)}
                                placeholder="Ej: 50.5"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={asignando}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Ingrese el porcentaje de participación (0-100)
                            </p>
                        </div>
                    )}

                    {/* Mensaje de error */}
                    {errorModal && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700 whitespace-pre-line">{errorModal}</p>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCerrar}
                            disabled={asignando}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={asignarClienteALote}
                            disabled={asignando || !clienteSeleccionado || !tipoRelacion}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {asignando ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Asignando...</span>
                                </>
                            ) : (
                                <span>Asignar Cliente</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
