// src/components/info_panel.tsx
import { useEffect, useState } from 'react';
import { clienteLoteApi } from '@/services';
import { DollarSign, X } from 'lucide-react';

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
    descripcion: string | null;
  } | null;
  onClose?: () => void;
  isAdmin?: boolean; // Solo mostrar información del cliente si es admin
};

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

function estadoBadge(estado: string, estadoNombre: string, isAdmin: boolean) {
  const map: Record<string, { bg: string; text: string; label: string; emoji: string }> = isAdmin ? {
    "1": { bg: "bg-green-100", text: "text-green-700", label: "Disponible", emoji: "🟢" },
    "2": { bg: "bg-yellow-100", text: "text-yellow-800", label: "Separado", emoji: "🟡" },
    "3": { bg: "bg-red-100", text: "text-red-700", label: "Vendido", emoji: "🔴" },
    "4": { bg: "bg-gray-300", text: "text-gray-700", label: "Bloqueado", emoji: "⚪" },
    "5": { bg: "bg-gray-100", text: "text-gray-700", label: "Bloqueo Comercial", emoji: "⚪" },
    "6": { bg: "bg-orange-100", text: "text-orange-800", label: "Separado Comercial", emoji: "🟠" },
  } :{
    "1": { bg: "bg-green-100", text: "text-green-700", label: "Disponible", emoji: "🟢" },
    "2": { bg: "bg-yellow-100", text: "text-yellow-800", label: "Separado", emoji: "🟡" },
    "3": { bg: "bg-red-100", text: "text-red-700", label: "Vendido", emoji: "🔴" },
    "4": { bg: "bg-red-100", text: "text-red-700", label: "Vendido", emoji: "🔴" },
    "5": { bg: "bg-red-100", text: "text-red-700", label: "Vendido", emoji: "🔴" },
    "6": { bg: "bg-yellow-100", text: "text-yellow-800", label: "Separado", emoji: "🟡" },
  };
  const cls = map[estado] ?? { bg: "bg-gray-100", text: "text-gray-700", label: estadoNombre || "—", emoji: "⚪" };
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls.bg} ${cls.text}`}>
      <span className="mr-1 text-xs sm:text-sm">{cls.emoji}</span>
      <span className="text-xs sm:text-sm">{cls.label}</span>
    </div>
  );
}

export default function InfoPanel({ loading, error, lote, onClose, isAdmin = false }: Props) {
  // Estado de arrastre
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Estado para información del cliente relacionado
  const [clienteRelacionado, setClienteRelacionado] = useState<RelacionClienteLote | null>(null);
  const [cargandoCliente, setCargandoCliente] = useState(false);

  const onMouseDownRoot = (e: React.MouseEvent) => {
    if (isMobile) return; // En móvil no es movible
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    const panelWidth = 320;
    const panelHeight = 260; // aproximado
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - panelWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - panelHeight - margin);
    setPosition({
      x: Math.max(margin, Math.min(nextX, maxX)),
      y: Math.max(margin, Math.min(nextY, maxY)),
    });
  };

  const onMouseUp = () => setIsDragging(false);

  // Suscribirse a eventos mientras se arrastra
  // @ts-ignore
  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, dragStart]);

  // Detectar móvil (sm breakpoint ~ 640px)
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Obtener información del cliente relacionado al lote (solo si es admin)
  useEffect(() => {
    if (!lote || !isAdmin) {
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
  }, [lote?.codigo, isAdmin]);

  // Si no hay lote seleccionado, no mostrar el panel
  if (!lote && !loading && !error) {
    return null;
  }

  return (
    <div
      className="fixed z-50"
      style={
        isMobile
          ? ({
              left: 16,
              right: 16,
              bottom: 16,
              width: 'auto',
            })
          : isAdmin ? ({
              left: `calc(250px + ${position.x}px)`,
              top: `calc(12vh + ${position.y}px)`,
              width: 320,
            })
          : {
              left: position.x,
              top: `calc(10vh + ${position.y}px)`,
              width: 320,
            }
      }
      onMouseDown={onMouseDownRoot}
    >
      <div className="
        bg-white/95 backdrop-blur-sm 
        border border-gray-200 rounded-xl
        shadow-2xl 
        overflow-hidden 
        flex flex-col
      ">
        {/* Header fijo */}
        <div data-drag-handle className="
          flex items-center justify-between select-none
          px-3 py-2 sm:px-4 sm:py-3 
          bg-gradient-to-r from-blue-600 to-blue-700 
          text-white
        ">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏠</span>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold truncate">Las Bugambilias-1RA ETAPA</h3>
              {lote && (
                <p className="text-xs text-blue-100 truncate">
                  Lote {lote.manzana}-{lote.lote_numero}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onClose && (
              <button
                onClick={onClose}
                className="
                  p-1 sm:p-1 
                  hover:bg-white/20 
                  bg-blue-600
                  rounded 
                  transition-colors
                "
                aria-label="Cerrar panel"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Contenido del panel */}
        <div className="
          p-3 sm:p-4 
          space-y-2 sm:space-y-3
        ">
            {loading && (
              <div className="animate-pulse space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-6 sm:h-8 bg-gray-200 rounded" />
              </div>
            )}

            {error && (
              <div className="
                flex items-start gap-2 
                text-xs sm:text-sm 
                text-red-700 
                bg-red-50 
                border border-red-200 
                rounded-lg 
                px-2 py-1 sm:px-3 sm:py-2
              ">
                <span>⚠️</span>
                <span className="flex-1">Error: {error}</span>
              </div>
            )}

            {!loading && !error && lote && (
              <>
                {/* Estado y área en una línea */}
                <div className="flex items-center justify-between">
                  {estadoBadge(lote.estado, lote.estado_nombre, isAdmin)}
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Área</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-800">{lote.area_lote} m²</div>
                  </div>
                </div>

                {/* Precio destacado */}
                {isAdmin ? (
                  lote.estado === "1" ? (
                    <div className="
                      bg-gradient-to-r from-green-50 to-emerald-50 
                      border border-green-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-green-600 font-medium">
                        <DollarSign className="w-4 h-4 text-green-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-green-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-green-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) :
                  lote.estado === "2" ? (
                    <div className="
                      bg-gradient-to-r from-yellow-50 to-amber-50 
                      border border-yellow-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-yellow-600 font-medium">
                        <DollarSign className="w-4 h-4 text-yellow-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-yellow-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-yellow-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) : 
                  lote.estado === "3" ? (
                    <div className="
                      bg-gradient-to-r from-red-50 to-rose-50 
                      border border-red-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-red-600 font-medium">
                        <DollarSign className="w-4 h-4 text-red-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-red-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-red-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) :
                  lote.estado === "4" ? (
                    <div className="
                      bg-gradient-to-r from-gray-50 to-gray-200 
                      border border-gray-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-gray-600 font-medium">
                        <DollarSign className="w-4 h-4 text-gray-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-gray-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-gray-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) :
                  lote.estado === "5" ? (
                    <div className="
                      bg-gradient-to-r from-gray-50 to-gray-200 
                      border border-gray-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-gray-600 font-medium">
                        <DollarSign className="w-4 h-4 text-gray-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-gray-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-gray-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) :
                  lote.estado === "6" ? (
                    <div className="
                      bg-gradient-to-r from-orange-50 to-orange-200 
                      border border-orange-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-orange-600 font-medium">
                        <DollarSign className="w-4 h-4 text-orange-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-orange-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-orange-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) : (null)
                ):(
                  lote.estado === "1" ? (
                    <div className="
                      bg-gradient-to-r from-green-50 to-emerald-50 
                      border border-green-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-green-600 font-medium">
                        <DollarSign className="w-4 h-4 text-green-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-green-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-green-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) :
                  lote.estado === "2" || lote.estado === "6" ? (
                    <div className="
                      bg-gradient-to-r from-yellow-50 to-amber-50 
                      border border-yellow-200 
                      rounded-lg 
                      p-2 sm:p-3
                    ">
                      <div className="text-xs text-yellow-600 font-medium">
                        <DollarSign className="w-4 h-4 text-yellow-600 inline-block" /> Precio total</div>
                      <div className="text-base sm:text-lg font-bold text-yellow-800">
                        {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                      </div>
                      {lote.precio_metro_cuadrado != null && (
                        <div className="text-xs text-yellow-600">
                          {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`
                      rounded-lg 
                      p-2 sm:p-3 
                      ${lote.estado === "3" 
                        ? "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200" 
                        : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
                      }
                    `}>
                      <div className={`text-xs font-medium ${
                        lote.estado === "3" ? "text-red-600" : "text-red-600"
                      }`}>
                        {lote.estado === "3" ? "🔴 Estado" : "🔴 Estado"}
                      </div>
                      <div className={`text-base sm:text-lg font-bold ${
                        lote.estado === "3" ? "text-red-800" : "text-red-800"
                      }`}>
                        {lote.estado === "3" ? "Vendido" : "Vendido"}
                      </div>
                    </div>
                  )
                )}
                

                {/* Ubicación compacta */}
                <div className="
                  flex items-center justify-center 
                  space-x-2 
                  text-xs sm:text-sm 
                  text-gray-600 
                  bg-gray-50 
                  rounded-lg 
                  px-2 py-1 sm:px-3 sm:py-2
                ">
                  <span>📍</span>
                  <span className="font-medium">Descripción: {lote.descripcion}</span>
                </div>

                {/* Información del Cliente - Solo visible para admin */}
                {isAdmin && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    {cargandoCliente ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Cliente:</span>
                        <span className="text-xs text-gray-500">Cargando...</span>
                      </div>
                    ) : clienteRelacionado ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 font-medium">Cliente:</span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right">
                            {clienteRelacionado.cliente_nombre} {clienteRelacionado.cliente_apellidos}
                          </span>
                        </div>
                        {clienteRelacionado.cliente_dni && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-medium">DNI:</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              {clienteRelacionado.cliente_dni}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Cliente:</span>
                        <span className="text-xs text-gray-500">Sin asignar</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
