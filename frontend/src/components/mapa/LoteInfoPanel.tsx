import React from 'react';

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

const colorMap: Record<string, string> = {
  "1": "#f5cdadff", // beige - Disponible
  "2": "#fff200ff", // Amarillo - Separado
  "3": "#ef1688ff", // morado - Vendido
  "4": "#ef1688ff", // morado - Bloqueado
  "5": "#ef1688ff", // morado - Bloqueo Comercial
  "6": "#fff200ff", // Amarillo - Separado comercial
};

const LoteInfoPanel: React.FC<LoteInfoPanelProps> = ({ lote, position, isVisible }) => {
  if (!isVisible || !lote || !position) {
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
        left: Math.min(position.x + 10, window.innerWidth - 250),
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
        
        {lote.precio && (
          <div className="flex justify-between items-center">
            <span className="font-medium">Precio:</span>
            <span className="font-semibold text-green-600">S/ {lote.precio.toLocaleString()}</span>
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
               lote.estado === "4" ? "Bloqueado" :
               lote.estado === "5" ? "Bloqueado comercial" :
               lote.estado === "6" ? "Separado comercial" :
               lote.estado}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoteInfoPanel;
