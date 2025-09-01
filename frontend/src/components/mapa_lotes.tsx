import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";

interface Lote {
  codigo: string;
  estado: string;
  estado_nombre: string;
  area_lote: number;
  perimetro: number;
  precio: number | null;
}

export default function MapaLotes() {
  const objectRef = useRef<HTMLObjectElement>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoizar el mapeo de colores para evitar recálculos
  const colorMap = useMemo(() => ({
    "1": "#4ade80", // Verde - Disponible
    "2": "#facc15", // Amarillo - Reservado
    "3": "#ef4444", // Rojo - Vendido
    "4": "#ef4444", // Rojo - Bloqueado
  }), []);

  // Función optimizada para aplicar colores al SVG
  const applyColors = useCallback((svgDoc: Document, lotesData: Lote[]) => {
    console.log('🎨 Aplicando colores a', lotesData.length, 'lotes');
    
    // Crear un mapa para acceso O(1) en lugar de O(n)
    const lotesMap = new Map(lotesData.map(lote => [lote.codigo, lote]));
    
    // Procesar todos los elementos del SVG de una vez
    const elements = svgDoc.querySelectorAll('[id]');
    let appliedCount = 0;
    
    elements.forEach((el) => {
      const lote = lotesMap.get(el.id);
      if (lote) {
        // Aplicar color según el estado del lote
        el.setAttribute('fill', colorMap[lote.estado as keyof typeof colorMap] || "#ffffff");
        appliedCount++;
      }
    });
    
    console.log(`✅ Colores aplicados: ${appliedCount} lotes encontrados`);
  }, [colorMap]);

  // Cargar datos del backend
  useEffect(() => {
    const fetchLotes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Iniciando carga de datos...');
        
        // Usar la URL de la API con fallback
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const response = await axios.get(`${apiUrl}/api/maps/lotes/fast/`);
        console.log('✅ Datos recibidos:', response.data.length, 'lotes');
        setLotes(response.data);
        
      } catch (err: any) {
        console.error('❌ Error en la petición:', err);
        setError('Error al cargar los datos. Verifica la conexión.');
      } finally {
        setLoading(false);
      }
    };

    fetchLotes();
  }, []);

  // Aplicar colores cuando tanto el SVG como los datos estén listos
  useEffect(() => {
    if (svgLoaded && lotes.length > 0 && !loading) {
      const svgDoc = objectRef.current?.contentDocument;
      if (svgDoc) {
        // Usar requestAnimationFrame para mejor rendimiento
        requestAnimationFrame(() => {
          applyColors(svgDoc, lotes);
        });
      }
    }
  }, [svgLoaded, lotes, loading, applyColors]);

  // Manejar la carga del SVG
  const handleSvgLoad = useCallback(() => {
    console.log('📄 SVG cargado');
    setSvgLoaded(true);
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del mapa...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-red-600 mb-2">⚠️ {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      <object
        ref={objectRef}
        type="image/svg+xml"
        data="/planovirtual 1_edit_ids.svg"
        className="w-full h-auto"
        onLoad={handleSvgLoad}
      />
    </div>
  );
}