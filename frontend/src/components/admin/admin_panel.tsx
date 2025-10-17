import { useState, useEffect } from "react";
import { api } from "../../services/api";


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

type AdminPanelProps = { codigo?: string | null };
export default function AdminPanel({ codigo }: AdminPanelProps){
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

    // Mantiene sincronizados precio total y precio por m² cuando uno cambia
    function updateLinkedPrices(row: Lote_admin, changedField: 'precio'|'precio_metro_cuadrado', rawValue: string){
        // Determinar el área efectiva (borrador si existe, caso contrario el valor actual)
        const pendingArea = drafts[row.codigo]?.area_lote;
        const area = Number(pendingArea ?? row.area_lote);
        const newValue = rawValue === '' ? NaN : Number(rawValue);

        setDrafts(prev => {
            const prevRow = prev[row.codigo] || {};
            const nextRow: any = { ...prevRow, [changedField]: rawValue };

            // Solo calcular el campo vinculado si área y valor son válidos
            if (isFinite(area) && area > 0 && !Number.isNaN(newValue)){
                if (changedField === 'precio'){
                    const perM2 = Math.round((newValue / area) * 100) / 100;
                    nextRow['precio_metro_cuadrado'] = perM2;
                }else{ // precio_metro_cuadrado cambió
                    const total = Math.round((newValue * area) * 100) / 100;
                    nextRow['precio'] = total;
                }
            } else if (rawValue === ''){
                // Si el usuario vacía el campo, el vinculado pasa a 0 por defecto
                if (changedField === 'precio'){
                    nextRow['precio_metro_cuadrado'] = 0;
                }else{
                    nextRow['precio'] = 0;
                }
            }

            return { ...prev, [row.codigo]: nextRow };
        });
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
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    placeholder={type === 'number' ? '0' : 'Ingresa texto...'}
                />
            );
        }
        const pending = drafts[l.codigo]?.[field];
        const display = pending !== undefined ? pending : (l as any)[field];
        return (
            <div 
                onClick={() => startEdit(l, field)} 
                className="cursor-text px-3 py-2 rounded-md hover:bg-blue-50/80 active:bg-blue-100/80 transition border border-transparent hover:border-blue-200 min-h-[40px] flex items-center touch-manipulation select-none"
            >
                <span className="text-xs sm:text-sm text-gray-800 flex-1">
                    {display == null || display === '' ? '-' : String(display)}
                </span>
                <span className="ml-2 text-gray-400 text-[10px] sm:text-xs">✏️</span>
            </div>
        );
    }

    function renderEditableCellWithCurrency(l: Lote_admin, field: 'precio'|'precio_metro_cuadrado', type: 'number'|'text' = 'number'){
        const isEditing = !!editing && editing.codigo === l.codigo && editing.field === field;
        if (isEditing){
            return (
                <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">S/.</span>
                    <input
                        className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type={type}
                        min={type === 'number' ? 0 : undefined}
                        value={draftValue}
                        autoFocus
                        onChange={(e) => { 
                            const val = e.target.value; 
                            setDraftValue(val);
                            updateLinkedPrices(l, field, val);
                        }}
                        onBlur={() => {
                            // Si queda vacío, forzamos 0 por defecto y recalculamos el vinculado
                            if (draftValue === ''){
                                const coerced = '0';
                                setDraftValue(coerced);
                                updateLinkedPrices(l, field, coerced);
                            }
                            closeEditor();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') closeEditor();
                            if (e.key === 'Escape') { closeEditor(); discardRow(l.codigo); }
                        }}
                        disabled={saving}
                        placeholder="0"
                    />
                </div>
            );
        }
        const pending = drafts[l.codigo]?.[field];
        const display = pending !== undefined ? pending : (l as any)[field];
        return (
            <div 
                onClick={() => startEdit(l, field)} 
                className="cursor-text px-3 py-2 rounded-md hover:bg-blue-50/80 active:bg-blue-100/80 transition border border-transparent hover:border-blue-200 min-h-[40px] flex items-center touch-manipulation select-none"
            >
                <span className="text-xs sm:text-sm text-gray-800 flex-1">
                    {display == null || display === '' ? 'S/. 0' : `S/. ${String(display)}`}
                </span>
                <span className="ml-2 text-gray-400 text-[10px] sm:text-xs">✏️</span>
            </div>
        );
    }

    function estadoLabel(value: number){
        return value === 1 ? 'Disponible'
            : value === 2 ? 'Separado'
            : value === 3 ? 'Vendido'
            : value === 4 ? 'Bloqueado'
            : value === 5 ? 'Bloque Comercial'
            : value === 6 ? 'Reserva comercial'
            : '';
    }

    function renderEstadoCell(l: Lote_admin){
        const isEditing = !!editing && editing.codigo === l.codigo && editing.field === 'estado';
        if (isEditing){
            return (
                <select
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm text-gray-800"
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
                    <option value="1">🟢 Disponible</option>
                    <option value="2">🟡 Separado</option>
                    <option value="6">🟠 Separado comercial</option>
                    <option value="3">🔴 Vendido</option>
                    <option value="4">⚪ Bloqueado</option>
                    <option value="5">⚪ Bloqueado comercial</option>
                </select>
            );
        }
        const pending = drafts[l.codigo]?.estado as number | undefined;
        const currentEstado = pending !== undefined ? pending : l.estado;
        const estadoEmoji = currentEstado === 1 ? '🟢' 
            : currentEstado === 2 ? '🟡' 
            : currentEstado === 3 ? '🔴'
            : currentEstado === 4 ? '⚪'
            : currentEstado === 5 ? '⚪'
            : currentEstado === 6 ? '🟠'
            : '🔴';
        return (
            <div 
                onClick={() => startEdit(l, 'estado')} 
                className="cursor-pointer px-3 py-2 rounded-md hover:bg-blue-50/80 active:bg-blue-100/80 transition border border-transparent hover:border-blue-200 min-h-[40px] flex items-center touch-manipulation select-none"
            >
                <span className="text-xs sm:text-sm text-gray-800 flex-1">
                    {estadoEmoji} {estadoLabel(currentEstado)}
                </span>
                <span className="ml-2 text-gray-400 text-[10px] sm:text-xs">✏️</span>
            </div>
        );
    }


    if (!codigo) return (
        <div className="h-full flex items-center justify-center p-4">
            <div className="bg-white/90 border border-gray-200 rounded-xl p-6 text-gray-600 shadow-sm text-center">
                <div className="text-2xl sm:text-4xl mb-2">📍</div>
                <p className="text-xs sm:text-base">Selecciona un lote en el mapa</p>
            </div>
        </div>
    );
    if (loading) return (
        <div className="h-full flex items-center justify-center p-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-6 shadow-sm text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-base">Cargando...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="h-full flex items-center justify-center p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 shadow-sm text-center max-w-sm">
                <div className="text-2xl sm:text-4xl mb-2">⚠️</div>
                <p className="text-xs sm:text-sm mb-4">Error: {error}</p>
                <button onClick={() => cargarLotes(codigo ?? null)} className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition text-xs sm:text-sm">
                    Reintentar
                </button>
            </div>
        </div>
    );


    return(
        <div className="h-full w-full flex flex-col min-w-0">
            <div className="bg-white shadow-md overflow-hidden flex flex-col h-full w-full">
                {/* Header */}
                <div className="px-3 content-center pt-2 h-[4rem] bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm sm:text-lg font-semibold">Administrador de Lotes</h2>

                    {/* Botones de acción globales */}
                    {codigo && hasDrafts(codigo) && (
                        <div className="flex flex-row gap-2">
                            <button 
                                disabled={saving} 
                                onClick={() => saveRow(codigo)} 
                                className="flex-1 px-3 py-2 rounded-md bg-white/10 hover:bg-white hover:text-blue-500 hover:border-blue-500 active:bg-white/30 border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed transition text-xs sm:text-sm font-medium touch-manipulation min-h-[36px] flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                                </svg>
                                
                            </button>
                            <button 
                                disabled={saving} 
                                onClick={() => discardRow(codigo)} 
                                className="flex-1 px-3 py-2 rounded-md bg-red-500/85 hover:bg-white hover:text-red-500 hover:border-red-500 active:bg-red-700 border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed transition text-xs sm:text-sm font-medium touch-manipulation min-h-[36px] flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                    </div>   
                </div>
                
                {/* Content */}
                <div className="p-3 sm:p-4 overflow-auto flex-1">
                    {Array.isArray(lotes) && lotes.map((l) => (
                        <div key={l.codigo} className={`bg-gray-50 rounded-lg p-4 mb-4 border transition-all ${hasDrafts(l.codigo) ? 'border-orange-300 bg-orange-50/50 shadow-md' : 'border-gray-200'}`}>
                            {/* Código del lote */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm sm:text-lg font-bold text-blue-900">Lote {l.codigo}</h3>
                                    {hasDrafts(l.codigo) && (
                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-[10px] sm:text-xs font-medium rounded-full flex items-center">
                                            ⚠️ Cambios pendientes
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-500">
                                    Actualizado: {new Date(l.actualizado_en).toLocaleString()}
                                </div>
                            </div>

                            {/* Estado - Ocupa todo el ancho */}
                            <div className="space-y-1 mb-4">
                                <label className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</label>
                                <div className="text-xs sm:text-sm">
                                    {renderEstadoCell(l)}
                                </div>
                            </div>

                            {/* Grid de campos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                                {/* Área */}
                                <div className="space-y-1">
                                    <label className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">Área (m²)</label>
                                    <div className="text-xs sm:text-sm">
                                        {renderEditableCell(l, 'area_lote', 'number')}
                                    </div>
                                </div>

                                {/* Perímetro */}
                                <div className="space-y-1">
                                    <label className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">Perímetro (m)</label>
                                    <div className="text-xs sm:text-sm">
                                        {renderEditableCell(l, 'perimetro', 'number')}
                                    </div>
                                </div>

                                {/* Precio */}
                                <div className="space-y-1">
                                    <label className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">Precio (S/.)</label>
                                    <div className="text-xs sm:text-sm">
                                        {renderEditableCellWithCurrency(l, 'precio', 'number')}
                                    </div>
                                </div>

                                {/* Precio por m² */}
                                <div className="space-y-1">
                                    <label className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">Precio m² (S/.)</label>
                                    <div className="text-xs sm:text-sm">
                                        {renderEditableCellWithCurrency(l, 'precio_metro_cuadrado', 'number')}
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">Descripción</label>
                                    <div className="text-xs sm:text-sm">
                                        {renderEditableCell(l, 'descripcion', 'text')}
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}