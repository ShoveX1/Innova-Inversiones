import { useState, useEffect } from "react";
import { api } from "../../../../services/api_base";
import { clienteLoteApi, clientesApi } from '@/services';
import AsignarCliente from "./asignar_cliente";

interface RelacionClienteLote_admin {
    id: string;
    cliente: string;
    lote: number;
    cliente_nombre?: string;
    cliente_apellidos?: string;
    tipo_relacion: string;
    porcentaje_participacion: number | null;
    fecha?: string;
}

interface Cliente_admin {
    id: string;
    estado_financiero_actual: string;
    meses_deuda: number;
    monto_cuota: number;
    fecha_conciliacion: string;
    telefono: number;
}

interface EdicionClienteProps {
    codigoLote: string;
    onHayCambios?: (hayCambios: boolean) => void;
    shouldSave?: boolean;
    onSaveComplete?: () => void;
    shouldDiscard?: boolean;
    onDiscardComplete?: () => void;
}

export default function EdicionCliente({ 
    codigoLote,
    onHayCambios,
    shouldSave,
    onSaveComplete,
    shouldDiscard,
    onDiscardComplete
}: EdicionClienteProps) {
    const [relaciones, setRelaciones] = useState<RelacionClienteLote_admin[]>([]);
    const [clientes, setClientes] = useState<Record<string, Cliente_admin>>({});
    const [clienteDrafts, setClienteDrafts] = useState<Record<string, string>>({});
    const [fechaConciliacionDrafts, setFechaConciliacionDrafts] = useState<Record<string, string>>({});
    const [mesesDeudaDrafts, setMesesDeudaDrafts] = useState<Record<string, string>>({});
    const [telefonoDrafts, setTelefonoDrafts] = useState<Record<string, string>>({});
    const [montoCuotaDrafts, setMontoCuotaDrafts] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [modalAbierto, setModalAbierto] = useState(false);

    const TIPO_RELACION_LABELS: Record<string, string> = {
        'Propietario': '👤 Propietario',
        'reservante': '📋 Reservante',
        'copropietario': '👥 Copropietario',
    };

    // Buscar lote por código
    async function buscarLote(codigo: string) {
        const response = await api.get(`/api/admin/lotes/listar/?search=${encodeURIComponent(codigo)}`);
        const lotes = response?.lotes || (Array.isArray(response) ? response : []);
        return Array.isArray(lotes) 
            ? lotes.find((l: any) => l.codigo?.toLowerCase() === codigo.toLowerCase())
            : null;
    }

    // Cargar datos de un cliente
    async function cargarDatosCliente(clienteId: string): Promise<Cliente_admin> {
        try {
            const clienteData = await clientesApi.obtener(clienteId);
            return {
                id: clienteId,
                estado_financiero_actual: clienteData.estado_financiero_actual || 'al dia',
                meses_deuda: clienteData.meses_deuda || 0,
                monto_cuota: clienteData.monto_cuota || 0,
                fecha_conciliacion: clienteData.fecha_conciliacion || '',
                telefono: clienteData.telefono || 0
            };
        } catch (e) {
            console.error(`Error al cargar cliente ${clienteId}:`, e);
            return {
                id: clienteId,
                estado_financiero_actual: 'al dia',
                meses_deuda: 0,
                monto_cuota: 0,
                fecha_conciliacion: '',
                telefono: 0
            };
        }
    }

    // Cargar relaciones del lote
    async function cargarRelaciones() {
        if (!codigoLote) return;

        try {
            const lote = await buscarLote(codigoLote);
            if (!lote?.id) return;

            const relacionesData = await clienteLoteApi.listar({ lote_id: lote.id });
            const relacionesList = relacionesData?.relaciones || [];
            setRelaciones(relacionesList);

            // Cargar datos de todos los clientes
            const nuevosClientes: Record<string, Cliente_admin> = {};
            for (const relacion of relacionesList) {
                if (relacion.cliente && !nuevosClientes[relacion.cliente]) {
                    nuevosClientes[relacion.cliente] = await cargarDatosCliente(relacion.cliente);
                }
            }
            setClientes(nuevosClientes);
        } catch (e) {
            console.error('Error al cargar relaciones:', e);
        }
    }

    useEffect(() => {
        cargarRelaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codigoLote]);

    // Notificar cambios al componente padre
    useEffect(() => {
        const hayCambios = relaciones.some(rel => 
            clienteDrafts[rel.cliente] || 
            fechaConciliacionDrafts[rel.cliente] !== undefined ||
            mesesDeudaDrafts[rel.cliente] !== undefined ||
            telefonoDrafts[rel.cliente] !== undefined ||
            montoCuotaDrafts[rel.cliente] !== undefined
        );
        onHayCambios?.(hayCambios);
    }, [clienteDrafts, fechaConciliacionDrafts, mesesDeudaDrafts, telefonoDrafts, montoCuotaDrafts, relaciones, onHayCambios]);

    // Manejar guardado desde el componente padre
    useEffect(() => {
        if (shouldSave) {
            guardarCambios();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldSave]);

    // Manejar descarte desde el componente padre
    useEffect(() => {
        if (shouldDiscard) {
            descartarCambios();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldDiscard]);

    function updateClienteDraft(clienteId: string, estado: string) {
        setClienteDrafts(prev => ({
            ...prev,
            [clienteId]: estado
        }));
    }

    function updateFechaConciliacionDraft(clienteId: string, fecha: string) {
        setFechaConciliacionDrafts(prev => ({
            ...prev,
            [clienteId]: fecha
        }));
    }

    function updateMesesDeudaDraft(clienteId: string, meses: string) {
        setMesesDeudaDrafts(prev => ({
            ...prev,
            [clienteId]: meses
        }));
    }

    function updateTelefonoDraft(clienteId: string, telefono: string) {
        setTelefonoDrafts(prev => ({
            ...prev,
            [clienteId]: telefono
        }));
    }

    function updateMontoCuotaDraft(clienteId: string, monto: string) {
        setMontoCuotaDrafts(prev => ({
            ...prev,
            [clienteId]: monto
        }));
    }

    async function guardarCambios() {
        const clientesConCambios = relaciones.filter(rel => 
            clienteDrafts[rel.cliente] || 
            fechaConciliacionDrafts[rel.cliente] !== undefined ||
            mesesDeudaDrafts[rel.cliente] !== undefined ||
            telefonoDrafts[rel.cliente] !== undefined ||
            montoCuotaDrafts[rel.cliente] !== undefined
        );
        
        if (clientesConCambios.length === 0) {
            onSaveComplete?.();
            return;
        }
        
        try {
            setSaving(true);
            
            for (const { cliente } of clientesConCambios) {
                const clienteActual = clientes[cliente];
                const nuevoEstado = clienteDrafts[cliente] || clienteActual?.estado_financiero_actual || 'al dia';
                const fechaConciliacion = fechaConciliacionDrafts[cliente] ?? (clienteActual?.fecha_conciliacion || null);
                const mesesDeudaStr = mesesDeudaDrafts[cliente];
                const mesesDeuda = mesesDeudaStr !== undefined ? parseInt(mesesDeudaStr) || 1 : clienteActual?.meses_deuda ?? 1;
                const telefonoStr = telefonoDrafts[cliente];
                const telefono = telefonoStr !== undefined ? parseInt(telefonoStr) || 0 : clienteActual?.telefono ?? 0;
                const montoCuotaStr = montoCuotaDrafts[cliente];
                const montoCuota = montoCuotaStr !== undefined ? parseFloat(montoCuotaStr) || 0 : clienteActual?.monto_cuota ?? 0;
                
                const payload: any = {
                    estado_financiero_actual: nuevoEstado,
                    fecha_conciliacion: fechaConciliacion || null,
                    telefono: telefono,
                    monto_cuota: montoCuota
                };
                
                if (nuevoEstado === 'deudor' || nuevoEstado === 'conciliado') {
                    payload.meses_deuda = mesesDeuda;
                } else if (nuevoEstado !== 'al dia') {
                    payload.meses_deuda = clienteActual?.meses_deuda ?? 0;
                }
                
                await clientesApi.actualizar(cliente, payload);
                
                setClientes(prev => ({
                    ...prev,
                    [cliente]: {
                        ...clienteActual,
                        id: cliente,
                        estado_financiero_actual: nuevoEstado,
                        fecha_conciliacion: fechaConciliacion || '',
                        meses_deuda: (nuevoEstado === 'deudor' || nuevoEstado === 'conciliado') ? mesesDeuda : clienteActual?.meses_deuda ?? 0,
                        telefono: telefono,
                        monto_cuota: montoCuota
                    }
                }));
            }
            
            setClienteDrafts({});
            setFechaConciliacionDrafts({});
            setMesesDeudaDrafts({});
            setTelefonoDrafts({});
            setMontoCuotaDrafts({});
            
            onSaveComplete?.();
        } catch (e: any) {
            setError(e.message || 'No se pudo guardar los cambios');
        } finally {
            setSaving(false);
        }
    }

    function descartarCambios() {
        setClienteDrafts({});
        setFechaConciliacionDrafts({});
        setMesesDeudaDrafts({});
        setTelefonoDrafts({});
        setMontoCuotaDrafts({});
        onDiscardComplete?.();
    }

    return (
        <>
            <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Clientes Asignados ({relaciones.length || 0})
                    </label>
                    <button
                        onClick={() => setModalAbierto(true)}
                        className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center gap-1"
                    >
                        <span>+</span>
                        <span className="text-xs">Asignar Cliente</span>
                    </button>
                </div>
                
                {error && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs mb-2">
                        {error}
                    </div>
                )}
                
                {/* Lista de clientes asignados */}
                <div className="space-y-2">
                    {relaciones && relaciones.length > 0 ? (
                        relaciones.map((relacion) => (
                            <div key={relacion.id} className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-800 mb-2">
                                    <span className="font-medium">
                                        {relacion.cliente_nombre} {relacion.cliente_apellidos}
                                    </span>
                                    <span className="text-gray-600">-</span>
                                    <span>{TIPO_RELACION_LABELS[relacion.tipo_relacion] || relacion.tipo_relacion}</span>
                                    {relacion.tipo_relacion === 'copropietario' && relacion.porcentaje_participacion && (
                                        <>
                                            <span className="text-gray-600">-</span>
                                            <span className="text-gray-600">{relacion.porcentaje_participacion}%</span>
                                        </>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <label className="block text-[9px] text-gray-500 uppercase font-semibold mb-1">
                                                📞 Teléfono
                                            </label>
                                            <input
                                                type="number"
                                                value={telefonoDrafts[relacion.cliente] !== undefined 
                                                    ? telefonoDrafts[relacion.cliente] 
                                                    : (clientes[relacion.cliente]?.telefono || '')}
                                                onChange={(e) => updateTelefonoDraft(relacion.cliente, e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-md border border-blue-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-800"
                                                disabled={saving}
                                                placeholder="Ingrese teléfono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] text-gray-500 uppercase font-semibold mb-1">
                                                💰 Monto Cuota
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={montoCuotaDrafts[relacion.cliente] !== undefined 
                                                    ? montoCuotaDrafts[relacion.cliente] 
                                                    : (clientes[relacion.cliente]?.monto_cuota || '')}
                                                onChange={(e) => updateMontoCuotaDraft(relacion.cliente, e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-md border border-green-200 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs text-gray-800"
                                                disabled={saving}
                                                placeholder="S/. 0.00"
                                            />
                                        </div>
                                    </div>
                                    <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                        Estado de Pago: 
                                    </label>
                                    <select
                                        value={clienteDrafts[relacion.cliente] || clientes[relacion.cliente]?.estado_financiero_actual || 'al dia'}
                                        onChange={(e) => updateClienteDraft(relacion.cliente, e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs sm:text-sm text-gray-800"
                                        disabled={saving}
                                    >
                                        <option value="al dia">🟢 Al día</option>
                                        <option value="deudor">🔴 Deudor</option>
                                        <option value="conciliado">🟤 Conciliado</option>
                                    </select>
                                    
                                    {/* Input de meses de deuda para estado "deudor" */}
                                    {(clienteDrafts[relacion.cliente] === 'deudor' || 
                                      (!clienteDrafts[relacion.cliente] && clientes[relacion.cliente]?.estado_financiero_actual === 'deudor')) && (
                                        <div className="mt-2">
                                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                                Meses de Deuda: 
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={mesesDeudaDrafts[relacion.cliente] !== undefined 
                                                    ? mesesDeudaDrafts[relacion.cliente] 
                                                    : (clientes[relacion.cliente]?.meses_deuda || '')}
                                                onChange={(e) => updateMesesDeudaDraft(relacion.cliente, e.target.value)}
                                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs sm:text-sm text-gray-800"
                                                disabled={saving}
                                                placeholder="Ingrese meses de deuda"
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Campos para estado "conciliado": meses de deuda + fecha de conciliación */}
                                    {(clienteDrafts[relacion.cliente] === 'conciliado' || 
                                      (!clienteDrafts[relacion.cliente] && clientes[relacion.cliente]?.estado_financiero_actual === 'conciliado')) && (
                                        <>
                                            <div className="mt-2">
                                                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                                    Meses de Deuda: 
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={mesesDeudaDrafts[relacion.cliente] !== undefined 
                                                        ? mesesDeudaDrafts[relacion.cliente] 
                                                        : (clientes[relacion.cliente]?.meses_deuda || '')}
                                                    onChange={(e) => updateMesesDeudaDraft(relacion.cliente, e.target.value)}
                                                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs sm:text-sm text-gray-800"
                                                    disabled={saving}
                                                    placeholder="Ingrese meses de deuda"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                                    Fecha de Conciliación: 
                                                </label>
                                                <input
                                                    type="date"
                                                    value={fechaConciliacionDrafts[relacion.cliente] !== undefined 
                                                        ? fechaConciliacionDrafts[relacion.cliente] 
                                                        : (clientes[relacion.cliente]?.fecha_conciliacion || '')}
                                                    onChange={(e) => updateFechaConciliacionDraft(relacion.cliente, e.target.value)}
                                                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs sm:text-sm text-gray-800 cursor-pointer"
                                                    disabled={saving}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs sm:text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-200 text-center">
                            No hay clientes asignados a este lote
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de asignación */}
            {modalAbierto && (
                <AsignarCliente
                    codigoLote={codigoLote}
                    onCerrar={() => setModalAbierto(false)}
                    onClienteAsignado={cargarRelaciones}
                />
            )}
        </>
    );
}

