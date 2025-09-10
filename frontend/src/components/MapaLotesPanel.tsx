// src/components/MapaLotesPanel.tsx
import { useEffect, useState, useMemo } from "react";
import { api } from "../services/api";
import MapaLotes from "./mapa_lotes";        // tu SVG existente (ver snippet abajo)
import InfoPanel from "./info_panel";        // el panel
// La URL base se toma desde services/api.ts (VITE_API_BASE_URL)

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
  // agrega más campos si los necesitas
}

export default function MapaLotesPanel() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get('api/maps/lotes/');
        if (!cancel) setLotes(data as Lote[]);
      } catch (e: any) {
        if (!cancel) setError(e?.message ?? "Error al cargar lotes");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const selectedLote = useMemo(
    () => lotes.find(l => l.codigo === selectedCodigo) ?? null,
    [lotes, selectedCodigo]
  );

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mapa arriba en móvil, a la derecha en desktop */}
      <div className="order-1 md:order-2 w-full md:w-4/5 h-[60vh] md:h-full">
        <MapaLotes  
          lotes={lotes}
          loading={loading}
          error={error}
          onSelectCodigo={setSelectedCodigo}
          selectedCodigo={selectedCodigo}
        />
      </div>

      {/* Panel debajo en móvil, a la izquierda en desktop */}
      <div className="order-2 md:order-1 w-full md:w-1/5 max-h-[40vh] md:h-full border-t md:border-t-0 md:border-r border-gray-200 bg-zinc-50 overflow-auto">
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
