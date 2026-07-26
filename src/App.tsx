import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { NavBar } from './components/NavBar'
import { MapPage } from './pages/MapPage'
import { UploadGpxPage } from './pages/UploadGpxPage'
import { RouteDetailPage } from './pages/RouteDetailPage'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <NavBar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/upload" element={<UploadGpxPage />} />
              <Route path="/routes/:id" element={<RouteDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
