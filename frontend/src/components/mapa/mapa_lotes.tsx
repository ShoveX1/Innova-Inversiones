import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import LoteInfoPanel from './LoteInfoPanel';


interface Lote {
  codigo: string;
  estado: string;
  area_lote: number;
  precio: number | null;
}

type Props = { 
  lotes: Lote[];
  loading: boolean;
  error: string | null;
  onSelectCodigo: (codigo: string) => void;
  selectedCodigo?: string | null;
  colorOverrides?: Partial<Record<string, string>>;
  disableAutoZoom?: boolean;
};

export default function MapaLotes({ lotes, loading, error, onSelectCodigo, selectedCodigo = null, colorOverrides, disableAutoZoom = false }: Props) {
  const objectRef = useRef<HTMLObjectElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  // Deprecated translate states (reemplazado por viewBox). Eliminados para evitar inconsistencias.
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [svgNaturalSize, setSvgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const lastWheelEventRef = useRef<{ deltaY: number; clientX: number; clientY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ clientX: number; clientY: number; svgX: number; svgY: number } | null>(null);
  const pinchLastDistanceRef = useRef<number | null>(null);
  const tapStartRef = useRef<{ x: number; y: number; t: number; target: Element | null } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number; fingers: number } | null>(null);
  const containerTapStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const panFrameRef = useRef<number | null>(null);
  const isPanningRef = useRef(false);
  const baseViewBoxRef = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  const viewBoxRef = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  
  // Sistema centralizado de zoom (única fuente de verdad)
  const [currentZoom, setCurrentZoom] = useState(1);
  const currentZoomRef = useRef(1);
  
  // Estados para el panel de información del lote
  const [hoveredLote, setHoveredLote] = useState<Lote | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  const getSvgEl = useCallback(() => {
    return objectRef.current?.contentDocument?.querySelector('svg') as SVGSVGElement | null;
  }, []);

  const setSvgViewBox = useCallback((vb: { x: number; y: number; w: number; h: number }) => {
    const svgEl = getSvgEl();
    if (!svgEl) return;
    svgEl.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    viewBoxRef.current = vb;
  }, [getSvgEl]);

  // Función centralizada para aplicar zoom
  const applyZoom = useCallback((newZoom: number, centerX?: number, centerY?: number) => {
    const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
    
    // Calcular el nuevo viewBox basado en el zoom base
    // Para zoom in (mayor zoom): viewBox más pequeño
    // Para zoom out (menor zoom): viewBox más grande
    const baseWidth = baseViewBoxRef.current.w;
    const baseHeight = baseViewBoxRef.current.h;
    const newWidth = baseWidth / newZoom;
    const newHeight = baseHeight / newZoom;
    
    let newX = current.x;
    let newY = current.y;
    
    // Si se proporciona un centro, centrar el zoom en ese punto
    if (centerX !== undefined && centerY !== undefined) {
      newX = centerX - newWidth / 2;
      newY = centerY - newHeight / 2;
    } else {
      // Si no se proporciona centro, centrar en el centro actual del viewBox
      const centerCurrentX = current.x + current.w / 2;
      const centerCurrentY = current.y + current.h / 2;
      newX = centerCurrentX - newWidth / 2;
      newY = centerCurrentY - newHeight / 2;
    }
    
    // Aplicar el zoom
    setSvgViewBox({ x: newX, y: newY, w: newWidth, h: newHeight });
    setCurrentZoom(newZoom);
    currentZoomRef.current = newZoom;
  }, [setSvgViewBox]);

  // Helper: zoom en un punto de pantalla (clientX/clientY) con límites y centrado
  const zoomAtClientPoint = useCallback((clientX: number, clientY: number, direction: 'in' | 'out' = 'in') => {
    const svgEl = getSvgEl();
    if (!svgEl) return;
    const pt = svgEl.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(svgEl.getScreenCTM()?.inverse() || (new DOMMatrix()));

    const factor = direction === 'in' ? 1.2 : 1 / 1.2;
    const minScale = 1;
    const maxScale = 5;
    const currentZoomValue = currentZoomRef.current;
    const nextScale = Math.max(minScale, Math.min(maxScale, currentZoomValue * factor));
    if (nextScale === currentZoomValue) return;

    // Calcular el nuevo viewBox centrado en el punto
    const base = baseViewBoxRef.current;
    const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : base;
    const zoomRatio = currentZoomValue / nextScale;
    const newW = current.w * zoomRatio;
    const newH = current.h * zoomRatio;
    const newX = svgPt.x - (svgPt.x - current.x) * (newW / current.w);
    const newY = svgPt.y - (svgPt.y - current.y) * (newH / current.h);
    
    setSvgViewBox({ x: newX, y: newY, w: newW, h: newH });
    setCurrentZoom(nextScale);
    currentZoomRef.current = nextScale;
  }, [getSvgEl, setSvgViewBox]);


  // Mantener ref de pan actualizado para listeners nativos
  useEffect(() => { isPanningRef.current = isPanning; }, [isPanning]);

  // Sincronizar selección externa (desde el Panel) con el estado interno
  useEffect(() => {
    setSelectedLote(selectedCodigo);
  }, [selectedCodigo]);
  // Función para animar el zoom suavemente
  const animateZoomToLote = useCallback((centerX: number, centerY: number, targetZoom: number) => {
    const startZoom = currentZoomRef.current;
    const startTime = performance.now();
    const duration = 800; // 800ms de animación
    
    const startViewBox = { ...viewBoxRef.current };
    const base = baseViewBoxRef.current;
    
    // Calcular el viewBox objetivo
    const targetWidth = base.w / targetZoom;
    const targetHeight = base.h / targetZoom;
    const targetX = centerX - targetWidth / 2;
    const targetY = centerY - targetHeight / 2;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Usar easing suave (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Interpolar entre el estado inicial y el objetivo
      const currentZoom = startZoom + (targetZoom - startZoom) * easeOut;
      const currentWidth = base.w / currentZoom;
      const currentHeight = base.h / currentZoom;
      const currentX = startViewBox.x + (targetX - startViewBox.x) * easeOut;
      const currentY = startViewBox.y + (targetY - startViewBox.y) * easeOut;
      
      // Aplicar el viewBox actual
      setSvgViewBox({
        x: currentX,
        y: currentY,
        w: currentWidth,
        h: currentHeight
      });
      
      // Actualizar el zoom actual
      setCurrentZoom(currentZoom);
      currentZoomRef.current = currentZoom;
      
      // Continuar la animación si no ha terminado
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [setSvgViewBox]);

  const selectCodigo = useCallback((codigo: string) => {
    setSelectedLote(codigo);
    onSelectCodigo(codigo);
    
    // Zoom automático al lote seleccionado (solo si no está deshabilitado)
    if (!disableAutoZoom) {
      const svgDoc = objectRef.current?.contentDocument;
      if (svgDoc) {
        const loteElement = svgDoc.getElementById(codigo);
        if (loteElement) {
          try {
            // Obtener el bounding box del lote
            const svgElement = loteElement as unknown as SVGGraphicsElement;
            const bbox = svgElement.getBBox();
            
            // Calcular el centro del lote
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            
            // Zoom objetivo: 300%
            const targetZoom = 3;
            const currentZoomValue = currentZoomRef.current;
            
            // Solo hacer zoom si el zoom actual es menor al objetivo
            if (currentZoomValue < targetZoom) {
              animateZoomToLote(centerX, centerY, targetZoom);
            }
          } catch (error) {
            console.warn('Error al hacer zoom al lote:', error);
          }
        }
      }
    }
  }, [onSelectCodigo, disableAutoZoom, animateZoomToLote]);

  const handleClick = (e: React.MouseEvent<SVGPathElement>) => {
    const codigo = (e.currentTarget as SVGPathElement).dataset.codigo;
    if (codigo) {
      selectCodigo(codigo);
    }
  };

  // Funciones para manejar el zoom con botones
  const handleZoomIn = () => {
    const currentZoomValue = currentZoomRef.current;
    const factor = 1.2;
    const newZoom = currentZoomValue * factor;
    
    // Límite máximo: 500% (5x)
    const clampedZoom = Math.min(newZoom, 5);
    if (clampedZoom <= currentZoomValue) return; // No hacer zoom si ya está en el máximo
    
    applyZoom(clampedZoom);
  };

  const handleZoomOut = () => {
    const currentZoomValue = currentZoomRef.current;
    const factor = 1 / 1.2;
    const newZoom = currentZoomValue * factor;
    
    // Límite mínimo: 100% (1x)
    if (newZoom < 1) return;
    
    applyZoom(newZoom);
  };

  const handleResetZoom = () => {
    const base = baseViewBoxRef.current;
    if (base.w > 0 && base.h > 0) {
      setSvgViewBox(base);
      setCurrentZoom(1);
      currentZoomRef.current = 1;
    }
  };

  // Doble clic: acercar (o alejar con Shift)
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    zoomAtClientPoint(e.clientX, e.clientY, e.shiftKey ? 'out' : 'in');
  }, [zoomAtClientPoint]);

  // Programar zoom con rueda (usable desde contenedor y desde el documento SVG)
  const scheduleWheelZoom = useCallback((clientX: number, clientY: number, deltaY: number) => {
    lastWheelEventRef.current = { deltaY, clientX, clientY };
    if (wheelFrameRef.current != null) return;
    wheelFrameRef.current = requestAnimationFrame(() => {
      wheelFrameRef.current = null;
      const data = lastWheelEventRef.current;
      if (!data) return;

      const svgEl = getSvgEl();
      if (!svgEl) return;
      const pt = svgEl.createSVGPoint();
      pt.x = data.clientX;
      pt.y = data.clientY;
      const svgPt = pt.matrixTransform(svgEl.getScreenCTM()?.inverse() || (new DOMMatrix()));

      const zoomIntensity = 0.0015;
      const zoomFactor = Math.exp(-data.deltaY * zoomIntensity);
      const minScale = 1; // 100% mínimo
      const maxScale = 5; // 500% máximo
      const currentZoomValue = currentZoomRef.current;
      const nextScale = Math.max(minScale, Math.min(maxScale, currentZoomValue * zoomFactor));
      
      if (nextScale === currentZoomValue) return;
      
      const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
      const zoomRatio = currentZoomValue / nextScale;
      const newW = current.w * zoomRatio;
      const newH = current.h * zoomRatio;
      const newX = svgPt.x - (svgPt.x - current.x) * (newW / current.w);
      const newY = svgPt.y - (svgPt.y - current.y) * (newH / current.h);
      
      setSvgViewBox({ x: newX, y: newY, w: newW, h: newH });
      setCurrentZoom(nextScale);
      currentZoomRef.current = nextScale;
    });
  }, [getSvgEl, setSvgViewBox]);

  // Zoom con rueda centrado en el cursor (con rAF y límites)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    scheduleWheelZoom(e.clientX, e.clientY, e.deltaY);
  }, [scheduleWheelZoom]);

  // Memoizar el mapeo de colores para evitar recálculos
  const colorMap = useMemo(() => ({
    "1": "#f5cdadff", // beige - Disponible
    "2": "#fff200ff", // Amarillo - Separado
    "3": "#ef1688ff", // morado - Vendido
    "4": "#ef1688ff", // morado - Bloqueado
    "5": "#ef1688ff", // morado - Bloqueo Comercial
    "6": "#fff200ff", // Amarillo - Separado comercial
    ...(colorOverrides || {})
  }), [colorOverrides]);

  // Contadores de lotes por estado
  const contadores = useMemo(() => {
    const contador1 = lotes.filter(lote => lote.estado === "1").length; // Disponible
    const contador2 = lotes.filter(lote => ["2", "6"].includes(lote.estado)).length; // Separado + Separado comercial
    const contador3 = lotes.filter(lote => ["3", "4", "5"].includes(lote.estado)).length; // Vendido + Bloqueado + Bloqueo Comercial
    
    return {
      disponible: contador1,
      separado: contador2,
      vendido: contador3
    };
  }, [lotes]);

  // Función optimizada para aplicar colores al SVG
  const applyColors = useCallback((svgDoc: Document, lotesData: Lote[]) => {
    
    // Crear un mapa para acceso O(1) en lugar de O(n)
    const lotesMap = new Map(lotesData.map(lote => [lote.codigo, lote]));
    
    // Procesar todos los elementos del SVG de una vez
    const elements = svgDoc.querySelectorAll('[id]');
    let appliedCount = 0;
    
    elements.forEach((el) => {
      const lote = lotesMap.get(el.id);
        if (lote) {
          // Aplicar color según el estado del lote
          const color = colorMap[lote.estado as keyof typeof colorMap] || "#ffffff";
          el.setAttribute('fill', color);
          // Forzar el color también en el estilo CSS
          (el as SVGElement).style.fill = color;
          // Remover cualquier clase que pueda estar sobrescribiendo el color
          el.removeAttribute('class');
        
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

        // Eventos de click/tap (solo agregar una vez)
        el.setAttribute('data-codigo', lote.codigo);
        if (!el.hasAttribute('data-click-attached')) {
          el.addEventListener('click', (e) => handleClick(e as any));
          el.setAttribute('data-click-attached', 'true');
        }

        // Soporte táctil: detectar "tap" sin pan/zoom
        if (!el.hasAttribute('data-touch-attached')) {
          const onTouchStart = (ev: TouchEvent) => {
            if (ev.touches.length !== 1) return;
            // No prevenir por defecto inicialmente - permitir que el pan funcione si se mueve
            const t = ev.touches[0];
            tapStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), target: ev.currentTarget as Element };
          };
          const onTouchMove = (ev: TouchEvent) => {
            if (!tapStartRef.current || ev.touches.length !== 1) return;
            const t = ev.touches[0];
            const dx = Math.abs(t.clientX - tapStartRef.current.x);
            const dy = Math.abs(t.clientY - tapStartRef.current.y);
            // Si se mueve demasiado, cancelar tap para permitir pan
            if (dx > 8 || dy > 8) {
              tapStartRef.current = null;
              // Permitir que el evento se propague para el pan del mapa
              ev.stopPropagation();
            }
          };
          const onTouchEnd = (ev: TouchEvent) => {
            const start = tapStartRef.current;
            tapStartRef.current = null;
            if (!start) return;
            
            // Si se estaba haciendo pinch, no seleccionar
            if (pinchLastDistanceRef.current != null) return;
            
            const now = Date.now();
            const dt = now - start.t;
            if (dt <= 500) {
              const touch = (ev.changedTouches && ev.changedTouches[0]) || null;
              // Solo prevenir por defecto si fue un tap válido (sin movimiento significativo)
              ev.preventDefault();
              ev.stopPropagation();

              // Doble tap detection (umbral corto y poca distancia)
              const last = lastTapRef.current;
              const isDoubleTap = !!(last && (now - last.time) < 350 && touch && Math.hypot((touch.clientX - last.x), (touch.clientY - last.y)) < 24 && last.fingers === 1);

              if (isDoubleTap && touch) {
                // Zoom in centrado en el punto del tap
                zoomAtClientPoint(touch.clientX, touch.clientY, 'in');
                lastTapRef.current = null;
              } else {
                lastTapRef.current = touch ? { x: touch.clientX, y: touch.clientY, time: now, fingers: 1 } : { x: start.x, y: start.y, time: now, fingers: 1 };
                const targetEl = (start.target as Element) ?? (ev.currentTarget as Element);
                const codigo = targetEl.getAttribute('data-codigo') || targetEl.id;
                if (codigo) {
                  selectCodigo(codigo);
                }
              }
            }
          };
          el.addEventListener('touchstart', onTouchStart as any, { passive: false } as any);
          el.addEventListener('touchmove', onTouchMove as any, { passive: false } as any);
          el.addEventListener('touchend', onTouchEnd as any);
          el.setAttribute('data-touch-attached', 'true');
        }
        
        // Eventos de hover (overlay por encima, respetando selección y solo una vez)
        if (!el.hasAttribute('data-hover-attached')) {
          el.addEventListener('mouseenter', (e) => {
            if (isPanningRef.current) return;
            if (el.getAttribute('data-selected') !== 'true') {
              // Actualizar estado del panel de hover
              setHoveredLote(lote);
              const mouseEvent = e as MouseEvent;
              setHoverPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
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
                const svgNode = node as SVGElement;
                // Aplicar fill: none tanto como atributo como estilo CSS
                svgNode.setAttribute('fill', 'none');
                svgNode.style.fill = 'none';
                // Asegurar que no haya fill en el estilo
                svgNode.style.setProperty('fill', 'none', 'important');
                
                // Aplicar el stroke
                svgNode.setAttribute('stroke', '#6b7280');
                svgNode.setAttribute('stroke-width', '3');
                svgNode.setAttribute('vector-effect', 'non-scaling-stroke');
                svgNode.setAttribute('stroke-linejoin', 'round');
                svgNode.setAttribute('stroke-linecap', 'round');
                
                // Aplicar también como estilo CSS para mayor seguridad
                svgNode.style.stroke = '#6b7280';
                svgNode.style.strokeWidth = '3px';
                svgNode.style.vectorEffect = 'non-scaling-stroke';
                svgNode.style.strokeLinejoin = 'round';
                svgNode.style.strokeLinecap = 'round';
                
                // Procesar recursivamente todos los hijos
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
            if (isPanningRef.current) return;
            if (el.getAttribute('data-selected') !== 'true') {
              // Limpiar estado del panel de hover
              setHoveredLote(null);
              setHoverPosition(null);
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
            // Solo aplicar borde al overlay (transparente)
            const applyStrokeOnly = (node: Element) => {
              const svgNode = node as SVGElement;
              // Aplicar fill: none tanto como atributo como estilo CSS
              svgNode.setAttribute('fill', 'none');
              svgNode.style.fill = 'none';
              // Asegurar que no haya fill en el estilo
              svgNode.style.setProperty('fill', 'none', 'important');
              
              // Aplicar el stroke (borde negro)
              svgNode.setAttribute('stroke', '#000000');
              svgNode.setAttribute('stroke-width', '4');
              svgNode.setAttribute('vector-effect', 'non-scaling-stroke');
              svgNode.setAttribute('stroke-linejoin', 'round');
              svgNode.setAttribute('stroke-linecap', 'round');
              
              // Aplicar también como estilo CSS para mayor seguridad
              svgNode.style.stroke = '#000000';
              svgNode.style.strokeWidth = '4px';
              svgNode.style.vectorEffect = 'non-scaling-stroke';
              svgNode.style.strokeLinejoin = 'round';
              svgNode.style.strokeLinecap = 'round';
              
              // Procesar recursivamente todos los hijos
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
      // console.warn('No se pudo actualizar overlay de selección:', e);
    }

    // Actualizar contadores en el SVG
    try {
      const contadorDisponibles = svgDoc.getElementById('contador-disponibles');
      const contadorSeparados = svgDoc.getElementById('contador-separados');
      const contadorVendidos = svgDoc.getElementById('contador-vendidos');
      
      if (contadorDisponibles) {
        contadorDisponibles.textContent = contadores.disponible.toString();
      }
      if (contadorSeparados) {
        contadorSeparados.textContent = contadores.separado.toString();
      }
      if (contadorVendidos) {
        contadorVendidos.textContent = contadores.vendido.toString();
      }
    } catch (e) {
      console.warn('Error al actualizar contadores en SVG:', e);
    }

  }, [colorMap, selectedLote, contadores]);

  // Cargar datos del backend

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
    setSvgLoaded(true);
  }, []);

  // Placeholder para responder a cambios de medidas (se usará al limitar pan)
  useEffect(() => {
    // Intencionalmente vacío: mantenemos lectura de medidas para futuros límites de pan
  }, [containerSize, svgNaturalSize]);

  // Utilidad para limitar desplazamiento (mantener contenido visible)
  const clampPan = useCallback((tx: number, ty: number, currentScale: number) => {
    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height;

    // Medir tamaño del contenido en píxeles de pantalla
    let contentWidthPx = 0;
    let contentHeightPx = 0;
    if (svgNaturalSize.width > 0 && svgNaturalSize.height > 0) {
      contentWidthPx = svgNaturalSize.width * currentScale;
      contentHeightPx = svgNaturalSize.height * currentScale;
    } else {
      const obj = objectRef.current;
      if (obj) {
        const rect = obj.getBoundingClientRect();
        contentWidthPx = rect.width;
        contentHeightPx = rect.height;
      }
    }

    if (!contentWidthPx || !contentHeightPx || !containerWidth || !containerHeight) {
      // Sin datos confiables, no aplicar clamping
      return { x: tx, y: ty };
    }

    // Margen permitido en píxeles de pantalla
    const gapXPx = (contentWidthPx - containerWidth) / 2;
    const gapYPx = (contentHeightPx - containerHeight) / 2;
    const maxOffsetXPx = gapXPx > 0 ? gapXPx : containerWidth / 2; // permitir pan aunque el contenido sea más pequeño
    const maxOffsetYPx = gapYPx > 0 ? gapYPx : containerHeight / 2;

    // Convertir a unidades de translate (pre-escala) ya que usamos translate(...) scale(...)
    const maxOffsetXTranslate = maxOffsetXPx / Math.max(currentScale, 0.0001);
    const maxOffsetYTranslate = maxOffsetYPx / Math.max(currentScale, 0.0001);

    const clampedX = Math.max(-maxOffsetXTranslate, Math.min(maxOffsetXTranslate, tx));
    const clampedY = Math.max(-maxOffsetYTranslate, Math.min(maxOffsetYTranslate, ty));
    return { x: clampedX, y: clampedY };
  }, [containerSize, svgNaturalSize]);

  // Pan por arrastre mejorado - mantiene el punto de clic bajo el cursor
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPanning(true);
    
    const svgEl = getSvgEl();
    if (!svgEl) return;
    
    // Convertir el punto de clic a coordenadas del SVG
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svgEl.getScreenCTM()?.inverse() || (new DOMMatrix()));
    
    // Guardar el punto inicial tanto en coordenadas de pantalla como del SVG
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      svgX: svgPt.x,
      svgY: svgPt.y
    };
    
    // Asegurar estilo de cursor inmediatamente
    const el = containerRef.current;
    if (el) el.style.cursor = 'grabbing';
  }, [getSvgEl]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return;
    e.preventDefault();

    if (panFrameRef.current != null) return;
    panFrameRef.current = requestAnimationFrame(() => {
      panFrameRef.current = null;
      
      if (!panStartRef.current) return;
      
      // Calcular el delta en píxeles de pantalla
      const deltaX = e.clientX - panStartRef.current.clientX;
      const deltaY = e.clientY - panStartRef.current.clientY;
      
      // Obtener el viewBox base del pan
      const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
      
      // Convertir el delta de píxeles a unidades del SVG
      // El factor depende del tamaño del viewBox vs el tamaño del contenedor
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const scaleX = current.w / containerRect.width;
      const scaleY = current.h / containerRect.height;
      
      // Aplicar el desplazamiento (invertido porque movemos el viewBox, no el contenido)
      const newX = current.x - (deltaX * scaleX);
      const newY = current.y - (deltaY * scaleY);
      
      setSvgViewBox({ x: newX, y: newY, w: current.w, h: current.h });
      
      // Actualizar la posición de referencia para el próximo frame
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        svgX: panStartRef.current.svgX,
        svgY: panStartRef.current.svgY
      };
    });
  }, [isPanning, getSvgEl, setSvgViewBox]);

  const endPan = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
    const el = containerRef.current;
    if (el) el.style.cursor = '';
  }, []);

  // Touch helpers
  const getTouchPoints = (touches: ReadonlyArray<{ clientX: number; clientY: number }>) => {
    const svgEl = getSvgEl();
    if (!svgEl) return { points: [], rect: null } as const;
    const rect = svgEl.getBoundingClientRect();
    const points = Array.from(touches).map(t => ({ x: t.clientX - rect.left, y: t.clientY - rect.top }));
    return { points, rect } as const;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!objectRef.current) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const { points } = getTouchPoints(e.touches as any);
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      pinchLastDistanceRef.current = Math.hypot(dx, dy);
      setIsPanning(false);
      lastPointerRef.current = null;
    } else if (e.touches.length === 1) {
      // No prevenir por defecto inmediatamente para permitir que el pan funcione
      // desde cualquier punto, incluyendo lotes
      const t = e.touches[0];
      lastPointerRef.current = { x: t.clientX, y: t.clientY };
      containerTapStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
      setIsPanning(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!objectRef.current) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx = t0.clientX - t1.clientX;
      const dy = t0.clientY - t1.clientY;
      const distance = Math.hypot(dx, dy);
      const lastDistance = pinchLastDistanceRef.current ?? distance;

      // Punto medio en coordenadas de pantalla (client)
      const midClientX = (t0.clientX + t1.clientX) / 2;
      const midClientY = (t0.clientY + t1.clientY) / 2;

      // Convertir a coordenadas del SVG
      const svgEl = getSvgEl();
      if (!svgEl) return;
      const pt = svgEl.createSVGPoint();
      pt.x = midClientX;
      pt.y = midClientY;
      const svgPt = pt.matrixTransform(svgEl.getScreenCTM()?.inverse() || (new DOMMatrix()));

      const factor = distance / (lastDistance || distance);
      const minScale = 1; // 100% mínimo
      const maxScale = 5; // 500% máximo
      const nextScaleUnclamped = currentZoomRef.current * factor;
      const nextScale = Math.max(minScale, Math.min(maxScale, nextScaleUnclamped));
      const k = nextScale / currentZoomRef.current;
      if (k !== 1) {
        const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
        const newW = current.w * (currentZoomRef.current / nextScale);
        const newH = current.h * (currentZoomRef.current / nextScale);
        const newX = svgPt.x - (svgPt.x - current.x) * (newW / current.w);
        const newY = svgPt.y - (svgPt.y - current.y) * (newH / current.h);
        setSvgViewBox({ x: newX, y: newY, w: newW, h: newH });
        // Mantener indicador de zoom sincronizado
        setCurrentZoom(nextScale);
        currentZoomRef.current = nextScale;
      }
      pinchLastDistanceRef.current = distance;
      setIsPanning(false);
      lastPointerRef.current = null;
    } else if (e.touches.length === 1 && isPanning && lastPointerRef.current) {
      e.preventDefault();
      const t = e.touches[0];
      // Cancelar tap de contenedor si hubo movimiento significativo
      if (containerTapStartRef.current) {
        const dxTap = Math.abs(t.clientX - containerTapStartRef.current.x);
        const dyTap = Math.abs(t.clientY - containerTapStartRef.current.y);
        if (dxTap > 8 || dyTap > 8) {
          containerTapStartRef.current = null;
        }
      }
      const dx = t.clientX - lastPointerRef.current.x;
      const dy = t.clientY - lastPointerRef.current.y;
      const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
      const s = currentZoomRef.current;
      // Reducir sensibilidad y atenuar influencia del zoom en pan táctil
      const sensitivity = 0.6; // 60% de la velocidad anterior
      const scaleInfluence = 1 + (Math.max(1, s) - 1) * 0.4; // antes 100%, ahora 40%
      const factorX = (current.w / Math.max(1, containerSize.width)) * scaleInfluence * sensitivity;
      const factorY = (current.h / Math.max(1, containerSize.height)) * scaleInfluence * sensitivity;
      const newX = current.x - dx * factorX;
      const newY = current.y - dy * factorY;
      setSvgViewBox({ x: newX, y: newY, w: current.w, h: current.h });
      lastPointerRef.current = { x: t.clientX, y: t.clientY };
    }
  }, [isPanning, clampPan, setSvgViewBox, containerSize]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
    // Detectar doble tap en el contenedor (fondo)
    const changed = (e as any).changedTouches as TouchList | undefined;
    if (changed && changed.length === 1 && pinchLastDistanceRef.current == null && containerTapStartRef.current) {
      const t = changed[0];
      const now = Date.now();
      const dt = now - containerTapStartRef.current.t;
      if (dt <= 350) {
        const last = lastTapRef.current;
        const isDoubleTap = !!(last && (now - last.time) < 350 && Math.hypot((t.clientX - last.x), (t.clientY - last.y)) < 24 && last.fingers === 1);
        if (isDoubleTap) {
          (e as any).preventDefault?.();
          (e as any).stopPropagation?.();
          zoomAtClientPoint(t.clientX, t.clientY, 'in');
          lastTapRef.current = null;
        } else {
          lastTapRef.current = { x: t.clientX, y: t.clientY, time: now, fingers: 1 };
        }
      }
      containerTapStartRef.current = null;
    }

    if ((pinchLastDistanceRef.current ?? null) != null) {
      pinchLastDistanceRef.current = null;
    }
    setIsPanning(false);
    lastPointerRef.current = null;
    // No necesitamos actualizar nada aquí, currentZoom ya está sincronizado
  }, [zoomAtClientPoint]);

  // Medir contenedor visible (viewport del mapa)
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.contentRect;
        setContainerSize({ width: box.width, height: box.height });
      }
    });
    ro.observe(element);
    // Medición inicial
    const rect = element.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });
    return () => {
      ro.disconnect();
    };
  }, []);

  // Medir base viewBox del SVG embebido
  useEffect(() => {
    if (!svgLoaded) return;
    const svgDoc = objectRef.current?.contentDocument;
    const svgEl = svgDoc?.querySelector('svg') as SVGSVGElement | null;
    if (!svgEl) return;
    (svgEl.style as any).touchAction = 'none';
    const viewBoxAttr = svgEl.getAttribute('viewBox');
    if (viewBoxAttr) {
      const [x, y, w, h] = viewBoxAttr.trim().split(/\s+|,/).map(Number);
      baseViewBoxRef.current = { x, y, w, h };
      viewBoxRef.current = { x, y, w, h };
      setSvgNaturalSize({ width: w, height: h });
      return;
    }
    // fallback
    const width = parseFloat(svgEl.getAttribute('width') || '0');
    const height = parseFloat(svgEl.getAttribute('height') || '0');
    const x = 0, y = 0, w = width || 1000, h = height || 1000;
    baseViewBoxRef.current = { x, y, w, h };
    viewBoxRef.current = { x, y, w, h };
    setSvgNaturalSize({ width: w, height: h });
  }, [svgLoaded]);

  // Asegurar interacción cuando el cursor está sobre el SVG embebido (wheel, dblclick, pan)
  useEffect(() => {
    if (!svgLoaded) return;
    const svgDoc = objectRef.current?.contentDocument;
    const svgEl = svgDoc?.querySelector('svg') as SVGSVGElement | null;
    if (!svgEl) return;

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      scheduleWheelZoom(ev.clientX, ev.clientY, ev.deltaY);
    };

    const onDblClick = (ev: MouseEvent) => {
      ev.preventDefault();
      zoomAtClientPoint(ev.clientX, ev.clientY, (ev as MouseEvent & { shiftKey?: boolean }).shiftKey ? 'out' : 'in');
    };

    const onMouseDown = (ev: MouseEvent) => {
      ev.preventDefault();
      setIsPanning(true);
      
      // Convertir el punto de clic a coordenadas del SVG
      const pt = svgEl.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const svgPt = pt.matrixTransform(svgEl.getScreenCTM()?.inverse() || (new DOMMatrix()));
      
      // Guardar el punto inicial tanto en coordenadas de pantalla como del SVG
      panStartRef.current = {
        clientX: ev.clientX,
        clientY: ev.clientY,
        svgX: svgPt.x,
        svgY: svgPt.y
      };
      
      const el = containerRef.current;
      if (el) el.style.cursor = 'grabbing';
    };
    
    const onMouseMove = (ev: MouseEvent) => {
      if (!isPanning || !panStartRef.current) return;
      ev.preventDefault();

      if (panFrameRef.current != null) return;
      panFrameRef.current = requestAnimationFrame(() => {
        panFrameRef.current = null;
        
        if (!panStartRef.current) return;
        
        // Calcular el delta en píxeles de pantalla
        const deltaX = ev.clientX - panStartRef.current.clientX;
        const deltaY = ev.clientY - panStartRef.current.clientY;
        
        // Obtener el viewBox base del pan
        const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
        
        // Convertir el delta de píxeles a unidades del SVG
        const container = containerRef.current;
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const scaleX = current.w / containerRect.width;
        const scaleY = current.h / containerRect.height;
        
        // Aplicar el desplazamiento (invertido porque movemos el viewBox, no el contenido)
        const newX = current.x - (deltaX * scaleX);
        const newY = current.y - (deltaY * scaleY);
        
        setSvgViewBox({ x: newX, y: newY, w: current.w, h: current.h });
        
        // Actualizar la posición de referencia para el próximo frame
        panStartRef.current = {
          clientX: ev.clientX,
          clientY: ev.clientY,
          svgX: panStartRef.current.svgX,
          svgY: panStartRef.current.svgY
        };
      });
    };
    
    const endPanSvg = () => {
      setIsPanning(false);
      panStartRef.current = null;
      const el = containerRef.current;
      if (el) el.style.cursor = '';
    };

    svgEl.addEventListener('wheel', onWheel, { passive: false });
    svgEl.addEventListener('dblclick', onDblClick);
    svgEl.addEventListener('mousedown', onMouseDown);
    svgEl.addEventListener('mousemove', onMouseMove);
    svgEl.addEventListener('mouseup', endPanSvg);
    svgEl.addEventListener('mouseleave', endPanSvg);
    svgEl.addEventListener('touchstart', handleTouchStart as any, { passive: false } as any);
    svgEl.addEventListener('touchmove', handleTouchMove as any, { passive: false } as any);
    svgEl.addEventListener('touchend', handleTouchEnd as any);
    svgEl.addEventListener('touchcancel', handleTouchEnd as any);

    return () => {
      svgEl.removeEventListener('wheel', onWheel as any);
      svgEl.removeEventListener('dblclick', onDblClick as any);
      svgEl.removeEventListener('mousedown', onMouseDown as any);
      svgEl.removeEventListener('mousemove', onMouseMove as any);
      svgEl.removeEventListener('mouseup', endPanSvg as any);
      svgEl.removeEventListener('mouseleave', endPanSvg as any);
      svgEl.removeEventListener('touchstart', handleTouchStart as any);
      svgEl.removeEventListener('touchmove', handleTouchMove as any);
      svgEl.removeEventListener('touchend', handleTouchEnd as any);
      svgEl.removeEventListener('touchcancel', handleTouchEnd as any);
    };
  }, [svgLoaded, scheduleWheelZoom, isPanning, clampPan, containerSize, setSvgViewBox, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (  
    <div className="relative h-full">
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

      {/* Controles de zoom - FUERA del contenedor con onDoubleClick */}
      <div className="
        absolute 
        bottom-2 right-2 
        sm:bottom-3 sm:right-3 
        md:top-6 md:right-6 md:bottom-auto 
        bg-white/70 
        sm:bg-white/80 
        md:bg-white/95 
        backdrop-blur-sm 
        shadow-lg 
        sm:shadow-xl 
        rounded-lg 
        sm:rounded-xl 
        p-1.5 
        sm:p-2 
        md:p-3 
        z-20 
        flex flex-col 
        gap-1 
        sm:gap-2 
        md:gap-3 
        border border-gray-200 
        opacity-80 
        sm:opacity-90 
        md:opacity-100 
        hover:opacity-100
      ">
        <button
          onClick={handleZoomIn}
          disabled={currentZoom >= 5}
          className={`
            w-7 h-7 
            sm:w-9 sm:h-9 
            md:w-12 md:h-12 
            ${currentZoom >= 5 
              ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }
            text-white 
            rounded-md 
            sm:rounded-lg 
            transition-all duration-200 
            flex items-center justify-center 
            shadow-sm 
            sm:shadow-md 
            ${currentZoom < 5 ? 'hover:shadow-lg transform hover:scale-105 active:scale-95' : ''}
            font-bold 
            text-sm 
            sm:text-base 
            md:text-lg
          `}
          title={currentZoom >= 5 ? "Zoom máximo alcanzado (500%)" : "Acercar"}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          disabled={currentZoom <= 1}
          className={`
            w-7 h-7 
            sm:w-9 sm:h-9 
            md:w-12 md:h-12 
            ${currentZoom <= 1 
              ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }
            text-white 
            rounded-md 
            sm:rounded-lg 
            transition-all duration-200 
            flex items-center justify-center 
            shadow-sm 
            sm:shadow-md 
            ${currentZoom > 1 ? 'hover:shadow-lg transform hover:scale-105 active:scale-95' : ''}
            font-bold 
            text-sm 
            sm:text-base 
            md:text-lg
          `}
          title={currentZoom <= 1 ? "Zoom mínimo alcanzado (100%)" : "Alejar"}
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          className="
            w-7 h-7 
            sm:w-9 sm:h-9 
            md:w-12 md:h-12 
            bg-gradient-to-br from-gray-500 to-gray-600 
            text-white 
            rounded-md 
            sm:rounded-lg 
            hover:from-gray-600 hover:to-gray-700 
            transition-all duration-200 
            flex items-center justify-center 
            shadow-sm 
            sm:shadow-md 
            hover:shadow-lg 
            transform hover:scale-105 active:scale-95 
            text-xs 
            sm:text-xs 
            md:text-sm 
            font-bold
          "
          title="Zoom Original"
        >
          ⌂
        </button>
      </div>

      {/* Indicador de zoom */}
      <div className="
        absolute 
        left-2 bottom-2 
        sm:left-3 sm:bottom-3 
        md:top-6 md:left-6 md:bottom-auto 
        bg-white/60 
        sm:bg-white/70 
        md:bg-white/95 
        backdrop-blur-sm 
        shadow-md 
        sm:shadow-xl 
        rounded-md 
        sm:rounded-xl 
        px-1.5 py-1 
        sm:px-2 sm:py-1 
        md:px-4 md:py-2 
        z-20 
        border border-gray-200 
        text-xs 
        sm:text-xs 
        md:text-sm 
        opacity-70 
        sm:opacity-90 
        md:opacity-100
      ">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-gray-700 font-semibold">
            {Math.round(currentZoom * 100)}%
          </span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex items-center justify-center h-full w-full overflow-hidden sm:relative bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner select-none overscroll-none"
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ cursor: isPanning ? 'grabbing' : currentZoom > 1 ? 'grab' : 'default', touchAction: 'none' }}
      >
        
        <div className="relative w-full h-full" style={{ touchAction: 'none' }}>
          <object
            ref={objectRef}
            type="image/svg+xml"
            data={`${import.meta.env.BASE_URL}planovirtual-IDs-2.svg`}
            className="w-full h-full object-contain"
            onLoad={handleSvgLoad}
          />
          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-100/20 pointer-events-none rounded-xl"></div>
        </div>
      </div>

      {/* Panel de información del lote */}
      <LoteInfoPanel 
        lote={hoveredLote}
        position={hoverPosition}
        isVisible={!!hoveredLote && !!hoverPosition}
      />
    </div>
  );
}