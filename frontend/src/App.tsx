
import './App.css'
import MapaLotesPanel from './components/MapaLotesPanel.tsx'
import Header from './components/Header.tsx'

function App() {

  return (
    <>
      <div>
        <Header />
      </div>
      <div>
        <h1 className="text-Black text-4xl font-bold">Mapa de Lotes</h1>
        <MapaLotesPanel />
      </div>
      <div>
        <h2 className="text-white text-4xl font-bold">Panel de informacion</h2>
        
      </div>
    </>
  )
}

export default App
