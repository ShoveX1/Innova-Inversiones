import AdminPanel from "../../../components/admin/components_plano_lotes/admin_panel";
import MapaLotes from "../../../components/mapa/mapa_lotes";
import InfoPanel from "../../../components/mapa/info_panel";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api } from "@/services";

export interface Lote {
    codigo: string;
    estado: string;
    manzana: string;
    lote_numero: string;
    area_lote: number;
    precio: number | null;
    precio_metro_cuadrado: number | null;
    estado_nombre: string;
    descripcion: string | null;
}

interface PlanoLotesProps {
    navCollapsed: boolean;
}

export default function PlanoLotes({ navCollapsed }: PlanoLotesProps) {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);
    const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
    const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false);
    const isMountedRef = useRef(true);

    const fetchLotes = useCallback(async () => {
        try {
        setError(null);
        const data = await api.get('api/maps/lotes/');
        if (!isMountedRef.current) return;
        // Asegurar campo precio_metro_cuadrado para InfoPanel
        const mapped = (data as any[]).map((d) => ({
            ...d,
            precio_metro_cuadrado: d?.precio_metro_cuadrado ?? null,
        })) as Lote[];
        setLotes(mapped);
        } catch (e: any) {
        if (!isMountedRef.current) return;
        setError(e?.message ?? "Error al cargar lotes");
        } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        setLoading(true);
        fetchLotes();
        return () => { isMountedRef.current = false; };
    }, [fetchLotes]);

    useEffect(() => {
        const onFocus = () => fetchLotes();
        const onVisible = () => { if (document.visibilityState === 'visible') fetchLotes(); };
        let bc: BroadcastChannel | null = null;
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try {
                bc = new BroadcastChannel('lotes-updates');
                bc.onmessage = (ev) => {
                    if (ev?.data?.type === 'lote-updated') {
                        fetchLotes();
                    }
                };
            } catch {}
        }
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisible);
        try { bc?.close(); } catch {}
        };
    }, [fetchLotes]);

    useEffect(() => {
        const interval = window.setInterval(fetchLotes, 30000);
        return () => window.clearInterval(interval);
    }, [fetchLotes]);

    // Al seleccionar un lote, volvemos a mostrar el InfoPanel (solo si AdminPanel está cerrado)
    useEffect(() => {
        if (selectedCodigo && !showAdminPanel) setShowInfoPanel(true);
    }, [selectedCodigo, showAdminPanel]);

    // Cuando se abre el AdminPanel, cerrar el InfoPanel
    useEffect(() => {
        if (showAdminPanel) setShowInfoPanel(false);
    }, [showAdminPanel]);

    const selectedLote = useMemo(() => {
        return lotes.find(l => l.codigo === selectedCodigo) ?? null;
    }, [lotes, selectedCodigo]);

    return (
        <div className="h-screen w-full">
            {/* Panel de Navegación fijo */}
            <div className={`${navCollapsed ? 'ml-16' : 'ml-[16rem]'} h-screen overflow-auto`}>
                <div className="bg-white shadow-md overflow-hidden flex flex-row justify-between">
                    <div className="h-[70px] md:h-[85px]">
                        <h1 className="text-transparent bg-clip-text 
                            bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 
                            font-extrabold tracking-tight text-2xl px-4
                            md:text-4xl lg:text-5xl drop-shadow-sm mt-2">
                            Plano de Lotes
                        </h1>
                        <p className="text-gray-500 text-sm px-4 mb-2">Las Bugambilias-1RA ETAPA</p>
                    </div>
                    <button 
                        onClick={() => setShowAdminPanel(prev => !prev)}
                        className="bg-blue-600 text-white mx-4 my-auto rounded-lg w-8 h-8 sm:w-36 sm:h-12 flex items-center justify-center"
                    >
                        <span className="block sm:hidden">{showAdminPanel ? '✕' : '🖊️'}</span>
                        <p className="hidden sm:block">{showAdminPanel ? 'Cerrar Edición' : 'Editar Lotes'}</p>
                    </button>
                </div>
                <div className="flex-1 flex flex-col items-center sm:flex-row sm:items-start min-h-0 overflow-hidden h-[calc(100vh-70px)] md:h-[calc(100vh-85px)]">
                    {/* Mapa - En móvil va abajo, en sm+ a la derecha */}
                    <div className={`
                        sm:h-full sm:max-h-[87vh] sm:min-h-[87vh] sm:w-full
                        w-[80vw] ${showAdminPanel ? 'h-1/3' : 'h-1/2'} min-h-0 overflow-hidden rounded-lg border border-gray-200
                        m-1 mb-1 sm:ml-4 sm:mt-4 sm:mb-4 sm:mr-2`}>
                        <MapaLotes  
                            lotes={lotes}
                            loading={loading}
                            error={error}
                            onSelectCodigo={setSelectedCodigo}
                            selectedCodigo={selectedCodigo}
                            colorOverrides={{ "4": "#9ca3af", "5": "#e0e0e0", "6": "#FF8C00"}}
                            disableAutoZoom={true}
                        />
                        {/* Info Panel superpuesto */}
                        {showInfoPanel && (
                            <InfoPanel 
                                loading={loading}
                                error={error}
                                lote={selectedLote}
                                onClose={() => setShowInfoPanel(false)}
                            />
                        )}
                    </div>
                    {/* Panel de administración - Toggle */}
                    {showAdminPanel && (
                        <div className=" 
                            sm:h-full sm:w-[500px] sm:max-h-[87vh]
                            w-[80vw] h-2/3  m-1 sm:m-4 mt-0
                            min-h-0 overflow-y-auto flex flex-col rounded-lg shadow-lg">
                            <AdminPanel codigo={selectedCodigo} />
                        </div>
                    )}
                    
                </div>
            </div>
        </div>
    )
}