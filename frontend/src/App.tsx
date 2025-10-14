
import './App.css'
import MapaPage from './pages/public/mapa_page.tsx'
import Header from './components/common/Header.tsx'
import AdminMapaPage from './pages/admin/admin_mapa_page.tsx'
import AdminMapaPagePerspectiva from './pages/admin/admin_mapa_page_perspectiva.tsx'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

function AppContent() {
  const location = useLocation();
  const isAdminMapaPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/prueba');

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
          <Route path="/admin" element={<AdminMapaPage />} />
          <Route path="/plano-perspectiva" element={<AdminMapaPagePerspectiva />} />
            {/* Rutas adicionales para navegación del panel */}
          <Route path="/admin" element={<div className="p-6">Dashboard (en construcción)</div>} />
          <Route path="/admin" element={<div className="p-6">Gestión de Clientes (en construcción)</div>} />
          <Route path="/admin" element={<div className="p-6">Gestión de Usuarios (en construcción)</div>} />
          <Route path="/admin" element={<div className="p-6">Transacciones (en construcción)</div>} />
          <Route path="/admin" element={<div className="p-6">Créditos por Cobrar (en construcción)</div>} />
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
