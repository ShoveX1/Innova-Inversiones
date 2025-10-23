import { useSvgLoader } from '../hooks/useSvgLoader';


export default function PrintButton(){
    const { objectRef, svgLoaded, error, loading, handleSvgLoad } = useSvgLoader({ svgPath: 'planovirtual-IDs-2.svg' });

    return (
        <div>
            <button onClick={handleSvgLoad}>Imprimir</button>
            {loading && <p>Cargando...</p>}
            {error && <p>Error: {error}</p>}
            {svgLoaded && <p>SVG cargado</p>}
            
            <object 
                ref={objectRef} 
                type="image/svg+xml" 
                data={`/planovirtual-IDs-2.svg`} 
                onLoad={handleSvgLoad} 
                className="w-full h-full object-contain"
            />
        </div>
    )
}