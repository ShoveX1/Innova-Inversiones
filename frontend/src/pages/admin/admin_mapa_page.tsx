import AdminPanel from "../../components/admin/admin_panel";
import MapaLotes from "../../components/mapa/mapa_lotes";
import PanelNavegacion from "../../components/admin/panel_navegacion";
import { api } from "../../services/api";
import { useState, useEffect, useRef, useCallback } from "react";

export interface Lote {
    codigo: string;
    estado: string; 
  }

export default function AdminMapaPage(){

    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    const fetchLotes = useCallback(async () => {
        try {
        setError(null);
        const data = await api.get('api/maps/lotes/');
        if (!isMountedRef.current) return;
        setLotes(data as Lote[]);
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

    

    return (
        <div className="flex h-screen w-full">
            {/* Panel de Navegación - Siempre a la izquierda */}
            <div className="flex-shrink-0 h-screen flex">
                <PanelNavegacion />
            </div>
            
            {/* Contenido Principal */}
            <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
                {/* Panel de administración - En móvil va arriba, en sm+ a la izquierda */}
                <div className="w-full h-1/2 sm:h-full sm:w-1/3 min-h-0 overflow-hidden flex flex-col">
                    <AdminPanel codigo={selectedCodigo} />
                </div>
                
                {/* Mapa - En móvil va abajo, en sm+ a la derecha */}
                <div className="w-full h-1/2 sm:h-full min-h-0 overflow-hidden">
                    <MapaLotes  
                        lotes={lotes}
                        loading={loading}
                        error={error}
                        onSelectCodigo={setSelectedCodigo}
                        selectedCodigo={selectedCodigo}
                        colorOverrides={{ "4": "#9ca3af", "5": "#e0e0e0" }}
                    />
                </div>
            </div>
        </div>
    )
}
