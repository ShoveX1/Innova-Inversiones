import AdminPanel from "../components/admin_panel";
import MapaLotes from "../components/mapa_lotes";



export default function AdminMapaPage(){
    return (
        <div>
            <div>
                <AdminPanel />
            </div>
            <div>
                <MapaLotes lotes={[]} loading={false} error={null} onSelectCodigo={() => {}} selectedCodigo={null} />
            </div>
        </div>
    )
}
