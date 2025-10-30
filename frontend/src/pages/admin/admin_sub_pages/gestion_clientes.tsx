import ListaClientes from "../../../components/admin/components_gestion_clientes/lista_clientes";
import TarjetaMetricaCliente from "../../../components/admin/components_gestion_clientes/tarjeta_metrica_cliente";

interface GestionClientesProps {
    navCollapsed: boolean;
}

export default function GestionClientes({ navCollapsed }: GestionClientesProps) {
    return (
        <div className="h-screen w-full">
            <div className={`${navCollapsed ? 'ml-16' : 'ml-[16rem]'} h-screen overflow-auto`}>
                <div className="bg-white shadow-md overflow-hidden flex flex-row justify-between">
                    <div>
                        <h1 className="text-transparent bg-clip-text 
                            bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 
                            font-extrabold tracking-tight text-3xl px-4
                            sm:text-4xl md:text-5xl drop-shadow-sm mt-2">
                            Gestión de Clientes
                        </h1>
                        <p className="text-gray-500 text-sm px-4 mb-2">Administración de clientes</p>
                    </div>
                </div>
                <div className="">
                    <TarjetaMetricaCliente />
                    <ListaClientes />
                </div>
            </div>
        </div>
    );
}
