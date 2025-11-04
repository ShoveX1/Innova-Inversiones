import React, { useEffect, useState } from 'react';

interface Lote {
  codigo: string;
  estado: string;
  area_lote: number;
  precio: number | null;
}

interface LoteInfoPanelProps {
  lote: Lote | null;
  position: { x: number; y: number } | null;
  isVisible: boolean;
}

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

const colorMap: Record<string, string> = {
  "1": "#f5cdadff", // beige - Disponible
  "2": "#fff200ff", // Amarillo - Separado
  "3": "#ef1688ff", // morado - Vendido
  "4": "#ef1688ff", // morado - Bloqueado
  "5": "#ef1688ff", // morado - Bloqueo Comercial
  "6": "#fff200ff", // Amarillo - Separado comercial
};

const LoteInfoPanel: React.FC<LoteInfoPanelProps> = ({ lote, position, isVisible }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHoverEnabled, setIsHoverEnabled] = useState(false);

  // Detectar si es un dispositivo táctil primario (no desktop con touch)
  useEffect(() => {
    const checkTouchDevice = () => {
      // Verificar si es un dispositivo táctil primario
      // Usar media query para detectar si el puntero principal es grueso (touch)
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      // Verificar si tiene capacidad táctil Y es el método de entrada primario
      const hasTouchCapability = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - msMaxTouchPoints es específico de IE
        navigator.msMaxTouchPoints > 0
      );
      
      // Es un dispositivo táctil si tiene puntero grueso O si tiene touch y no tiene puntero fino (mouse)
      const isPrimaryTouch = hasCoarsePointer || (hasTouchCapability && !window.matchMedia('(pointer: fine)').matches);
      
      setIsTouchDevice(isPrimaryTouch);
      // En desktop (no táctil), el hover está habilitado por defecto
      setIsHoverEnabled(!isPrimaryTouch);
    };

    checkTouchDevice();
    
    // Escuchar cambios en las media queries (por si cambia el dispositivo)
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const handleChange = () => checkTouchDevice();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // No mostrar el panel en dispositivos táctiles primarios
  if (isTouchDevice) {
    return null;
  }

  // En desktop, mostrar solo si el hover está activado (isVisible)
  if (!isHoverEnabled || !isVisible || !lote || !position) {
    return null;
  }

  return (
    <div 
      className="
        absolute 
        bg-white/95 
        backdrop-blur-sm 
        shadow-lg 
        rounded-lg 
        border border-gray-300 
        p-3 
        z-30 
        pointer-events-none
        max-w-xs
        min-w-[200px]
        transform -translate-y-2
        transition-all duration-200 ease-out
      "
      style={{
        left: Math.min(position.x + 35, window.innerWidth - 250),
        top: Math.min(position.y - 10, window.innerHeight - 150),
      }}
    >
      <h3 className="text-sm font-bold text-gray-800 mb-2 text-center">
        Información del Lote
      </h3>
      
      <div className="space-y-2 text-xs text-gray-700">
        <div className="flex justify-between items-center">
          <span className="font-medium">Lote:</span>
          <span className="font-semibold text-gray-900">{lote.codigo}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Área:</span>
          <span className="font-semibold text-gray-900">{lote.area_lote} m²</span>
        </div>
        
        {lote.precio && (lote.estado === "1" || lote.estado === "2" || lote.estado === "6") && (
          <div className="flex justify-between items-center">
            <span className="font-medium">Precio:</span>
            <span className="font-semibold text-green-600"> {currency.format(Number(lote.precio))}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Estado:</span>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
              style={{ 
                backgroundColor: colorMap[lote.estado as keyof typeof colorMap] || "#ffffff" 
              }}
            ></div>
            <span className="font-semibold text-gray-900">
              {lote.estado === "1" ? "Disponible" :
               lote.estado === "2" ? "Separado" :
               lote.estado === "3" ? "Vendido" :
               lote.estado === "4" ? "Vendido" :
               lote.estado === "5" ? "Vendido" :
               lote.estado === "6" ? "Separado" :
               lote.estado}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoteInfoPanel;
