
import './App.css'
import MapaPage from './pages/mapa_page.tsx'
import Header from './components/Header.tsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <header>
          <Header />
        </header>
        <main className="flex-1 flex min-h-0">
          <Routes>
            <Route path="/" element={<MapaPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
