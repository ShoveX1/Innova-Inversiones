import { COLORS_PUBLIC, COLORS_ADMIN} from "../constants/colorsAndLabels";


interface Lote {
    codigo: string;
    estado: string;
}

export function getColorEstado(
    lote: Lote, 
    isAdmin: boolean
    ): string {
        const colorMap = isAdmin ? COLORS_ADMIN : COLORS_PUBLIC;
        return colorMap[lote.estado as keyof typeof colorMap] || "#ffffff";
    }