import React, { useState, useEffect } from "react";
import { api } from "../services/api";


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

export default function AdminPanel({ codigo }: { codigo?: string | null }){
    const [lotes, setLotes] = useState<Lote_admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    async function cargarLotes(selected?: string | null){
        try{
            setLoading(true);
            setError(null);
            //Endpoint de listado del backend
            const code = (selected ?? codigo) ?? null;
            if(!code){
                setLotes([]);
                return;
            }
            const data = await api.get(`/api/admin/lotes/?codigo=${encodeURIComponent(code)}`);
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
        cargarLotes(codigo ?? null);
    }, [codigo]);

    // Edición en línea
    type EditableField = 'estado'|'area_lote'|'perimetro'|'precio'|'precio_metro_cuadrado'|'descripcion';
    const [editing, setEditing] = useState<{ codigo: string; field: EditableField } | null>(null);
    const [draftValue, setDraftValue] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [drafts, setDrafts] = useState<Record<string, Partial<Record<EditableField, any>>>>({});
    const [channel] = useState<BroadcastChannel | null>(() => {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try { return new BroadcastChannel('lotes-updates'); } catch { return null; }
        }
        return null;
    });

    const fieldToPayloadKey: Record<'estado'|'area_lote'|'perimetro'|'precio'|'precio_metro_cuadrado'|'descripcion', string> = {
        estado: 'input_estado',
        area_lote: 'input_area_lote',
        perimetro: 'input_perimetro',
        precio: 'input_precio',
        precio_metro_cuadrado: 'input_precio_metro_cuadrado',
        descripcion: 'input_descripcion',
    };

    function startEdit(row: Lote_admin, field: EditableField){
        setEditing({ codigo: row.codigo, field });
        const pending = drafts[row.codigo]?.[field];
        const current = pending !== undefined ? pending : (row as any)[field];
        setDraftValue(current == null ? '' : String(current));
    }

    function closeEditor(){
        setEditing(null);
        setDraftValue('');
    }

    function updateDraft(codigo: string, field: EditableField, value: any){
        setDrafts(prev => ({
            ...prev,
            [codigo]: {
                ...(prev[codigo] || {}),
                [field]: value,
            }
        }));
    }

    function hasDrafts(codigo: string){
        return !!drafts[codigo] && Object.keys(drafts[codigo] as object).length > 0;
    }

    function normalizeRowDraft(rowDraft: Partial<Record<EditableField, any>>): Partial<Lote_admin>{
        const out: any = {};
        for (const k of Object.keys(rowDraft) as EditableField[]){
            const v = rowDraft[k];
            if (k === 'descripcion') out[k] = v == null || v === '' ? null : String(v);
            else out[k] = v === '' || v == null ? 0 : Number(v);
        }
        return out;
    }

    async function saveRow(cod: string){
        const rowDraft = drafts[cod];
        if (!rowDraft) return;
        try{
            setSaving(true);
            const payload: any = { codigo: cod };
            for (const k of Object.keys(rowDraft) as EditableField[]){
                const payloadKey = fieldToPayloadKey[k];
                const v = rowDraft[k];
                if (k === 'descripcion') payload[payloadKey] = v == null || v === '' ? null : String(v);
                else payload[payloadKey] = v === '' || v == null ? 0 : Number(v);
            }
            await api.put(`/api/admin/lotes/update/?codigo=${cod}`, payload);
            const normalized = normalizeRowDraft(rowDraft);
            setLotes(prev => prev.map(l => l.codigo === cod ? ({ ...l, ...normalized, actualizado_en: new Date().toISOString() }) : l));
            setDrafts(prev => { const { [cod]: _, ...rest } = prev; return rest; });
            setEditing(null);
            setDraftValue('');
            // Notificar a otras páginas/ventanas que hubo una actualización
            try { channel?.postMessage({ type: 'lote-updated', codigo: cod, at: Date.now() }); } catch {}
        }catch(e:any){
            setError(e.message || 'No se pudo guardar los cambios');
        }finally{
            setSaving(false);
        }
    }

    function discardRow(cod: string){
        setDrafts(prev => { const { [cod]: _, ...rest } = prev; return rest; });
        if (editing?.codigo === cod) closeEditor();
    }

    function renderEditableCell(l: Lote_admin, field: Exclude<EditableField, 'estado'>, type: 'number'|'text' = 'number'){
        const isEditing = !!editing && editing.codigo === l.codigo && editing.field === field;
        if (isEditing){
            return (
                <input
                    className="w-full px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    type={type}
                    min={type === 'number' ? 0 : undefined}
                    value={draftValue}
                    autoFocus
                    onChange={(e) => { setDraftValue(e.target.value); updateDraft(l.codigo, field, e.target.value); }}
                    onBlur={() => closeEditor()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') closeEditor();
                        if (e.key === 'Escape') { closeEditor(); discardRow(l.codigo); }
                    }}
                    disabled={saving}
                />
            );
        }
        const pending = drafts[l.codigo]?.[field];
        const display = pending !== undefined ? pending : (l as any)[field];
        return (
            <div onClick={() => startEdit(l, field)} className="cursor-text px-2 py-1 rounded hover:bg-blue-50/80 transition">
                {display == null || display === '' ? '-' : String(display)}
            </div>
        );
    }

    function estadoLabel(value: number){
        return value === 1 ? 'Disponible'
            : value === 2 ? 'Reservado'
            : value === 3 ? 'Vendido'
            : value === 4 ? 'Bloqueado'
            : value === 5 ? 'Bloque Comercial'
            : '';
    }

    function renderEstadoCell(l: Lote_admin){
        const isEditing = !!editing && editing.codigo === l.codigo && editing.field === 'estado';
        if (isEditing){
            return (
                <select
                    className="w-full px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={draftValue}
                    autoFocus
                    onChange={(e) => { setDraftValue(e.target.value); updateDraft(l.codigo, 'estado', Number(e.target.value)); }}
                    onBlur={() => closeEditor()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') closeEditor();
                        if (e.key === 'Escape') { closeEditor(); discardRow(l.codigo); }
                    }}
                    disabled={saving}
                >
                    <option value="1">Disponible</option>
                    <option value="2">Reservado</option>
                    <option value="3">Vendido</option>
                    <option value="4">Bloqueado</option>
                    <option value="5">Bloque Comercial</option>
                </select>
            );
        }
        const pending = drafts[l.codigo]?.estado as number | undefined;
        return (
            <div onClick={() => startEdit(l, 'estado')} className="cursor-pointer px-2 py-1 rounded hover:bg-blue-50/80 transition">
                {estadoLabel(pending !== undefined ? pending : l.estado)}
            </div>
        );
    }


    if (!codigo) return (
        <div className="max-w-auto mx-auto p-4">
            <div className="bg-white/90 border border-gray-200 rounded-xl p-4 text-gray-600 shadow-sm">
                Selecciona un lote en el mapa
            </div>
        </div>
    );
    if (loading) return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 shadow-sm">Cargando...</div>
        </div>
    );
    if (error) return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <span>Error: {error}</span>
                <button onClick={() => cargarLotes(codigo ?? null)} className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition">
                    Reintentar
                </button>
            </div>
        </div>
    );


    return(

        <div className="h-full w-full flex flex-col">
            <div className="bg-white shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Administrador de Lotes</h2>
                    <button onClick={() => cargarLotes(codigo)} className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 transition">
                        Refrescar
                    </button>
                </div>
                <div className="p-4 overflow-auto flex-1">
                    <table className="min-w-full text-sm">
                        <tbody className="divide-y divide-gray-100 text-blue-900">
                            {Array.isArray(lotes) && lotes.map((l) =>(
                                <React.Fragment key={l.codigo}>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Código</td>
                                        <td className="px-3 py-2 font-medium text-gray-800">{l.codigo}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Estado</td>
                                        <td className="px-3 py-2">{renderEstadoCell(l)}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Área</td>
                                        <td className="px-3 py-2">{renderEditableCell(l, 'area_lote', 'number')}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Perímetro</td>
                                        <td className="px-3 py-2">{renderEditableCell(l, 'perimetro', 'number')}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Precio</td>
                                        <td className="px-3 py-2">{renderEditableCell(l, 'precio', 'number')}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Precio Metro Cuadrado</td>
                                        <td className="px-3 py-2">{renderEditableCell(l, 'precio_metro_cuadrado', 'number')}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Descripción</td>
                                        <td className="px-3 py-2">{renderEditableCell(l, 'descripcion', 'text')}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold">Actualizado en</td>
                                        <td className="px-3 py-2 text-gray-500">{new Date(l.actualizado_en).toLocaleString()}</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50/40">
                                        <td className="text-left px-3 py-2 font-semibold"></td>
                                        <td className="px-3 py-2">
                                            {hasDrafts(l.codigo) ? (
                                                <div className="flex items-center gap-2">
                                                    <button disabled={saving} onClick={() => saveRow(l.codigo)} className="px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition">
                                                        Guardar
                                                    </button>
                                                    <button disabled={saving} onClick={() => discardRow(l.codigo)} className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition">
                                                        Descartar
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">‎</span>
                                            )}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
    )
}