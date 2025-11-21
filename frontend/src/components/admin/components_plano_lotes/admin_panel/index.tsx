import { useState, useCallback } from "react";
import EdicionLote from "./edicion_lote";
import EdicionCliente from "./edicion_cliente";

type AdminPanelProps = { codigo?: string | null };

export default function AdminPanel({ codigo }: AdminPanelProps) {
    const [hasCambiosLote, setHasCambiosLote] = useState(false);
    const [hasCambiosCliente, setHasCambiosCliente] = useState(false);
    const [saving, setSaving] = useState(false);
    const [triggerSaveLote, setTriggerSaveLote] = useState<number>();
    const [triggerDiscardLote, setTriggerDiscardLote] = useState<number>();
    const [triggerSaveCliente, setTriggerSaveCliente] = useState<number>();
    const [triggerDiscardCliente, setTriggerDiscardCliente] = useState<number>();
    
    const hasCambios = hasCambiosLote || hasCambiosCliente;

    const handleSave = useCallback(() => {
        const timestamp = Date.now();
        setTriggerSaveLote(timestamp);
        setTriggerSaveCliente(timestamp);
    }, []);

    const handleDiscard = useCallback(() => {
        const timestamp = Date.now();
        setTriggerDiscardLote(timestamp);
        setTriggerDiscardCliente(timestamp);
    }, []);

    return (
        <div className="h-full w-full flex flex-col min-w-0">
            <div className="bg-white shadow-md overflow-hidden flex flex-col h-full w-full custom-scrollbar">
                {/* Header */}
                <div className="px-3 content-center pt-2 h-[3rem] md:h-[4rem] bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm md:text-lg font-semibold">Administrador de Lotes</h2>

                        {/* Botones de acción globales */}
                        {codigo && hasCambios && (
                            <div className="flex flex-row gap-2">
                                <button 
                                    disabled={saving} 
                                    onClick={handleSave} 
                                    className="flex-1 px-3 py-2 rounded-md bg-white/10 hover:bg-white hover:text-blue-500 hover:border-blue-500 active:bg-white/30 border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed transition text-xs sm:text-sm font-medium touch-manipulation min-h-[36px] flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                                    </svg>
                                </button>
                                <button 
                                    disabled={saving} 
                                    onClick={handleDiscard} 
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
                    {codigo && (
                        <div className={`bg-gray-50 rounded-lg p-4 mb-4 border transition-all ${hasCambios ? 'border-orange-300 bg-orange-50/50 shadow-md' : 'border-gray-200'}`}>
                            {/* Código del lote */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm sm:text-lg font-bold text-blue-900">Lote {codigo}</h3>
                                    {hasCambios && (
                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-[10px] sm:text-xs font-medium rounded-full flex items-center">
                                            ⚠️ Cambios pendientes
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Edición de Lote */}
                            <EdicionLote 
                                codigo={codigo}
                                onHasCambios={setHasCambiosLote}
                                onSavingChange={setSaving}
                                shouldSave={triggerSaveLote !== undefined}
                                onSaveComplete={() => setTriggerSaveLote(undefined)}
                                shouldDiscard={triggerDiscardLote !== undefined}
                                onDiscardComplete={() => setTriggerDiscardLote(undefined)}
                            />
                            
                            {/* Cliente - Visualización y edición */}
                            <EdicionCliente 
                                codigoLote={codigo}
                                onHayCambios={setHasCambiosCliente}
                                shouldSave={triggerSaveCliente !== undefined}
                                onSaveComplete={() => setTriggerSaveCliente(undefined)}
                                shouldDiscard={triggerDiscardCliente !== undefined}
                                onDiscardComplete={() => setTriggerDiscardCliente(undefined)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
