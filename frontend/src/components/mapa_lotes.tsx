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

type Props = { onSelectCodigo: (codigo:string) => void; selectedCodigo?: string | null };

export default function MapaLotes({ onSelectCodigo, selectedCodigo = null }: Props) {
  const objectRef = useRef<HTMLObjectElement>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [selectedLote, setSelectedLote] = useState<string | null>(null);

  // Sincronizar selección externa (desde el Panel) con el estado interno
  useEffect(() => {
    setSelectedLote(selectedCodigo);
  }, [selectedCodigo]);
  const handleClick = (e: React.MouseEvent<SVGPathElement>) => {
    const codigo = (e.currentTarget as SVGPathElement).dataset.codigo;
    if (codigo) {
      // Actualizar el lote seleccionado
      setSelectedLote(codigo);
      onSelectCodigo(codigo);
    }
  };

  // Funciones para manejar el zoom con botones
  const handleZoomIn = () => {
    setScale(prevScale => {
      const newScale = prevScale + 0.2;
      return Math.max(0.5, Math.min(3, newScale)); // Límites: 0.5x a 3x
    });
  };

  const handleZoomOut = () => {
    setScale(prevScale => {
      const newScale = prevScale - 0.2;
      return Math.max(0.5, Math.min(3, newScale)); // Límites: 0.5x a 3x
    });
  };

  const handleResetZoom = () => {
    setScale(1);
  };

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
        
        // Determinar el borde según si está seleccionado
        const isSelected = selectedLote === lote.codigo;
        // Dejamos el trazo original transparente y delegamos el borde al overlay para que esté sobre todo
        const strokeColor = 'transparent';
        const strokeWidth = '3';
        
        el.setAttribute('data-selected', isSelected ? 'true' : 'false');
        el.setAttribute('stroke', strokeColor);
        el.setAttribute('stroke-width', strokeWidth);
        el.setAttribute('cursor', 'pointer');
        (el as SVGElement).style.transition = 'stroke 0.2s ease-in-out';

        // Eventos de click (solo agregar una vez)
        el.setAttribute('data-codigo', lote.codigo);
        if (!el.hasAttribute('data-click-attached')) {
          el.addEventListener('click', (e) => handleClick(e as any));
          el.setAttribute('data-click-attached', 'true');
        }
        
        // Eventos de hover (overlay por encima, respetando selección y solo una vez)
        if (!el.hasAttribute('data-hover-attached')) {
          el.addEventListener('mouseenter', () => {
            if (el.getAttribute('data-selected') !== 'true') {
              const svgRoot = svgDoc.querySelector('svg');
              if (!svgRoot) return;
              let hoverOverlay = svgDoc.getElementById('hover-overlay') as SVGGElement | null;
              if (!hoverOverlay) {
                hoverOverlay = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
                hoverOverlay.setAttribute('id', 'hover-overlay');
                hoverOverlay.setAttribute('pointer-events', 'none');
                svgRoot.appendChild(hoverOverlay);
              }
              // Limpiar y clonar el elemento actual como contorno gris
              while (hoverOverlay.firstChild) hoverOverlay.removeChild(hoverOverlay.firstChild);
              const clone = (el as SVGElement).cloneNode(true) as SVGElement;
              const applyStrokeOnly = (node: Element) => {
                (node as SVGElement).setAttribute('fill', 'none');
                (node as SVGElement).setAttribute('stroke', '#6b7280');
                (node as SVGElement).setAttribute('stroke-width', '3');
                (node as SVGElement).setAttribute('vector-effect', 'non-scaling-stroke');
                (node as SVGElement).setAttribute('stroke-linejoin', 'round');
                (node as SVGElement).setAttribute('stroke-linecap', 'round');
                const children = node.children;
                for (let i = 0; i < children.length; i++) {
                  applyStrokeOnly(children[i]);
                }
              };
              applyStrokeOnly(clone);
              hoverOverlay.appendChild(clone);
              // Asegurar que selección quede arriba del hover
              const selectionOverlay = svgDoc.getElementById('selection-overlay');
              if (selectionOverlay && selectionOverlay.parentNode) {
                selectionOverlay.parentNode.appendChild(selectionOverlay);
              }
            }
          });
          
          el.addEventListener('mouseleave', () => {
            if (el.getAttribute('data-selected') !== 'true') {
              const hoverOverlay = svgDoc.getElementById('hover-overlay');
              if (hoverOverlay) {
                while (hoverOverlay.firstChild) hoverOverlay.removeChild(hoverOverlay.firstChild);
              }
            }
          });
          
          el.setAttribute('data-hover-attached', 'true');
        }

        appliedCount++;
      }
    });
    // Capa de overlay para resaltar el seleccionado por encima de todo
    try {
      const svgRoot = svgDoc.querySelector('svg');
      if (svgRoot) {
        let overlay = svgDoc.getElementById('selection-overlay') as SVGGElement | null;
        if (!overlay) {
          overlay = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
          overlay.setAttribute('id', 'selection-overlay');
          overlay.setAttribute('pointer-events', 'none');
          svgRoot.appendChild(overlay);
        }
        // Limpiar overlay actual
        while (overlay.firstChild) overlay.removeChild(overlay.firstChild);

        if (selectedLote) {
          const selectedEl = svgDoc.getElementById(selectedLote) as SVGElement | null;
          if (selectedEl) {
            const clone = selectedEl.cloneNode(true) as SVGElement;
            // Forzar que solo sea borde visible en todo el árbol clonado
            const applyStrokeOnly = (node: Element) => {
              (node as SVGElement).setAttribute('fill', 'none');
              (node as SVGElement).setAttribute('stroke', '#000000');
              (node as SVGElement).setAttribute('stroke-width', '4');
              (node as SVGElement).setAttribute('vector-effect', 'non-scaling-stroke');
              (node as SVGElement).setAttribute('stroke-linejoin', 'round');
              (node as SVGElement).setAttribute('stroke-linecap', 'round');
              const children = node.children;
              for (let i = 0; i < children.length; i++) {
                applyStrokeOnly(children[i]);
              }
            };
            applyStrokeOnly(clone);
            overlay.appendChild(clone);
            // Asegurar que el overlay quede al tope de la pila
            svgRoot.appendChild(overlay);
          }
        }
      }
    } catch (e) {
      // En caso de cualquier problema con el overlay, no romper la ejecución
      console.warn('No se pudo actualizar overlay de selección:', e);
    }

    console.log(`✅ Colores aplicados: ${appliedCount} lotes encontrados`);
  }, [colorMap, selectedLote]);

  // Cargar datos del backend
  useEffect(() => {
    const fetchLotes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Iniciando carga de datos...');
        
        // Usar la URL de la API con fallback
        const apiUrl = import.meta.env.VITE_API_URL;
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

  // Aplicar colores cuando tanto el SVG como los datos estén listos, o cuando cambie la selección
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
  }, [svgLoaded, lotes, loading, applyColors, selectedLote]);

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
      
      <div 
        className="flex items-center justify-center h-full w-full overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner border border-gray-200"
      >
        {/* Controles de zoom */}
        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-3 z-20 flex flex-col gap-3 border border-gray-200">
          <button
            onClick={handleZoomIn}
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-bold text-lg"
            title="Acercar"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-bold text-lg"
            title="Alejar"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-sm font-bold"
            title="Zoom Original"
          >
            ⌂
          </button>
        </div>

        {/* Indicador de zoom */}
        <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl px-4 py-2 z-20 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 font-semibold text-sm">
              Zoom: {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
        
        <div className="relative">
          <object
            ref={objectRef}
            type="image/svg+xml"
            data={`${import.meta.env.BASE_URL}planovirtual-1_edit_ids.svg`}
            className="max-w-full max-h-full w-auto h-auto transition-transform duration-300 ease-in-out drop-shadow-lg"
            style={{ transform: `scale(${scale})` }}
            onLoad={handleSvgLoad}
          />
          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-100/20 pointer-events-none rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}