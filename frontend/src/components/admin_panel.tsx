import { useState, useEffect } from "react";
import { api } from "../services/api";

//type Props ={
   // loading?: boolean;
   // error?: string | null;
    //lote?: {Codigo: string| null;}| null;
    //onClose?: () => void;
//}

export interface Lote_admin{
    codigo: string;
    estado: number;
    area_lote: number;
    perimetro: number;
    precio: number| null;
    precio_metro_cuadrado: number| null;
    descripcion: string| null;
    actualizado_en: string;
};

export default function AdminPanel(){
    const [lotes, setLotes] = useState<Lote_admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function cargarLotes(){
        try{
            setLoading(true);
            setError(null);
            //Endpoint de listado del backend
            const data = await api.get('/api/admin/lotes/?codigo=i-1');
            if(!data || typeof data !== 'object') throw new Error('Respuesta inesperada')
            const items = Array.isArray(data) ? data : [data];
            setLotes(items as Lote_admin[]);
        }catch(e: any){
            setError(e.message || "Error al cargar lotes");
            setLotes([]);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() =>{
        cargarLotes();
    }, []);


    if (loading) return <div>Cargando...</div>;
    if (error) return (
        <div style={{ color: 'red' }}>
        Error: {error} <button onClick={cargarLotes}>Reintentar</button>
        </div>
    );


    return(

        <div style={{ padding: 16}} className="text-black">
            <h2>Administrador de Lotes</h2>
            <button onClick={cargarLotes} style={{ color: 'white'}}>Refrescar</button>
            <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse'}}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left'}}>Código</th>
                        <th style={{ textAlign: 'left'}}>Estado</th>
                        <th style={{ textAlign: 'left'}}>Área</th>
                        <th style={{ textAlign: 'left'}}>Perímetro</th>
                        <th style={{ textAlign: 'left'}}>Precio</th>
                        <th style={{ textAlign: 'left'}}>Precio Metro Cuadrado</th>
                        <th style={{ textAlign: 'left'}}>Descripción</th>
                        <th style={{ textAlign: 'left'}}>Actualizado en</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(lotes) && lotes.map((l) =>(
                        <tr key={l.codigo}>
                            <td>{l.codigo}</td>
                            <td>{l.estado === 1 ? 
                            'Disponible' : l.estado === 2 ? 
                            'Reservado' : l.estado === 3 ? 
                            'Vendido' : l.estado === 4 ? 
                            'Bloqueado' : ''}</td>
                            <td>
                                <input 
                                style={{backgroundColor: 'white'}}
                                type="number"  
                                value={l.area_lote}
                                onChange={(e) => (Number(e.target.value))}
                                />
                            </td>
                            <td>{l.perimetro}</td>
                            <td>{l.precio ?? '-'}</td>
                            <td>{l.precio_metro_cuadrado ?? '-'}</td>
                            <td>{l.descripcion ?? '-'}</td>
                            <td>{new Date(l.actualizado_en).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
    )
}