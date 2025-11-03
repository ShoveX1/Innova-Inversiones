import { useState, useEffect } from 'react';
import { clientesApi } from '@/services';


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
}


export default function RegistroCliente(){

    const [isOpen, setOpen] = useState(false);

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
        }
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Cerrar modal con tecla ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

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
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Crear cliente
            await clientesApi.crear(cliente);
            setSuccess('Cliente creado exitosamente');
            resetForm();
        } catch (error: any) {
            console.error('Error al crear el cliente:', error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Error al crear el cliente';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen){
        return(
            <button 
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-200 hover:text-blue-700">
            Crear Cliente</button>
        )
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4"
            style={{ minHeight: '100vh' }}
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
                        <h1 className="text-2xl font-bold text-blue-500 mb-1">Registro de Cliente</h1>
                        <a onClick={() => setOpen(false)}
                        className="text-lg font-bold text-red-600 cursor-pointer bg-red-200 rounded-md p-2
                                hover:bg-red-600 hover:text-red-100">
                        X</a>
                    </div>
                    
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
                            required
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

                    <button type="submit" 
                        disabled={loading} 
                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-400 hover:text-blue-700"  >
                        {loading ? 'Guardando...' : 'Registrar Cliente'}
                    </button>
                </form>
            </section>
        </div>
    )
}