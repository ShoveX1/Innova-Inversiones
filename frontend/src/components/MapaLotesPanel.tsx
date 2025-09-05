// src/components/MapaLotesPanel.tsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import MapaLotes from "./mapa_lotes";        // tu SVG existente (ver snippet abajo)
import InfoPanel from "./info_panel";        // el panel
// Ajusta la URL según tu backend (DRF)
const API_URL = import.meta.env?.VITE_API_URL;

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
        const res = await axios.get<Lote[]>(`${API_URL}/api/maps/lotes/fast/`);
        if (!cancel) setLotes(res.data);
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
    <div className="flex h-screen">
      {/* Panel 20% a la izquierda */}
      <div className="w-1/5 h-full border-r border-gray-200 bg-zinc-50">
        <InfoPanel
          loading={loading}
          error={error}
          lote={selectedLote}
          onClose={() => setSelectedCodigo(null)}
        />
      </div>

      {/* Mapa 80% a la derecha */}
      <div className="w-4/5 h-full">
        <MapaLotes  
          lotes={lotes}
          loading={loading}
          error={error}
          onSelectCodigo={setSelectedCodigo}
          selectedCodigo={selectedCodigo}
        />
      </div>
    </div>
  );
}
