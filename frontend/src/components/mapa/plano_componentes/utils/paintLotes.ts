import { getColorEstado } from "./colorManager";

interface Lote {
    codigo: string;
    estado: string;
}

/**
 * Aplica colores a los lotes del SVG de forma optimizada
 * @param svgDoc - Documento SVG donde aplicar los colores
 * @param lotesData - Array de lotes con sus estados
 * @param isAdmin - Si es modo admin (true) o público (false)
 * @returns Número de lotes pintados exitosamente
 */
export function paintLotes(svgDoc: Document, lotesData: Lote[], isAdmin: boolean): number {
    if (!svgDoc || !lotesData || lotesData.length === 0) {
        console.warn('⚠️ paintLotes: Datos inválidos', { svgDoc: !!svgDoc, lotesCount: lotesData?.length });
        return 0;
    }

    // ✅ Optimización 1: Crear un Map para acceso O(1) en lugar de O(n)
    // 🔄 IMPORTANTE: Normalizamos los códigos a minúsculas para coincidir con los IDs del SVG
    const lotesMap = new Map(
        lotesData.map(lote => [lote.codigo.toLowerCase().trim(), lote])
    );
    
    // ✅ Optimización 2: Procesar todos los elementos con ID de una vez
    const elements = svgDoc.querySelectorAll('[id]');
    let paintedCount = 0;
    
    elements.forEach((el) => {
        // 🔄 Normalizar el ID del elemento SVG a minúsculas también
        const elementId = el.id.toLowerCase().trim();
        const lote = lotesMap.get(elementId);
        
        if (lote) {
            // Obtener el color según el estado
            const color = getColorEstado(lote, isAdmin);
            
            // ✅ Optimización 3: Aplicar el color de múltiples formas
            el.setAttribute('fill', color);
            
            // Forzar el color también en el estilo CSS
            (el as SVGElement).style.fill = color;
            
            // ✅ Optimización 4: Remover clases que puedan sobrescribir el color
            el.removeAttribute('class');
            
            // Marcar como interactivo
            el.setAttribute('cursor', 'pointer');
            
            paintedCount++;
        }
    });
    
    console.log(`✅ paintLotes: ${paintedCount} lotes pintados de ${lotesData.length} disponibles`);
    return paintedCount;
}

/**
 * Normaliza un código de lote (convierte a minúsculas y elimina espacios)
 * @param codigo - Código del lote a normalizar
 * @returns Código normalizado
 */
export function normalizarCodigo(codigo: string): string {
    return codigo.toLowerCase().trim();
}