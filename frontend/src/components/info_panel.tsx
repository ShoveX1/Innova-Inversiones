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
  const map: Record<string, { bg: string; text: string; label: string }> = {
    "1": { bg: "bg-green-100", text: "text-green-700", label: "Disponible" },
    "2": { bg: "bg-yellow-100", text: "text-yellow-800", label: "Reservado" },
    "3": { bg: "bg-red-100", text: "text-red-700", label: "Vendido" },
    // Mostrar estado 4 como "Vendido" para usuarios no gerenciales
    "4": { bg: "bg-red-100", text: "text-red-700", label: "Vendido" },
  };
  const cls = map[estado] ?? { bg: "bg-gray-100", text: "text-gray-700", label: estadoNombre || "—" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls.bg} ${cls.text}`}>
      {cls.label}
    </span>
  );
}

export default function InfoPanel({ loading, error, lote, onClose }: Props) {
  const titleId = "info-panel-title";

  return (
    <aside
      className="w-full h-full bg-white text-gray-900 border-gray-200 flex flex-col"
      role="region"
      aria-labelledby={titleId}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="min-w-0">
          <h2 id={titleId} className="m-0 text-base md:text-lg font-semibold truncate">Innova Inversiones</h2>
          <p className="m-0 text-xs text-gray-500 mt-0.5 truncate">
            {lote ? `Lote ${lote.manzana}-${lote.lote_numero}` : "Selecciona un lote en el mapa"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center h-9 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          aria-label="Cerrar panel"
        >
          Cerrar
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-auto">
        {loading && (
          <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="grid grid-cols-2 gap-3 animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg" />
              <div className="h-16 bg-gray-200 rounded-lg" />
              <div className="h-16 bg-gray-200 rounded-lg col-span-2" />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span aria-hidden>⚠️</span>
            <span className="flex-1">Error: {error}</span>
          </div>
        )}

        {!loading && !error && !lote && (
          <div className="text-center text-gray-600">
            <div className="mx-auto mb-2 text-2xl" aria-hidden>🗺️</div>
            <p className="text-sm">Selecciona un lote en el mapa para ver los detalles.</p>
          </div>
        )}

        {!loading && !error && lote && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Estado</div>
                <div className="mt-1">{estadoBadge(lote.estado, lote.estado_nombre)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Área (m²)</div>
                <div className="text-sm font-medium text-gray-800">{lote.area_lote}</div>
              </div>
            </div>

            {/* Mostrar el precio arriba en móvil para que no se oculte */}
            {lote.estado === "1" && (
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500">Precio total</div>
                <div className="text-lg font-semibold text-gray-900">
                  {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}
                </div>
                {lote.precio_metro_cuadrado != null && (
                  <div className="mt-1 text-xs text-gray-500">
                    {currency.format(Number(lote.precio_metro_cuadrado))} / m²
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500">Manzana</div>
                <div className="font-medium">{lote.manzana}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500">Lote</div>
                <div className="font-medium">{lote.lote_numero}</div>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
