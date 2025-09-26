import AdminPanel from "../components/admin_panel";
import MapaLotes from "../components/mapa_lotes";
import { api } from "../services/api";
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
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisible);
        };
    }, [fetchLotes]);

    useEffect(() => {
        const interval = window.setInterval(fetchLotes, 30000);
        return () => window.clearInterval(interval);
    }, [fetchLotes]);

    

    return (
        <div className="flex min-h-0 min-w-0 w-full h-screen relative overflow-hidden">
            <div className="
                w-full h-full min-h-0 overflow-hidden flex flex-col
                sm:w-1/2
                "
                >
                <AdminPanel codigo={selectedCodigo} />
            </div>
            <div className="w-full h-full min-h-0 overflow-hidden">
                <MapaLotes  
                lotes={lotes}
                loading={loading}
                error={error}
                onSelectCodigo={setSelectedCodigo}
                selectedCodigo={selectedCodigo}
                colorOverrides={{ "4": "#9ca3af" }}
                />
        </div>
        </div>
    )
}
