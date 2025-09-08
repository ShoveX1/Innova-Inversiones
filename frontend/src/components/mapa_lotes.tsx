import { useEffect, useState, useRef, useCallback, useMemo } from "react";


interface Lote {
  codigo: string;
  estado: string;
  estado_nombre: string;
  area_lote: number;
  perimetro?: number;
  precio: number | null;
}

type Props = { 
  lotes: Lote[];
  loading: boolean;
  error: string | null;
  onSelectCodigo: (codigo: string) => void;
  selectedCodigo?: string | null;
 };

export default function MapaLotes({ lotes, loading, error, onSelectCodigo, selectedCodigo = null }: Props) {
  const objectRef = useRef<HTMLObjectElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [svgNaturalSize, setSvgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const lastWheelEventRef = useRef<{ deltaY: number; clientX: number; clientY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pinchLastDistanceRef = useRef<number | null>(null);
  const panFrameRef = useRef<number | null>(null);
  const isPanningRef = useRef(false);
  const scaleRef = useRef(1);
  const baseViewBoxRef = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  const viewBoxRef = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });

  const getSvgEl = useCallback(() => {
    return objectRef.current?.contentDocument?.querySelector('svg') as SVGSVGElement | null;
  }, []);

  const setSvgViewBox = useCallback((vb: { x: number; y: number; w: number; h: number }) => {
    const svgEl = getSvgEl();
    if (!svgEl) return;
    svgEl.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    viewBoxRef.current = vb;
  }, [getSvgEl]);

  // Mantener refs simples (para wheel/dblclick)
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Mantener ref de pan actualizado para listeners nativos
  useEffect(() => { isPanningRef.current = isPanning; }, [isPanning]);

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
    const base = baseViewBoxRef.current;
    if (base.w > 0 && base.h > 0) {
      setSvgViewBox(base);
    }
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Doble clic: acercar (o alejar con Shift)
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const svgEl = getSvgEl();
    if (!svgEl) return;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svgEl.getScreenCTM()?.inverse() || (new DOMMatrix()));

    const factor = e.shiftKey ? 1 / 1.2 : 1.2;
    const minScale = 0.5;
    const maxScale = 3;
    const nextScale = Math.max(minScale, Math.min(maxScale, scaleRef.current * factor));
    const base = baseViewBoxRef.current;
    const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : base;
    const zoomRatio = scaleRef.current / nextScale;
    const newW = current.w * zoomRatio;
    const newH = current.h * zoomRatio;
    const newX = svgPt.x - (svgPt.x - current.x) * (newW / current.w);
    const newY = svgPt.y - (svgPt.y - current.y) * (newH / current.h);
    setSvgViewBox({ x: newX, y: newY, w: newW, h: newH });
    setScale(nextScale);
  }, [getSvgEl, setSvgViewBox]);

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
      const minScale = 0.5;
      const maxScale = 3;
      const nextScale = Math.max(minScale, Math.min(maxScale, scaleRef.current * zoomFactor));
      const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
      const zoomRatio = scaleRef.current / nextScale;
      const newW = current.w * zoomRatio;
      const newH = current.h * zoomRatio;
      const newX = svgPt.x - (svgPt.x - current.x) * (newW / current.w);
      const newY = svgPt.y - (svgPt.y - current.y) * (newH / current.h);
      setSvgViewBox({ x: newX, y: newY, w: newW, h: newH });
      setScale(nextScale);
    });
  }, [getSvgEl, setSvgViewBox]);

  // Zoom con rueda centrado en el cursor (con rAF y límites)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    scheduleWheelZoom(e.clientX, e.clientY, e.deltaY);
  }, [scheduleWheelZoom]);

  // Memoizar el mapeo de colores para evitar recálculos
  const colorMap = useMemo(() => ({
    "1": "#4ade80", // Verde - Disponible
    "2": "#facc15", // Amarillo - Reservado
    "3": "#ef4444", // Rojo - Vendido
    "4": "#ef4444", // Rojo - Bloqueado
  }), []);

  // Función optimizada para aplicar colores al SVG
  const applyColors = useCallback((svgDoc: Document, lotesData: Lote[]) => {
    // console.debug('Aplicando colores a', lotesData.length, 'lotes');
    
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
            if (isPanningRef.current) return;
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
            if (isPanningRef.current) return;
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
      // console.warn('No se pudo actualizar overlay de selección:', e);
    }

    // console.debug(`Colores aplicados: ${appliedCount} lotes encontrados`);
  }, [colorMap, selectedLote]);

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
    // console.log('📄 SVG cargado');
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

  // Pan por arrastre (solo cuando hay zoom)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPanning(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    // Asegurar estilo de cursor inmediatamente
    const el = containerRef.current;
    if (el) el.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !lastPointerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    if (panFrameRef.current != null) return;
    panFrameRef.current = requestAnimationFrame(() => {
      panFrameRef.current = null;
      const svgEl = getSvgEl();
      if (!svgEl) return;
      const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
      const s = scaleRef.current;
      const velocityScale = Math.max(1, s);
      const newX = current.x - dx * (current.w / Math.max(1, containerSize.width)) * velocityScale;
      const newY = current.y - dy * (current.h / Math.max(1, containerSize.height)) * velocityScale;
      setSvgViewBox({ x: newX, y: newY, w: current.w, h: current.h });
    });
  }, [isPanning, getSvgEl, setSvgViewBox, containerSize]);

  const endPan = useCallback(() => {
    setIsPanning(false);
    lastPointerRef.current = null;
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
      e.preventDefault();
      const t = e.touches[0];
      lastPointerRef.current = { x: t.clientX, y: t.clientY };
      setIsPanning(true);
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!objectRef.current) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const { points } = getTouchPoints(e.touches as any);
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      const distance = Math.hypot(dx, dy);
      const lastDistance = pinchLastDistanceRef.current ?? distance;
      const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };

      const factor = distance / (lastDistance || distance);
      const minScale = 0.5;
      const maxScale = 3;
      const nextScaleUnclamped = scale * factor;
      const nextScale = Math.max(minScale, Math.min(maxScale, nextScaleUnclamped));
      const k = nextScale / scale;
      if (k !== 1) {
        const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
        const newW = current.w * (scaleRef.current / nextScale);
        const newH = current.h * (scaleRef.current / nextScale);
        const newX = midpoint.x - (midpoint.x - current.x) * (newW / current.w);
        const newY = midpoint.y - (midpoint.y - current.y) * (newH / current.h);
        setSvgViewBox({ x: newX, y: newY, w: newW, h: newH });
      }
      pinchLastDistanceRef.current = distance;
      setIsPanning(false);
      lastPointerRef.current = null;
    } else if (e.touches.length === 1 && isPanning && lastPointerRef.current) {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - lastPointerRef.current.x;
      const dy = t.clientY - lastPointerRef.current.y;
      const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
      const s = scaleRef.current;
      const newX = current.x - dx * (current.w / Math.max(1, containerSize.width)) * Math.max(1, s);
      const newY = current.y - dy * (current.h / Math.max(1, containerSize.height)) * Math.max(1, s);
      setSvgViewBox({ x: newX, y: newY, w: current.w, h: current.h });
      lastPointerRef.current = { x: t.clientX, y: t.clientY };
    }
  }, [isPanning, clampPan, setSvgViewBox, containerSize]);

  const handleTouchEnd = useCallback(() => {
    if ((pinchLastDistanceRef.current ?? null) != null) {
      pinchLastDistanceRef.current = null;
    }
    setIsPanning(false);
    lastPointerRef.current = null;
    // Consolidar transform imperativo en estado
    // nada que consolidar (viewBox actualizado)
    setScale(scaleRef.current);
  }, []);

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
      const svgObject = objectRef.current;
      if (!svgObject) return;
      const rect = svgObject.getBoundingClientRect();
      const cursorX = ev.clientX - rect.left;
      const cursorY = ev.clientY - rect.top;
      const factor = (ev as MouseEvent & { shiftKey?: boolean }).shiftKey ? 1 / 1.2 : 1.2;
      const minScale = 0.5;
      const maxScale = 3;
      const nextScaleUnclamped = scale * factor;
      const nextScale = Math.max(minScale, Math.min(maxScale, nextScaleUnclamped));
      const k = nextScale / scale;
      if (k === 1) return;
      const nextTranslateX = translateX - (k - 1) * (cursorX);
      const nextTranslateY = translateY - (k - 1) * (cursorY);
      setScale(nextScale);
      setTranslateX(nextTranslateX);
      setTranslateY(nextTranslateY);
    };

    const onMouseDown = (ev: MouseEvent) => {
      ev.preventDefault();
      setIsPanning(true);
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
      const el = containerRef.current;
      if (el) el.style.cursor = 'grabbing';
    };
    const onMouseMove = (ev: MouseEvent) => {
      if (!isPanning || !lastPointerRef.current) return;
      ev.preventDefault();
      const dx = ev.clientX - lastPointerRef.current.x;
      const dy = ev.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };

      if (panFrameRef.current != null) return;
      panFrameRef.current = requestAnimationFrame(() => {
        panFrameRef.current = null;
        const current = viewBoxRef.current.w > 0 ? viewBoxRef.current : baseViewBoxRef.current;
        const s = scaleRef.current;
        const newX = current.x - dx * (current.w / Math.max(1, containerSize.width)) * Math.max(1, s);
        const newY = current.y - dy * (current.h / Math.max(1, containerSize.height)) * Math.max(1, s);
        setSvgViewBox({ x: newX, y: newY, w: current.w, h: current.h });
      });
    };
    const endPanSvg = () => {
      setIsPanning(false);
      lastPointerRef.current = null;
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
        ref={containerRef}
        className="flex items-center justify-center h-full w-full overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner border border-gray-200 select-none overscroll-none"
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
        style={{ cursor: isPanning ? 'grabbing' : scale > 1 ? 'grab' : 'default', touchAction: 'none' }}
      >
        {/* Controles de zoom */}
        <div className="absolute bottom-3 right-3 md:top-6 md:right-6 md:bottom-auto bg-white/80 md:bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-2 md:p-3 z-20 flex flex-col gap-2 md:gap-3 border border-gray-200 opacity-90 md:opacity-100 hover:opacity-100">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-bold text-base md:text-lg"
            title="Acercar"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-bold text-base md:text-lg"
            title="Alejar"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-xs md:text-sm font-bold"
            title="Zoom Original"
          >
            ⌂
          </button>
        </div>

        {/* Indicador de zoom (discreto en móvil) */}
        <div className="absolute left-3 bottom-3 md:top-6 md:left-6 md:bottom-auto bg-white/70 md:bg-white/95 backdrop-blur-sm shadow-xl rounded-xl px-2 py-1 md:px-4 md:py-2 z-20 border border-gray-200 text-xs md:text-sm opacity-90 md:opacity-100">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 font-semibold">
              Zoom: {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
        
        <div className="relative" style={{ touchAction: 'none', width: '100%', height: '100%' }}>
          <object
            ref={objectRef}
            type="image/svg+xml"
            data={`${import.meta.env.BASE_URL}planovirtual-1_edit_ids.svg`}
            className="max-w-full max-h-full w-auto h-auto"
            onLoad={handleSvgLoad}
          />
          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-100/20 pointer-events-none rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}