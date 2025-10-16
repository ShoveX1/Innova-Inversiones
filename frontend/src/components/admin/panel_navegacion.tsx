

import { useState } from 'react';
import { NavLink } from 'react-router-dom';



interface PanelNavegacionProps{
    onToggleSidebar?: (isCollapsed: boolean) => void;
}

export default function PanelNavegacion({onToggleSidebar}:PanelNavegacionProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        if(onToggleSidebar) onToggleSidebar(newState);
    };

    return (
        <div className={`bg-white shadow-md overflow-visible flex flex-col h-min-full h-full transition-all duration-300 ${isCollapsed ? 'max-w-16' : 'max-w-sm'}`}>

            {/* Header del Panel */}
            <div className={`px-5 py-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
                <div className="flex items-center justify-center">
                    {isCollapsed ? (
                        /* Estado colapsado - Solo logo */
                        <div className="flex flex-col items-center gap 2">
                            <img src="/logo_innova_blanco.svg" alt="Innova Inversiones" className="w-8 h-8" />
                        </div>
                    ) : (
                        /* Estado expandido - Logo + texto + botón */
                        <div className="w-full flex items-center justify-start">
                            <div className="flex items-center space-x-3">
                                <img src="/logo_innova_blanco.svg" alt="Innova Inversiones" className="w-8 h-8" />
                                <div className="flex flex-col items-start">
                                    <h2 className="text-2xl font-bold mr-2">Innova Inversiones</h2>
                                    <span className="text-xs">Las Bugambilias</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Botón flotante centrado en el borde inferior del header */}
            <div className="relative">
                <button 
                    onClick={toggleCollapse}
                    className="absolute right-0 translate-x-1/2 -top-3 bg-white rounded-full shadow-lg hover:shadow-xl p-2 transition-all ring-1 ring-black/5"
                    aria-label={isCollapsed ? 'Expandir panel' : 'Contraer panel'}
                >
                    <svg 
                        className="w-5 h-5 text-blue-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 6h16M4 12h16M4 18h16" 
                        />
                    </svg>
                </button>
            </div>

            {/* Contenido del Panel */}
            <div className="flex-1 overflow-hidden border-t border-gray-200 bg-gradient-to-r from-blue-900 to-blue-700 text-white h-min-full">
                <div className={`flex flex-col gap-2 pt-8 pb-8 transition-all duration-300 ${isCollapsed ? 'px-2' : 'p-4'}`}>
                    {/* Plano de Lotes */}
                    <NavLink 
                        to="/admin/plano-lotes" 
                        className={({ isActive }) => 
                            `py-4 flex items-center text-white hover:text-white rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : 'ps-2 flex-row gap-4'} ` +
                            (isActive ? 'bg-white/20 shadow-lg scale-105' : 'hover:bg-white/10 hover:scale-105 hover:shadow-md')
                        }
                        title={isCollapsed ? 'Plano de Lotes' : undefined}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {!isCollapsed && (
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-bold">Plano de Lotes</h3>
                            </div>
                        )}
                    </NavLink>

                    {/* Dashboard */}
                    <NavLink 
                        to="/admin/dashboard" 
                        className={({ isActive }) => 
                            `py-4 flex items-center text-white hover:text-white rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : 'ps-2 flex-row gap-2'} ` +
                            (isActive ? 'bg-white/20 shadow-lg scale-105' : 'hover:bg-white/10 hover:scale-105 hover:shadow-md')
                        }
                        title={isCollapsed ? 'Dashboard' : undefined}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                        </svg>
                        {!isCollapsed && (
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-bold">DashBoard</h3>
                            </div>
                        )}
                    </NavLink>

                    {/* Gestión de Clientes */}
                    <NavLink 
                        to="/admin/gestion-clientes" 
                        className={({ isActive }) => 
                            `py-4 flex items-center text-white hover:text-white rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : 'ps-2 flex-row gap-2'} ` +
                            (isActive ? 'bg-white/20 shadow-lg scale-105' : 'hover:bg-white/10 hover:scale-105 hover:shadow-md')
                        }
                        title={isCollapsed ? 'Gestión de Clientes' : undefined}
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        {!isCollapsed && (
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-bold">Gestion de Clientes</h3>
                            </div>
                        )}
                    </NavLink>

                    {/* Gestión de Usuarios */}
                    <NavLink 
                        to="/admin/gestion-usuarios" 
                        className={({ isActive }) => 
                            `py-4 flex items-center text-white hover:text-white rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : 'ps-2 flex-row gap-2'} ` +
                            (isActive ? 'bg-white/20 shadow-lg scale-105' : 'hover:bg-white/10 hover:scale-105 hover:shadow-md')
                        }
                        title={isCollapsed ? 'Gestión de Usuarios' : undefined}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5l-1.99-2.51A2.5 2.5 0 0 0 10.01 8H8.46a1.5 1.5 0 0 0-1.42 1.37L4.5 17H7v5h2v-6h2v-6h2v-6h2z"/>
                        </svg>
                        {!isCollapsed && (
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-bold">Gestion de Usuarios</h3>
                            </div>
                        )}
                    </NavLink>

                    {/* Transacciones */}
                    <NavLink 
                        to="/admin/transacciones" 
                        className={({ isActive }) => 
                            `py-4 flex items-center text-white hover:text-white rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : 'ps-2 flex-row gap-2'} ` +
                            (isActive ? 'bg-white/20 shadow-lg scale-105' : 'hover:bg-white/10 hover:scale-105 hover:shadow-md')
                        }
                        title={isCollapsed ? 'Transacciones' : undefined}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                        </svg>
                        {!isCollapsed && (
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-bold">Transacciones</h3>
                            </div>
                        )}
                    </NavLink>

                    {/* Créditos por Cobrar */}
                    <NavLink 
                        to="/admin/creditos-por-cobrar" 
                        className={({ isActive }) => 
                            `py-4 flex items-center text-white hover:text-white rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : 'ps-2 flex-row gap-2'} ` +
                            (isActive ? 'bg-white/20 shadow-lg scale-105' : 'hover:bg-white/10 hover:scale-105 hover:shadow-md')
                        }
                        title={isCollapsed ? 'Créditos por Cobrar' : undefined}
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                        </svg>
                        {!isCollapsed && (
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-bold">Creditos por Cobrar</h3>
                            </div>
                        )}
                    </NavLink>
                </div>
            </div>
        </div>
    )
}