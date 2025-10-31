import { useState, useEffect } from 'react';
import { clientesApi, lotesApi, clienteLoteApi } from '@/services';


interface Cliente {
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    direccion: string;
    telefono: string;
    email: string;
    fecha_nacimiento: string;
    estado: boolean;
    lotes: Lote[];
}

interface LoteFormulario {
    asignar_lote: boolean;
    lote_id: number;
    tipo_relacion: string;
    porcentaje_participacion: number;
}

interface Lote {
    id: number;
    codigo: string;
    manzana: string;
    lote_numero: string;
    estado: number;
}
// Interface para relaciones cliente-lote (puede usarse en el futuro)
// interface ClienteLote {
//     id: string;
//     cliente: string;
//     lote: string;
//     lote_codigo: string;
//     lote_manzana: string;
//     lote_numero: string;
//     cliente_nombre: string;
//     cliente_apellidos: string;
//     tipo_relacion: string;
//     porcentaje_participacion: number;
// }

export default function RegistroCliente(){

    const [cliente, setCliente] = useState<Cliente>(
        {
            id: '',
            nombre: '',
            apellidos: '',
            dni: '',
            direccion: '',
            telefono: '',
            email: '',
            fecha_nacimiento: '',
            estado: true,
            lotes: [],
        }
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loteFormulario, setLoteFormulario] = useState<LoteFormulario>({
        asignar_lote: false,
        lote_id: 0,
        tipo_relacion: 'reservante',
        porcentaje_participacion: 0,
    });
    const [loadingLotes, setLoadingLotes] = useState(false);
    const [lotes, setLotes] = useState<Lote[]>([]);

    useEffect(() => {
        const cargarLotes = async () => {
            try {
                setLoadingLotes(true);
                const response = await lotesApi.listar();
                const data = response as any;
                setLotes(data.lotes || data || []);
            } catch (error) {
                console.error('Error al cargar lotes:', error);
                setError('Error al cargar los lotes');
            } finally {
                setLoadingLotes(false);
            }
        };
        cargarLotes();
    }, []);


    const handleLoteChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        // Convertir valores numéricos
        let finalValue: any = type === 'checkbox' ? checked : value;
        if (name === 'lote_id' || name === 'porcentaje_participacion') {
            finalValue = value === '' ? 0 : Number(value);
        }
        
        setLoteFormulario({
            ...loteFormulario,
            [name]: finalValue,
        });
    };
    
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const target = e.target;
        const { name, value, type } = target;
        const checked = (target as HTMLInputElement).checked;
        
        setCliente({
            ...cliente,
            [name]: type === 'checkbox' ? checked : value,
        });
        // Limpiar mensajes de error al modificar el formulario
        if (error) setError(null);
        if (success) setSuccess(null);
    };

    const resetForm = () => {
        setCliente({
            id: '',
            nombre: '',
            apellidos: '',
            dni: '',
            direccion: '',
            telefono: '',
            email: '',
            fecha_nacimiento: '',
            estado: true,
            lotes: [],
        });
        setLoteFormulario({
            asignar_lote: false,
            lote_id: 0,
            tipo_relacion: 'reservante',
            porcentaje_participacion: 0,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Crear cliente (sin el campo lotes que es solo lectura)
            const { lotes, ...datosCliente } = cliente;
            const response = await clientesApi.crear(datosCliente);
            console.log("Cliente creado exitosamente:", response);
            console.log("Respuesta completa:", JSON.stringify(response, null, 2));
            
            // Obtener id del cliente creado de la respuesta
            const clienteId = response?.cliente?.id || response?.data?.cliente?.id || response?.id;
            console.log("Cliente ID obtenido:", clienteId);
            
            if (!clienteId) {
                throw new Error('No se pudo obtener el ID del cliente creado');
            }

            // Si se debe asignar un lote, crear la relación
            if (loteFormulario.asignar_lote && loteFormulario.lote_id > 0 && clienteId) {
                try {
                    const relacionData: any = {
                        cliente: clienteId,
                        lote: loteFormulario.lote_id,
                        tipo_relacion: loteFormulario.tipo_relacion,
                    };
                    if (loteFormulario.porcentaje_participacion > 0) {
                        relacionData.porcentaje_participacion = loteFormulario.porcentaje_participacion;
                    }
                    console.log('Datos a enviar para asignar lote:', relacionData);
                    await clienteLoteApi.asignar(relacionData);
                    setSuccess('Cliente creado y lote asignado exitosamente');
                } catch (errorRelacion: any) {
                    console.error('Error al asignar el lote al cliente:', errorRelacion);
                    console.error('Detalles del error:', errorRelacion?.response?.data);
                    setSuccess('Cliente creado exitosamente');
                    const errorDetalle = errorRelacion?.response?.data;
                    const errorMsg = errorDetalle?.error || errorDetalle?.detalle || errorRelacion?.message || 'Error desconocido';
                    const detalles = errorDetalle?.detalles ? ` (${JSON.stringify(errorDetalle.detalles)})` : '';
                    setError(`Cliente creado. Error al asignar lote: ${errorMsg}${detalles}`);
                }
            } else {
                setSuccess('Cliente creado exitosamente');
            }
            resetForm();
        } catch (error: any) {
            console.error('Error al crear el cliente:', error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Error al crear el cliente';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-600 mb-4">Registro de Cliente</h1>
            <section>
                {error && (
                    <div style={{ color: 'red', padding: '10px', marginBottom: '10px', backgroundColor: '#fee', border: '1px solid #fcc' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ color: 'green', padding: '10px', marginBottom: '10px', backgroundColor: '#efe', border: '1px solid #cfc' }}>
                        {success}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-black p-4 bg-gray-100 rounded-lg">
                    <div>
                        <label htmlFor="nombre">Nombre: *</label>
                        <input className="w-full p-2 rounded-md border border-gray-300 bg-white"
                            type="text" 
                            id="nombre"
                            name="nombre" 
                            value={cliente.nombre} 
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="apellidos">Apellidos: *</label>
                        <input className="w-full p-2 rounded-md border border-gray-300 bg-white"
                            type="text" 
                            id="apellidos"
                            name="apellidos" 
                            value={cliente.apellidos} 
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="dni">DNI:</label>
                        <input className="w-full p-2 rounded-md border border-gray-300 bg-white"
                            type="number" 
                            id="dni"
                            name="dni" 
                            value={cliente.dni} 
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="direccion">Dirección:</label>
                        <input className="w-full p-2 rounded-md border border-gray-300 bg-white"
                            type="text" 
                            id="direccion"
                            name="direccion" 
                            value={cliente.direccion} 
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="telefono">Teléfono:</label>
                        <input className="w-full p-2 rounded-md border border-gray-300 bg-white"
                            type="number" 
                            id="telefono"
                            name="telefono" 
                            value={cliente.telefono} 
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="email">Email:</label>
                        <input className="w-full p-2 rounded-md border border-gray-300 bg-white"
                            type="email" 
                            id="email"
                            name="email" 
                            value={cliente.email} 
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="fecha_nacimiento">Fecha de Nacimiento:</label>
                        <input className="w-full p-2 rounded-md border border-gray-300 bg-white"
                            type="date" 
                            id="fecha_nacimiento"
                            name="fecha_nacimiento" 
                            value={cliente.fecha_nacimiento} 
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="estado">
                            <input className="mr-2"
                                type="checkbox" 
                                id="estado"
                                name="estado" 
                                checked={cliente.estado} 
                                onChange={handleChange}
                            />
                            Activo
                        </label>
                    </div>

                    {/* Sección de Asignar Lote */}
                    <div className="border-t border-gray-300 pt-4 mt-4">
                        <div className="mb-4">
                            <label htmlFor="asignar_lote">
                                <input 
                                    className="mr-2"
                                    type="checkbox"
                                    id="asignar_lote"
                                    name="asignar_lote"
                                    checked={loteFormulario.asignar_lote}
                                    onChange={handleLoteChange}
                                />
                                Asignar lote al cliente
                            </label>
                        </div>

                        {loteFormulario.asignar_lote && (
                            <>
                                <div>
                                    <label htmlFor="lote_id">Lote:</label>
                                    <select
                                        className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                        id="lote_id"
                                        name="lote_id"
                                        value={loteFormulario.lote_id}
                                        onChange={handleLoteChange}
                                        required={loteFormulario.asignar_lote}
                                        disabled={loadingLotes}
                                    >
                                        <option value="0">Seleccione un lote</option>
                                        {lotes.map((lote) => (
                                            <option key={lote.id} value={lote.id}>
                                                {lote.codigo}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingLotes && <p className="text-sm text-gray-500">Cargando lotes...</p>}
                                </div>

                                <div>
                                    <label htmlFor="tipo_relacion">Tipo de Relación: *</label>
                                    <select
                                        className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                        id="tipo_relacion"
                                        name="tipo_relacion"
                                        value={loteFormulario.tipo_relacion}
                                        onChange={handleLoteChange}
                                        required={loteFormulario.asignar_lote}
                                    >
                                        <option value="reservante">Reservante</option>
                                        <option value="Propietario">Propietario</option>
                                        <option value="copropietario">Copropietario</option>
                                    </select>
                                </div>

                                {loteFormulario.tipo_relacion === 'copropietario' && (
                                    <div>
                                        <label htmlFor="porcentaje_participacion">Porcentaje de Participación:</label>
                                        <input
                                            className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                            type="number"
                                            id="porcentaje_participacion"
                                            name="porcentaje_participacion"
                                            value={loteFormulario.porcentaje_participacion > 0 ? loteFormulario.porcentaje_participacion : ''}
                                            onChange={handleLoteChange}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            placeholder="Ej: 50"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2 rounded-md"  >
                        {loading ? 'Guardando...' : 'Registrar Cliente'}
                    </button>
                </form>
            </section>
        </div>
    )
}