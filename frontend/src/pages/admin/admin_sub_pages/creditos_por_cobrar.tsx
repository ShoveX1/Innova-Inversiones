interface CreditosPorCobrarProps {
    navCollapsed: boolean;
}

export default function CreditosPorCobrar({ navCollapsed }: CreditosPorCobrarProps) {
    return (
        <div className="h-screen w-full">
            <div className={`${navCollapsed ? 'ml-16' : 'ml-[16rem]'} h-screen overflow-auto`}>
                <div className="bg-white shadow-md overflow-hidden flex flex-row justify-between">
                    <div>
                        <h1 className="text-transparent bg-clip-text 
                            bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 
                            font-extrabold tracking-tight text-3xl px-4
                            sm:text-4xl md:text-5xl drop-shadow-sm mt-2">
                            Créditos por Cobrar
                        </h1>
                        <p className="text-gray-500 text-sm px-4 mb-2">Gestión de créditos pendientes</p>
                    </div>
                </div>
                <div className="p-4">
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-600 mb-4">Créditos por Cobrar en construcción</h2>
                        <p className="text-gray-500">Esta sección estará disponible próximamente</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
