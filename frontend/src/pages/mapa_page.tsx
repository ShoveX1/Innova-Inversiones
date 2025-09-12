import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { api } from "../services/api";
import MapaLotes from "../components/mapa_lotes";
import InfoPanel from "../components/info_panel";

export interface Lote {
  codigo: string;
  manzana: string;
  lote_numero: string;
  area_lote: number;
  precio: number | null;
  precio_metro_cuadrado: number | null;
  estado: string; 
  estado_nombre: string;
  perimetro?: number;
}

export default function MapaPage() {
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

  const selectedLote = useMemo(
    () => lotes.find(l => l.codigo === selectedCodigo) ?? null,
    [lotes, selectedCodigo]
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col md:flex-row">
      <div className="order-1 md:order-2 w-full md:w-4/5 h-[50vh] md:h-full min-h-0">
        <MapaLotes  
          lotes={lotes}
          loading={loading}
          error={error}
          onSelectCodigo={setSelectedCodigo}
          selectedCodigo={selectedCodigo}
        />
      </div>

      <div className="order-2 md:order-1 w-full md:w-1/5 h-[50vh] md:h-full md:max-h-none border-t md:border-t-0 md:border-r border-gray-200 bg-zinc-50 flex flex-col min-h-0 overflow-hidden">
        <InfoPanel
          loading={loading}
          error={error}
          lote={selectedLote}
          onClose={() => setSelectedCodigo(null)}
        />
      </div>
    </div>
  );
}

