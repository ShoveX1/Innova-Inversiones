import React, { useState, useEffect } from 'react';
import { clienteLoteApi } from '@/services';

interface Lote {
  codigo: string;
  estado: string;
  area_lote: number;
  precio: number | null;
}

interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
}

interface RelacionClienteLote {
  id: string;
  cliente: Cliente;
  cliente_nombre: string;
  cliente_apellidos: string;
  cliente_dni?: string;
  tipo_relacion: string;
  lote_codigo?: string; // Código del lote devuelto por el serializer
}

interface LoteInfoPanelProps {
  lote: Lote | null;
  position: { x: number; y: number } | null;
  isVisible: boolean;
  isAdmin?: boolean; // Solo mostrar información del cliente si es admin
}

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

const getColorMap = (isAdmin: boolean): Record<string, string> => {
  return isAdmin ? {
    "1": "#f5cdadff", // beige - Disponible
    "2": "#fff200ff", // Amarillo - Separado
    "3": "#ef1688ff", // morado - Vendido
    "4": "#9ca3af", // gris - Bloqueado
    "5": "#e0e0e0", // gris claro - Bloqueo Comercial
    "6": "#FF8C00", // naranja - Separado comercial
  } : {
    "1": "#f5cdadff", // beige - Disponible
    "2": "#fff200ff", // Amarillo - Separado
    "3": "#ef1688ff", // morado - Vendido
    "4": "#ef1688ff", // morado - Bloqueado
    "5": "#ef1688ff", // morado - Bloqueo Comercial
    "6": "#fff200ff", // Amarillo - Separado comercial
  };
};

const LoteInfoPanel: React.FC<LoteInfoPanelProps> = ({ lote, position, isVisible, isAdmin = false }) => {
  const [clienteRelacionado, setClienteRelacionado] = useState<RelacionClienteLote | null>(null);
  const [cargandoCliente, setCargandoCliente] = useState(false);

  // Obtener información del cliente relacionado al lote (solo si es admin)
  useEffect(() => {
    if (!lote || !isVisible || !isAdmin) {
      setClienteRelacionado(null);
      return;
    }

    async function obtenerClienteRelacionado() {
      if (!lote) return;
      
      try {
        setCargandoCliente(true);
        const response = await clienteLoteApi.listar({ codigo_lote: lote.codigo });
        const data = response as { count: number; relaciones: RelacionClienteLote[] };
        
        // IMPORTANTE: Filtrar relaciones para asegurar que solo se muestren clientes
        // del lote con código EXACTAMENTE igual (el backend usa icontains que puede devolver resultados parciales)
        const relacionesFiltradas = data.relaciones?.filter((relacion: any) => {
          // Verificar que el código del lote en la relación sea exactamente igual
          // El serializer devuelve lote_codigo (según RelacionClienteLoteSerializer)
          const codigoRelacion = relacion.lote_codigo || relacion.lote?.codigo || relacion.codigo_lote;
          // Comparación EXACTA pero sin importar mayúsculas/minúsculas
          // El código debe ser idéntico carácter por carácter, pero case-insensitive
          return codigoRelacion?.toLowerCase() === lote.codigo?.toLowerCase();
        }) || [];
        
        // Obtener la primera relación (puede haber múltiples, pero mostramos la primera)
        if (relacionesFiltradas.length > 0) {
          // Priorizar Propietario, luego Reservante, luego otros
          const relacion = relacionesFiltradas.find(r => r.tipo_relacion === 'Propietario') 
            || relacionesFiltradas.find(r => r.tipo_relacion === 'reservante')
            || relacionesFiltradas[0];
          setClienteRelacionado(relacion);
        } else {
          setClienteRelacionado(null);
        }
      } catch (error) {
        console.error('Error al obtener cliente relacionado:', error);
        setClienteRelacionado(null);
      } finally {
        setCargandoCliente(false);
      }
    }

    obtenerClienteRelacionado();
  }, [lote?.codigo, isVisible, isAdmin]);

  if (!isVisible || !lote || !position) {
    return null;
  }

  return (
    <div 
      className="
        absolute 
        bg-white/80
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
        left: Math.min(position.x + 25, window.innerWidth - 250),
        top: Math.min(position.y - 10, window.innerHeight - 150),
      }}
    >
      <h3 className="text-sm font-bold text-gray-800 mb-2 text-center ">
        Información del Lote
      </h3>
      
      <div className="space-y-2 text-xs text-gray-700">
        <div className="flex justify-between items-center">
          <span className="font-medium">Lote:</span>
          <span 
            className="font-semibold text-gray-900"
            style={{ 
              fontVariantLigatures: 'none',
              fontFeatureSettings: '"liga" 0, "calt" 0'
            }}
          >
            {lote.codigo}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Área:</span>
          <span className="font-semibold text-gray-900">{lote.area_lote} m²</span>
        </div>
        
        {isAdmin ?(
          <div className="flex justify-between items-center">
          <span className="font-medium">Precio:</span>
          <span className="font-semibold text-green-600"> {currency.format(Number(lote.precio))}</span>
        </div>
        ) : (
        lote.precio && (lote.estado === "1" || lote.estado === "2" || lote.estado === "6") && (
          <div className="flex justify-between items-center">
            <span className="font-medium">Precio:</span>
            <span className="font-semibold text-green-600"> {currency.format(Number(lote.precio))}</span>
          </div>
        ))}
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Estado:</span>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
              style={{ 
                backgroundColor: getColorMap(isAdmin)[lote.estado] || "#ffffff" 
              }}
            ></div>
            {isAdmin ? (
              <span className="font-semibold text-gray-900">
              {lote.estado === "1" ? "Disponible" :
               lote.estado === "2" ? "Separado" :
               lote.estado === "3" ? "Vendido" :
               lote.estado === "4" ? "Bloqueado" :
               lote.estado === "5" ? "Bloqueado Comercial" :
               lote.estado === "6" ? "Separado comercial" :
               lote.estado}
            </span>)
            :(
            <span className="font-semibold text-gray-900">
              {lote.estado === "1" ? "Disponible" :
               lote.estado === "2" ? "Separado" :
               lote.estado === "3" ? "Vendido" :
               lote.estado === "4" ? "Vendido" :
               lote.estado === "5" ? "Vendido" :
               lote.estado === "6" ? "Separado" :
               lote.estado}
            </span>)}
          </div>
        </div>

        {/* Información del Cliente - Solo visible para admin */}
        {isAdmin && (
          <>
            {cargandoCliente ? (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="font-medium text-gray-600">Cliente: </span>
                <span className="text-xs text-gray-500">Cargando...</span>
              </div>
            ) : clienteRelacionado ? (
              <div className="pt-2 border-t border-gray-200 mt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Cliente: </span>
                  <span className="font-semibold text-gray-900 text-xs text-right">
                    {clienteRelacionado.cliente_nombre} {clienteRelacionado.cliente_apellidos}
                  </span>
                </div>
                {clienteRelacionado.cliente_dni && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">DNI: </span>
                    <span className="font-semibold text-gray-900 text-xs">
                      {clienteRelacionado.cliente_dni}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="font-medium text-gray-600">Cliente: </span>
                <span className="text-xs text-gray-500">Sin asignar</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoteInfoPanel;
