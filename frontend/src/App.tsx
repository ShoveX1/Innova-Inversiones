
import './App.css'
import MapaLotesPanel from './components/MapaLotesPanel.tsx'
import Header from './components/Header.tsx'

function App() {

  return (
    <>
      <div className="min-h-screen bg-background">
        <header>
          <Header />
        </header>
          <main className="flex-1 flex">
            <div className="flex-1">
              <MapaLotesPanel />
            </div>
          </main>
      </div>
      
    </>
  )
}

export default App
