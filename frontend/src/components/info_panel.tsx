// src/components/info_panel.tsx
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
      <span className="mr-1 text-xs sm:text-sm">{cls.emoji}</span>
      <span className="text-xs sm:text-sm">{cls.label}</span>
    </div>
  );
}

export default function InfoPanel({ loading, error, lote, onClose }: Props) {

  // Si no hay lote seleccionado, no mostrar el panel
  if (!lote && !loading && !error) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <div className="
        bg-white/95 backdrop-blur-sm 
        border border-gray-200 
        sm:rounded-r-xl 
        shadow-2xl 
        overflow-hidden 
        flex flex-col
      ">
        {/* Header fijo */}
        <div className="
          flex items-center justify-between 
          px-3 py-2 sm:px-4 sm:py-3 
          bg-gradient-to-r from-blue-600 to-blue-700 
          text-white
        ">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏠</span>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold truncate">Innova Inversiones</h3>
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
                  rounded 
                  transition-colors
                "
                aria-label="Cerrar panel"
              >
                ✕
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
                  {estadoBadge(lote.estado, lote.estado_nombre)}
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Área</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-800">{lote.area_lote} m²</div>
                  </div>
                </div>

                {/* Precio destacado */}
                {lote.estado === "1" ? (
                  <div className="
                    bg-gradient-to-r from-green-50 to-emerald-50 
                    border border-green-200 
                    rounded-lg 
                    p-2 sm:p-3
                  ">
                    <div className="text-xs text-green-600 font-medium">💰 Precio total</div>
                    <div className="text-base sm:text-lg font-bold text-green-800">
                      {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                    </div>
                    {lote.precio_metro_cuadrado != null && (
                      <div className="text-xs text-green-600">
                        {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`
                    rounded-lg 
                    p-2 sm:p-3 
                    ${lote.estado === "2" 
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200" 
                      : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
                    }
                  `}>
                    <div className={`text-xs font-medium ${
                      lote.estado === "2" ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {lote.estado === "2" ? "🟡 Estado" : "🔴 Estado"}
                    </div>
                    <div className={`text-base sm:text-lg font-bold ${
                      lote.estado === "2" ? "text-yellow-800" : "text-red-800"
                    }`}>
                      {lote.estado === "2" ? "Reservado" : "Vendido"}
                    </div>
                  </div>
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
                  <span className="font-medium">M-{lote.manzana} • Lote {lote.lote_numero}</span>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
