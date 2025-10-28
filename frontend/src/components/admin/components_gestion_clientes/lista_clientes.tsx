




export default function ListaClientes(){
    return (
        <div>
            <section className="p-6 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <article className="bg-white rounded-lg p-4 shadow-sm flex flex-row justify-start items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" className="w-10 h-10 bg-green-200 rounded-lg p-2">
                            <path fill="green" d="M12 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7ZM6.5 7.5a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0ZM3 19a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3H3v-3Zm5-3a3 3 0 0 0-3 3v1h14v-1a3 3 0 0 0-3-3H8Z"/>
                        </svg>
                        <div className="flex flex-col justify-center items-start">
                            <h3 className="text-gray-500 text-sm">Clientes Activos</h3>
                            <p className="text-2xl font-bold text-black">120</p>
                        </div>
                    </article>

                    <article className="bg-white rounded-lg p-4 shadow-sm flex flex-row justify-start items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" className="w-10 h-10 bg-yellow-100 rounded-lg p-2">
                            <path fill="orange" d="M12 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7ZM6.5 7.5a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0ZM3 19a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3H3v-3Zm5-3a3 3 0 0 0-3 3v1h14v-1a3 3 0 0 0-3-3H8Z"/>
                        </svg>
                        <div className="flex flex-col justify-center items-start">
                            <h3 className="text-gray-500 text-sm">Prospectos</h3>
                            <p className="text-2xl font-bold text-black">120</p>
                        </div>
                    </article>

                    <article className="bg-white rounded-lg p-4 shadow-sm flex flex-row justify-start items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" className="w-10 h-10 bg-blue-200 rounded-lg p-2">
                            <path fill="blue" d="M12 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7ZM6.5 7.5a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0ZM3 19a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3H3v-3Zm5-3a3 3 0 0 0-3 3v1h14v-1a3 3 0 0 0-3-3H8Z"/>
                        </svg>
                        <div className="flex flex-col justify-center items-start">
                            <h3 className="text-gray-500 text-sm">Clientes Totales</h3>
                            <p className="text-2xl font-bold text-black">120</p>
                        </div>
                    </article>
                </div>
            </section>
        </div>
    )
}