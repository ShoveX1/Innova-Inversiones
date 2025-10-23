
import './App.css'
import MapaPage from './pages/public/mapa_page.tsx'
import MapaPageV2 from './pages/public/mapa_page_v2.tsx'
import Header from './components/common/Header.tsx'
import AdminMapaPage from './pages/admin/admin_mapa_page.tsx'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

function AppContent() {
  const location = useLocation();
  const isAdminMapaPage = location.pathname.startsWith('/admin') ||
                          location.pathname.startsWith('/mapa-v2');

  return (
    <div className="min-h-screen bg-background">
      {!isAdminMapaPage && (
        <header>
          <Header />
        </header>
      )}
      <main className="flex-1 flex min-h-0 min-w-0">
        <Routes>
          <Route path="/" element={<MapaPage />} />
          <Route path="/mapa-v2" element={<MapaPageV2 />} />
          <Route path="/admin/*" element={<AdminMapaPage />} /> 
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
