import { useState, useEffect } from "react";
import { api } from "../../../services/api_base";
import { clienteLoteApi, clientesApi } from '@/services';

interface Cliente {
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    email?: string;
    telefono?: string;
}

interface RelacionClienteLoteProps {
    codigoLote: string;
    estadoLote: number;
    loteId?: number;
    onAsignado?: () => void;
    onCerrar: () => void;
}

export default function RelacionClienteLote({
    codigoLote,
    estadoLote,
    loteId,
    onAsignado,
    onCerrar
}: RelacionClienteLoteProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [buscandoClientes, setBuscandoClientes] = useState(false);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [tipoRelacion, setTipoRelacion] = useState<string>('');
    const [porcentajeParticipacion, setPorcentajeParticipacion] = useState<string>('');
    const [asignando, setAsignando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mapear estado del lote a tipo de relación sugerido
    function estadoATipoRelacion(estado: number): string {
        const mapeo: Record<number, string> = {
            1: 'reservante',        // Disponible → Reservante
            2: 'reservante',        // Separado → Reservante
            3: 'Propietario',       // Vendido → Propietario
            4: 'declinado',         // Bloqueado → Declinado
            5: 'declinado',         // Bloqueado Comercial → Declinado
            6: 'reservante',        // Separado comercial → Reservante
        };
        return mapeo[estado] || 'reservante';
    }

    function estadoLabel(value: number): string {
        return value === 1 ? 'Disponible'
            : value === 2 ? 'Separado'
            : value === 3 ? 'Vendido'
            : value === 4 ? 'Bloqueado'
            : value === 5 ? 'Bloqueado Comercial'
            : value === 6 ? 'Separado comercial'
            : '';
    }

    // Inicializar tipo de relación según estado del lote
    useEffect(() => {
        setTipoRelacion(estadoATipoRelacion(estadoLote));
    }, [estadoLote]);

    // Buscar clientes
    async function buscarClientes(termino: string) {
        if (!termino || termino.length < 2) {
            setClientes([]);
            return;
        }
        
        try {
            setBuscandoClientes(true);
            const response = await clientesApi.listar();
            const data = response as { count: number; clientes: Cliente[] };
            const todosClientes = data.clientes || [];
            
            // Filtrar localmente por término de búsqueda
            const terminoLower = termino.toLowerCase();
            const filtrados = todosClientes.filter(cliente => 
                cliente.nombre.toLowerCase().includes(terminoLower) ||
                cliente.apellidos.toLowerCase().includes(terminoLower) ||
                cliente.dni.includes(termino) ||
                (cliente.email && cliente.email.toLowerCase().includes(terminoLower))
            );
            
            setClientes(filtrados.slice(0, 10)); // Limitar a 10 resultados
        } catch(e: any) {
            setError('Error al buscar clientes');
            setClientes([]);
        } finally {
            setBuscandoClientes(false);
        }
    }

    // Seleccionar cliente
    function seleccionarCliente(cliente: Cliente) {
        // Validar que el cliente tenga ID
        if (!cliente.id) {
            setError('Error: El cliente no tiene un ID válido');
            return;
        }
        console.log('Cliente seleccionado:', cliente); // Debug
        setClienteSeleccionado(cliente);
        setBusquedaCliente(`${cliente.nombre} ${cliente.apellidos} (${cliente.dni})`);
        setClientes([]);
    }

    // Asignar cliente a lote
    async function asignarClienteALote() {
        if (!clienteSeleccionado || !tipoRelacion) {
            setError('Por favor complete todos los campos requeridos');
            return;
        }

        // Validar que el cliente tenga un ID válido
        if (!clienteSeleccionado.id) {
            setError('Error: El cliente seleccionado no tiene un ID válido. Por favor, seleccione el cliente nuevamente.');
            return;
        }

        // Validar porcentaje si es copropietario
        if (tipoRelacion === 'copropietario') {
            const porcentaje = parseFloat(porcentajeParticipacion);
            if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
                setError('El porcentaje de participación debe ser un número entre 0 y 100');
                return;
            }
        }

        try {
            setAsignando(true);
            setError(null);

            // Obtener el ID del lote si no lo tenemos
            let idLote = loteId;
            if (!idLote) {
                try {
                    // Buscar el lote por código exacto usando el endpoint de listar
                    const lotesLista = await api.get(`/api/admin/lotes/listar/?search=${encodeURIComponent(codigoLote)}`);
                    
                    // El endpoint devuelve { count: number, lotes: Lote[] }
                    const lotes = lotesLista?.lotes || (Array.isArray(lotesLista) ? lotesLista : []);
                    const loteEncontrado = Array.isArray(lotes) 
                        ? lotes.find((l: any) => l.codigo?.toLowerCase() === codigoLote.toLowerCase())
                        : null;
                    
                    if (loteEncontrado?.id) {
                        idLote = loteEncontrado.id;
                    } else {
                        throw new Error(`No se encontró el lote con código: ${codigoLote}`);
                    }
                } catch (e: any) {
                    throw new Error(`Error al buscar el lote: ${e.message || 'Lote no encontrado'}`);
                }
            }

            if (!idLote) {
                throw new Error(`No se pudo obtener el ID del lote con código: ${codigoLote}`);
            }

            // Asegurar que el lote sea un número entero
            const loteIdNumero = typeof idLote === 'string' ? parseInt(idLote, 10) : idLote;
            if (isNaN(loteIdNumero)) {
                throw new Error(`ID de lote inválido: ${idLote}`);
            }

            // Validar nuevamente antes de crear el payload
            if (!clienteSeleccionado || !clienteSeleccionado.id) {
                throw new Error('El cliente seleccionado no tiene un ID válido');
            }

            // Validar que el ID del cliente sea un UUID válido
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

            console.log('Cliente seleccionado completo:', clienteSeleccionado); // Debug
            console.log('Payload a enviar:', payload); // Debug

            await clienteLoteApi.asignar(payload);
            
            // Llamar callback si existe
            if (onAsignado) {
                onAsignado();
            }
            
            // Cerrar modal
            onCerrar();
        } catch(e: any) {
            // Mostrar errores detallados del backend si están disponibles
            let errorMessage = 'Error al asignar el cliente al lote';
            
            console.error('Error completo:', e);
            console.error('Error response:', e.response);
            console.error('Error data:', e.response?.data);
            
            if (e.response?.data) {
                const errorData = e.response.data;
                console.error('Error data completo:', JSON.stringify(errorData, null, 2));
                
                if (errorData.detalles) {
                    // Errores del serializer
                    const detalles = errorData.detalles;
                    const errores = Object.entries(detalles).map(([campo, mensajes]: [string, any]) => {
                        const mensaje = Array.isArray(mensajes) ? mensajes.join(', ') : String(mensajes);
                        return `${campo}: ${mensaje}`;
                    });
                    errorMessage = `Error de validación:\n${errores.join('\n')}`;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else {
                    // Si no hay formato conocido, mostrar todo el objeto
                    errorMessage = `Error del servidor: ${JSON.stringify(errorData, null, 2)}`;
                }
            } else if (e.message) {
                errorMessage = e.message;
            }
            
            setError(errorMessage);
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
                                    
                                    // Si el usuario está escribiendo y ya hay un cliente seleccionado, limpiar la selección
                                    if (clienteSeleccionado && nuevoValor !== `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellidos} (${clienteSeleccionado.dni})`) {
                                        setClienteSeleccionado(null);
                                    }
                                    
                                    if (!nuevoValor) {
                                        setClienteSeleccionado(null);
                                        setClientes([]);
                                    } else {
                                        buscarClientes(nuevoValor);
                                    }
                                }}
                                placeholder="Buscar por nombre, DNI o email..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={asignando}
                            />
                            {buscandoClientes && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>
                        
                        {/* Lista de resultados */}
                        {clientes.length > 0 && !clienteSeleccionado && (
                            <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                                {clientes.map((cliente) => (
                                    <button
                                        key={cliente.id}
                                        onClick={() => seleccionarCliente(cliente)}
                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={asignando}
                        >
                            <option value="">Seleccione...</option>
                            <option value="Propietario">👤 Propietario</option>
                            <option value="reservante">📋 Reservante</option>
                            <option value="copropietario">👥 Copropietario</option>
                            <option value="declinado">❌ Declinado</option>
                        </select>
                        {tipoRelacion && (
                            <p className="mt-1 text-xs text-gray-500">
                                Sugerido según estado del lote: {estadoLabel(estadoLote)}
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
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
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

