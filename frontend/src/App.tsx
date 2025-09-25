
import './App.css'
import MapaPage from './pages/mapa_page.tsx'
import Header from './components/Header.tsx'
import AdminMapaPage from './pages/admin_mapa_page.tsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {

  return (
    
    <Router>
      <div className="min-h-screen bg-background">
        <header>
          <Header />
        </header>
        <main className="flex-1 flex min-h-0 min-w-0">
          <Routes>
            <Route path="/" element={<MapaPage />} />
            <Route path="/admin" element={<AdminMapaPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
