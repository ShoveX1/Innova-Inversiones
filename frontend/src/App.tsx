
import './App.css'
import MapaLotesPanel from './components/MapaLotesPanel.tsx'
import Header from './components/Header.tsx'
import PingPage from './pages/PingPage.tsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <header>
          <Header />
        </header>
        <main className="flex-1 flex">
          <Routes>
            <Route path="/" element={
              <div className="flex-1">
                <MapaLotesPanel />
              </div>
            } />
            <Route path="/ping" element={<PingPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
