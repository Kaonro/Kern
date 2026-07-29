import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { logPageView } from './lib/statsApi'
import { NavBar } from './components/NavBar'
import { MobileNav } from './components/MobileNav'
import { MapPage } from './pages/MapPage'
import { HeatmapPage } from './pages/HeatmapPage'
import { UploadGpxPage } from './pages/UploadGpxPage'
import { RouteDetailPage } from './pages/RouteDetailPage'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatsPage } from './pages/StatsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { WelcomeModal } from './components/WelcomeModal'
import './App.css'

/** Enregistre une visite (compteur simple, sans donnée personnelle) à chaque changement de page. */
function PageViewLogger() {
  const location = useLocation()

  useEffect(() => {
    logPageView(location.pathname)
  }, [location.pathname])

  return null
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageViewLogger />
        <WelcomeModal />
        <div className="app-shell">
          <NavBar />
          <MobileNav />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/generation" element={<HeatmapPage />} />
              <Route path="/upload" element={<UploadGpxPage />} />
              <Route path="/routes/:id" element={<RouteDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
