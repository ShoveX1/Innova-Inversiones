import { useEffect, useState, useRef } from 'react';
import { paintLotes } from '../utils/paintLotes';
import { api } from '../../../../services/api';
import { jsPDF } from 'jspdf';

interface Lote {
    codigo: string;
    estado: string;
    area_lote: number;
    precio: number | null;
}

interface PrintButtonProps {
    isAdmin?: boolean;
}

export default function PrintButton({ isAdmin = false }: PrintButtonProps){
    const svgPath = `${import.meta.env.BASE_URL}planovirtual-IDs-2.svg`;
    const objectRef = useRef<HTMLObjectElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    
    const [svgLoaded, setSvgLoaded] = useState(false);
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Crear el <object> SVG dinámicamente (sin mostrarlo en el HTML)
    useEffect(() => {
        const objectElement = document.createElement('object');
        objectElement.type = 'image/svg+xml';
        objectElement.data = svgPath;
        objectElement.style.position = 'absolute';
        objectElement.style.left = '-9999px';
        objectElement.style.width = '1px';
        objectElement.style.height = '1px';
        
        objectElement.onload = () => setSvgLoaded(true);
        
        objectRef.current = objectElement;
        document.body.appendChild(objectElement);
        
        return () => {
            if (objectRef.current) {
                document.body.removeChild(objectRef.current);
            }
        };
    }, [svgPath]);

    useEffect(() => {
        const fetchLotes = async () => {
            const data = await api.get('api/maps/lotes/');
            setLotes(data as Lote[]);
        };
        fetchLotes();
    }, []);

    useEffect(() => {
        if (svgLoaded && lotes.length > 0) {
            const svgDoc = objectRef.current?.contentDocument;
            if (svgDoc) {
                requestAnimationFrame(() => {
                    paintLotes(svgDoc, lotes, isAdmin);
                });
            }
        }
    }, [svgLoaded, lotes, isAdmin]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getSvgElement = (): SVGSVGElement | null => {
        return objectRef.current?.contentDocument?.querySelector('svg') as SVGSVGElement || null;
    };

    const getFileName = (ext: string) => `plano-virtual-${new Date().toISOString().split('T')[0]}.${ext}`;

    const svgToCanvas = async (svgEl: SVGSVGElement, scale = 4): Promise<string> => {
        const svgString = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const w = svgEl.viewBox.baseVal.width || parseFloat(svgEl.getAttribute('width') || '1000');
        const h = svgEl.viewBox.baseVal.height || parseFloat(svgEl.getAttribute('height') || '1000');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false })!;
        canvas.width = w * scale;
        canvas.height = h * scale;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Error al cargar SVG'));
            };
            img.src = url;
        });
    };

    const handleDownloadPDF = async () => {
        try {
            const svg = getSvgElement();
            if (!svg) return alert('⚠️ No se pudo acceder al SVG');

            const imgData = await svgToCanvas(svg, 4);

            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();

            const w = svg.viewBox.baseVal.width || parseFloat(svg.getAttribute('width') || '1000');
            const h = svg.viewBox.baseVal.height || parseFloat(svg.getAttribute('height') || '1000');
            const ratio = w / h;

            let iw = pw * 0.95;
            let ih = iw / ratio;
            if (ih > ph * 0.95) {
                ih = ph * 0.95;
                iw = ih * ratio;
            }

            pdf.addImage(imgData, 'JPEG', (pw - iw) / 2, (ph - ih) / 2, iw, ih);
            pdf.save(getFileName('pdf'));
        } catch (err) {
            alert('⚠️ Error al generar PDF');
        }
    };

    const handleDownloadPNG = async () => {
        try {
            const svg = getSvgElement();
            if (!svg) return alert('⚠️ No se pudo acceder al SVG');

            const imgData = await svgToCanvas(svg, 4);
            
            const blob = await (await fetch(imgData)).blob();
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = getFileName('png');
            link.click();
            
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('⚠️ Error al generar PNG');
        }
    };


    const isReady = svgLoaded && lotes.length > 0;

    const handleDownload = async (format: 'pdf' | 'png') => {
        setIsOpen(false);
        if (format === 'pdf') {
            await handleDownloadPDF();
        } else {
            await handleDownloadPNG();
        }
    };

    return (
        <div ref={dropdownRef} className="relative inline-block">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                disabled={!isReady}
                className="px-3 py-2 sm:px-4 bg-blue-600 text-white border-2 border-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md font-medium"
                title="Descargar plano"
            >
                <span className="text-xl sm:text-base">🗺️</span>
                <span className="hidden sm:inline">Descargar Plano</span>
                <svg 
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && isReady && (
                <div className="absolute top-full left-0 mt-2 w-full  bg-white border border-blue-200 rounded-lg shadow-xl z-40 min-w-max overflow-hidden">
                    <button
                        onClick={() => handleDownload('pdf')}
                        className="w-full px-4 py-2.5 text-left bg-blue-300 hover:bg-blue-50 transition-colors flex items-center gap-3 text-gray-800 border-b border-blue-100"
                    >
                        <span className="text-sm sm:text-lg">📄</span>
                        <span className="text-center sm:font-medium text-sm">PDF</span>
                    </button>
                    <button
                        onClick={() => handleDownload('png')}
                        className="w-full px-4 py-2.5 text-left bg-blue-300 hover:bg-blue-50 transition-colors flex items-center gap-3 text-gray-800"
                    >
                        <span className="text-sm sm:text-lg text-center">🖼️</span>
                        <span className="text-center sm:font-medium text-sm">PNG</span>
                    </button>
                </div>
            )}
        </div>
    )
}