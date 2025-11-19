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
}

interface EditarClienteProps {
    clienteId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditarCliente({ clienteId, isOpen, onClose, onSuccess }: EditarClienteProps) {
    const [cliente, setCliente] = useState<Cliente>({
        id: '',
        nombre: '',
        apellidos: '',
        dni: '',
        direccion: '',
        telefono: '',
        email: '',
        fecha_nacimiento: '',
        estado: true,
    });

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const cargarCliente = async () => {
        try {
            setLoadingData(true);
            setError(null);
            const data = await clientesApi.obtener(clienteId);
            
            // Formatear fecha para el input type="date" (YYYY-MM-DD)
            let fechaFormateada = '';
            if (data.fecha_nacimiento) {
                // Si viene como string, puede venir en formato ISO (YYYY-MM-DD) o otro formato
                const fecha = new Date(data.fecha_nacimiento);
                if (!isNaN(fecha.getTime())) {
                    // Formatear a YYYY-MM-DD para el input type="date"
                    fechaFormateada = fecha.toISOString().split('T')[0];
                } else {
                    // Si ya viene en formato YYYY-MM-DD, usarlo directamente
                    fechaFormateada = data.fecha_nacimiento;
                }
            }
            
            setCliente({
                id: data.id,
                nombre: data.nombre || '',
                apellidos: data.apellidos || '',
                dni: data.dni || '',
                direccion: data.direccion || '',
                telefono: data.telefono || '',
                email: data.email || '',
                fecha_nacimiento: fechaFormateada,
                estado: data.estado !== undefined ? data.estado : true,
            });
        } catch (err: any) {
            console.error('Error al cargar el cliente:', err);
            const errorMessage = err?.response?.data?.error || err?.message || 'Error al cargar el cliente';
            setError(errorMessage);
        } finally {
            setLoadingData(false);
        }
    };

    // Cargar datos del cliente cuando se abre el modal
    useEffect(() => {
        if (isOpen && clienteId) {
            cargarCliente();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, clienteId]);

    // Cerrar modal con tecla ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Actualizar cliente
            await clientesApi.actualizar(clienteId, cliente);
            setSuccess('Cliente actualizado exitosamente');
            // Llamar callback de éxito y cerrar después de un breve delay
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (error: any) {
            console.error('Error al actualizar el cliente:', error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Error al actualizar el cliente';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4"
            style={{ minHeight: '100vh' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <section className="w-full max-w-md bg-white rounded-lg shadow-xl mx-auto mt-2 sm:mt-0 mb-2 sm:mb-0">
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
                <form 
                    onSubmit={handleSubmit} 
                    className="flex flex-col gap-2 text-black p-4 sm:p-6 bg-white rounded-lg max-h-[90vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-blue-500 mb-1">Editar Cliente</h1>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="text-lg font-bold text-red-600 cursor-pointer bg-red-200 rounded-md p-2 hover:bg-red-600 hover:text-red-100"
                        >
                            X
                        </button>
                    </div>
                    
                    {loadingData ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3">Cargando datos del cliente...</span>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label htmlFor="nombre">Nombre: *</label>
                                <input 
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white"
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
                                <input 
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white"
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
                                <input 
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                    type="number" 
                                    id="dni"
                                    name="dni" 
                                    value={cliente.dni} 
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="direccion">Dirección:</label>
                                <input 
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                    type="text" 
                                    id="direccion"
                                    name="direccion" 
                                    value={cliente.direccion || ''} 
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="telefono">Teléfono:</label>
                                <input 
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                    type="number" 
                                    id="telefono"
                                    name="telefono" 
                                    value={cliente.telefono || ''} 
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="email">Email:</label>
                                <input 
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                    type="email" 
                                    id="email"
                                    name="email" 
                                    value={cliente.email || ''} 
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="fecha_nacimiento">Fecha de Nacimiento:</label>
                                <input 
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white"
                                    type="date" 
                                    id="fecha_nacimiento"
                                    name="fecha_nacimiento" 
                                    value={cliente.fecha_nacimiento || ''} 
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <label htmlFor="estado" className="flex items-center gap-3 cursor-pointer">
                                    <span className="text-gray-700 font-medium">Estado:</span>
                                    <div className="relative inline-flex items-center">
                                        {/* Checkbox oculto */}
                                        <input
                                            type="checkbox"
                                            id="estado"
                                            name="estado"
                                            checked={cliente.estado}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        {/* Switch visual */}
                                        <div className="
                                            w-14 h-7 
                                            bg-gray-300 
                                            peer-focus:outline-none 
                                            peer-focus:ring-2 
                                            peer-focus:ring-blue-300 
                                            rounded-full 
                                            peer 
                                            peer-checked:after:translate-x-full 
                                            peer-checked:after:border-white 
                                            after:content-[''] 
                                            after:absolute 
                                            after:top-[2px] 
                                            after:left-[2px] 
                                            after:bg-white 
                                            after:border-gray-300 
                                            after:border 
                                            after:rounded-full 
                                            after:h-6 
                                            after:w-6 
                                            after:transition-all 
                                            peer-checked:bg-blue-600
                                            shadow-inner
                                        "></div>
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                            {cliente.estado ? 'Activo' : 'Prospecto'}
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-400 hover:text-blue-700"
                                >
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </section>
        </div>
    );
}

