// src/components/info_panel.tsx
import { useState, useRef, useEffect } from 'react';

type Props = {
  loading?: boolean;
  error?: string | null;
  lote?: {
    codigo: string;
    manzana: string;
    lote_numero: string;
    area_lote: number;
    precio: number | null;
    precio_metro_cuadrado: number | null;
    estado: string;
    estado_nombre: string;
  } | null;
  onClose?: () => void;
};

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

function estadoBadge(estado: string, estadoNombre: string) {
  const map: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
    "1": { bg: "bg-green-100", text: "text-green-700", label: "Disponible", emoji: "🟢" },
    "2": { bg: "bg-yellow-100", text: "text-yellow-800", label: "Reservado", emoji: "🟡" },
    "3": { bg: "bg-red-100", text: "text-red-700", label: "Vendido", emoji: "🔴" },
    "4": { bg: "bg-red-100", text: "text-red-700", label: "Vendido", emoji: "🔴" },
  };
  const cls = map[estado] ?? { bg: "bg-gray-100", text: "text-gray-700", label: estadoNombre || "—", emoji: "⚪" };
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls.bg} ${cls.text}`}>
      <span className="mr-1">{cls.emoji}</span>
      {cls.label}
    </div>
  );
}

export default function InfoPanel({ loading, error, lote, onClose }: Props) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Función para manejar el arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === panelRef.current || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Limitar el panel dentro de la ventana
    const maxX = window.innerWidth - 320; // 320px es el ancho del panel
    const maxY = window.innerHeight - (isMinimized ? 60 : 200); // altura variable
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Event listeners para el arrastre
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Si no hay lote seleccionado, no mostrar el panel
  if (!lote && !loading && !error) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 transition-all duration-300 ease-out ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '300px'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
        {/* Header arrastrable */}
        <div 
          data-drag-handle
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-grab hover:from-blue-700 hover:to-blue-800 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏠</span>
            <div>
              <h3 className="text-sm font-semibold truncate">Innova Inversiones</h3>
              {lote && (
                <p className="text-xs text-blue-100 truncate">
                  Lote {lote.manzana}-{lote.lote_numero}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? '📈' : '📉'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Cerrar panel"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Contenido del panel */}
        {!isMinimized && (
          <div className="p-4 space-y-3">
            {loading && (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span>⚠️</span>
                <span className="flex-1">Error: {error}</span>
              </div>
            )}

            {!loading && !error && lote && (
              <>
                {/* Estado y área en una línea */}
                <div className="flex items-center justify-between">
                  {estadoBadge(lote.estado, lote.estado_nombre)}
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Área</div>
                    <div className="text-sm font-semibold text-gray-800">{lote.area_lote} m²</div>
                  </div>
                </div>

                {/* Precio destacado */}
                {lote.estado === "1" && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium">💰 Precio total</div>
                    <div className="text-lg font-bold text-green-800">
                      {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                    </div>
                    {lote.precio_metro_cuadrado != null && (
                      <div className="text-xs text-green-600">
                        {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                      </div>
                    )}
                  </div>
                )}

                {/* Ubicación compacta */}
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <span>📍</span>
                  <span className="font-medium">M-{lote.manzana} • Lote {lote.lote_numero}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
