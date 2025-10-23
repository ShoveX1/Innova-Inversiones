//----------------------------------------------------
//colores publicos para el plano
export const COLORS_PUBLIC = {
    "1": "#f5cdadff", // beige - Disponible
    "2": "#fff200ff", // Amarillo - Separado
    "3": "#ef1688ff", // morado - Vendido
    "4": "#ef1688ff", // morado - Bloqueado
    "5": "#ef1688ff", // morado - Bloqueo Comercial
    "6": "#fff200ff", // Amarillo - Separado comercial
} as const;


//colores reales para el admin
export const COLORS_ADMIN = {
    "1": "#f5cdadff", // beige - Disponible
    "2": "#fff200ff", // Amarillo - Separado
    "3": "#ef1688ff", // rojo - Vendido
    "4": "#9ca3af", // gris - Bloqueado
    "5": "#e0e0e0", // gris claro - Bloqueo Comercial
    "6": "#FF8C00", // naranja - Separado comercial
} as const;

//----------------------------------------------------
//labels publicos para el plano
export const LABELS_PUBLIC = {
    "1": "Disponible",
    "2": "Separado",
    "3": "Vendido",
    "4": "Vendido",
    "5": "Vendido",
    "6": "Separado",
} as const;

//labels reales para el admin
export const LABELS_ADMIN = {
    "1": "Disponible",
    "2": "Separado",
    "3": "Vendido",
    "4": "Bloqueado",
    "5": "Bloqueo Comercial",
    "6": "Separado comercial",
} as const;

//----------------------------------------------------
//emojis publicos para los estados en el plano
export const EMOJIS_PUBLIC = {
    "1": "🟢", // Verde - Disponible
    "2": "🟡", // Amarillo - Separado
    "3": "🔴", // Rojo - Vendido
    "4": "🔴", // Rojo - Bloqueado
    "5": "🔴", // Rojo - Bloqueo Comercial
    "6": "🟡", // Amarillo - Separado comercial
} as const;

//emojis reales para los estados en el admin
export const EMOJIS_ADMIN = {
    "1": "🟢", // Verde - Disponible
    "2": "🟡", // Amarillo - Separado
    "3": "🔴", // Rojo - Vendido
    "4": "⚪", // Blanco - Bloqueado
    "5": "⚪", // Blanco - Bloqueo Comercial
    "6": "🟠", // Naranja - Separado comercial
} as const;

//----------------------------------------------------
//tipos y constantes auxiliares
export type EstadoLote = "1" | "2" | "3" | "4" | "5" | "6";