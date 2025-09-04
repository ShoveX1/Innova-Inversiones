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
  
  export default function InfoPanel({ loading, error, lote, onClose }: Props) {
    return (
      <aside className="w-full h-full bg-zinc-50 p-4 box-border text-gray-900">
        <div className="flex justify-between items-center">
          <h2 className="m-0 text-lg font-semibold">Panel de Información</h2>
          <button onClick={onClose} className="bg-transparent hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200">
            Cerrar
          </button>
        </div>

        <hr className="my-3 border-gray-200" />

        {loading && <p className="text-sm text-gray-600">Cargando lotes…</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {!loading && !error && !lote && <p className="text-sm text-gray-600">Selecciona un lote en el mapa.</p>}

        {!loading && !error && lote && (
          <div className="grid gap-2 text-sm">
            <div className="font-semibold">Innova Inversiones</div>
            <div><span className="font-semibold">Manzana:</span> {lote.manzana}  <span className="font-semibold">Lote:</span> {lote.lote_numero}</div>
            <div><span className="font-semibold">Área (m²):</span> {lote.area_lote}</div>
            {/* condicion para mostrar estado */}
            {lote.estado ==="1" ? (
              <div><span className="font-semibold">Precio Total:</span> {lote.precio != null ? currency.format(Number(lote.precio)) : "—"}</div>
            ):lote.estado ==="2" ?(
              <div><span className="font-semibold">Estado:</span> Reservado</div>
            ):(
              <div><span className="font-semibold">Estado:</span> Vendido</div>
            )}
          </div>
        )}
      </aside>
    );
  }
  