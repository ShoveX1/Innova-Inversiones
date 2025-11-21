import { useState, useEffect } from "react";
import { api } from "../../../../services/api_base";
import { Pencil } from "lucide-react";


export interface Lote_admin{
    codigo: string;
    estado: number;
    area_lote: number;
    perimetro: number;
    precio: number| null;
    precio_metro_cuadrado: number| null;
    descripcion: string| null;
    actualizado_en: string;
}

type AdminPanelProps = { 
    codigo?: string | null;
    onHasCambios?: (hasCambios: boolean) => void;
    onSavingChange?: (saving: boolean) => void;
    shouldSave?: boolean;
    onSaveComplete?: () => void;
    shouldDiscard?: boolean;
    onDiscardComplete?: () => void;
};
export default function AdminPanel({ 
    codigo, 
    onHasCambios, 
    onSavingChange,
    shouldSave,
    onSaveComplete,
    shouldDiscard,
    onDiscardComplete
}: AdminPanelProps){
    const [lotes, setLotes] = useState<Lote_admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function cargarLotes() {
        if (!codigo) {
            setLotes([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await api.get(`/api/admin/lotes/?codigo=${encodeURIComponent(codigo)}`);
            
            if (!data || typeof data !== 'object') {
                throw new Error('Respuesta inesperada');
            }
            
            setLotes(Array.isArray(data) ? data : [data]);
        } catch (e: any) {
            setError(e.message || "Error al cargar lotes");
            setLotes([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarLotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const loteDrafts = !!drafts[codigo] && Object.keys(drafts[codigo] as object).length > 0;
        return loteDrafts;
    }

    // Notificar al padre cuando hay cambios
    useEffect(() => {
        if (codigo) {
            const hayCambios = hasDrafts(codigo);
            onHasCambios?.(hayCambios);
        }
    }, [drafts, codigo, onHasCambios]);

    function normalizeFieldValue(field: EditableField, value: any) {
        if (field === 'descripcion') {
            return value == null || value === '' ? null : String(value);
        }
        return value === '' || value == null ? 0 : Number(value);
    }

    async function saveRow(cod: string) {
        const rowDraft = drafts[cod];
        
        if (!rowDraft) {
            onSaveComplete?.();
            return;
        }
        
        try {
            setSaving(true);
            onSavingChange?.(true);
            
            const payload: any = { codigo: cod };
            const normalized: any = {};
            
            for (const field of Object.keys(rowDraft) as EditableField[]) {
                const value = rowDraft[field];
                const normalizedValue = normalizeFieldValue(field, value);
                
                payload[fieldToPayloadKey[field]] = normalizedValue;
                normalized[field] = normalizedValue;
            }
            
            await api.put(`/api/admin/lotes/update/?codigo=${cod}`, payload);
            
            setLotes(prev => prev.map(l => 
                l.codigo === cod 
                    ? { ...l, ...normalized, actualizado_en: new Date().toISOString() } 
                    : l
            ));
            setDrafts(prev => {
                const { [cod]: _, ...rest } = prev;
                return rest;
            });
            
            setEditing(null);
            setDraftValue('');
            channel?.postMessage({ type: 'lote-updated', codigo: cod, at: Date.now() });
            onSaveComplete?.();
        } catch (e: any) {
            setError(e.message || 'No se pudo guardar los cambios');
        } finally {
            setSaving(false);
            onSavingChange?.(false);
        }
    }

    // Trigger save desde el componente padre
    useEffect(() => {
        if (shouldSave && codigo) {
            saveRow(codigo);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldSave]);

    function discardRow(cod: string) {
        setDrafts(prev => {
            const { [cod]: _, ...rest } = prev;
            return rest;
        });
        if (editing?.codigo === cod) {
            setEditing(null);
            setDraftValue('');
        }
        onDiscardComplete?.();
    }

    // Trigger discard desde el componente padre
    useEffect(() => {
        if (shouldDiscard && codigo) {
            discardRow(codigo);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldDiscard]);

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
                <span className="ml-2 text-gray-400 text-[10px] sm:text-xs"><Pencil className="w-4 h-4 text-blue-500" /></span>
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
                <span className="ml-2 text-gray-400 text-[10px] sm:text-xs"><Pencil className="w-4 h-4 text-blue-500" /></span>
            </div>
        );
    }

    const ESTADO_LABELS: Record<number, string> = {
        1: 'Disponible',
        2: 'Separado',
        3: 'Vendido',
        4: 'Bloqueado',
        5: 'Bloqueado Comercial',
        6: 'Separado comercial'
    };

    const ESTADO_EMOJIS: Record<number, string> = {
        1: '🟢',
        2: '🟡',
        3: '🔴',
        4: '⚪',
        5: '⚪',
        6: '🟠'
    };

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
        
        return (
            <div 
                onClick={() => startEdit(l, 'estado')} 
                className="cursor-pointer px-3 py-2 rounded-md hover:bg-blue-50/80 active:bg-blue-100/80 transition border border-transparent hover:border-blue-200 min-h-[40px] flex items-center touch-manipulation select-none"
            >
                <span className="text-xs sm:text-sm text-gray-800 flex-1">
                    {ESTADO_EMOJIS[currentEstado] || '🔴'} {ESTADO_LABELS[currentEstado] || ''}
                </span>
                <span className="ml-2 text-gray-400 text-[10px] sm:text-xs"><Pencil className="w-4 h-4 text-blue-500" /></span>
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
                <button onClick={cargarLotes} className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition text-xs sm:text-sm">
                    Reintentar
                </button>
            </div>
        </div>
    );


    return(
        <>
            {Array.isArray(lotes) && lotes.map((l) => (
                <div key={l.codigo}>
                    {/* Fecha de actualización */}
                    <div className="text-[10px] sm:text-xs text-gray-500 mb-4">
                        Actualizado: {new Date(l.actualizado_en).toLocaleString()}
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
        </>
    )
}