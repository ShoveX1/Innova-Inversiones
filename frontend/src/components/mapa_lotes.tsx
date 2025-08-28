import { useEffect, useState, useRef } from "react";
import axios from "axios";

interface Lote {
  codigo: string;
  estado: string;
}

export default function MapaLotes() {
  const objectRef = useRef<HTMLObjectElement>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [svgLoaded, setSvgLoaded] = useState(false);

  // Cargar datos del backend
  useEffect(() => {
    console.log('�� Iniciando carga de datos...');
    axios.get("http://127.0.0.1:8000/api/maps/lotes/")
      .then((res) => {
        console.log('✅ Datos recibidos:', res.data.length, 'lotes');
        setLotes(res.data);
      })
      .catch((err) => {
        console.error('❌ Error en la petición:', err);
      });
  }, []);

  // Aplicar colores cuando tanto el SVG como los datos estén listos
  useEffect(() => {
    if (svgLoaded && lotes.length > 0) {
      console.log('🎨 Aplicando colores a', lotes.length, 'lotes');
      
      const svgDoc = objectRef.current?.contentDocument;
      if (svgDoc) {
        lotes.forEach((lote, index) => {
          const el = svgDoc.getElementById(lote.codigo);
          if (el) {
            console.log(`✅ Aplicando color ${lote.estado} a ${lote.codigo}`);
            switch (lote.estado) {
              case "1": el.style.fill = "#4ade80"; break;
              case "2": el.style.fill = "#facc15"; break;
              case "3": el.style.fill = "#ef4444"; break;
              case "4": el.style.fill = "#9ca3af"; break;
              default: el.style.fill = "#ffffff";
            }
          } else {
            console.log(`❌ Elemento ${lote.codigo} no encontrado`);
          }
        });
      }
    }
  }, [svgLoaded, lotes]);

  // Manejar la carga del SVG
  const handleSvgLoad = () => {
    console.log('�� SVG cargado');
    setSvgLoaded(true);
  };

  return (
    <div>
      <object
        ref={objectRef}
        type="image/svg+xml"
        data="/planovirtual 1_edit_ids.svg"
        className="w-full h-auto"
        onLoad={handleSvgLoad}
      />
    </div>
  );
}