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
      <aside
        style={{
          width: "320px",
          height: "100vh",
          background: "#f7f7f8",
          borderLeft: "1px solid #e2e2e2",
          padding: "16px",
          boxSizing: "border-box",
          color: "black",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Panel de Información</h2>
          <button onClick={onClose} className="bg-transparent hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200">
            Cerrar
          </button>
        </div>
  
        <hr style={{ margin: "12px 0" }} />
  
        {loading && <p>Cargando lotes…</p>}
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
        {!loading && !error && !lote && <p>Selecciona un lote en el mapa.</p>}
  
        {!loading && !error && lote && (
          <div style={{ display: "grid", gap: "8px" }}>
            <div><strong>Innova Inversiones</strong></div>
            <div><strong>Manzana: </strong> {lote.manzana}  <strong>Lote: </strong> {lote.lote_numero}</div>
            <div><strong>Área (m²):</strong> {lote.area_lote}</div>
            {/* condicion para mostrar estado */}
            {lote.estado ==="1" ? (
              <div><strong>Precio Total: </strong> {lote.precio != null ? currency.format(Number(lote.precio)) : "—"} </div>
            ):lote.estado ==="2" ?(
              <div><strong>Estado: </strong> Reservado </div>
            ):(
              <div><strong>Estado: </strong> Vendido </div>
            )}
          </div>
        )}
      </aside>
    );
  }
  