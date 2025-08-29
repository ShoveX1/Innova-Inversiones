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

interface LoteSeleccionado {
  lote: Lote;
  x: number;
  y: number;
}

export default function MapaLotes() {
  const objectRef = useRef<HTMLObjectElement>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteSeleccionado | null>(null);

  // Memoizar el mapeo de colores para evitar recálculos
  const colorMap = useMemo(() => ({
    "1": "#4ade80", // Verde - Disponible
    "2": "#facc15", // Amarillo - Reservado
    "3": "#ef4444", // Rojo - Vendido
    "4": "#9ca3af", // Gris - Bloqueado
  }), []);

  // Estados que NO muestran precio
  const estadosSinPrecio = useMemo(() => ["3", "4"], []); // Vendido, Bloqueado

  // Función optimizada para aplicar colores y eventos
  const applyColorsAndEvents = useCallback((svgDoc: Document, lotesData: Lote[]) => {
    console.log('🎨 Aplicando colores y eventos a', lotesData.length, 'lotes');
    
    // Crear un mapa para acceso O(1) en lugar de O(n)
    const lotesMap = new Map(lotesData.map(lote => [lote.codigo, lote]));
    
    // Procesar todos los elementos del SVG de una vez
    const elements = svgDoc.querySelectorAll('[id]');
    let appliedCount = 0;
    
    elements.forEach((el) => {
      const lote = lotesMap.get(el.id);
      if (lote) {
        // Aplicar color
        el.setAttribute('fill', colorMap[lote.estado as keyof typeof colorMap] || "#ffffff");
        
        // Agregar cursor pointer y eventos de clic
        (el as HTMLElement).style.cursor = 'pointer';
        el.addEventListener('click', (event) => {
          event.preventDefault();
          
          // Usar la posición del mouse directamente
          const mouseEvent = event as MouseEvent;
          setLoteSeleccionado({
            lote,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY
          });
        });
        
        // Agregar hover effects
        el.addEventListener('mouseenter', () => {
          (el as HTMLElement).style.opacity = '0.8';
          (el as HTMLElement).style.stroke = '#000';
          (el as HTMLElement).style.strokeWidth = '2';
        });
        
        el.addEventListener('mouseleave', () => {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.stroke = 'none';
          (el as HTMLElement).style.strokeWidth = '0';
        });
        
        appliedCount++;
      }
    });
    
    console.log(`✅ Colores y eventos aplicados: ${appliedCount} encontrados`);
  }, [colorMap]);

  // Cargar datos del backend con timeout y retry
  useEffect(() => {
    const fetchLotes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Iniciando carga de datos...');
        
        // Configurar timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // Usar la versión rápida de la API
        const response = await axios.get("http://127.0.0.1:8000/api/maps/lotes/fast/", {
          signal: controller.signal,
          timeout: 10000
        });
        
        clearTimeout(timeoutId);
        console.log('✅ Datos recibidos:', response.data.length, 'lotes');
        setLotes(response.data);
        
      } catch (err: any) {
        console.error('❌ Error en la petición:', err);
        if (err.name === 'AbortError') {
          setError('La petición tardó demasiado. Intenta de nuevo.');
        } else {
          setError('Error al cargar los datos. Verifica la conexión.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLotes();
  }, []);

  // Aplicar colores y eventos cuando tanto el SVG como los datos estén listos
  useEffect(() => {
    if (svgLoaded && lotes.length > 0 && !loading) {
      const svgDoc = objectRef.current?.contentDocument;
      if (svgDoc) {
        // Usar requestAnimationFrame para mejor rendimiento
        requestAnimationFrame(() => {
          applyColorsAndEvents(svgDoc, lotes);
        });
      }
    }
  }, [svgLoaded, lotes, loading, applyColorsAndEvents]);

  // Manejar la carga del SVG
  const handleSvgLoad = useCallback(() => {
    console.log('📄 SVG cargado');
    setSvgLoaded(true);
  }, []);

  // Cerrar modal al hacer clic fuera
  const handleCloseModal = useCallback(() => {
    setLoteSeleccionado(null);
  }, []);

  // Formatear números
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

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

                    {/* Modal de información del lote */}
        {loteSeleccionado && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCloseModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: `${loteSeleccionado.x}px`,
                top: `${loteSeleccionado.y}px`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px'
              }}
            >
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Lote {loteSeleccionado.lote.codigo.toUpperCase()}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-semibold">{loteSeleccionado.lote.estado_nombre}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Área:</span>
                <span className="font-semibold">{formatNumber(loteSeleccionado.lote.area_lote)} m²</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Perímetro:</span>
                <span className="font-semibold">{formatNumber(loteSeleccionado.lote.perimetro)} m</span>
              </div>
              
              {!estadosSinPrecio.includes(loteSeleccionado.lote.estado) && loteSeleccionado.lote.precio && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio:</span>
                  <span className="font-semibold text-green-600">
                    ${formatNumber(loteSeleccionado.lote.precio)}
                  </span>
                </div>
              )}
              
              {estadosSinPrecio.includes(loteSeleccionado.lote.estado) && (
                <div className="text-center py-2 bg-gray-100 rounded">
                  <span className="text-gray-500 text-sm">
                    {loteSeleccionado.lote.estado === "3" ? "Lote vendido" : "Lote bloqueado"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}