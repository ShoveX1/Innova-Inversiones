import { useState, useRef, useCallback } from "react";


interface UseSvgLoaderProps {
    svgPath: string;
}

interface UseSvgLoaderReturn {
    objectRef: React.RefObject<HTMLObjectElement | null>;
    svgLoaded: boolean;
    error: string | null;
    loading: boolean;
    handleSvgLoad: () => void;
}


export function useSvgLoader({ svgPath }: UseSvgLoaderProps): UseSvgLoaderReturn {
    const [svgLoaded, setSvgLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const objectRef = useRef<HTMLObjectElement>(null);

    const handleSvgLoad = useCallback(() => {
        const objectEl = objectRef.current;

        if (!objectEl) return;

        try {
            const svgDoc = objectEl.contentDocument;
            if (svgDoc && svgDoc.querySelector('svg')) {
                setSvgLoaded(true);
                setLoading(false);
                setError(null);
            } else {
                throw new Error('No se pudo cargar el SVG');
            }
        } catch (err: any) {
            setLoading(false);
            setError(err.message);
        }
    }, [svgPath]);

    return {objectRef, svgLoaded, error, loading, handleSvgLoad};
};