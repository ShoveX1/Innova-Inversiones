import SidebarAdmin from "../../components/admin/sidebar_admin";
import PlanoLotes from "./admin_sub_pages/plano_lotes";
import Dashboard from "./admin_sub_pages/dashboard";
import GestionClientes from "./admin_sub_pages/gestion_clientes";
import GestionUsuarios from "./admin_sub_pages/gestion_usuarios";
import Transacciones from "./admin_sub_pages/transacciones";
import CreditosPorCobrar from "./admin_sub_pages/creditos_por_cobrar";
import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";


export default function AdminMapaPage(){

    const [navCollapsed, setNavCollapsed] = useState<boolean>(false);
    const isMountedRef = useRef(true);


    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);


    return (
        <div className="h-screen w-full">
            {/* Panel de Navegación fijo */}
            <div className={`fixed left-0 top-0 h-screen z-30 ${navCollapsed ? 'w-16' : 'w-[16rem]'}`}>
                <SidebarAdmin onToggleSidebar={(isCollapsed:boolean) => setNavCollapsed(isCollapsed)} />
            </div>
            <div className="h-screen w-full">
                <Routes>
                    <Route path="/" element={<PlanoLotes navCollapsed={navCollapsed} />} />
                    <Route path="/plano-lotes" element={<PlanoLotes navCollapsed={navCollapsed} />} />
                    <Route path="/dashboard" element={<Dashboard navCollapsed={navCollapsed} />} />
                    <Route path="/gestion-clientes" element={<GestionClientes navCollapsed={navCollapsed} />} />
                    <Route path="/gestion-usuarios" element={<GestionUsuarios navCollapsed={navCollapsed} />} />
                    <Route path="/transacciones" element={<Transacciones navCollapsed={navCollapsed} />} />
                    <Route path="/creditos-por-cobrar" element={<CreditosPorCobrar navCollapsed={navCollapsed} />} />
                </Routes>
            </div>
        </div>
    )
}
